/*
  Équipe SVM Ride gérée depuis l'admin (17/10/2026, demande de Seb).

  - public.equipe_membres : une fiche par personne (prénom, nom facultatif,
    fonction, citation, présentation du responsable, photo, ordre, affichée ou non).
  - Le site (accueil « Des passionnés à votre service », page /equipe, page
    Contact) lit les fiches affichées ; seuls les administrateurs modifient.
  - Une seule fiche « responsable » (mise en avant, carte noir et or).
  - Photos : bucket public « equipe-photos » (WebP/JPEG, 2 Mo max), envoyées
    depuis l'admin après recadrage carré ; photo_chemin permet d'effacer le
    fichier quand la photo est remplacée ou la fiche supprimée. Les 4 fiches de
    départ gardent leurs photos actuelles, servies par le site (photo_chemin vide).
  - accord_photo_le : date à laquelle l'admin a confirmé l'accord de la personne
    pour publier sa photo et son prénom (droit à l'image).
*/

create table if not exists public.equipe_membres (
  id uuid primary key default gen_random_uuid(),
  prenom text not null check (char_length(btrim(prenom)) between 1 and 40),
  nom text check (nom is null or char_length(nom) <= 60),
  fonction text not null check (char_length(btrim(fonction)) between 1 and 60),
  citation text check (citation is null or char_length(citation) <= 220),
  presentation text check (presentation is null or char_length(presentation) <= 1500),
  photo_url text check (photo_url is null or photo_url ~ '^(/|https://)'),
  photo_avif text check (photo_avif is null or photo_avif ~ '^(/|https://)'),
  photo_jpg text check (photo_jpg is null or photo_jpg ~ '^(/|https://)'),
  photo_chemin text,
  accord_photo_le timestamptz,
  ordre integer not null default 0,
  responsable boolean not null default false,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.equipe_membres is 'Fiches de l''équipe affichées sur le site (accueil, /equipe, contact) ; gérées dans l''admin, onglet Équipe.';

create unique index if not exists equipe_membres_un_responsable on public.equipe_membres (responsable) where responsable;
create index if not exists equipe_membres_ordre on public.equipe_membres (ordre);

create or replace trigger equipe_membres_updated_at before update on public.equipe_membres
  for each row execute function public.update_updated_at_column();

alter table public.equipe_membres enable row level security;

create policy "Équipe : lecture des fiches affichées" on public.equipe_membres
  for select to anon, authenticated using (visible);
create policy "Équipe : lecture admin" on public.equipe_membres
  for select to authenticated using (public.est_admin());
create policy "Équipe : création admin" on public.equipe_membres
  for insert to authenticated with check (public.est_admin());
create policy "Équipe : modification admin" on public.equipe_membres
  for update to authenticated using (public.est_admin()) with check (public.est_admin());
create policy "Équipe : suppression admin" on public.equipe_membres
  for delete to authenticated using (public.est_admin());

-- Photos (lecture publique par l'URL du fichier, écriture admin)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('equipe-photos', 'equipe-photos', true, 2097152, array['image/webp', 'image/jpeg'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "equipe-photos : ajout admin" on storage.objects
  for insert to authenticated with check (bucket_id = 'equipe-photos' and public.est_admin());
create policy "equipe-photos : modification admin" on storage.objects
  for update to authenticated using (bucket_id = 'equipe-photos' and public.est_admin()) with check (bucket_id = 'equipe-photos' and public.est_admin());
create policy "equipe-photos : suppression admin" on storage.objects
  for delete to authenticated using (bucket_id = 'equipe-photos' and public.est_admin());

-- Fiches de départ : l'équipe publiée le 16/10/2026 (src/config/equipe.ts)
insert into public.equipe_membres (prenom, fonction, citation, presentation, photo_url, photo_avif, photo_jpg, ordre, responsable)
select * from (values
  ('Mattia', 'Responsable commercial',
   'Une bonne affaire, c''est une moto dont on est encore content un an après.',
   'Chez SVM Ride, chaque moto est choisie, contrôlée et présentée comme si elle devait rejoindre mon propre garage.' || E'\n\n' ||
   'Mon rôle est de vous conseiller franchement, sans pression : vous expliquer l''histoire de la moto, son entretien, ses points forts, et trouver avec vous la solution de financement ou de reprise qui vous convient. Et je reste disponible après la vente.',
   '/equipe-mattia.webp', '/equipe/mattia.avif', '/equipe/mattia.jpg', 0, true),
  ('Amanda', 'Conseillère en financement',
   'Trouver le financement qui colle à votre budget, c''est mon puzzle préféré.', null,
   '/equipe/amanda.webp', '/equipe/amanda.avif', '/equipe/amanda.jpg', 1, false),
  ('Pedro', 'Technicien atelier',
   'Une moto bien préparée, c''est une moto qu''on oublie pour ne penser qu''à la route.', null,
   '/equipe/pedro.webp', '/equipe/pedro.avif', '/equipe/pedro.jpg', 2, false),
  ('Valentin', 'Expert reprises et dépôt-vente',
   'J''estime chaque moto avec honnêteté, comme si c''était la mienne.', null,
   '/equipe/valentin.webp', '/equipe/valentin.avif', '/equipe/valentin.jpg', 3, false)
) as v(prenom, fonction, citation, presentation, photo_url, photo_avif, photo_jpg, ordre, responsable)
where not exists (select 1 from public.equipe_membres);

-- Au passage (alerte de sécurité Supabase) : chemin de recherche figé
alter function private.delai_sans_suite() set search_path = '';
