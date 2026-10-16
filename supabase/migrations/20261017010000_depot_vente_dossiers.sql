/*
  Dépôt-vente — lots 2 à 5 : dossiers, contrats et signature, espace propriétaire,
  notifications (17/10/2026). Règles métier : réponses de Mattia au questionnaire du 16/10.

  - SVM Ride rachète la moto au moment de la vente et la revend en son nom : le
    déposant n'a aucune garantie à assurer ; il perçoit le « net vendeur ».
  - Mandat exclusif de 2 mois ; prolongation par avenant signé ; retrait anticipé
    ou vente par une plateforme : 290 € ; gardiennage 50 €/jour à partir du 7e jour
    après la fin du mandat ; reversement sous 48 h ; dossiers conservés 5 ans.

  Accès : tout est réservé à l'admin (est_admin()). Le propriétaire et la page de
  signature passent uniquement par des fonctions serveur (depot-proprietaire,
  depot-signature) qui vérifient un code reçu par e-mail : aucune table n'est
  ouverte aux visiteurs.
*/

-- ---------------------------------------------------------------------------
-- Paramètres (une seule ligne)
-- ---------------------------------------------------------------------------
create table if not exists public.depot_parametres (
  id boolean primary key default true check (id),
  duree_mandat_mois integer not null default 2 check (duree_mandat_mois between 1 and 24),
  frais_resiliation integer not null default 290 check (frais_resiliation >= 0),
  gardiennage_par_jour integer not null default 50 check (gardiennage_par_jour >= 0),
  gardiennage_delai_jours integer not null default 7 check (gardiennage_delai_jours >= 0),
  reversement_heures integer not null default 48 check (reversement_heures > 0),
  conservation_annees integer not null default 5 check (conservation_annees between 1 and 15),
  updated_at timestamptz not null default now()
);
insert into public.depot_parametres (id) values (true) on conflict do nothing;
alter table public.depot_parametres enable row level security;
create policy "Admin : paramètres du dépôt-vente (lecture)" on public.depot_parametres
  for select to authenticated using (public.est_admin());
create policy "Admin : paramètres du dépôt-vente (modification)" on public.depot_parametres
  for update to authenticated using (public.est_admin()) with check (public.est_admin());

-- ---------------------------------------------------------------------------
-- Dossiers
-- ---------------------------------------------------------------------------
create sequence if not exists public.depot_dossier_numero_seq;

