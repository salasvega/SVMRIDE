/*
  Lot 0 — rôle administrateur réel sur toutes les règles d'accès (16/10/2026).

  Avant : toutes les règles « admin » accordaient tout à n'importe quel compte
  connecté (TO authenticated USING (true)). Sans danger tant que les
  inscriptions sont fermées, mais l'espace propriétaire du dépôt-vente (lot 4)
  fera se connecter des clients : ils auraient vu tout le back-office.

  Après : chaque règle exige public.est_admin() (table private.administrateurs).
  Restent ouverts au public, volontairement : lecture des véhicules disponibles,
  photos des annonces, envoi de pièces jointes par les formulaires.

  ALTER POLICY plutôt que DROP/CREATE (même effet, sans fenêtre sans règle).
  Appliquée en production en deux étapes : securite_role_admin_tables puis
  securite_role_admin_fichiers.
  Vérifié : un compte connecté non admin ne voit plus aucune demande, aucun
  dossier ni aucune pièce ; l'admin voit tout.
*/

-- Demandes des formulaires
alter policy "Admins can read contact submissions" on public.contact_submissions using (public.est_admin());
alter policy "Admins can update contact submissions" on public.contact_submissions using (public.est_admin()) with check (public.est_admin());
alter policy "Admins can delete contact submissions" on public.contact_submissions using (public.est_admin());
alter policy "Admins can read custom search submissions" on public.custom_search_submissions using (public.est_admin());
alter policy "Admins can update custom search submissions" on public.custom_search_submissions using (public.est_admin()) with check (public.est_admin());
alter policy "Admins can delete custom search submissions" on public.custom_search_submissions using (public.est_admin());
alter policy "Admins can read financing submissions" on public.financing_submissions using (public.est_admin());
alter policy "Admins can update financing submissions" on public.financing_submissions using (public.est_admin()) with check (public.est_admin());
alter policy "Admins can delete financing submissions" on public.financing_submissions using (public.est_admin());
alter policy "Admins can read trade-in submissions" on public.trade_in_submissions using (public.est_admin());
alter policy "Admins can update trade-in submissions" on public.trade_in_submissions using (public.est_admin()) with check (public.est_admin());
alter policy "Admins can delete trade-in submissions" on public.trade_in_submissions using (public.est_admin());

-- Dossiers de vente
alter policy "Authenticated users can view sales folders" on public.sales_folders using (public.est_admin());
alter policy "Authenticated users can insert sales folders" on public.sales_folders with check (public.est_admin());
alter policy "Authenticated users can update sales folders" on public.sales_folders using (public.est_admin()) with check (public.est_admin());
alter policy "Authenticated users can delete sales folders" on public.sales_folders using (public.est_admin());

-- Dossiers de financement
alter policy "Admin : lecture des dossiers de financement" on public.user_financing_profiles using (public.est_admin());
alter policy "Admin : création des dossiers de financement" on public.user_financing_profiles with check (public.est_admin());
alter policy "Admin : modification des dossiers de financement" on public.user_financing_profiles using (public.est_admin()) with check (public.est_admin());
alter policy "Admin : suppression des dossiers de financement" on public.user_financing_profiles using (public.est_admin());

-- Véhicules (la lecture publique des véhicules disponibles reste inchangée)
alter policy "Les administrateurs peuvent tout voir" on public.vehicles using (public.est_admin());
alter policy "Les administrateurs peuvent insérer des véhicules" on public.vehicles with check (public.est_admin());
alter policy "Les administrateurs peuvent modifier des véhicules" on public.vehicles using (public.est_admin()) with check (public.est_admin());
alter policy "Les administrateurs peuvent supprimer des véhicules" on public.vehicles using (public.est_admin());

-- Fichiers
alter policy "Authenticated users can read form attachments" on storage.objects using (bucket_id = 'form-attachments' and public.est_admin());
alter policy "Authenticated users can delete form attachments" on storage.objects using (bucket_id = 'form-attachments' and public.est_admin());
alter policy "Admin : remplacement des pièces jointes" on storage.objects using (bucket_id = 'form-attachments' and public.est_admin()) with check (bucket_id = 'form-attachments' and public.est_admin());
alter policy "Authenticated users can view sales documents" on storage.objects using (bucket_id = 'sales-documents' and public.est_admin());
alter policy "Authenticated users can upload sales documents" on storage.objects with check (bucket_id = 'sales-documents' and public.est_admin());
alter policy "Authenticated users can update sales documents" on storage.objects using (bucket_id = 'sales-documents' and public.est_admin()) with check (bucket_id = 'sales-documents' and public.est_admin());
alter policy "Authenticated users can delete sales documents" on storage.objects using (bucket_id = 'sales-documents' and public.est_admin());
alter policy "Authenticated users can upload vehicle images" on storage.objects with check (bucket_id = 'vehicle-images' and public.est_admin());
alter policy "Authenticated users can update vehicle images" on storage.objects using (bucket_id = 'vehicle-images' and public.est_admin()) with check (bucket_id = 'vehicle-images' and public.est_admin());
alter policy "Authenticated users can delete vehicle images" on storage.objects using (bucket_id = 'vehicle-images' and public.est_admin());
alter policy "Public can view financing documents" on storage.objects using (bucket_id = 'financing-documents' and public.est_admin());
alter policy "Public can upload financing documents" on storage.objects with check (bucket_id = 'financing-documents' and public.est_admin());
alter policy "Public can update financing documents" on storage.objects using (bucket_id = 'financing-documents' and public.est_admin()) with check (bucket_id = 'financing-documents' and public.est_admin());
alter policy "Public can delete financing documents" on storage.objects using (bucket_id = 'financing-documents' and public.est_admin());

-- Les règles de fichiers « Public can … financing documents » gardent leur nom
-- trompeur : Supabase refuse de renommer les règles de storage.objects (table
-- dont il est propriétaire). Elles sont bien réservées à l'admin ci-dessus.

-- Outils de la carte « Stockage » : admin seulement
create or replace function public.stockage_utilise()
returns table (espace text, fichiers bigint, octets bigint)
language sql stable security definer set search_path = ''
as $$
  select bucket_id, count(*), coalesce(sum((metadata->>'size')::bigint), 0)
  from storage.objects where public.est_admin() group by bucket_id order by 3 desc;
$$;
create or replace function public.photos_a_compresser(p_min_octets bigint default 700000)
returns table (chemin text, octets bigint)
language sql stable security definer set search_path = ''
as $$
  select name, (metadata->>'size')::bigint from storage.objects
  where public.est_admin() and bucket_id = 'form-attachments'
    and metadata->>'mimetype' in ('image/jpeg', 'image/jpg')
    and (metadata->>'size')::bigint >= p_min_octets
  order by created_at;
$$;

-- Pour les fonctions serveur (clé secrète) : un compte donné est-il admin ?
create or replace function public.est_admin_compte(p_user uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from private.administrateurs where user_id = p_user);
$$;
revoke all on function public.est_admin_compte(uuid) from public, anon, authenticated;
grant execute on function public.est_admin_compte(uuid) to service_role;
