/*
  # Nettoyage des anciens triggers webhook
  
  Cette migration supprime les anciens triggers qui font doublon
  avec les nouveaux triggers standardisés.
  
  Triggers supprimés :
  - SendMailOnContactReceived (remplacé par send_contact_email_trigger)
  - SendMailOnCustom-search-form (remplacé par send_custom_search_email_trigger)
  
  Les nouveaux triggers standardisés conservés :
  - send_contact_email_trigger
  - send_custom_search_email_trigger
  - send_financing_email_trigger
  - send_trade_in_email_trigger
*/

-- Supprimer les anciens triggers
DROP TRIGGER IF EXISTS "SendMailOnContactReceived" ON contact_submissions;
DROP TRIGGER IF EXISTS "SendMailOnCustom-search-form" ON custom_search_submissions;
