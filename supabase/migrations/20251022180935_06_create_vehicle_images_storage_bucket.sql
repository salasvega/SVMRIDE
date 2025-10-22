/*
  # Create vehicle-images storage bucket

  1. Storage Bucket
    - Create `vehicle-images` bucket for storing vehicle photos
    - Set to public access for easy image display
    - Configure file size limits and allowed MIME types

  2. Security Policies
    - Public read access for all users (to display images on website)
    - Authenticated users (admins) can upload images
    - Authenticated users (admins) can delete images

  3. Important Notes
    - Images are publicly accessible via direct URL
    - Only admins can upload/delete images
    - Bucket is optimized for image storage
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vehicle-images',
  'vehicle-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view vehicle images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'vehicle-images');

CREATE POLICY "Authenticated users can upload vehicle images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'vehicle-images');

CREATE POLICY "Authenticated users can update vehicle images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'vehicle-images')
  WITH CHECK (bucket_id = 'vehicle-images');

CREATE POLICY "Authenticated users can delete vehicle images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'vehicle-images');
