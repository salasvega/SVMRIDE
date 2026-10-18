/**
 * Textes du site : Éléments communs à toutes les pages (en-tête, pied de page, cookies, page introuvable, plan du site).
 * Registre : voir src/config/textes-outils.ts (conventions) et src/config/textes.ts.
 */
import { P, type PageTextes } from '../textes-outils.ts';

export const PAGES_COMMUN: PageTextes[] = [
  {
  cle: 'pied', libelle: 'Pied de page', description: 'Bas de toutes les pages.', chemin: '/',
  sections: [{ titre: 'Pied de page', textes: [P('pied.description', 'Phrase sous le nom', 'Spécialiste du deux-roues en Île-de-France', undefined, 200)] }],
},
];
