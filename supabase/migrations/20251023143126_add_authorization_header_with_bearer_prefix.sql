/*
  # Ajouter le header Authorization avec préfixe Bearer

  Cette migration recrée les webhooks pour les 3 formulaires
  (trade-in, custom-search, financing) avec le header Authorization
  incluant le préfixe "Bearer " devant le token.

  Format correct: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
*/

-- Supprimer les anciens webhooks
DROP TRIGGER IF EXISTS send_trade_in_email_trigger ON trade_in_submissions;
DROP TRIGGER IF EXISTS send_custom_search_email_trigger ON custom_search_submissions;
DROP TRIGGER IF EXISTS send_financing_email_trigger ON financing_submissions;

DROP FUNCTION IF EXISTS send_trade_in_email_webhook();
DROP FUNCTION IF EXISTS send_custom_search_email_webhook();
DROP FUNCTION IF EXISTS send_financing_email_webhook();

-- Créer le webhook pour Trade-In (AVEC Authorization Bearer)
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
    url := 'https://fthoybkgbnxzlrjbprrh.supabase.co/functions/v1/trade-in-form',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <CLE_RETIREE>'
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

-- Créer le webhook pour Custom Search (AVEC Authorization Bearer)
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
    url := 'https://fthoybkgbnxzlrjbprrh.supabase.co/functions/v1/custom-search-form',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <CLE_RETIREE>'
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

-- Créer le webhook pour Financing (AVEC Authorization Bearer)
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
    url := 'https://fthoybkgbnxzlrjbprrh.supabase.co/functions/v1/financing-form',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <CLE_RETIREE>'
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
