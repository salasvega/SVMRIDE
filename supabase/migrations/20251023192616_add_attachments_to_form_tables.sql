/*
  # Add Attachments Column to Form Submission Tables

  1. Changes
    - Add `attachments` JSONB column to contact_submissions table
    - Add `attachments` JSONB column to custom_search_submissions table
    - Add `attachments` JSONB column to trade_in_submissions table
    - Add `attachments` JSONB column to financing_submissions table

  2. Structure
    - Each attachment will be stored as a JSON object with:
      - filename: original filename
      - path: storage path in Supabase
      - size: file size in bytes
      - mime_type: MIME type of the file
*/

-- Add attachments column to contact_submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contact_submissions' AND column_name = 'attachments'
  ) THEN
    ALTER TABLE contact_submissions ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add attachments column to custom_search_submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'custom_search_submissions' AND column_name = 'attachments'
  ) THEN
    ALTER TABLE custom_search_submissions ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add attachments column to trade_in_submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trade_in_submissions' AND column_name = 'attachments'
  ) THEN
    ALTER TABLE trade_in_submissions ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add attachments column to financing_submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'financing_submissions' AND column_name = 'attachments'
  ) THEN
    ALTER TABLE financing_submissions ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;
