/**
 * Textes du site : Suivre ma vente et page de signature.
 * Registre : voir src/config/textes-outils.ts (conventions) et src/config/textes.ts.
 */
import { entete, type PageTextes } from '../textes-outils.ts';

export const PAGES_SUIVRE: PageTextes[] = [
  {
  cle: 'suivre', libelle: 'Suivre ma vente', description: 'Espace des propriétaires en dépôt-vente.', chemin: '/suivre-ma-vente',
  sections: [entete('suivre', 'Suivre ma vente', 'Vous nous avez confié votre moto en dépôt-vente ? Suivez ici chaque étape de la vente. Connectez-vous avec l\'adresse e-mail de votre contrat : nous vous envoyons un code, sans mot de passe.')],
},
];
