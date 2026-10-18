/*
  Image de la page d'accueil, tampon et logo des documents modifiables dans
  l'admin (18/10/2026), onglet « Infos du site ».

  - Bucket « site-images » : JPEG accepté en plus du PNG et du WebP (les
    navigateurs qui ne savent pas produire de WebP, comme Safari, envoient
    l'image d'accueil recadrée en JPEG).
  - Réglage « fond_accueil » : { version, ordinateur, mobile } (adresses des
    images recadrées, accueil/<version>/) ; absent ou incomplet = image d'origine.
  - Réglage « documents » : { version, tampon, logo } (documents/<version>/),
    lu par les fonctions qui produisent les contrats de dépôt-vente, avenants et
    certificats ; null = images d'origine du site.
  Historique automatique (site_reglages_historique), comme les autres réglages.
*/
update storage.buckets
set allowed_mime_types = array['image/png', 'image/webp', 'image/jpeg']
where id = 'site-images';

-- Valeurs de départ (images d'origine) : le premier changement pourra être annulé depuis l'historique
insert into public.site_reglages (cle, valeur, updated_by) values
  ('fond_accueil', '{"origine": true}'::jsonb, 'image d''origine (18/10/2026)'),
  ('documents', '{"tampon": null, "logo": null}'::jsonb, 'images d''origine (18/10/2026)')
on conflict (cle) do nothing;
