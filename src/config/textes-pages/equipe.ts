/**
 * Textes du site : Page Équipe.
 * Registre : voir src/config/textes-outils.ts (conventions) et src/config/textes.ts.
 */
import { entete, type PageTextes } from '../textes-outils.ts';

export const PAGES_EQUIPE: PageTextes[] = [
  {
  cle: 'equipe', libelle: 'Équipe', description: 'Page de présentation de l’équipe.', chemin: '/equipe',
  sections: [entete('equipe', 'Rencontrez l\'équipe {nom}', 'Chez {nom}, la passion de la moto se partage au quotidien. Découvrez les femmes et les hommes qui mettent leur expérience et leur savoir-faire au service de votre prochain projet moto.')],
},
];
