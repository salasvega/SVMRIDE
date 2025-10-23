/*
  # Mise à jour des triggers pour utiliser les nouvelles fonctions de notification

  Cette migration met à jour les 3 webhooks pour appeler les nouvelles edge functions
  dédiées à l'envoi d'emails (trade-in-notification, custom-search-notification, financing-notification).
  
  Les nouvelles URLs sont:
  - https://fthoybkgbnxzlrjbprrh.supabase.co/functions/v1/trade-in-notification
  - https://fthoybkgbnxzlrjbprrh.supabase.co/functions/v1/custom-search-notification
  - https://fthoybkgbnxzlrjbprrh.supabase.co/functions/v1/financing-notification
*/

-- Supprimer les anciens webhooks
DROP TRIGGER IF EXISTS send_trade_in_email_trigger ON trade_in_submissions;
DROP TRIGGER IF EXISTS send_custom_search_email_trigger ON custom_search_submissions;
DROP TRIGGER IF EXISTS send_financing_email_trigger ON financing_submissions;

DROP FUNCTION IF EXISTS send_trade_in_email_webhook();
DROP FUNCTION IF EXISTS send_custom_search_email_webhook();
DROP FUNCTION IF EXISTS send_financing_email_webhook();

-- Créer le webhook pour Trade-In Notification
CREATE OR REPLACE FUNCTION send_trade_in_email_webhook()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
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
    url := 'https://fthoybkgbnxzlrjbprrh.supabase.co/functions/v1/trade-in-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0aG95YmtnYm54emxyamJwcnJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA1MDUxMywiZXhwIjoyMDc2NjI2NTEzfQ.4n8H5nNj940jvJWZBecryN-DdlWX98E7HgZs_SuvGDk'
    ),
    body := payload
  ) INTO request_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER send_trade_in_email_trigger
  AFTER INSERT ON trade_in_submissions
  FOR EACH ROW
  EXECUTE FUNCTION send_trade_in_email_webhook();

-- Créer le webhook pour Custom Search Notification
CREATE OR REPLACE FUNCTION send_custom_search_email_webhook()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
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

CREATE TRIGGER send_custom_search_email_trigger
  AFTER INSERT ON custom_search_submissions
  FOR EACH ROW
  EXECUTE FUNCTION send_custom_search_email_webhook();

-- Créer le webhook pour Financing Notification
CREATE OR REPLACE FUNCTION send_financing_email_webhook()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
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
    url := 'https://fthoybkgbnxzlrjbprrh.supabase.co/functions/v1/financing-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0aG95YmtnYm54emxyamJwcnJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA1MDUxMywiZXhwIjoyMDc2NjI2NTEzfQ.4n8H5nNj940jvJWZBecryN-DdlWX98E7HgZs_SuvGDk'
    ),
    body := payload
  ) INTO request_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER send_financing_email_trigger
  AFTER INSERT ON financing_submissions
  FOR EACH ROW
  EXECUTE FUNCTION send_financing_email_webhook();
