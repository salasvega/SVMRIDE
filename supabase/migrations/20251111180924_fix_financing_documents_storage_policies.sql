/*
  # Fix financing-documents storage policies

  1. Changes
    - Drop all conflicting policies for financing-documents bucket
    - Recreate clean policies with correct permissions
    - Allow anyone (authenticated or not) to upload documents
    - Allow anyone to read documents
    - Allow anyone to delete documents
    - Allow anyone to update documents

  2. Security
    - Public access for read operations
    - Public access for write operations (required for form submissions)
*/

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow authenticated users to upload financing-documents" ON storage.objects;
  DROP POLICY IF EXISTS "Allow public read access financing-documents" ON storage.objects;
  DROP POLICY IF EXISTS "Allow users to delete their own files financing-documents" ON storage.objects;
  DROP POLICY IF EXISTS "Anyone can delete financing documents" ON storage.objects;
  DROP POLICY IF EXISTS "Anyone can update financing documents" ON storage.objects;
  DROP POLICY IF EXISTS "Anyone can upload financing documents" ON storage.objects;
  DROP POLICY IF EXISTS "Anyone can view financing documents" ON storage.objects;
  DROP POLICY IF EXISTS "no anon delete financing" ON storage.objects;
  DROP POLICY IF EXISTS "no anon insert financing" ON storage.objects;
  DROP POLICY IF EXISTS "no anon read financing" ON storage.objects;
  DROP POLICY IF EXISTS "no anon update financing" ON storage.objects;
END $$;

CREATE POLICY "Public can view financing documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'financing-documents');

CREATE POLICY "Public can upload financing documents"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'financing-documents');

CREATE POLICY "Public can update financing documents"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'financing-documents')
WITH CHECK (bucket_id = 'financing-documents');

CREATE POLICY "Public can delete financing documents"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'financing-documents');
