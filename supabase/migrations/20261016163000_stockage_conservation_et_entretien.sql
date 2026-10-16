/*
  Stockage : durée de conservation et entretien automatique (16/10/2026).

  Contexte : offre gratuite Supabase (1 Go de fichiers), 888 Mo utilisés.
  Le 16/10 : 510 photos de véhicules inutilisées supprimées (211 Mo),
  avec l'accord de Seb (fonction private.effacer_fichiers, migration
  stockage_effacement_generique).

  Durées de conservation (décidées le 16/10, modifiables ci-dessous) :
   - pièces jointes des demandes (contact, reprise, recherche, financement) :
     12 mois après la demande, puis effacées (la demande reste, sans ses fichiers) ;
   - demandes elles-mêmes : 3 ans après leur envoi, puis supprimées
     (recommandation CNIL pour les données de prospects) ;
   - fichiers orphelins (envoyés mais jamais rattachés, ou restés après une
     suppression) : effacés après 7 jours.
  Les dossiers de financement (user_financing_profiles) ne sont PAS concernés :
  leur durée sera fixée avec le projet dépôt-vente.

  Appliquée en production en 4 étapes (stockage_conservation_1 à 4).
  Exécution : chaque nuit à 3h17 (UTC) par pg_cron ; chaque passage est
  consigné dans private.journal_entretien (traçabilité RGPD).
*/

-- Durées (une seule source)
create or replace function private.duree_pieces_jointes() returns interval
language sql immutable as $$ select interval '12 months' $$;
create or replace function private.duree_demandes() returns interval
language sql immutable as $$ select interval '3 years' $$;
create or replace function private.delai_orphelins() returns interval
language sql immutable as $$ select interval '7 days' $$;

-- Ancien déclencheur : il supprimait les lignes de storage.objects en SQL,
-- ce que Supabase interdit désormais (la suppression de la demande échouait)
-- et qui laissait de toute façon les fichiers dans le stockage.
create or replace function public.delete_submission_attachments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  chemins text[];
begin
  if old.attachments is not null and jsonb_typeof(old.attachments) = 'array' then
    select array_agg(a->>'path') into chemins
    from jsonb_array_elements(old.attachments) a
    where coalesce(a->>'path', '') <> '';
    perform private.effacer_fichiers('form-attachments', chemins);
  end if;
  return old;
end;
$$;

-- Fonctions déclencheurs : pas appelables depuis l'API
revoke execute on function public.delete_submission_attachments() from public, anon, authenticated;

-- Journal des passages
create table if not exists private.journal_entretien (
  id bigint generated always as identity primary key,
  fait_le timestamptz not null default now(),
  details jsonb not null
);
revoke all on private.journal_entretien from public, anon, authenticated;

-- Chemins des pièces jointes référencées par les demandes
create or replace function private.pieces_jointes_referencees()
returns table (chemin text)
language sql
stable
security definer
set search_path = ''
as $$
  select a->>'path' from public.contact_submissions t, jsonb_array_elements(case when jsonb_typeof(t.attachments) = 'array' then t.attachments else '[]'::jsonb end) a
  union select a->>'path' from public.trade_in_submissions t, jsonb_array_elements(case when jsonb_typeof(t.attachments) = 'array' then t.attachments else '[]'::jsonb end) a
  union select a->>'path' from public.custom_search_submissions t, jsonb_array_elements(case when jsonb_typeof(t.attachments) = 'array' then t.attachments else '[]'::jsonb end) a
  union select a->>'path' from public.financing_submissions t, jsonb_array_elements(case when jsonb_typeof(t.attachments) = 'array' then t.attachments else '[]'::jsonb end) a
$$;

create or replace function private.entretien_stockage()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  tbl text;
  chemins text[];
  n integer;
  rapport jsonb := '{}'::jsonb;
  total_pj integer := 0;
  total_demandes integer := 0;
