/*
  Statut « Sans suite » et effacement des fichiers 7 jours après (17/10/2026,
  demande de Seb et Mattia).

  - Dépôt-vente (demandes d'estimation) : « Sans suite » remplace « Abandonnée »
    (les demandes abandonnées passent en sans suite).
  - Reprise (trade_in_submissions) et Financement (financing_submissions,
    user_financing_profiles) : nouveau statut « sans_suite ».
  - La date de passage en « Sans suite » est notée (colonne sans_suite_le) ;
    elle s'efface si le statut change de nouveau.
  - Chaque nuit (4h53 UTC), les photos et pièces jointes des demandes « Sans suite »
    depuis plus de 7 jours sont effacées du stockage (la demande reste, sans ses
    fichiers) ; chaque passage est consigné dans private.journal_entretien.
  Les autres règles ne changent pas (pièces jointes 12 mois, demandes 3 ans).
*/

-- 1. Statuts
alter table public.depot_demandes drop constraint if exists depot_demandes_statut_check;
update public.depot_demandes set statut = 'sans_suite' where statut = 'abandonnee';
alter table public.depot_demandes add constraint depot_demandes_statut_check
  check (statut in ('nouvelle', 'a_qualifier', 'en_echange', 'acceptee', 'refusee', 'sans_suite'));

alter table public.trade_in_submissions drop constraint if exists trade_in_submissions_status_check;
alter table public.trade_in_submissions add constraint trade_in_submissions_status_check
  check (status in ('new', 'in_progress', 'completed', 'sans_suite'));

alter table public.financing_submissions drop constraint if exists financing_submissions_status_check;
alter table public.financing_submissions add constraint financing_submissions_status_check
  check (status in ('new', 'in_progress', 'completed', 'sans_suite'));

-- 2. Date de passage en « Sans suite »
alter table public.depot_demandes add column if not exists sans_suite_le timestamptz;
alter table public.trade_in_submissions add column if not exists sans_suite_le timestamptz;
alter table public.financing_submissions add column if not exists sans_suite_le timestamptz;
alter table public.user_financing_profiles add column if not exists sans_suite_le timestamptz;

update public.depot_demandes set sans_suite_le = now() where statut = 'sans_suite' and sans_suite_le is null;

-- Argument du déclencheur : nom de la colonne de statut (« statut » ou « status »)
create or replace function private.dater_sans_suite()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (to_jsonb(new) ->> tg_argv[0]) = 'sans_suite' then
    if tg_op = 'INSERT' or (to_jsonb(old) ->> tg_argv[0]) is distinct from 'sans_suite' then
      new.sans_suite_le := now();
    end if;
  else
    new.sans_suite_le := null;
  end if;
  return new;
end;
$$;
revoke all on function private.dater_sans_suite() from public, anon, authenticated;

create or replace trigger dater_sans_suite before insert or update of statut on public.depot_demandes
  for each row execute function private.dater_sans_suite('statut');
create or replace trigger dater_sans_suite before insert or update of status on public.trade_in_submissions
  for each row execute function private.dater_sans_suite('status');
create or replace trigger dater_sans_suite before insert or update of status on public.financing_submissions
  for each row execute function private.dater_sans_suite('status');
create or replace trigger dater_sans_suite before insert or update of status on public.user_financing_profiles
  for each row execute function private.dater_sans_suite('status');

-- 3. Effacement 7 jours après le passage en « Sans suite »
create or replace function private.delai_sans_suite() returns interval
language sql immutable as $$ select interval '7 days' $$;

create or replace function private.entretien_sans_suite()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  tbl text;
  chemins text[];
  n_depot integer := 0;
  n_formulaires integer := 0;
  n_financement integer := 0;
  rapport jsonb;
