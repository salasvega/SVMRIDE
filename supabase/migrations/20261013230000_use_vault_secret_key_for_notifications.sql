/*
  # Notifications e-mail : clé secrète lue dans Vault

  Les déclencheurs envoyaient l'ancienne clé service_role écrite en dur.
  Ils lisent désormais la nouvelle clé secrète (sb_secret_…) dans Vault,
  sous le nom `svm_secret_key`, et l'envoient dans l'en-tête `apikey`
  (les nouvelles clés ne sont pas des JWT et ne passent plus par Authorization).
*/

-- Schéma non exposé par l'API REST : la fonction n'est pas appelable depuis le site.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.svm_secret_key()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'svm_secret_key' limit 1;
$$;

revoke all on function private.svm_secret_key() from public, anon, authenticated;

create or replace function private.notify_edge_function(fn_name text, payload jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform net.http_post(
    url := 'https://fthoybkgbnxzlrjbprrh.supabase.co/functions/v1/' || fn_name,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', private.svm_secret_key()
    ),
    body := payload
  );
exception when others then
  -- Une notification ratée ne doit jamais bloquer l'enregistrement du formulaire.
  raise warning 'Notification % non envoyée : %', fn_name, sqlerrm;
end;
$$;

revoke all on function private.notify_edge_function(text, jsonb) from public, anon, authenticated;

-- Contact
create or replace function public.send_contact_email_webhook()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  perform private.notify_edge_function('contact-notification', jsonb_build_object(
    'type', TG_OP, 'table', TG_TABLE_NAME,
    'record', row_to_json(NEW), 'old_record', row_to_json(OLD)));
  return NEW;
end;
$$;

-- Recherche personnalisée
create or replace function public.send_custom_search_email_webhook()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  perform private.notify_edge_function('custom-search-notification', jsonb_build_object(
    'type', TG_OP, 'table', TG_TABLE_NAME,
    'record', row_to_json(NEW), 'old_record', row_to_json(OLD)));
  return NEW;
end;
$$;

-- Financement
create or replace function public.send_financing_email_webhook()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  perform private.notify_edge_function('financing-notification', jsonb_build_object(
    'type', TG_OP, 'table', TG_TABLE_NAME,
    'record', row_to_json(NEW), 'old_record', row_to_json(OLD)));
  return NEW;
end;
$$;

-- Reprise
create or replace function public.send_trade_in_email_webhook()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  perform private.notify_edge_function('trade-in-notification', jsonb_build_object(
    'type', TG_OP, 'table', TG_TABLE_NAME,
    'record', row_to_json(NEW), 'old_record', row_to_json(OLD)));
  return NEW;
end;
$$;

-- Dossier de financement (uniquement lors de la soumission)
create or replace function public.notify_financing_profile_submission()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  if (TG_OP = 'INSERT' and NEW.submitted_at is not null)
     or (TG_OP = 'UPDATE' and OLD.submitted_at is null and NEW.submitted_at is not null) then
    perform private.notify_edge_function('financing-profile-notification', jsonb_build_object(
      'type', TG_OP, 'table', TG_TABLE_NAME, 'record', row_to_json(NEW)));
  end if;
  return NEW;
end;
$$;
