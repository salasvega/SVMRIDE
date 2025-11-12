/*
  # Add Storage Cleanup Triggers for Form Submissions

  1. Purpose
    - Automatically delete files from storage when submissions are deleted
    - Prevent orphaned files in form-attachments bucket
    - Clean up attachments for all submission types

  2. Implementation
    - Create function to delete files from storage.objects
    - Add AFTER DELETE triggers for each submission table
    - Parse attachments JSONB to extract file paths
    - Delete corresponding storage objects

  3. Tables Affected
    - contact_submissions
    - custom_search_submissions
    - trade_in_submissions
    - financing_submissions

  4. Security
    - Function executes with SECURITY DEFINER to bypass RLS
    - Only deletes files from form-attachments bucket
    - Validates JSON structure before processing
*/

-- Function to delete storage objects for a submission's attachments
CREATE OR REPLACE FUNCTION delete_submission_attachments()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  attachment JSONB;
  file_path TEXT;
BEGIN
  -- Only process if there are attachments
  IF OLD.attachments IS NOT NULL AND jsonb_array_length(OLD.attachments) > 0 THEN
    -- Loop through each attachment
    FOR attachment IN SELECT * FROM jsonb_array_elements(OLD.attachments)
    LOOP
      -- Extract the file path
      file_path := attachment->>'path';

      -- Delete the file from storage if path exists
      IF file_path IS NOT NULL AND file_path != '' THEN
        DELETE FROM storage.objects
        WHERE bucket_id = 'form-attachments'
        AND name = file_path;
      END IF;
    END LOOP;
  END IF;

  RETURN OLD;
END;
$$;

-- Trigger for contact_submissions
DROP TRIGGER IF EXISTS cleanup_contact_attachments ON contact_submissions;
CREATE TRIGGER cleanup_contact_attachments
  AFTER DELETE ON contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION delete_submission_attachments();

-- Trigger for custom_search_submissions
DROP TRIGGER IF EXISTS cleanup_custom_search_attachments ON custom_search_submissions;
CREATE TRIGGER cleanup_custom_search_attachments
  AFTER DELETE ON custom_search_submissions
  FOR EACH ROW
  EXECUTE FUNCTION delete_submission_attachments();

-- Trigger for trade_in_submissions
DROP TRIGGER IF EXISTS cleanup_trade_in_attachments ON trade_in_submissions;
CREATE TRIGGER cleanup_trade_in_attachments
  AFTER DELETE ON trade_in_submissions
  FOR EACH ROW
  EXECUTE FUNCTION delete_submission_attachments();

-- Trigger for financing_submissions
DROP TRIGGER IF EXISTS cleanup_financing_attachments ON financing_submissions;
CREATE TRIGGER cleanup_financing_attachments
  AFTER DELETE ON financing_submissions
  FOR EACH ROW
  EXECUTE FUNCTION delete_submission_attachments();
