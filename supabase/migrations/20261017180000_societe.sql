/*
  Informations légales de la société modifiables dans l'admin (17/10/2026),
  onglet « Infos du site », bloc « Société » : réglage « societe » de
  public.site_reglages (format : src/config/societe.ts). Historique automatique
  (site_reglages_historique). Utilisées par les mentions légales et copiées dans
  chaque nouveau contrat de dépôt-vente (les contrats existants ne changent pas).
*/
insert into public.site_reglages (cle, valeur, updated_by) values ('societe', $json$
{
  "raison_sociale": "SVM RIDE",
  "forme": "SAS",
  "capital": "",
  "siret": "988 004 719 00015",
  "rcs": "RCS Nanterre",
  "tva": "",
  "siege": "3 Rue Émile Verhaeren, 92210 Saint-Cloud",
  "directeur_publication": "M. Mattia SARAVIA",
  "assureur": "AXA",
  "mediateur_nom": "",
  "mediateur_site": "",
  "mediateur_adresse": ""
}
$json$::jsonb, 'reprise du site (17/10/2026)')
on conflict (cle) do nothing;
