/**
 * Textes du site : Page Dépôt-vente (/vendre-ma-moto).
 * Registre : voir src/config/textes-outils.ts (conventions) et src/config/textes.ts.
 */
import { entete, type PageTextes } from '../textes-outils.ts';

export const PAGES_VENDRE: PageTextes[] = [
  {
  cle: 'vendre', libelle: 'Dépôt-vente', description: 'Page « Vendre ma moto ».', chemin: '/vendre-ma-moto',
  sections: [entete('vendre', 'Vendre ma moto en dépôt-vente', 'Confiez-nous votre moto : nous la vendons pour vous, au juste prix, sans les appels, les visites ni les démarches. Estimation gratuite, paiement sous 48 h après la vente.')],
},
];
