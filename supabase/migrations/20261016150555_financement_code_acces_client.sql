-- Accès client à son dossier : e-mail + code personnel (stocké haché),
-- avec blocage temporaire après plusieurs codes erronés.
alter table public.user_financing_profiles
  add column if not exists access_code_hash text,
  add column if not exists access_failed_attempts integer not null default 0,
  add column if not exists access_locked_until timestamptz;

comment on column public.user_financing_profiles.access_code_hash is
  'Empreinte du code d''accès client (sel:sha256). Jamais le code en clair.';

-- Fichiers acceptés pour les pièces : images et PDF uniquement
update storage.buckets
  set allowed_mime_types = array['image/jpeg','image/png','image/webp','image/heic','image/heif','application/pdf']
  where id = 'financing-documents';
