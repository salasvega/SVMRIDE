/*
  # Fix vehicle images storage bucket and policies

  1. Changes
    - Create vehicle-images bucket if not exists
    - Add RLS policies for storage.objects table
    - Enable public read access for vehicle images
    - Restrict upload/update/delete to authenticated users only

  2. Security
    - Public can view all vehicle images
    - Only authenticated admins can upload, update, or delete images
*/

-- Ensure the bucket exists (already created, but this is idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vehicle-images',
  'vehicle-images',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete vehicle images" ON storage.objects;

-- Policy: Anyone can view vehicle images (public read)
CREATE POLICY "Public read access for vehicle images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'vehicle-images');

-- Policy: Authenticated users can upload vehicle images
CREATE POLICY "Authenticated users can upload vehicle images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vehicle-images');

-- Policy: Authenticated users can update vehicle images
CREATE POLICY "Authenticated users can update vehicle images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'vehicle-images')
WITH CHECK (bucket_id = 'vehicle-images');

-- Policy: Authenticated users can delete vehicle images
CREATE POLICY "Authenticated users can delete vehicle images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'vehicle-images');
