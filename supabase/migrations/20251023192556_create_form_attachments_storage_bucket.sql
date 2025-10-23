/*
  # Create Form Attachments Storage Bucket

  1. Storage Setup
    - Create `form-attachments` bucket for storing uploaded files from forms
    - Configure bucket to allow uploads from authenticated and anonymous users
    - Set file size limit to 10MB
    - Allow common document and image formats

  2. Security
    - Enable RLS on storage.objects
    - Allow public INSERT for file uploads
    - Allow authenticated users to read files
    - Prevent unauthorized deletions

  3. Policies
    - Anyone can upload files to form-attachments bucket
    - Authenticated users (admins) can read all files
    - Only authenticated users can delete files
*/

-- Create the form-attachments bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'form-attachments',
  'form-attachments',
  false,
  10485760, -- 10MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow anyone to upload files
CREATE POLICY "Anyone can upload form attachments"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'form-attachments');

-- Policy: Allow authenticated users to read files
CREATE POLICY "Authenticated users can read form attachments"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'form-attachments');

-- Policy: Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete form attachments"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'form-attachments');
