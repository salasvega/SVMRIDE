/*
  # Suppression du trigger SQL en double pour custom_search_submissions
  
  Cette migration supprime le trigger SQL `send_custom_search_email_trigger` qui fait doublon
  avec le webhook du Dashboard `custom_search_WebHook`.
  
  On garde uniquement le webhook du Dashboard pour uniformiser avec les autres formulaires
  (Contact et Trade-In qui utilisent les webhooks du Dashboard).
*/

-- Supprimer le trigger SQL en double
DROP TRIGGER IF EXISTS send_custom_search_email_trigger ON custom_search_submissions;
DROP FUNCTION IF EXISTS send_custom_search_email_webhook();
