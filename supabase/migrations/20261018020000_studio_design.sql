/*
  Studio Design (admin) — thèmes graphiques du site public (18/10/2026).

  - design_themes : bibliothèque (5 thèmes prédéfinis non modifiables +
    thèmes de l'administrateur), statut brouillon / enregistré / archivé.
  - design_publications : une ligne par publication ou restauration, jamais
    modifiée ni supprimée (historique et numéro de version).
  - site_reglages, clé « theme » : le thème publié, lu par la fonction
    Netlify « seo » qui l'injecte dans chaque page. Écrit uniquement par
    publier_theme() et restaurer_version().

  Un thème est une fiche JSON validée par private.theme_valide(), miroir de
  themeValide() dans src/config/design.ts : seules les clés du registre et des
  couleurs #RRGGBB sont acceptées (aucune injection de CSS possible).
  Le statut « Actif » n'est pas stocké : c'est le thème de la dernière publication.
*/

-- ===== Validation =====
create or replace function private.theme_valide(t jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  k text;
  v jsonb;
  k2 text;
  v2 jsonb;
  hex constant text := '^#[0-9A-Fa-f]{6}$';
begin
  if t is null or jsonb_typeof(t) <> 'object' or t -> 'schema' is distinct from '1'::jsonb then
    return false;
  end if;
  for k in select jsonb_object_keys(t) loop
    if k not in ('schema', 'couleurs', 'derivees', 'sections', 'style') then return false; end if;
  end loop;

  if jsonb_typeof(t -> 'couleurs') is distinct from 'object' then return false; end if;
  for k, v in select * from jsonb_each(t -> 'couleurs') loop
    if k not in ('primaire', 'secondaire', 'accent', 'arriere_plan', 'surface', 'texte', 'texte_secondaire', 'bordure', 'boutons', 'liens')
       or jsonb_typeof(v) <> 'string' or (v #>> '{}') !~ hex then
      return false;
    end if;
  end loop;

  if t ? 'derivees' then
    if jsonb_typeof(t -> 'derivees') <> 'object' then return false; end if;
    for k, v in select * from jsonb_each(t -> 'derivees') loop
      if k not in ('bleu-hover', 'bleu-clair', 'sur-bouton', 'bleu-vif', 'or-texte', 'or-voile', 'or-voile-leger', 'degrade-debut',
                   'degrade-debut-sombre', 'champ', 'doux-68', 'doux-64', 'doux-62', 'doux-58', 'inverse', 'inverse-91',
                   'inverse-88', 'inverse-84', 'inverse-74', 'inverse-66', 'inverse-53', 'inverse-52')
         or jsonb_typeof(v) <> 'string' or (v #>> '{}') !~ hex then
        return false;
      end if;
    end loop;
  end if;

  if t ? 'sections' then
    if jsonb_typeof(t -> 'sections') <> 'object' then return false; end if;
    for k, v in select * from jsonb_each(t -> 'sections') loop
      if k not in ('header', 'hero', 'catalogue', 'cartes', 'fiche', 'marques', 'equipe', 'avis', 'formulaires', 'boutons', 'footer')
         or jsonb_typeof(v) <> 'object' then
        return false;
      end if;
      for k2, v2 in select * from jsonb_each(v) loop
        if k2 not in ('fond', 'texte', 'titres', 'accent', 'bouton', 'bordure')
           or jsonb_typeof(v2) <> 'string' or (v2 #>> '{}') !~ hex then
          return false;
        end if;
      end loop;
    end loop;
  end if;

  if t ? 'style' then
    if jsonb_typeof(t -> 'style') <> 'object' then return false; end if;
    for k, v in select * from jsonb_each(t -> 'style') loop
      if jsonb_typeof(v) <> 'string' then return false; end if;
      if not (
        (k = 'arrondi_boutons' and (v #>> '{}') in ('carre', 'leger', 'arrondi', 'pilule'))
        or (k = 'arrondi_cartes' and (v #>> '{}') in ('carre', 'leger', 'arrondi'))
        or (k = 'ombres' and (v #>> '{}') in ('aucune', 'legeres', 'marquees'))
      ) then
        return false;
      end if;
    end loop;
  end if;

  return true;
end;
$$;
grant execute on function private.theme_valide(jsonb) to anon, authenticated;

-- ===== Bibliothèque =====
create table if not exists public.design_themes (
  id uuid primary key default gen_random_uuid(),
  nom text not null check (char_length(btrim(nom)) between 1 and 60),
  description text not null default '' check (char_length(description) <= 300),
  predefini boolean not null default false,
  ordre integer not null default 100,
  origine_id uuid references public.design_themes (id) on delete set null,
  statut text not null default 'enregistre' check (statut in ('brouillon', 'enregistre', 'archive')),
  config jsonb not null check (private.theme_valide(config)),
  cree_par text,
  maj_par text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.design_themes is 'Studio Design : thèmes graphiques du site public (prédéfinis et personnalisés).';

-- ===== Historique des publications =====
create table if not exists public.design_publications (
  version bigint generated always as identity primary key,
  theme_id uuid references public.design_themes (id) on delete set null,
  theme_nom text not null,
  config jsonb not null check (private.theme_valide(config)),
  type text not null check (type in ('installation', 'publication', 'restauration')),
  restaure_version bigint references public.design_publications (version),
  publie_par text,
  publie_le timestamptz not null default now()
);
comment on table public.design_publications is 'Studio Design : chaque publication ou restauration de thème (jamais modifiée).';
create index if not exists design_publications_theme on public.design_publications (theme_id);
create index if not exists design_publications_restaure on public.design_publications (restaure_version);
create index if not exists design_themes_origine on public.design_themes (origine_id);

-- Auteur, date, protections (thèmes prédéfinis, thème actif)
create or replace function private.design_theme_avant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actif uuid;
begin
  select (valeur ->> 'theme_id')::uuid into actif from public.site_reglages where cle = 'theme';
  if tg_op = 'DELETE' then
    if old.predefini then raise exception 'Les thèmes prédéfinis ne peuvent pas être supprimés.'; end if;
    if old.id = actif then raise exception 'Le thème actif ne peut pas être supprimé.'; end if;
    return old;
  end if;
  if tg_op = 'UPDATE' then
    if old.predefini and current_setting('svm.migration', true) is distinct from 'oui' then
      raise exception 'Les thèmes prédéfinis ne peuvent pas être modifiés : dupliquez-les.';
    end if;
    if new.statut = 'archive' and old.id = actif then raise exception 'Le thème actif ne peut pas être archivé.'; end if;
    new.predefini := old.predefini;
    new.cree_par := old.cree_par;
    new.created_at := old.created_at;
  else
    new.cree_par := coalesce(auth.jwt() ->> 'email', new.cree_par);
  end if;
  new.maj_par := coalesce(auth.jwt() ->> 'email', new.maj_par);
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.design_theme_avant() from public, anon, authenticated;

create or replace trigger design_themes_avant before insert or update or delete on public.design_themes
  for each row execute function private.design_theme_avant();

alter table public.design_themes enable row level security;
alter table public.design_publications enable row level security;

create policy "Thèmes : lecture admin" on public.design_themes
  for select to authenticated using (public.est_admin());
create policy "Thèmes : création admin" on public.design_themes
  for insert to authenticated with check (public.est_admin() and not predefini);
create policy "Thèmes : modification admin" on public.design_themes
  for update to authenticated using (public.est_admin() and not predefini) with check (public.est_admin() and not predefini);
create policy "Thèmes : suppression admin" on public.design_themes
  for delete to authenticated using (public.est_admin() and not predefini);
create policy "Publications : lecture admin" on public.design_publications
  for select to authenticated using (public.est_admin());

-- La clé « theme » de site_reglages ne s'écrit que par les fonctions ci-dessous
create or replace function private.proteger_reglage_theme()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.cle = 'theme' and current_setting('svm.publication_theme', true) is distinct from 'oui' then
    raise exception 'Le thème du site se publie depuis le Studio Design.';
  end if;
  return new;
end;
$$;
revoke all on function private.proteger_reglage_theme() from public, anon, authenticated;

create or replace trigger site_reglages_theme before insert or update on public.site_reglages
  for each row execute function private.proteger_reglage_theme();

-- ===== Publication et restauration =====
create or replace function private.mettre_en_ligne(p_version bigint, p_theme uuid, p_nom text, p_config jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform set_config('svm.publication_theme', 'oui', true);
  insert into public.site_reglages (cle, valeur)
  values ('theme', jsonb_build_object('version', p_version, 'theme_id', p_theme, 'nom', p_nom, 'config', p_config))
  on conflict (cle) do update set valeur = excluded.valeur;
  perform set_config('svm.publication_theme', '', true);
end;
$$;
revoke all on function private.mettre_en_ligne(bigint, uuid, text, jsonb) from public, anon, authenticated;

create or replace function public.publier_theme(p_theme uuid)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  t public.design_themes;
  v bigint;
begin
  if not public.est_admin() then raise exception 'Réservé aux administrateurs.'; end if;
  select * into t from public.design_themes where id = p_theme;
  if not found then raise exception 'Thème introuvable.'; end if;
  if not private.theme_valide(t.config) then raise exception 'Thème invalide.'; end if;
  insert into public.design_publications (theme_id, theme_nom, config, type, publie_par)
  values (t.id, t.nom, t.config, 'publication', auth.jwt() ->> 'email')
  returning version into v;
  perform private.mettre_en_ligne(v, t.id, t.nom, t.config);
  if t.statut <> 'enregistre' and not t.predefini then
    update public.design_themes set statut = 'enregistre' where id = t.id;
  end if;
  return v;
end;
$$;
revoke all on function public.publier_theme(uuid) from public, anon;
grant execute on function public.publier_theme(uuid) to authenticated;

create or replace function public.restaurer_version(p_version bigint)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.design_publications;
  v bigint;
begin
  if not public.est_admin() then raise exception 'Réservé aux administrateurs.'; end if;
  select * into p from public.design_publications where version = p_version;
  if not found then raise exception 'Version introuvable.'; end if;
  insert into public.design_publications (theme_id, theme_nom, config, type, restaure_version, publie_par)
  values (p.theme_id, p.theme_nom, p.config, 'restauration', p.version, auth.jwt() ->> 'email')
  returning version into v;
  perform private.mettre_en_ligne(v, p.theme_id, p.theme_nom, p.config);
  return v;
end;
$$;
revoke all on function public.restaurer_version(bigint) from public, anon;
grant execute on function public.restaurer_version(bigint) to authenticated;

-- ===== Thèmes prédéfinis et installation =====
insert into public.design_themes (nom, description, predefini, ordre, config, cree_par) values
('SVM Signature', 'Identité actuelle : noir profond, or et bleu saphir. Premium, sportif et élégant.', true, 1, $j$
{"schema":1,"couleurs":{"primaire":"#0E0E10","secondaire":"#D9B965","accent":"#B8902F","arriere_plan":"#F6F5F2","surface":"#FFFFFF","texte":"#111111","texte_secondaire":"#4A4A4A","bordure":"#ECE9E0","boutons":"#254893","liens":"#254893"},"derivees":{"bleu-hover":"#2F5BB3","bleu-clair":"#6395F8","sur-bouton":"#FFFFFF","bleu-vif":"#1A8CFF","or-texte":"#8A6A1F","or-voile":"#FBF6E9","or-voile-leger":"#FBF7EE","degrade-debut":"#2A2112","degrade-debut-sombre":"#6E5418","champ":"#E3E0D6","doux-68":"#5E5E5E","doux-64":"#666666","doux-62":"#6B6B6B","doux-58":"#767676","inverse":"#FFFFFF","inverse-91":"#E8E8E8","inverse-88":"#E0E0E0","inverse-84":"#D6D6D6","inverse-74":"#BDBDBD","inverse-66":"#AAAAAA","inverse-53":"#8A8A8A","inverse-52":"#888888"},"sections":{},"style":{"arrondi_boutons":"arrondi","arrondi_cartes":"arrondi","ombres":"legeres"}}
$j$::jsonb, 'installation'),
('Racing Performance', 'Noir carbone, rouge racing et gris métallique. Dynamique, sportif et compétitif.', true, 2, $j$
{"schema":1,"couleurs":{"primaire":"#141414","secondaire":"#A7AAAE","accent":"#C8102E","arriere_plan":"#F4F4F4","surface":"#FFFFFF","texte":"#111111","texte_secondaire":"#4D4D4D","bordure":"#E2E2E2","boutons":"#C8102E","liens":"#B00E27"},"sections":{},"style":{"arrondi_boutons":"leger","arrondi_cartes":"leger","ombres":"marquees"}}
$j$::jsonb, 'installation'),
('Urban Minimal', 'Blanc cassé, gris clair, noir et bleu nuit. Moderne, épuré et minimaliste.', true, 3, $j$
{"schema":1,"couleurs":{"primaire":"#1B2B44","secondaire":"#D5D8DC","accent":"#8C96A3","arriere_plan":"#FAF9F6","surface":"#FFFFFF","texte":"#111111","texte_secondaire":"#555555","bordure":"#E6E4DF","boutons":"#1F3A5F","liens":"#1F3A5F"},"sections":{},"style":{"arrondi_boutons":"carre","arrondi_cartes":"carre","ombres":"aucune"}}
$j$::jsonb, 'installation'),
('Luxury Edition', 'Noir mat, champagne, ivoire et gris foncé. Haut de gamme, raffiné et exclusif.', true, 4, $j$
{"schema":1,"couleurs":{"primaire":"#1C1C1C","secondaire":"#E8DCC0","accent":"#C9B37E","arriere_plan":"#FBF8F1","surface":"#FFFFFF","texte":"#1C1C1C","texte_secondaire":"#4A4A4A","bordure":"#ECE4D3","boutons":"#8A7340","liens":"#7A6535"},"sections":{},"style":{"arrondi_boutons":"leger","arrondi_cartes":"leger","ombres":"legeres"}}
$j$::jsonb, 'installation'),
('Tech Motion', 'Bleu nuit, bleu électrique, gris graphite et blanc. Technologique et dynamique.', true, 5, $j$
{"schema":1,"couleurs":{"primaire":"#0B1D3A","secondaire":"#5AA9FF","accent":"#2F8CFF","arriere_plan":"#F3F5F8","surface":"#FFFFFF","texte":"#0B1D3A","texte_secondaire":"#3A3F47","bordure":"#DDE2EA","boutons":"#0057D9","liens":"#0057D9"},"sections":{},"style":{"arrondi_boutons":"pilule","arrondi_cartes":"arrondi","ombres":"legeres"}}
$j$::jsonb, 'installation');

-- Version 1 : SVM Signature, publiée à l'installation (aucun changement visible)
do $$
declare
  t public.design_themes;
  v bigint;
begin
  select * into t from public.design_themes where predefini and ordre = 1;
  insert into public.design_publications (theme_id, theme_nom, config, type, publie_par)
  values (t.id, t.nom, t.config, 'installation', 'installation')
  returning version into v;
  perform private.mettre_en_ligne(v, t.id, t.nom, t.config);
end;
$$;
