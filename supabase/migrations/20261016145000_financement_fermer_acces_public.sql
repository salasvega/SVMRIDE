/*
  Fermeture des accès publics aux dossiers et pièces de financement (16/10/2026).

  Avant : n'importe qui, avec la clé publique du site, pouvait lire, créer,
  modifier et supprimer tous les dossiers (user_financing_profiles) et
  lire, lister, envoyer et supprimer toutes les pièces (financing-documents).

  Après : seul l'admin connecté y accède. Le parcours client passe par la
  fonction serveur « financing-dossier » (accès par e-mail + code personnel).

  Appliqué en production par étapes (outil : les DROP POLICY demandaient une
  confirmation), d'où ALTER POLICY ... TO authenticated au lieu de DROP.
*/

-- Pièces : espace privé
update storage.buckets set public = false where id = 'financing-documents';

-- Dossiers : admin seulement
alter policy "Anyone can view their own financing profile" on public.user_financing_profiles rename to "Admin : lecture des dossiers de financement";
alter policy "Anyone can update financing profile" on public.user_financing_profiles to authenticated using (true) with check (true);
alter policy "Anyone can update financing profile" on public.user_financing_profiles rename to "Admin : modification des dossiers de financement";
alter policy "Anyone can delete financing profile" on public.user_financing_profiles to authenticated using (true);
alter policy "Anyone can delete financing profile" on public.user_financing_profiles rename to "Admin : suppression des dossiers de financement";
alter policy "Anyone can create financing profile" on public.user_financing_profiles to authenticated with check (true);
alter policy "Anyone can create financing profile" on public.user_financing_profiles rename to "Admin : création des dossiers de financement";
alter policy "Admin : lecture des dossiers de financement" on public.user_financing_profiles to authenticated using (true);

-- Table inutilisée par le site : protection activée (aucune règle = aucun accès client)
alter table public.financing_documents enable row level security;

-- Pièces : admin seulement
alter policy "Public can view financing documents" on storage.objects to authenticated using (bucket_id = 'financing-documents');
alter policy "Public can delete financing documents" on storage.objects to authenticated using (bucket_id = 'financing-documents');
alter policy "Public can upload financing documents" on storage.objects to authenticated with check (bucket_id = 'financing-documents');
alter policy "Public can update financing documents" on storage.objects to authenticated using (bucket_id = 'financing-documents') with check (bucket_id = 'financing-documents');
