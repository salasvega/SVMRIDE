/*
  # Add admin_notes field to all form submission tables

  1. Changes
    - Add `admin_notes` column to `contact_submissions` table
    - Add `admin_notes` column to `custom_search_submissions` table
    - Add `admin_notes` column to `trade_in_submissions` table
    - Add `admin_notes` column to `financing_submissions` table
  
  2. Details
    - Column type: text (multiline)
    - Nullable: true (optional field)
    - Default value: empty string
    - Purpose: Allow administrators to add internal notes, actions, and remarks for each submission
*/

-- Add admin_notes to contact_submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contact_submissions' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE contact_submissions ADD COLUMN admin_notes text DEFAULT '';
  END IF;
END $$;

-- Add admin_notes to custom_search_submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'custom_search_submissions' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE custom_search_submissions ADD COLUMN admin_notes text DEFAULT '';
  END IF;
END $$;

-- Add admin_notes to trade_in_submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trade_in_submissions' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE trade_in_submissions ADD COLUMN admin_notes text DEFAULT '';
  END IF;
END $$;

-- Add admin_notes to financing_submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'financing_submissions' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE financing_submissions ADD COLUMN admin_notes text DEFAULT '';
  END IF;
END $$;