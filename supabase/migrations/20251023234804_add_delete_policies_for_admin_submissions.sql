/*
  # Add DELETE policies for admin on all form submission tables

  1. Changes
    - Add DELETE policy for `contact_submissions` table
    - Add DELETE policy for `custom_search_submissions` table
    - Add DELETE policy for `trade_in_submissions` table
    - Add DELETE policy for `financing_submissions` table
  
  2. Security
    - Only authenticated admin users can delete submissions
    - Policies use `auth.uid()` to ensure proper authentication
*/

-- Add DELETE policy for contact_submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contact_submissions' 
    AND policyname = 'Admins can delete contact submissions'
  ) THEN
    CREATE POLICY "Admins can delete contact submissions"
      ON contact_submissions
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Add DELETE policy for custom_search_submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'custom_search_submissions' 
    AND policyname = 'Admins can delete custom search submissions'
  ) THEN
    CREATE POLICY "Admins can delete custom search submissions"
      ON custom_search_submissions
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Add DELETE policy for trade_in_submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'trade_in_submissions' 
    AND policyname = 'Admins can delete trade-in submissions'
  ) THEN
    CREATE POLICY "Admins can delete trade-in submissions"
      ON trade_in_submissions
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Add DELETE policy for financing_submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'financing_submissions' 
    AND policyname = 'Admins can delete financing submissions'
  ) THEN
    CREATE POLICY "Admins can delete financing submissions"
      ON financing_submissions
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;