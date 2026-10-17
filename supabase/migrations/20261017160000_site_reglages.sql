/*
  Réglages du site modifiables depuis l'admin (17/10/2026).

  Premier réglage : « equipe_affichee » (oui / non), dans l'onglet Équipe de
  l'admin. Non = la section « Des passionnés à votre service » et son bouton
  sur l'accueil, la page /equipe et le lien « Notre équipe » du pied de page
  sont masqués (période de réorganisation). Les fiches restent modifiables.

  Lecture publique (le site et la fonction Netlify « seo » en ont besoin),
  modification réservée aux administrateurs.
*/

create table if not exists public.site_reglages (
  cle text primary key check (cle ~ '^[a-z_]{3,40}$'),
  valeur jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text
);

comment on table public.site_reglages is 'Réglages du site modifiables dans l''admin (ex. equipe_affichee : section Équipe visible ou non).';

create or replace trigger site_reglages_updated_at before update on public.site_reglages
  for each row execute function public.update_updated_at_column();

alter table public.site_reglages enable row level security;

create policy "Réglages : lecture publique" on public.site_reglages
  for select to anon, authenticated using (true);
create policy "Réglages : création admin" on public.site_reglages
  for insert to authenticated with check (public.est_admin());
create policy "Réglages : modification admin" on public.site_reglages
  for update to authenticated using (public.est_admin()) with check (public.est_admin());

insert into public.site_reglages (cle, valeur) values ('equipe_affichee', 'true'::jsonb)
on conflict (cle) do nothing;
