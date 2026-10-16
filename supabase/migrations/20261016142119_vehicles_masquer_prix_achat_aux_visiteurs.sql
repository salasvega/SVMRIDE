-- Les visiteurs (rôle anon) ne peuvent plus lire le prix d'achat, le prix
-- de vente réel ni la date de vente des véhicules. L'admin connecté
-- (rôle authenticated) garde l'accès complet.
-- Attention : une nouvelle colonne publique ajoutée plus tard devra être
-- ajoutée à ce GRANT pour être visible sur le site.
revoke select on table public.vehicles from anon;
grant select (
  id, slug, brand, model, year, type, displacement, price, mileage,
  condition, description, images, features, warranty, available, status,
  created_at, updated_at
) on table public.vehicles to anon;
