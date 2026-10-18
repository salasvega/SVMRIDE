/**
 * Textes du site : Page Reprises (/reprises).
 * Registre : voir src/config/textes-outils.ts (conventions) et src/config/textes.ts.
 */
import { entete, type PageTextes } from '../textes-outils.ts';

export const PAGES_REPRISES: PageTextes[] = [
  { cle: 'reprises', libelle: 'Reprises', description: 'Page de demande de reprise.', chemin: '/reprises', sections: [entete('reprises', 'Reprise de votre véhicule', 'Obtenez une estimation rapide et au meilleur prix')] },
];
