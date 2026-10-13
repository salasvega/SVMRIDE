/*
  # Fix financing profile notification trigger

  1. Changes
    - Update trigger function to use hardcoded webhook URL
    - Remove dependency on database settings
    - Use direct Supabase project URL

  2. Security
    - Service role key is passed via Authorization header
    - Function is SECURITY DEFINER for proper permissions
*/

CREATE OR REPLACE FUNCTION notify_financing_profile_submission()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url text;
  should_notify boolean := false;
  service_key text;
BEGIN
  -- Check if we should notify
  IF TG_OP = 'INSERT' AND NEW.submitted_at IS NOT NULL THEN
    should_notify := true;
  ELSIF TG_OP = 'UPDATE' AND OLD.submitted_at IS NULL AND NEW.submitted_at IS NOT NULL THEN
    should_notify := true;
  END IF;

  IF NOT should_notify THEN
    RETURN NEW;
  END IF;

  -- Construct webhook URL directly
  webhook_url := 'https://fthoybkgbnxzlrjbprrh.supabase.co/functions/v1/financing-profile-notification';
  
  -- Service role key
  service_key := '<CLE_RETIREE>';

  -- Call the edge function
  PERFORM
    net.http_post(
      url := webhook_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := jsonb_build_object(
        'type', TG_OP,
        'table', TG_TABLE_NAME,
        'record', row_to_json(NEW)
      )
    );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Failed to send notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
