/*
  Effacement réel de fichiers (API Storage) depuis la base (16/10/2026).
  Supabase interdit de supprimer des lignes de storage.objects en SQL : on
  appelle l'API Storage avec la clé secrète lue dans Vault, via pg_net
  (asynchrone), par lots de 100.
  Utilisée le 16/10 pour supprimer 510 photos de véhicules inutilisées (211 Mo),
  avec l'accord de Seb.
*/
create or replace function private.effacer_fichiers(p_bucket text, p_noms text[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  i integer := 1;
  lot text[];
  lots integer := 0;
begin
  if p_noms is null or cardinality(p_noms) = 0 then
    return 0;
  end if;
  while i <= cardinality(p_noms) loop
    lot := p_noms[i : i + 99];
    perform net.http_delete(
      url := 'https://fthoybkgbnxzlrjbprrh.supabase.co/storage/v1/object/' || p_bucket,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', private.svm_secret_key(),
        'Authorization', 'Bearer ' || private.svm_secret_key()
      ),
      body := jsonb_build_object('prefixes', to_jsonb(lot)),
      timeout_milliseconds := 30000
    );
    lots := lots + 1;
    i := i + 100;
  end loop;
  return lots;
exception when others then
  raise warning 'Fichiers non effacés (%): %', p_bucket, sqlerrm;
  return -1;
end;
$$;

revoke all on function private.effacer_fichiers(text, text[]) from public, anon, authenticated;

create or replace function private.effacer_pieces_financement(p_noms text[])
returns void
language sql
security definer
set search_path = ''
as $$
  select private.effacer_fichiers('financing-documents', p_noms);
$$;

revoke all on function private.effacer_pieces_financement(text[]) from public, anon, authenticated;
