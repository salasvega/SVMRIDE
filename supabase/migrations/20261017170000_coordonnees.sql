/*
  Coordonnées de SVM Ride modifiables dans l'admin, onglet « Infos du site »
  (17/10/2026) : contact, showroom, horaires.

  - Réglage « coordonnees » dans public.site_reglages (format : src/config/coordonnees.ts).
    Lu par le site, la fonction Netlify « seo » (Google) et les fonctions qui envoient
    les e-mails (pied de page, téléphone, adresse qui reçoit les demandes).
  - public.site_reglages_historique : chaque modification d'un réglage (ancienne et
    nouvelle valeur, auteur, date), pour savoir qui a changé quoi et revenir en arrière.
    Lecture réservée aux administrateurs ; écriture par le déclencheur seulement.
  - updated_by est rempli avec l'e-mail du compte connecté.
*/

create table if not exists public.site_reglages_historique (
  id bigint generated always as identity primary key,
  cle text not null,
  ancienne_valeur jsonb,
  nouvelle_valeur jsonb not null,
  par text,
  fait_le timestamptz not null default now()
);
create index if not exists site_reglages_historique_cle on public.site_reglages_historique (cle, fait_le desc);

alter table public.site_reglages_historique enable row level security;
create policy "Historique des réglages : lecture admin" on public.site_reglages_historique
  for select to authenticated using (public.est_admin());

create or replace function private.historiser_reglage()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_by := coalesce(auth.jwt() ->> 'email', new.updated_by);
  if tg_op = 'INSERT' or new.valeur is distinct from old.valeur then
    insert into public.site_reglages_historique (cle, ancienne_valeur, nouvelle_valeur, par)
    values (new.cle, case when tg_op = 'UPDATE' then old.valeur end, new.valeur, new.updated_by);
  end if;
  return new;
end;
$$;
revoke all on function private.historiser_reglage() from public, anon, authenticated;

create or replace trigger site_reglages_historique before insert or update on public.site_reglages
  for each row execute function private.historiser_reglage();

-- Valeurs du 17/10/2026 (identiques à COORDONNEES_DEFAUT)
insert into public.site_reglages (cle, valeur, updated_by) values ('coordonnees', $json$
{
  "telephone": "01 84 19 01 74",
  "email": "contact@svmride.com",
  "email_reception": "contact@svmride.com",
  "instagram": "svm_ride",
  "showroom": { "nom": "Chaville", "adresse": "310 Avenue Roger Salengro", "code_postal": "92370", "ville": "Chaville", "note": "" },
  "horaires": [
    { "mode": "rdv", "plages": [] },
    { "mode": "ouvert", "plages": [{ "de": "09:00", "a": "18:00" }] },
    { "mode": "ouvert", "plages": [{ "de": "09:00", "a": "18:00" }] },
    { "mode": "ouvert", "plages": [{ "de": "09:00", "a": "18:00" }] },
    { "mode": "ouvert", "plages": [{ "de": "09:00", "a": "18:00" }] },
    { "mode": "ouvert", "plages": [{ "de": "09:00", "a": "18:00" }] },
    { "mode": "ferme", "plages": [] }
  ],
  "horaires_note": "Sur rendez-vous à notre showroom de Chaville"
}
$json$::jsonb, 'reprise du site (17/10/2026)')
on conflict (cle) do nothing;
