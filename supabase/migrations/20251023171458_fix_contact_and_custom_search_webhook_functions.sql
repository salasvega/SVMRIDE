/*
  # Correction des fonctions webhook contact et recherche personnalisée
  
  Cette migration corrige les définitions des fonctions send_contact_email_webhook
  et send_custom_search_email_webhook pour qu'elles utilisent la même structure
  que les fonctions fonctionnelles (send_financing_email_webhook et send_trade_in_email_webhook).
  
  Changements:
  - Utilisation de l'URL Supabase en dur au lieu de current_setting
  - Utilisation du service_role_key en dur
  - Ajout de la variable request_id pour capturer la réponse
  - Utilisation de SELECT INTO au lieu de PERFORM
  - Structure identique aux fonctions qui fonctionnent
*/

-- Corriger la fonction webhook pour les contacts
CREATE OR REPLACE FUNCTION send_contact_email_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_id bigint;
  payload jsonb;
BEGIN
  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', row_to_json(NEW),
    'old_record', row_to_json(OLD)
  );

  SELECT net.http_post(
    url := 'https://fthoybkgbnxzlrjbprrh.supabase.co/functions/v1/contact-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0aG95YmtnYm54emxyamJwcnJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA1MDUxMywiZXhwIjoyMDc2NjI2NTEzfQ.4n8H5nNj940jvJWZBecryN-DdlWX98E7HgZs_SuvGDk'
    ),
    body := payload
  ) INTO request_id;

  RETURN NEW;
END;
$$;

-- Corriger la fonction webhook pour les recherches personnalisées
CREATE OR REPLACE FUNCTION send_custom_search_email_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_id bigint;
  payload jsonb;
BEGIN
  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', row_to_json(NEW),
    'old_record', row_to_json(OLD)
  );

  SELECT net.http_post(
    url := 'https://fthoybkgbnxzlrjbprrh.supabase.co/functions/v1/custom-search-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0aG95YmtnYm54emxyamJwcnJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA1MDUxMywiZXhwIjoyMDc2NjI2NTEzfQ.4n8H5nNj940jvJWZBecryN-DdlWX98E7HgZs_SuvGDk'
    ),
    body := payload
  ) INTO request_id;

  RETURN NEW;
END;
$$;
