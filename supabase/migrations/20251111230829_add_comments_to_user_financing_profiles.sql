/*
  # Add comments field to user_financing_profiles table

  1. Changes
    - Add `comments` column to `user_financing_profiles` table
      - Type: text
      - Nullable: true (non-obligatoire)
      - Purpose: Allow users to add optional notes/comments from the financing profile page

  2. Notes
    - This field is optional and allows users to provide additional context or notes
    - Will be displayed in the admin modal and included in email notifications
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_financing_profiles' AND column_name = 'comments'
  ) THEN
    ALTER TABLE user_financing_profiles ADD COLUMN comments text;
  END IF;
END $$;