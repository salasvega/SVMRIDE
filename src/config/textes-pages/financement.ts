/**
 * Textes du site : Page Financement et dossier de financement.
 * Registre : voir src/config/textes-outils.ts (conventions) et src/config/textes.ts.
 */
import { entete, type PageTextes } from '../textes-outils.ts';

export const PAGES_FINANCEMENT: PageTextes[] = [
  { cle: 'financement', libelle: 'Financement', description: 'Simulateur et demande de financement.', chemin: '/financement', sections: [entete('financement', 'Solutions de Financement', 'Financez votre deux-roues en toute simplicité')] },
];
