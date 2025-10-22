/*
  # Remove Email Notification Triggers

  1. Purpose
    - Remove all email notification triggers from the database
    - Remove the trigger function that calls the Edge Function
    - This will allow form submissions to work without email dependencies

  2. Changes
    - Drop all triggers on submission tables
    - Drop the notify_new_submission function
    - Note: pg_net extension is left enabled as it's harmless

  3. Tables Affected
    - contact_submissions
    - financing_submissions
    - trade_in_submissions
    - custom_search_submissions
*/

-- Drop all triggers
DROP TRIGGER IF EXISTS trigger_notify_contact_submission ON contact_submissions;
DROP TRIGGER IF EXISTS trigger_notify_financing_submission ON financing_submissions;
DROP TRIGGER IF EXISTS trigger_notify_trade_in_submission ON trade_in_submissions;
DROP TRIGGER IF EXISTS trigger_notify_custom_search_submission ON custom_search_submissions;

-- Drop the trigger function
DROP FUNCTION IF EXISTS notify_new_submission();
