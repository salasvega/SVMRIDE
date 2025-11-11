/*
  # Add admin notes to user financing profiles

  1. Changes
    - Add `admin_notes` column to `user_financing_profiles` table
      - Type: text
      - Nullable: true (optional field)
      - Default: empty string
  
  2. Purpose
    - Allow administrators to add internal notes about financing profile requests
    - Notes are only visible to administrators, not to end users
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_financing_profiles' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE user_financing_profiles ADD COLUMN admin_notes text DEFAULT '';
  END IF;
END $$;
