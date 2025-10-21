/*
  # Add comments field to financing submissions

  1. Changes
    - Add `comments` column to `financing_submissions` table
      - Type: text (nullable)
      - Allows users to add optional free-form text with questions or additional information
  
  2. Notes
    - Column is optional (nullable) to maintain backward compatibility
    - No default value needed as field is optional
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'financing_submissions' AND column_name = 'comments'
  ) THEN
    ALTER TABLE financing_submissions ADD COLUMN comments text;
  END IF;
END $$;