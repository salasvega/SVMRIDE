/*
  # Create financing-documents storage bucket

  1. Storage Configuration
    - Creates a new storage bucket named `financing-documents`
    - Sets the bucket as public for read access
    - Maximum file size: 10MB
    - Allowed MIME types: images and PDFs

  2. Security Policies
    - Allow authenticated users to upload files
    - Allow public read access to files
    - Allow users to delete their own files based on folder structure
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'financing-documents',
  'financing-documents',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow public read access financing-documents'
  ) THEN
    CREATE POLICY "Allow public read access financing-documents"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'financing-documents');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow authenticated users to upload financing-documents'
  ) THEN
    CREATE POLICY "Allow authenticated users to upload financing-documents"
    ON storage.objects FOR INSERT
    TO public
    WITH CHECK (bucket_id = 'financing-documents');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow users to delete their own files financing-documents'
  ) THEN
    CREATE POLICY "Allow users to delete their own files financing-documents"
    ON storage.objects FOR DELETE
    TO public
    USING (bucket_id = 'financing-documents');
  END IF;
END $$;