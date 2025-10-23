/*
  # Création de la fonction webhook pour les contacts
  
  Cette migration crée la fonction trigger pour envoyer les notifications
  par email lors de nouvelles soumissions de contact, en homogénéité avec
  les autres fonctions webhook existantes.
  
  1. Fonction créée
    - `send_contact_email_webhook()` : Fonction trigger qui appelle l'edge function
  
  2. Trigger créé
    - `send_contact_email_trigger` : Se déclenche après INSERT sur contact_submissions
  
  3. Sécurité
    - Fonction définie avec SECURITY DEFINER pour avoir les permissions nécessaires
    - Utilise pg_net.http_post pour appeler l'edge function de notification
  
  Note: Le trigger existant "SendMailOnContactReceived" sera conservé si présent.
*/

-- Créer la fonction webhook pour les contacts
CREATE OR REPLACE FUNCTION send_contact_email_webhook()
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
    url := supabase_url || '/functions/v1/contact-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'contact_submissions',
      'record', row_to_json(NEW)
    ),
    timeout_milliseconds := 5000
  );

  RETURN NEW;
END;
$$;

-- Créer le trigger pour contact_submissions
-- Note: On utilise CREATE OR REPLACE pour éviter les conflits avec les triggers existants
DROP TRIGGER IF EXISTS send_contact_email_trigger ON contact_submissions;

CREATE TRIGGER send_contact_email_trigger
  AFTER INSERT ON contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION send_contact_email_webhook();