create table if not exists public.depot_dossiers (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique
    default ('DV-' || to_char(now() at time zone 'Europe/Paris', 'YYYY') || '-' ||
             lpad(nextval('public.depot_dossier_numero_seq')::text, 4, '0')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  demande_id uuid references public.depot_demandes (id) on delete set null,
  vehicle_id uuid references public.vehicles (id) on delete set null,

  -- Déposant
  prop_civilite text check (prop_civilite in ('M.', 'Mme')),
  prop_prenom text not null check (char_length(prop_prenom) between 1 and 80),
  prop_nom text not null check (char_length(prop_nom) between 1 and 80),
  prop_email text not null check (char_length(prop_email) <= 254),
  prop_telephone text not null check (char_length(prop_telephone) <= 30),
  prop_adresse text check (char_length(prop_adresse) <= 300),
  prop_piece_type text check (prop_piece_type in ('cni', 'passeport', 'titre_sejour', 'permis')),
  prop_piece_numero text check (char_length(prop_piece_numero) <= 40),

  -- Moto
  marque text not null check (char_length(marque) <= 60),
  modele text not null check (char_length(modele) <= 80),
  version text check (char_length(version) <= 80),
  annee integer check (annee between 1950 and 2100),
  kilometrage integer check (kilometrage between 0 and 1000000),
  immatriculation text check (char_length(immatriculation) <= 20),
  vin text check (char_length(vin) <= 30),
  date_mise_circulation date,

  -- Conditions (net vendeur = ce que perçoit le déposant ; la différence est la rémunération TTC de SVM)
  prix_affiche integer check (prix_affiche between 0 and 1000000),
  net_vendeur integer check (net_vendeur between 0 and 1000000),
  duree_mois integer not null default 2 check (duree_mois between 1 and 24),
  date_debut date,
  date_fin date,
  frais_resiliation integer not null default 290,
  gardiennage_par_jour integer not null default 50,
  gardiennage_delai_jours integer not null default 7,

  -- Statuts
  statut_mandat text not null default 'preparation'
    check (statut_mandat in ('preparation', 'a_signer', 'actif', 'vendu', 'resilie', 'expire', 'cloture')),
  statut_vente text not null default 'a_publier'
    check (statut_vente in ('a_publier', 'en_ligne', 'reservee', 'vendue', 'preparation', 'livree', 'payee')),

  -- Pièces : { "carte_grise": {"recu": true, "le": "2026-10-17"}, ... }
  pieces jsonb not null default '{}'::jsonb,
  -- État des lieux d'entrée : { "fait_le", "kilometrage", "etat", "accessoires", "cles", "remarques" }
  etat_des_lieux jsonb,
  notes_internes text check (char_length(notes_internes) <= 10000),

  -- Vente
  vendu_le date,
  prix_vente integer check (prix_vente between 0 and 1000000),
  paye_le date,
  cloture_le timestamptz,

  -- Alertes envoyées (une seule fois)
  alerte_j7_le timestamptz,
  alerte_fin_le timestamptz,
  alerte_gardiennage_le timestamptz,

  check (date_fin is null or date_debut is null or date_fin >= date_debut)
);
create index if not exists depot_dossiers_statuts_idx on public.depot_dossiers (statut_mandat, statut_vente);
create index if not exists depot_dossiers_email_idx on public.depot_dossiers (lower(prop_email));
create index if not exists depot_dossiers_vehicle_idx on public.depot_dossiers (vehicle_id);
create unique index if not exists depot_dossiers_demande_unique on public.depot_dossiers (demande_id) where demande_id is not null;

alter table public.depot_dossiers enable row level security;
create policy "Admin : dossiers de dépôt-vente (lecture)" on public.depot_dossiers
  for select to authenticated using (public.est_admin());
create policy "Admin : dossiers de dépôt-vente (création)" on public.depot_dossiers
  for insert to authenticated with check (public.est_admin());
create policy "Admin : dossiers de dépôt-vente (modification)" on public.depot_dossiers
  for update to authenticated using (public.est_admin()) with check (public.est_admin());
create policy "Admin : dossiers de dépôt-vente (suppression)" on public.depot_dossiers
  for delete to authenticated using (public.est_admin());

-- ---------------------------------------------------------------------------
-- Fil d'actualité (visible ou non par le propriétaire)
-- ---------------------------------------------------------------------------
create table if not exists public.depot_evenements (
  id bigint generated always as identity primary key,
  dossier_id uuid not null references public.depot_dossiers (id) on delete cascade,
  fait_le timestamptz not null default now(),
  par text,
  type text not null check (type in (
    'creation', 'mandat', 'vente', 'visite', 'essai', 'offre', 'document', 'contrat',
    'demande_proprietaire', 'note', 'email', 'alerte')),
  titre text not null check (char_length(titre) <= 200),
  detail text check (char_length(detail) <= 3000),
  montant integer,
  visible_proprietaire boolean not null default false
);
create index if not exists depot_evenements_dossier_idx on public.depot_evenements (dossier_id, fait_le desc);
alter table public.depot_evenements enable row level security;
create policy "Admin : fil des dossiers (lecture)" on public.depot_evenements
  for select to authenticated using (public.est_admin());
create policy "Admin : fil des dossiers (ajout)" on public.depot_evenements
  for insert to authenticated with check (public.est_admin());
create policy "Admin : fil des dossiers (visibilité)" on public.depot_evenements
  for update to authenticated using (public.est_admin()) with check (public.est_admin());
create policy "Admin : fil des dossiers (suppression)" on public.depot_evenements
  for delete to authenticated using (public.est_admin() and type in ('visite', 'essai', 'offre', 'note'));
revoke update on public.depot_evenements from authenticated;
grant update (visible_proprietaire) on public.depot_evenements to authenticated;

-- ---------------------------------------------------------------------------
-- Documents (espace privé « depot-documents »)
-- ---------------------------------------------------------------------------
create table if not exists public.depot_documents (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.depot_dossiers (id) on delete cascade,
  type text not null check (type in (
    'carte_grise', 'piece_identite', 'non_gage', 'double_cles', 'carnet_entretien', 'rib',
    'etat_des_lieux', 'photo', 'contrat', 'contrat_signe', 'preuve', 'autre')),
  nom text not null check (char_length(nom) <= 200),
  chemin text not null unique,
  taille integer,
  mime text,
  visible_proprietaire boolean not null default false,
  ajoute_le timestamptz not null default now(),
  ajoute_par text
);
create index if not exists depot_documents_dossier_idx on public.depot_documents (dossier_id);
alter table public.depot_documents enable row level security;
create policy "Admin : documents des dossiers (lecture)" on public.depot_documents
  for select to authenticated using (public.est_admin());
create policy "Admin : documents des dossiers (ajout)" on public.depot_documents
  for insert to authenticated with check (public.est_admin() and type not in ('contrat', 'contrat_signe', 'preuve'));
create policy "Admin : documents des dossiers (visibilité)" on public.depot_documents
  for update to authenticated using (public.est_admin()) with check (public.est_admin());
create policy "Admin : documents des dossiers (suppression)" on public.depot_documents
  for delete to authenticated using (public.est_admin() and type not in ('contrat', 'contrat_signe', 'preuve'));
revoke update on public.depot_documents from authenticated;
grant update (visible_proprietaire) on public.depot_documents to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('depot-documents', 'depot-documents', false, 15728640,
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Admin : documents de dépôt-vente (lecture)" on storage.objects
  for select to authenticated using (bucket_id = 'depot-documents' and public.est_admin());
create policy "Admin : documents de dépôt-vente (envoi)" on storage.objects
  for insert to authenticated with check (bucket_id = 'depot-documents' and public.est_admin()
    and (storage.foldername(name))[2] is distinct from 'contrats');
create policy "Admin : documents de dépôt-vente (suppression)" on storage.objects
  for delete to authenticated using (bucket_id = 'depot-documents' and public.est_admin()
    and (storage.foldername(name))[2] is distinct from 'contrats');

-- ---------------------------------------------------------------------------
-- Contrats (mandat, avenant) et preuves de signature
-- ---------------------------------------------------------------------------
create table if not exists public.depot_contrats (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.depot_dossiers (id) on delete cascade,
  type text not null check (type in ('mandat', 'avenant')),
  numero integer not null,
  modele_version text not null,
  statut text not null default 'a_signer' check (statut in ('a_signer', 'signe', 'refuse', 'expire', 'annule')),
  donnees jsonb not null,
  pdf_chemin text not null,
  pdf_sha256 text not null,
  invitation_hash text,
  invitation_expire_le timestamptz,
  code_hash text,
  code_expire_le timestamptz,
  code_essais integer not null default 0,
  codes_envoyes integer not null default 0,
  code_envoye_le timestamptz,
  renonciation_retractation boolean,
  signe_le timestamptz,
  signe_pdf_chemin text,
  signe_pdf_sha256 text,
  cree_le timestamptz not null default now(),
  cree_par text,
  unique (dossier_id, numero)
);
create index if not exists depot_contrats_dossier_idx on public.depot_contrats (dossier_id, numero desc);
create unique index if not exists depot_contrats_invitation_idx on public.depot_contrats (invitation_hash) where invitation_hash is not null;
alter table public.depot_contrats enable row level security;
-- L'admin consulte ; seules les fonctions serveur créent et font évoluer un contrat
create policy "Admin : contrats (lecture)" on public.depot_contrats
  for select to authenticated using (public.est_admin());
revoke all on public.depot_contrats from authenticated, anon;
-- Lecture sans les empreintes de l'invitation et du code (jamais utiles à l'écran)
grant select (id, dossier_id, type, numero, modele_version, statut, donnees, pdf_chemin, pdf_sha256,
  invitation_expire_le, code_essais, codes_envoyes, code_envoye_le, renonciation_retractation,
  signe_le, signe_pdf_chemin, signe_pdf_sha256, cree_le, cree_par) on public.depot_contrats to authenticated;

create table if not exists public.depot_contrat_preuves (
  id bigint generated always as identity primary key,
  contrat_id uuid not null references public.depot_contrats (id) on delete cascade,
  fait_le timestamptz not null default now(),
  evenement text not null,
  ip text,
  navigateur text,
  detail jsonb
);
create index if not exists depot_contrat_preuves_idx on public.depot_contrat_preuves (contrat_id, fait_le);
alter table public.depot_contrat_preuves enable row level security;
create policy "Admin : preuves de signature (lecture)" on public.depot_contrat_preuves
  for select to authenticated using (public.est_admin());
revoke insert, update, delete on public.depot_contrat_preuves from authenticated, anon;

-- ---------------------------------------------------------------------------
-- Espace propriétaire : codes de connexion et demandes
-- ---------------------------------------------------------------------------
create table if not exists public.depot_acces (
  email text primary key,
  code_hash text,
  code_expire_le timestamptz,
  essais integer not null default 0,
  envois jsonb not null default '[]'::jsonb,
  bloque_jusqu_au timestamptz,
  derniere_connexion timestamptz
);
alter table public.depot_acces enable row level security;
revoke all on public.depot_acces from authenticated, anon;

create table if not exists public.depot_demandes_proprietaire (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.depot_dossiers (id) on delete cascade,
  cree_le timestamptz not null default now(),
  type text not null check (type in ('rappel', 'prolongation', 'reprise_anticipee', 'baisse_prix', 'question')),
  message text check (char_length(message) <= 2000),
  statut text not null default 'nouvelle' check (statut in ('nouvelle', 'en_cours', 'acceptee', 'refusee', 'terminee')),
  reponse text check (char_length(reponse) <= 2000),
  traite_le timestamptz,
  traite_par text
);
create index if not exists depot_demandes_proprietaire_idx on public.depot_demandes_proprietaire (dossier_id, cree_le desc);
alter table public.depot_demandes_proprietaire enable row level security;
create policy "Admin : demandes des propriétaires (lecture)" on public.depot_demandes_proprietaire
  for select to authenticated using (public.est_admin());
create policy "Admin : demandes des propriétaires (traitement)" on public.depot_demandes_proprietaire
  for update to authenticated using (public.est_admin()) with check (public.est_admin());
revoke update on public.depot_demandes_proprietaire from authenticated;
grant update (statut, reponse, traite_le, traite_par) on public.depot_demandes_proprietaire to authenticated;

-- ---------------------------------------------------------------------------
-- Journal des e-mails (une clé = un seul envoi)
-- ---------------------------------------------------------------------------
create table if not exists public.depot_emails (
  id bigint generated always as identity primary key,
  dossier_id uuid references public.depot_dossiers (id) on delete cascade,
  cle text not null unique,
  destinataire text not null,
  sujet text not null,
  statut text not null default 'en_attente' check (statut in ('en_attente', 'envoye', 'erreur')),
  erreur text,
  tentatives integer not null default 0,
  cree_le timestamptz not null default now(),
  envoye_le timestamptz
);
alter table public.depot_emails enable row level security;
create policy "Admin : journal des e-mails (lecture)" on public.depot_emails
  for select to authenticated using (public.est_admin());
revoke insert, update, delete on public.depot_emails from authenticated, anon;

-- ---------------------------------------------------------------------------
-- Journal d'audit (écriture seule, alimenté par la base)
-- ---------------------------------------------------------------------------
create table if not exists public.journal_audit (
  id bigint generated always as identity primary key,
  fait_le timestamptz not null default now(),
  par uuid,
  par_email text,
  table_nom text not null,
  ligne_id text not null,
  action text not null,
  avant jsonb,
  apres jsonb
);
create index if not exists journal_audit_ligne_idx on public.journal_audit (table_nom, ligne_id, fait_le desc);
alter table public.journal_audit enable row level security;
create policy "Admin : journal d'audit (lecture)" on public.journal_audit
  for select to authenticated using (public.est_admin());
revoke insert, update, delete on public.journal_audit from authenticated, anon;
