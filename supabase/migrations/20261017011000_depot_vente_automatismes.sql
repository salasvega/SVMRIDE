/*
  Dépôt-vente — automatismes des dossiers (17/10/2026)
  - Calcul des dates de mandat, cohérence des statuts.
  - Fil d'actualité alimenté automatiquement (statuts de mandat et de vente).
  - Statut public de la fiche moto synchronisé avec le statut de vente.
  - Journal d'audit (qui, quand, avant / après) sur dossiers, documents, contrats, paramètres.
  - E-mails au propriétaire déclenchés par la base (fonction depot-notifications).
  - Suppression d'un dossier : ses fichiers sont effacés.
  - Entretien quotidien : contrats et mandats expirés, alertes, purge après 5 ans.
*/

-- Qui agit (admin connecté, fonction serveur ou tâche planifiée)
create or replace function private.acteur()
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'email', 'système');
$$;
revoke all on function private.acteur() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Journal d'audit générique
-- ---------------------------------------------------------------------------
create or replace function private.audit_ligne()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_avant jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  v_apres jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  v_id text := coalesce(v_apres ->> 'id', v_avant ->> 'id');
  cle text;
begin
  -- On ne garde que les champs modifiés (et jamais les empreintes secrètes)
  if tg_op = 'UPDATE' then
    for cle in select jsonb_object_keys(to_jsonb(new)) loop
      if v_apres -> cle = v_avant -> cle then
        v_apres := v_apres - cle;
        v_avant := v_avant - cle;
      end if;
    end loop;
    if v_apres - 'updated_at' = '{}'::jsonb then
      return null;
    end if;
  end if;
  v_avant := v_avant - 'invitation_hash' - 'code_hash';
  v_apres := v_apres - 'invitation_hash' - 'code_hash';
  insert into public.journal_audit (par, par_email, table_nom, ligne_id, action, avant, apres)
  values (auth.uid(), private.acteur(), tg_table_name, v_id, lower(tg_op), v_avant, v_apres);
  return null;
end;
$$;
revoke all on function private.audit_ligne() from public, anon, authenticated;

create trigger audit_depot_dossiers after insert or update or delete on public.depot_dossiers
  for each row execute function private.audit_ligne();
create trigger audit_depot_documents after insert or update or delete on public.depot_documents
  for each row execute function private.audit_ligne();
create trigger audit_depot_contrats after insert or update or delete on public.depot_contrats
  for each row execute function private.audit_ligne();
create trigger audit_depot_parametres after update on public.depot_parametres
  for each row execute function private.audit_ligne();

-- ---------------------------------------------------------------------------
-- Dossier : avant enregistrement (dates, cohérence)
-- ---------------------------------------------------------------------------
create or replace function private.depot_dossier_avant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.prop_email := lower(trim(new.prop_email));
  if new.immatriculation is not null then
    new.immatriculation := upper(trim(new.immatriculation));
  end if;
  if new.date_debut is not null and new.date_fin is null then
    new.date_fin := (new.date_debut + make_interval(months => new.duree_mois))::date;
  end if;
  if tg_op = 'UPDATE' then
    -- Vente : dates renseignées automatiquement, mandat marqué « vendu »
    if new.statut_vente in ('vendue', 'preparation', 'livree', 'payee') and new.vendu_le is null then
      new.vendu_le := (now() at time zone 'Europe/Paris')::date;
    end if;
    if new.statut_vente = 'payee' and new.paye_le is null then
      new.paye_le := (now() at time zone 'Europe/Paris')::date;
    end if;
    if new.statut_vente in ('vendue', 'preparation', 'livree', 'payee') and new.statut_mandat = 'actif' then
      new.statut_mandat := 'vendu';
    end if;
    if new.statut_mandat = 'cloture' and new.cloture_le is null then
      new.cloture_le := now();
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.depot_dossier_avant() from public, anon, authenticated;

create trigger depot_dossier_avant before insert or update on public.depot_dossiers
  for each row execute function private.depot_dossier_avant();

