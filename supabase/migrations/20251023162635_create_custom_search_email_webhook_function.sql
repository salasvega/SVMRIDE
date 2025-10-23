/*
  # Création de la fonction webhook pour les recherches personnalisées
  
  Cette migration crée la fonction trigger manquante pour envoyer les notifications
  par email lors de nouvelles soumissions de recherche personnalisée.
  
  1. Fonction créée
    - `send_custom_search_email_webhook()` : Fonction trigger qui appelle l'edge function
  
  2. Trigger créé
    - `send_custom_search_email_trigger` : Se déclenche après INSERT sur custom_search_submissions
  
  3. Sécurité
    - Fonction définie avec SECURITY DEFINER pour avoir les permissions nécessaires
    - Utilise pg_net.http_post pour appeler l'edge function de notification
*/

-- Créer la fonction webhook pour les recherches personnalisées
CREATE OR REPLACE FUNCTION send_custom_search_email_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url text;
  service_role_key text;
BEGIN
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);

  IF supabase_url IS NULL OR service_role_key IS NULL THEN
    RAISE WARNING 'Supabase URL or service role key not configured';
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/custom-search-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'custom_search_submissions',
      'record', row_to_json(NEW)
    ),
    timeout_milliseconds := 5000
  );

  RETURN NEW;
END;
$$;

-- Créer le trigger pour custom_search_submissions
DROP TRIGGER IF EXISTS send_custom_search_email_trigger ON custom_search_submissions;

CREATE TRIGGER send_custom_search_email_trigger
  AFTER INSERT ON custom_search_submissions
  FOR EACH ROW
  EXECUTE FUNCTION send_custom_search_email_webhook();
