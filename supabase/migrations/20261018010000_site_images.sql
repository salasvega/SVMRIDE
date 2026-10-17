/*
  Logo et icône du site modifiables dans l'admin (18/10/2026), onglet
  « Infos du site », bloc « Logo et icône ».

  - Bucket public « site-images » (PNG/WebP, 2 Mo max), écriture admin : les
    différentes tailles générées dans le navigateur (onglet, iPhone, Android,
    Google, logo de la barre du haut), rangées par version (icone/<horodatage>/).
  - Réglage « identite » de public.site_reglages : { "icone": { version, logo,
    favicon_32, favicon_48, apple_180, icon_192, icon_512, maskable_512 } } ;
    « icone » à null (ou réglage absent) = logo d'origine du site (dossier public/).
    Historique automatique (site_reglages_historique).
*/
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-images', 'site-images', true, 2097152, array['image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "site-images : ajout admin" on storage.objects
  for insert to authenticated with check (bucket_id = 'site-images' and public.est_admin());
create policy "site-images : modification admin" on storage.objects
  for update to authenticated using (bucket_id = 'site-images' and public.est_admin()) with check (bucket_id = 'site-images' and public.est_admin());
create policy "site-images : suppression admin" on storage.objects
  for delete to authenticated using (bucket_id = 'site-images' and public.est_admin());

insert into public.site_reglages (cle, valeur, updated_by)
values ('identite', '{"icone": null}'::jsonb, 'logo d''origine (18/10/2026)')
on conflict (cle) do nothing;
