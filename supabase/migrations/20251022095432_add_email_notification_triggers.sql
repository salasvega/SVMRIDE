/*
  # Add Email Notification Triggers

  1. Purpose
    - Automatically send email notifications when new form submissions are created
    - Uses database triggers to call the send-notification-email Edge Function
    - Covers all form types: contact, financing, trade-in, and custom search

  2. Implementation
    - Creates a reusable trigger function that calls the Edge Function via http request
    - Uses pg_net extension (already available in Supabase) for HTTP requests
    - Adds triggers on all submission tables (INSERT only)
    - Runs asynchronously to avoid blocking the insert operation

  3. Security
    - Uses service role key for authenticated requests to Edge Function
    - Trigger function executes with definer privileges
    - No additional RLS policies needed (triggers run at database level)

  4. Tables Affected
    - contact_submissions
    - financing_submissions
    - trade_in_submissions
    - custom_search_submissions

  5. Configuration
    - Email recipient: salasvega@gmail.com (hardcoded in Edge Function)
    - Uses Resend API for email delivery
    - RESEND_API_KEY must be configured in Supabase secrets
*/

-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function that will be called by triggers to send notifications
CREATE OR REPLACE FUNCTION notify_new_submission()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  supabase_url text;
  service_role_key text;
  submission_type text;
BEGIN
  -- Get Supabase URL and service role key from environment
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);

  -- If not set in app settings, use default from Supabase environment
  IF supabase_url IS NULL THEN
    supabase_url := current_setting('supabase.url', true);
  END IF;

  -- Determine submission type based on table name
  submission_type := CASE TG_TABLE_NAME
    WHEN 'contact_submissions' THEN 'contact'
    WHEN 'financing_submissions' THEN 'financing'
    WHEN 'trade_in_submissions' THEN 'trade_in'
    WHEN 'custom_search_submissions' THEN 'custom_search'
    ELSE 'unknown'
  END;

  -- Make async HTTP request to Edge Function
  -- Using pg_net.http_post for non-blocking execution
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/send-notification-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(service_role_key, current_setting('supabase.service_role_key', true))
    ),
    body := jsonb_build_object(
      'type', submission_type,
      'record', row_to_json(NEW)
    )
  );

  RETURN NEW;
END;
$$;

-- Create triggers for contact_submissions
DROP TRIGGER IF EXISTS trigger_notify_contact_submission ON contact_submissions;
CREATE TRIGGER trigger_notify_contact_submission
  AFTER INSERT ON contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_submission();

-- Create triggers for financing_submissions
DROP TRIGGER IF EXISTS trigger_notify_financing_submission ON financing_submissions;
CREATE TRIGGER trigger_notify_financing_submission
  AFTER INSERT ON financing_submissions
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_submission();

-- Create triggers for trade_in_submissions
DROP TRIGGER IF EXISTS trigger_notify_trade_in_submission ON trade_in_submissions;
CREATE TRIGGER trigger_notify_trade_in_submission
  AFTER INSERT ON trade_in_submissions
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_submission();

-- Create triggers for custom_search_submissions
DROP TRIGGER IF EXISTS trigger_notify_custom_search_submission ON custom_search_submissions;
CREATE TRIGGER trigger_notify_custom_search_submission
  AFTER INSERT ON custom_search_submissions
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_submission();
