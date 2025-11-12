/*
  # Fix Sales Documents Storage Policies
  
  ## Overview
  Updates the RLS policies for the sales-documents storage bucket to allow
  authenticated users (admins) to upload and manage documents.
  
  ## Changes
  - Drop existing restrictive policies that check for 'admin' role
  - Create new policies that allow all authenticated users (who are admins by design)
  
  ## Security
  - Only authenticated users can access the sales-documents bucket
  - This aligns with the application's design where all authenticated users are admins
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view sales documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload sales documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update sales documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete sales documents" ON storage.objects;

-- Create new policies for authenticated users
CREATE POLICY "Authenticated users can view sales documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'sales-documents');

CREATE POLICY "Authenticated users can upload sales documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'sales-documents');

CREATE POLICY "Authenticated users can update sales documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'sales-documents')
  WITH CHECK (bucket_id = 'sales-documents');

CREATE POLICY "Authenticated users can delete sales documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'sales-documents');
