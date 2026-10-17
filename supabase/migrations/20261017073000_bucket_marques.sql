-- Logos des marques du carrousel « Explorez les marques » (lecture publique, écriture admin)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('marques', 'marques', true, 1048576, array['image/svg+xml', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "marques : ajout admin" on storage.objects
  for insert to authenticated with check (bucket_id = 'marques' and public.est_admin());
create policy "marques : modification admin" on storage.objects
  for update to authenticated using (bucket_id = 'marques' and public.est_admin()) with check (bucket_id = 'marques' and public.est_admin());
create policy "marques : suppression admin" on storage.objects
  for delete to authenticated using (bucket_id = 'marques' and public.est_admin());