-- ---------------------------------------------------------------------------
-- Dossier : après enregistrement (fil, fiche moto, e-mails)
-- ---------------------------------------------------------------------------
create or replace function private.depot_libelle_vente(p text)
returns text language sql immutable set search_path = '' as $$
  select case p
    when 'a_publier' then 'Annonce en préparation'
    when 'en_ligne' then 'Annonce en ligne'
    when 'reservee' then 'Moto réservée'
    when 'vendue' then 'Moto vendue'
    when 'preparation' then 'Préparation pour la livraison'
    when 'livree' then 'Moto livrée à l''acheteur'
    when 'payee' then 'Paiement effectué'
    else p end;
$$;
create or replace function private.depot_libelle_mandat(p text)
returns text language sql immutable set search_path = '' as $$
  select case p
    when 'preparation' then 'Dossier en préparation'
    when 'a_signer' then 'Contrat envoyé pour signature'
    when 'actif' then 'Mandat actif'
    when 'vendu' then 'Mandat terminé : moto vendue'
    when 'resilie' then 'Mandat résilié'
    when 'expire' then 'Mandat arrivé à échéance'
    when 'cloture' then 'Dossier clôturé'
    else p end;
$$;
revoke all on function private.depot_libelle_vente(text) from public, anon;
revoke all on function private.depot_libelle_mandat(text) from public, anon;

create or replace function private.depot_dossier_apres()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_statut text;
  v_dispo boolean;
begin
  if tg_op = 'INSERT' then
    insert into public.depot_evenements (dossier_id, par, type, titre, visible_proprietaire)
    values (new.id, private.acteur(), 'creation', 'Dossier ouvert', false);
    return null;
  end if;

  if new.statut_mandat is distinct from old.statut_mandat then
    insert into public.depot_evenements (dossier_id, par, type, titre, visible_proprietaire)
    values (new.id, private.acteur(), 'mandat', private.depot_libelle_mandat(new.statut_mandat),
            new.statut_mandat in ('actif', 'resilie', 'expire'));
  end if;

  if new.statut_vente is distinct from old.statut_vente then
    insert into public.depot_evenements (dossier_id, par, type, titre, visible_proprietaire)
    values (new.id, private.acteur(), 'vente', private.depot_libelle_vente(new.statut_vente),
            new.statut_vente <> 'a_publier');
    -- E-mail au propriétaire (une seule fois par étape, voir depot-notifications)
    if new.statut_vente in ('en_ligne', 'reservee', 'vendue', 'livree', 'payee') then
      perform private.notify_edge_function('depot-notifications',
        jsonb_build_object('type', 'vente', 'dossier_id', new.id, 'statut', new.statut_vente));
    end if;
  end if;

  -- Fiche moto du catalogue : statut public aligné sur la vente
  if new.vehicle_id is not null and (
       new.statut_vente is distinct from old.statut_vente
    or new.statut_mandat is distinct from old.statut_mandat
    or new.vehicle_id is distinct from old.vehicle_id) then
    v_statut := case
      when new.statut_vente in ('vendue', 'preparation', 'livree', 'payee') then 'sold'
      when new.statut_vente = 'reservee' then 'reserved'
      else 'available' end;
    v_dispo := case
      when new.statut_vente in ('vendue', 'preparation', 'livree', 'payee', 'reservee') then true
      when new.statut_mandat in ('resilie', 'expire') then false
      when new.statut_vente = 'en_ligne' then true
      else null end;
    update public.vehicles
       set status = v_statut,
           available = coalesce(v_dispo, available),
           updated_at = now()
     where id = new.vehicle_id;
  end if;
  return null;
end;
$$;
revoke all on function private.depot_dossier_apres() from public, anon, authenticated;

create trigger depot_dossier_apres after insert or update on public.depot_dossiers
  for each row execute function private.depot_dossier_apres();

-- Événement « offre reçue » visible : e-mail au propriétaire
create or replace function private.depot_evenement_apres()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.visible_proprietaire and new.type = 'offre' then
    perform private.notify_edge_function('depot-notifications',
      jsonb_build_object('type', 'evenement', 'dossier_id', new.dossier_id, 'evenement_id', new.id));
  end if;
  return null;
end;
$$;
revoke all on function private.depot_evenement_apres() from public, anon, authenticated;
create trigger depot_evenement_apres after insert on public.depot_evenements
  for each row execute function private.depot_evenement_apres();

