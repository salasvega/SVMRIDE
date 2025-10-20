/*
  # Ajout du statut aux soumissions de formulaires

  1. Modifications
    - Ajout d'une colonne `status` à toutes les tables de soumissions
    - Valeurs possibles : 'new', 'read', 'processed'
    - Valeur par défaut : 'new' pour les nouvelles soumissions
    - Ajout d'une colonne `read_at` pour suivre quand le message a été lu
    - Ajout d'une colonne `processed_at` pour suivre quand le message a été traité

  2. Tables modifiées
    - `contact_submissions`
    - `trade_in_submissions`
    - `custom_search_submissions`
    - `financing_submissions`

  3. Index
    - Ajout d'index sur la colonne `status` pour des requêtes optimisées
    - Ajout d'index sur `submitted_at` pour le tri

  4. Sécurité
    - Ajout de politiques UPDATE pour permettre aux admins de modifier le statut
*/

-- Add status columns to contact_submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contact_submissions' AND column_name = 'status'
  ) THEN
    ALTER TABLE contact_submissions ADD COLUMN status text DEFAULT 'new' NOT NULL;
    ALTER TABLE contact_submissions ADD COLUMN read_at timestamptz;
    ALTER TABLE contact_submissions ADD COLUMN processed_at timestamptz;
    
    -- Add check constraint for status values
    ALTER TABLE contact_submissions ADD CONSTRAINT contact_submissions_status_check 
      CHECK (status IN ('new', 'read', 'processed'));
  END IF;
END $$;

-- Add status columns to trade_in_submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trade_in_submissions' AND column_name = 'status'
  ) THEN
    ALTER TABLE trade_in_submissions ADD COLUMN status text DEFAULT 'new' NOT NULL;
    ALTER TABLE trade_in_submissions ADD COLUMN read_at timestamptz;
    ALTER TABLE trade_in_submissions ADD COLUMN processed_at timestamptz;
    
    -- Add check constraint for status values
    ALTER TABLE trade_in_submissions ADD CONSTRAINT trade_in_submissions_status_check 
      CHECK (status IN ('new', 'read', 'processed'));
  END IF;
END $$;

-- Add status columns to custom_search_submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'custom_search_submissions' AND column_name = 'status'
  ) THEN
    ALTER TABLE custom_search_submissions ADD COLUMN status text DEFAULT 'new' NOT NULL;
    ALTER TABLE custom_search_submissions ADD COLUMN read_at timestamptz;
    ALTER TABLE custom_search_submissions ADD COLUMN processed_at timestamptz;
    
    -- Add check constraint for status values
    ALTER TABLE custom_search_submissions ADD CONSTRAINT custom_search_submissions_status_check 
      CHECK (status IN ('new', 'read', 'processed'));
  END IF;
END $$;

-- Add status columns to financing_submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'financing_submissions' AND column_name = 'status'
  ) THEN
    ALTER TABLE financing_submissions ADD COLUMN status text DEFAULT 'new' NOT NULL;
    ALTER TABLE financing_submissions ADD COLUMN read_at timestamptz;
    ALTER TABLE financing_submissions ADD COLUMN processed_at timestamptz;
    
    -- Add check constraint for status values
    ALTER TABLE financing_submissions ADD CONSTRAINT financing_submissions_status_check 
      CHECK (status IN ('new', 'read', 'processed'));
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS contact_submissions_status_idx ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS contact_submissions_submitted_at_idx ON contact_submissions(submitted_at DESC);

CREATE INDEX IF NOT EXISTS trade_in_submissions_status_idx ON trade_in_submissions(status);
CREATE INDEX IF NOT EXISTS trade_in_submissions_submitted_at_idx ON trade_in_submissions(submitted_at DESC);

CREATE INDEX IF NOT EXISTS custom_search_submissions_status_idx ON custom_search_submissions(status);
CREATE INDEX IF NOT EXISTS custom_search_submissions_submitted_at_idx ON custom_search_submissions(submitted_at DESC);

CREATE INDEX IF NOT EXISTS financing_submissions_status_idx ON financing_submissions(status);
CREATE INDEX IF NOT EXISTS financing_submissions_submitted_at_idx ON financing_submissions(submitted_at DESC);

-- Add UPDATE policies for admins to change submission status
DROP POLICY IF EXISTS "Admins can update contact submissions" ON contact_submissions;
CREATE POLICY "Admins can update contact submissions"
  ON contact_submissions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update trade-in submissions" ON trade_in_submissions;
CREATE POLICY "Admins can update trade-in submissions"
  ON trade_in_submissions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update custom search submissions" ON custom_search_submissions;
CREATE POLICY "Admins can update custom search submissions"
  ON custom_search_submissions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update financing submissions" ON financing_submissions;
CREATE POLICY "Admins can update financing submissions"
  ON financing_submissions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);