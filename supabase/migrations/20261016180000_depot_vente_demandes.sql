/*
  Dépôt-vente — lot 1 : demandes d'estimation « Vendre ma moto » (16/10/2026).

  - Rôle administrateur réel : table private.administrateurs + public.est_admin().
    Les nouvelles tables l'utilisent dès maintenant ; les règles existantes
    (« tout compte connecté = admin ») seront migrées au lot 0.
    Le seul compte existant à cette date est déclaré administrateur.
  - depot_demandes : une demande par formulaire, écrite uniquement par la
    fonction serveur « depot-demande » (jamais directement par le navigateur).
  - depot_demandes_historique : changements de statut et notes, consignés
    automatiquement (qui, quand, avant / après).
  - Espace de fichiers privé « depot-photos » : photos envoyées par lien
    d'envoi à usage unique, consultées par l'admin par lien temporaire.
  - Suppression d'une demande : ses photos sont effacées (API Storage).
*/

-- Administrateurs
create table if not exists private.administrateurs (
  user_id uuid primary key references auth.users (id) on delete cascade,
  ajoute_le timestamptz not null default now()
);
revoke all on private.administrateurs from public, anon, authenticated;
insert into private.administrateurs (user_id) select id from auth.users on conflict do nothing;

create or replace function public.est_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from private.administrateurs where user_id = auth.uid());
$$;
revoke all on function public.est_admin() from public, anon;
grant execute on function public.est_admin() to authenticated;

-- Demandes
create sequence if not exists public.depot_demande_numero_seq;

create table if not exists public.depot_demandes (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique
    default ('DEM-' || to_char(now() at time zone 'Europe/Paris', 'YYYY') || '-' ||
             lpad(nextval('public.depot_demande_numero_seq')::text, 4, '0')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- false tant que les photos ne sont pas toutes envoyées (demande invisible)
  envoi_termine boolean not null default false,
  statut text not null default 'nouvelle'
    check (statut in ('nouvelle', 'a_qualifier', 'en_echange', 'acceptee', 'refusee', 'abandonnee')),
  -- Propriétaire
  prenom text not null check (char_length(prenom) between 1 and 80),
  nom text not null check (char_length(nom) between 1 and 80),
  email text not null check (char_length(email) <= 254),
  telephone text not null check (char_length(telephone) <= 30),
  -- Moto
  marque text not null check (char_length(marque) <= 60),
  modele text not null check (char_length(modele) <= 80),
  version text check (char_length(version) <= 80),
  annee integer not null check (annee between 1950 and 2100),
  kilometrage integer not null check (kilometrage between 0 and 1000000),
  immatriculation text check (char_length(immatriculation) <= 20),
  etat text not null check (etat in ('excellent', 'tres_bon', 'bon', 'correct', 'a_reviser')),
  entretien text check (entretien in ('complet', 'partiel', 'inconnu')),
  prix_souhaite integer check (prix_souhaite between 0 and 1000000),
  commentaire text check (char_length(commentaire) <= 3000),
  photos jsonb not null default '[]'::jsonb,
  -- RGPD et anti-abus
  consentement_version text not null,
  consentement_le timestamptz not null,
  ip_empreinte text,
  -- E-mails (une seule fois chacun)
  accuse_envoye_le timestamptz,
  alerte_envoyee_le timestamptz,
  -- Suivi admin
  lu_le timestamptz,
  notes_internes text
);

create index if not exists depot_demandes_statut_idx on public.depot_demandes (statut, created_at desc);
create index if not exists depot_demandes_ip_idx on public.depot_demandes (ip_empreinte, created_at desc);
create index if not exists depot_demandes_email_idx on public.depot_demandes (lower(email), created_at desc);

alter table public.depot_demandes enable row level security;

create policy "Admin : lecture des demandes de dépôt-vente"
  on public.depot_demandes for select to authenticated using (public.est_admin());
create policy "Admin : modification des demandes de dépôt-vente"
  on public.depot_demandes for update to authenticated using (public.est_admin()) with check (public.est_admin());
create policy "Admin : suppression des demandes de dépôt-vente"
  on public.depot_demandes for delete to authenticated using (public.est_admin());

-- L'admin ne modifie que le suivi (statut, lecture, notes) ; le reste est la parole du client
revoke update on public.depot_demandes from authenticated;
grant update (statut, lu_le, notes_internes) on public.depot_demandes to authenticated;

-- Historique
create table if not exists public.depot_demandes_historique (
  id bigint generated always as identity primary key,
  demande_id uuid not null references public.depot_demandes (id) on delete cascade,
  fait_le timestamptz not null default now(),
  par text,
  action text not null check (action in ('creation', 'statut', 'note')),
  ancien_statut text,
  nouveau_statut text,
  note text check (char_length(note) <= 3000)
);
create index if not exists depot_demandes_historique_idx on public.depot_demandes_historique (demande_id, fait_le);

alter table public.depot_demandes_historique enable row level security;
create policy "Admin : lecture de l'historique des demandes"
  on public.depot_demandes_historique for select to authenticated using (public.est_admin());
create policy "Admin : ajout d'une note à l'historique"
  on public.depot_demandes_historique for insert to authenticated
  with check (public.est_admin() and action = 'note');
-- Historique en écriture seule : ni modification ni suppression
revoke update, delete on public.depot_demandes_historique from authenticated, anon;

create or replace function private.depot_demande_suivi()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' and new.statut is distinct from old.statut then
    insert into public.depot_demandes_historique (demande_id, par, action, ancien_statut, nouveau_statut)
    values (new.id, coalesce(auth.jwt() ->> 'email', 'système'), 'statut', old.statut, new.statut);
  end if;
  if tg_op = 'UPDATE' and new.envoi_termine and not old.envoi_termine then
    insert into public.depot_demandes_historique (demande_id, par, action, nouveau_statut)
    values (new.id, 'formulaire', 'creation', new.statut);
  end if;
  return new;
end;
$$;
revoke all on function private.depot_demande_suivi() from public, anon, authenticated;

create trigger depot_demande_suivi
  before update on public.depot_demandes
  for each row execute function private.depot_demande_suivi();

create or replace function private.depot_demande_supprimee()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  noms text[];
begin
  select array_agg(o.name) into noms from storage.objects o
  where o.bucket_id = 'depot-photos' and split_part(o.name, '/', 1) = old.id::text;
  perform private.effacer_fichiers('depot-photos', noms);
  return old;
end;
$$;
revoke all on function private.depot_demande_supprimee() from public, anon, authenticated;

create trigger depot_demande_supprimee
  after delete on public.depot_demandes
  for each row execute function private.depot_demande_supprimee();

-- Photos : espace privé, images seulement, 10 Mo
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('depot-photos', 'depot-photos', false, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
on conflict (id) do nothing;

create policy "Admin : lecture des photos de dépôt-vente"
  on storage.objects for select to authenticated
  using (bucket_id = 'depot-photos' and public.est_admin());
