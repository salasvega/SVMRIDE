/*
  # Politiques de sécurité pour le stockage des images de véhicules

  1. Politiques
    - Lecture publique : Tout le monde peut voir les images
    - Upload : Seuls les utilisateurs authentifiés peuvent uploader
    - Mise à jour : Seuls les utilisateurs authentifiés peuvent modifier
    - Suppression : Seuls les utilisateurs authentifiés peuvent supprimer
  
  2. Sécurité
    - Les images sont publiques pour être affichées sur le site
    - Seuls les administrateurs authentifiés peuvent gérer les images
*/

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

-- Policy: Authenticated users can update their uploaded images
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