begin
  -- Dépôt-vente : photos des demandes d'estimation
  select array_agg(p->>'path') into chemins
  from public.depot_demandes t, jsonb_array_elements(t.photos) p
  where t.statut = 'sans_suite' and t.sans_suite_le < now() - private.delai_sans_suite()
    and coalesce(p->>'path', '') <> '';
  if chemins is not null then
    perform private.effacer_fichiers('depot-photos', chemins);
    n_depot := cardinality(chemins);
    update public.depot_demandes set photos = '[]'::jsonb
    where statut = 'sans_suite' and sans_suite_le < now() - private.delai_sans_suite()
      and jsonb_array_length(photos) > 0;
  end if;

  -- Reprise et ancien formulaire de financement : pièces jointes
  foreach tbl in array array['trade_in_submissions', 'financing_submissions'] loop
    execute format($f$
      select array_agg(a->>'path')
      from public.%I t,
           jsonb_array_elements(case when jsonb_typeof(t.attachments) = 'array' then t.attachments else '[]'::jsonb end) a
      where t.status = 'sans_suite' and t.sans_suite_le < now() - private.delai_sans_suite()
        and coalesce(a->>'path', '') <> ''
    $f$, tbl) into chemins;
    if chemins is not null then
      perform private.effacer_fichiers('form-attachments', chemins);
      n_formulaires := n_formulaires + cardinality(chemins);
      execute format($f$
        update public.%I set attachments = '[]'::jsonb
        where status = 'sans_suite' and sans_suite_le < now() - private.delai_sans_suite()
          and jsonb_typeof(attachments) = 'array' and jsonb_array_length(attachments) > 0
      $f$, tbl);
    end if;
  end loop;

  -- Dossiers de financement : toutes les pièces du dossier
  select array_agg(o.name) into chemins
  from storage.objects o
  join public.user_financing_profiles p
    on p.status = 'sans_suite' and p.sans_suite_le < now() - private.delai_sans_suite()
   and (split_part(o.name, '/', 1) = p.id::text
        or o.name in (p.id_card_front, p.id_card_back, p.driver_license_front, p.driver_license_back,
                      p.proof_of_residence, p.payslip_1, p.payslip_2, p.payslip_3,
                      p.tax_notice, p.rib, p.hosting_certificate, p.host_id_card))
  where o.bucket_id = 'financing-documents'
    -- jamais un fichier encore rattaché à un dossier qui n'est pas sans suite
    and not exists (
      select 1 from public.user_financing_profiles q
      where q.status is distinct from 'sans_suite'
        and o.name in (q.id_card_front, q.id_card_back, q.driver_license_front, q.driver_license_back,
                       q.proof_of_residence, q.payslip_1, q.payslip_2, q.payslip_3,
                       q.tax_notice, q.rib, q.hosting_certificate, q.host_id_card));
  if chemins is not null then
    perform private.effacer_fichiers('financing-documents', chemins);
    n_financement := cardinality(chemins);
  end if;
  update public.user_financing_profiles set
    id_card_front = null, id_card_back = null, driver_license_front = null, driver_license_back = null,
    proof_of_residence = null, payslip_1 = null, payslip_2 = null, payslip_3 = null,
    tax_notice = null, rib = null, hosting_certificate = null, host_id_card = null
  where status = 'sans_suite' and sans_suite_le < now() - private.delai_sans_suite()
    and coalesce(id_card_front, id_card_back, driver_license_front, driver_license_back, proof_of_residence,
                 payslip_1, payslip_2, payslip_3, tax_notice, rib, hosting_certificate, host_id_card) is not null;

  rapport := jsonb_build_object(
    'sans_suite_photos_depot', n_depot,
    'sans_suite_pieces_formulaires', n_formulaires,
    'sans_suite_pieces_financement', n_financement);
  insert into private.journal_entretien (details) values (rapport);
  return rapport;
end;
$$;
revoke all on function private.entretien_sans_suite() from public, anon, authenticated;

select cron.schedule('entretien-sans-suite', '53 4 * * *', 'select private.entretien_sans_suite()');

-- 4. Règle des 12 mois du dépôt-vente : « abandonnee » devient « sans_suite »
create or replace function private.entretien_depot()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  n_incompletes integer;
  n_photos integer := 0;
  n_anciennes integer;
  chemins text[];
  rapport jsonb;
begin
  with d as (delete from public.depot_demandes
             where not envoi_termine and created_at < now() - interval '24 hours' returning 1)
  select count(*) into n_incompletes from d;

  select array_agg(p->>'path') into chemins
  from public.depot_demandes t, jsonb_array_elements(t.photos) p
  where t.statut in ('refusee', 'sans_suite')
    and t.created_at < now() - private.duree_pieces_jointes()
    and coalesce(p->>'path', '') <> '';
  if chemins is not null then
    perform private.effacer_fichiers('depot-photos', chemins);
    n_photos := cardinality(chemins);
    update public.depot_demandes set photos = '[]'::jsonb
    where statut in ('refusee', 'sans_suite')
      and created_at < now() - private.duree_pieces_jointes()
      and jsonb_array_length(photos) > 0;
  end if;

  with d as (delete from public.depot_demandes
             where statut <> 'acceptee' and created_at < now() - private.duree_demandes() returning 1)
  select count(*) into n_anciennes from d;

  select array_agg(o.name) into chemins from storage.objects o
  where o.bucket_id = 'depot-photos' and o.created_at < now() - private.delai_orphelins()
    and not exists (select 1 from public.depot_demandes t where t.id::text = split_part(o.name, '/', 1));
  perform private.effacer_fichiers('depot-photos', chemins);

  rapport := jsonb_build_object(
    'depot_envois_interrompus', n_incompletes,
    'depot_photos_expirees', n_photos,
    'depot_demandes_expirees', n_anciennes,
    'depot_photos_orphelines', coalesce(cardinality(chemins), 0));
  insert into private.journal_entretien (details) values (rapport);
  return rapport;
end;
$$;
revoke all on function private.entretien_depot() from public, anon, authenticated;
