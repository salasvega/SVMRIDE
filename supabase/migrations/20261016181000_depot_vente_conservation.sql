/*
  Dépôt-vente — conservation des demandes d'estimation (16/10/2026).
  Chaque nuit (4h23 UTC), consigné dans private.journal_entretien :
   - envoi interrompu (photos jamais terminées) : demande effacée après 24 h ;
   - demande refusée ou abandonnée : photos effacées après 12 mois ;
   - demande non acceptée : effacée après 3 ans (recommandation CNIL prospects) ;
   - photo sans demande : effacée après 7 jours.
  Les demandes acceptées deviendront des dossiers (lot 2) : leur durée sera
  fixée avec le contrat.
*/
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
  where t.statut in ('refusee', 'abandonnee')
    and t.created_at < now() - private.duree_pieces_jointes()
    and coalesce(p->>'path', '') <> '';
  if chemins is not null then
    perform private.effacer_fichiers('depot-photos', chemins);
    n_photos := cardinality(chemins);
    update public.depot_demandes set photos = '[]'::jsonb
    where statut in ('refusee', 'abandonnee')
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

select cron.schedule('entretien-depot', '23 4 * * *', 'select private.entretien_depot()');
