/*
  Pièces de financement : effacées avec leur dossier (16/10/2026).

  Avant : supprimer un dossier laissait des pièces dans le stockage (anciennes
  versions remplacées, dossiers supprimés par l'ancien parcours client).

  Après : un déclencheur, après chaque suppression de dossier (admin, client
  ou autre), efface du stockage toutes ses pièces : celles du dossier
  (dossier « <id>/ ») et celles de l'ancien rangement par e-mail
  (dossier « <e-mail>/ »), sauf un fichier encore utilisé par un autre dossier.

  L'effacement passe par l'API Storage (les fichiers sont réellement
  supprimés, pas seulement leur ligne en base), appelée avec la clé secrète
  lue dans Vault, de façon asynchrone (pg_net) : la suppression du dossier
  n'est jamais bloquée par le stockage.
*/

-- Efface une liste de fichiers du bucket financing-documents
create or replace function private.effacer_pieces_financement(p_noms text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_noms is null or cardinality(p_noms) = 0 then
    return;
  end if;
  perform net.http_delete(
    url := 'https://fthoybkgbnxzlrjbprrh.supabase.co/storage/v1/object/financing-documents',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', private.svm_secret_key(),
      'Authorization', 'Bearer ' || private.svm_secret_key()
    ),
    body := jsonb_build_object('prefixes', to_jsonb(p_noms)),
    timeout_milliseconds := 20000
  );
exception when others then
  raise warning 'Pièces de financement non effacées : %', sqlerrm;
end;
$$;

revoke all on function private.effacer_pieces_financement(text[]) from public, anon, authenticated;

-- Pièces d'un dossier supprimé
create or replace function private.dossier_financement_supprime()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  noms text[];
begin
  select array_agg(o.name) into noms
  from storage.objects o
  where o.bucket_id = 'financing-documents'
    and (
      split_part(o.name, '/', 1) = old.id::text
      or (coalesce(old.user_email, '') <> '' and split_part(o.name, '/', 1) = old.user_email)
      or o.name in (
        old.id_card_front, old.id_card_back, old.driver_license_front, old.driver_license_back,
        old.proof_of_residence, old.payslip_1, old.payslip_2, old.payslip_3,
        old.tax_notice, old.rib, old.hosting_certificate, old.host_id_card
      )
    )
    -- jamais un fichier encore rattaché à un autre dossier
    and not exists (
      select 1 from public.user_financing_profiles p
      where o.name in (
        p.id_card_front, p.id_card_back, p.driver_license_front, p.driver_license_back,
        p.proof_of_residence, p.payslip_1, p.payslip_2, p.payslip_3,
        p.tax_notice, p.rib, p.hosting_certificate, p.host_id_card
      )
    );

  perform private.effacer_pieces_financement(noms);
  return old;
end;
$$;

revoke all on function private.dossier_financement_supprime() from public, anon, authenticated;

create trigger effacer_pieces_apres_suppression
  after delete on public.user_financing_profiles
  for each row
  execute function private.dossier_financement_supprime();
