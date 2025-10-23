/*
  # Suppression du trigger webhook en double pour trade_in_submissions
  
  Cette migration supprime le trigger "Trade_In_WebHook" qui fait doublon
  avec le trigger "send_trade_in_email_trigger".
  
  Cela corrige le problème des emails de reprise envoyés en double.
*/

-- Supprimer le trigger webhook en double
DROP TRIGGER IF EXISTS "Trade_In_WebHook" ON trade_in_submissions;
