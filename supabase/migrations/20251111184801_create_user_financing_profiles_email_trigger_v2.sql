/*
  # Create email notification trigger for user financing profiles

  1. New Functions
    - `notify_financing_profile_submission`: Function to call edge function when a profile is submitted
    - Triggers on INSERT or UPDATE when `submitted_at` is not null

  2. Security
    - Uses service role to call the edge function
    - Only triggers when a profile is newly submitted

  3. Notes
    - Sends notification to financing-profile-notification edge function
    - Includes all profile data in the webhook payload
*/

CREATE OR REPLACE FUNCTION notify_financing_profile_submission()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url text;
  should_notify boolean := false;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.submitted_at IS NOT NULL THEN
    should_notify := true;
  ELSIF TG_OP = 'UPDATE' AND OLD.submitted_at IS NULL AND NEW.submitted_at IS NOT NULL THEN
    should_notify := true;
  END IF;

  IF NOT should_notify THEN
    RETURN NEW;
  END IF;

  webhook_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/financing-profile-notification';
  
  IF webhook_url IS NULL OR webhook_url = '' THEN
    webhook_url := 'https://' || current_setting('app.settings.project_ref', true) || '.supabase.co/functions/v1/financing-profile-notification';
  END IF;

  PERFORM
    net.http_post(
      url := webhook_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'type', TG_OP,
        'table', TG_TABLE_NAME,
        'record', row_to_json(NEW)
      )
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_financing_profile_submitted ON public.user_financing_profiles;

CREATE TRIGGER on_financing_profile_submitted
AFTER INSERT OR UPDATE ON public.user_financing_profiles
FOR EACH ROW
EXECUTE FUNCTION notify_financing_profile_submission();
