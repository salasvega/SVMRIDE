/**
 * Textes du site : Catalogue et fiche véhicule.
 * Registre : voir src/config/textes-outils.ts (conventions) et src/config/textes.ts.
 */
import { entete, type PageTextes } from '../textes-outils.ts';

export const PAGES_VEHICULES: PageTextes[] = [
  { cle: 'vehicules', libelle: 'Nos véhicules', description: 'Catalogue des motos et scooters.', chemin: '/vehicules', sections: [entete('vehicules', 'Nos Véhicules d\'Occasion')] },
];