-- Demande d'un propriétaire : alerte interne
create or replace function private.depot_demande_proprietaire_apres()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.depot_evenements (dossier_id, par, type, titre, detail, visible_proprietaire)
    values (new.dossier_id, 'propriétaire', 'demande_proprietaire',
      case new.type
        when 'rappel' then 'Demande de rappel'
        when 'prolongation' then 'Demande de prolongation du mandat'
        when 'reprise_anticipee' then 'Demande de reprise anticipée de la moto'
        when 'baisse_prix' then 'Proposition de nouveau prix'
        else 'Question' end,
      new.message, true);
    perform private.notify_edge_function('depot-notifications',
      jsonb_build_object('type', 'demande_proprietaire', 'dossier_id', new.dossier_id, 'demande_id', new.id));
  elsif new.statut is distinct from old.statut and new.statut in ('acceptee', 'refusee', 'terminee') then
    insert into public.depot_evenements (dossier_id, par, type, titre, detail, visible_proprietaire)
    values (new.dossier_id, private.acteur(), 'demande_proprietaire',
      case new.statut when 'acceptee' then 'Votre demande a été acceptée'
                      when 'refusee' then 'Votre demande n''a pas pu être acceptée'
                      else 'Votre demande a été traitée' end,
      new.reponse, true);
  end if;
  return null;
end;
$$;
revoke all on function private.depot_demande_proprietaire_apres() from public, anon, authenticated;
create trigger depot_demande_proprietaire_apres after insert or update on public.depot_demandes_proprietaire
  for each row execute function private.depot_demande_proprietaire_apres();

-- ---------------------------------------------------------------------------
-- Suppression d'un dossier : fichiers effacés
-- ---------------------------------------------------------------------------
create or replace function private.depot_dossier_supprime()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.effacer_fichiers('depot-documents',
    array(select name from storage.objects where bucket_id = 'depot-documents' and name like old.id::text || '/%'));
  return null;
end;
$$;
revoke all on function private.depot_dossier_supprime() from public, anon, authenticated;
create trigger depot_dossier_supprime after delete on public.depot_dossiers
  for each row execute function private.depot_dossier_supprime();

-- ---------------------------------------------------------------------------
-- Entretien quotidien
-- ---------------------------------------------------------------------------
create or replace function private.entretien_depot_dossiers()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_aujourdhui date := (now() at time zone 'Europe/Paris')::date;
  v_contrats integer;
  v_mandats integer;
  v_purges integer;
  v_conservation integer := (select conservation_annees from public.depot_parametres limit 1);
begin
  -- Invitations de signature expirées
  update public.depot_contrats
     set statut = 'expire', invitation_hash = null, code_hash = null
   where statut = 'a_signer' and invitation_expire_le < now();
  get diagnostics v_contrats = row_count;

  -- Mandats arrivés à échéance sans vente
  update public.depot_dossiers
     set statut_mandat = 'expire'
   where statut_mandat = 'actif' and date_fin < v_aujourdhui
     and statut_vente in ('a_publier', 'en_ligne');
  get diagnostics v_mandats = row_count;

  -- Conservation : dossiers terminés depuis plus de N ans (fichiers effacés par le déclencheur)
  with d as (delete from public.depot_dossiers
   where statut_mandat in ('cloture', 'resilie', 'expire', 'vendu', 'preparation')
     and greatest(updated_at, coalesce(cloture_le, updated_at)) < now() - make_interval(years => coalesce(v_conservation, 5))
   returning 1)
  select count(*) into v_purges from d;

  -- Alertes d'échéance et de gardiennage (e-mails envoyés par la fonction)
  perform private.notify_edge_function('depot-notifications', jsonb_build_object('type', 'alertes'));

  return jsonb_build_object('contrats_expires', v_contrats, 'mandats_expires', v_mandats, 'dossiers_purges', v_purges);
end;
$$;
revoke all on function private.entretien_depot_dossiers() from public, anon, authenticated;

select cron.schedule('entretien-depot-dossiers', '41 5 * * *', 'select private.entretien_depot_dossiers()');
