/**
 * Textes du site : Page Recherche personnalisée.
 * Registre : voir src/config/textes-outils.ts (conventions) et src/config/textes.ts.
 */
import { entete, type PageTextes } from '../textes-outils.ts';

export const PAGES_RECHERCHE: PageTextes[] = [
  { cle: 'recherche', libelle: 'Recherche personnalisée', description: 'Demande de recherche sur mesure.', chemin: '/recherche-personnalisee', sections: [entete('recherche', 'Recherche Personnalisée', 'Nous trouvons le deux-roues de vos rêves')] },
];