begin
  -- 1. Pièces jointes de plus de 12 mois
  foreach tbl in array array['contact_submissions','trade_in_submissions','custom_search_submissions','financing_submissions'] loop
    execute format($f$
      select array_agg(a->>'path')
      from public.%I t,
           jsonb_array_elements(case when jsonb_typeof(t.attachments) = 'array' then t.attachments else '[]'::jsonb end) a
      where t.created_at < now() - private.duree_pieces_jointes()
        and coalesce(a->>'path', '') <> ''
    $f$, tbl) into chemins;
    if chemins is not null then
      perform private.effacer_fichiers('form-attachments', chemins);
      total_pj := total_pj + cardinality(chemins);
      execute format($f$
        update public.%I set attachments = '[]'::jsonb
        where created_at < now() - private.duree_pieces_jointes()
          and jsonb_typeof(attachments) = 'array' and jsonb_array_length(attachments) > 0
      $f$, tbl);
    end if;

    -- 2. Demandes de plus de 3 ans (le déclencheur efface leurs fichiers éventuels)
    execute format('with d as (delete from public.%I where created_at < now() - private.duree_demandes() returning 1) select count(*) from d', tbl) into n;
    total_demandes := total_demandes + n;
  end loop;
  rapport := rapport || jsonb_build_object('pieces_jointes_expirees', total_pj, 'demandes_supprimees', total_demandes);

  -- 3. Fichiers orphelins de plus de 7 jours
  select array_agg(o.name) into chemins from storage.objects o
  where o.bucket_id = 'form-attachments' and o.created_at < now() - private.delai_orphelins()
    and o.name not like '%.emptyFolderPlaceholder'
    and not exists (select 1 from private.pieces_jointes_referencees() r where r.chemin = o.name);
  perform private.effacer_fichiers('form-attachments', chemins);
  rapport := rapport || jsonb_build_object('orphelins_formulaires', coalesce(cardinality(chemins), 0));

  select array_agg(o.name) into chemins from storage.objects o
  where o.bucket_id = 'vehicle-images' and o.created_at < now() - private.delai_orphelins()
    and o.name not like '%.emptyFolderPlaceholder'
    and not exists (
      select 1 from public.vehicles v, jsonb_array_elements_text(case when jsonb_typeof(v.images) = 'array' then v.images else '[]'::jsonb end) u
      where u like '%/vehicle-images/' || o.name);
  perform private.effacer_fichiers('vehicle-images', chemins);
  rapport := rapport || jsonb_build_object('orphelins_photos_vehicules', coalesce(cardinality(chemins), 0));

  select array_agg(o.name) into chemins from storage.objects o
  where o.bucket_id = 'financing-documents' and o.created_at < now() - private.delai_orphelins()
    and o.name not like '%.emptyFolderPlaceholder'
    and not exists (
      select 1 from public.user_financing_profiles p
      where o.name in (p.id_card_front, p.id_card_back, p.driver_license_front, p.driver_license_back,
        p.proof_of_residence, p.payslip_1, p.payslip_2, p.payslip_3, p.tax_notice, p.rib,
        p.hosting_certificate, p.host_id_card));
  perform private.effacer_fichiers('financing-documents', chemins);
  rapport := rapport || jsonb_build_object('orphelins_financement', coalesce(cardinality(chemins), 0));

  select array_agg(o.name) into chemins from storage.objects o
  where o.bucket_id = 'sales-documents' and o.created_at < now() - private.delai_orphelins()
    and o.name not like '%.emptyFolderPlaceholder'
    and not exists (
      select 1 from public.sales_folders s, jsonb_array_elements(case when jsonb_typeof(s.documents) = 'array' then s.documents else '[]'::jsonb end) d
      where d->>'path' = o.name);
  perform private.effacer_fichiers('sales-documents', chemins);
  rapport := rapport || jsonb_build_object('orphelins_dossiers_vente', coalesce(cardinality(chemins), 0));

  insert into private.journal_entretien (details) values (rapport);
  with vieux as (delete from private.journal_entretien where fait_le < now() - interval '2 years' returning 1) select count(*) into n from vieux;
  return rapport;
end;
$$;

revoke all on function private.entretien_stockage() from public, anon, authenticated;

-- Tous les jours à 3h17 UTC
create extension if not exists pg_cron;
select cron.schedule('entretien-stockage', '17 3 * * *', 'select private.entretien_stockage()');

-- Tableau de bord admin : place utilisée par espace de stockage
create or replace function public.stockage_utilise()
returns table (espace text, fichiers bigint, octets bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select bucket_id, count(*), coalesce(sum((metadata->>'size')::bigint), 0)
  from storage.objects group by bucket_id order by 3 desc;
$$;
revoke all on function public.stockage_utilise() from public, anon;
grant execute on function public.stockage_utilise() to authenticated;

-- Outil admin « Compresser les anciennes photos » : photos JPEG lourdes des formulaires
create or replace function public.photos_a_compresser(p_min_octets bigint default 700000)
returns table (chemin text, octets bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select name, (metadata->>'size')::bigint
  from storage.objects
  where bucket_id = 'form-attachments'
    and metadata->>'mimetype' in ('image/jpeg', 'image/jpg')
    and (metadata->>'size')::bigint >= p_min_octets
  order by created_at;
$$;
revoke all on function public.photos_a_compresser(bigint) from public, anon;
grant execute on function public.photos_a_compresser(bigint) to authenticated;

-- L'admin peut remplacer une pièce jointe par sa version compressée (même chemin)
create policy "Admin : remplacement des pièces jointes"
  on storage.objects for update to authenticated
  using (bucket_id = 'form-attachments')
  with check (bucket_id = 'form-attachments');

-- Taille maximale alignée sur les formulaires (10 Mo annoncés, 5 Mo acceptés jusqu'ici)
update storage.buckets set file_size_limit = 10485760 where id = 'form-attachments';
