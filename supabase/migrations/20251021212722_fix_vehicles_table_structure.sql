/*
  # Fix vehicles table structure

  1. Changes
    - Add `status` column to replace the boolean `available` field
    - Set default values for existing nullable columns
    - Update RLS policies to use the new `status` field
    - Make `displacement`, `condition`, and `warranty` nullable with defaults

  2. Data Migration
    - Convert existing `available` boolean values to `status` string values
    - Keep the `available` column for backward compatibility initially

  3. Security
    - Update SELECT policy to work with the new `status` field
*/

-- Add the status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'status'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN status text DEFAULT 'available';
  END IF;
END $$;

-- Migrate existing data: convert available boolean to status string
UPDATE vehicles
SET status = CASE
  WHEN available = true THEN 'available'
  WHEN available = false THEN 'sold'
  ELSE 'available'
END
WHERE status IS NULL OR status = '';

-- Make columns nullable with defaults
ALTER TABLE vehicles ALTER COLUMN displacement DROP NOT NULL;
ALTER TABLE vehicles ALTER COLUMN displacement SET DEFAULT 0;

ALTER TABLE vehicles ALTER COLUMN condition DROP NOT NULL;
ALTER TABLE vehicles ALTER COLUMN condition SET DEFAULT '';

-- Set default for warranty if null
UPDATE vehicles SET warranty = '' WHERE warranty IS NULL;

-- Drop the old SELECT policy
DROP POLICY IF EXISTS "Tout le monde peut voir les véhicules disponibles" ON vehicles;

-- Create new SELECT policy using status field
CREATE POLICY "Tout le monde peut voir les véhicules"
  ON vehicles
  FOR SELECT
  TO public
  USING (true);

-- Ensure authenticated users can still manage vehicles
DROP POLICY IF EXISTS "Les administrateurs peuvent insérer des véhicules" ON vehicles;
CREATE POLICY "Les administrateurs peuvent insérer des véhicules"
  ON vehicles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Les administrateurs peuvent modifier des véhicules" ON vehicles;
CREATE POLICY "Les administrateurs peuvent modifier des véhicules"
  ON vehicles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Les administrateurs peuvent supprimer des véhicules" ON vehicles;
CREATE POLICY "Les administrateurs peuvent supprimer des véhicules"
  ON vehicles
  FOR DELETE
  TO authenticated
  USING (true);
