/**
 * Textes du site : Page Équipe.
 * Registre : voir src/config/textes-outils.ts (conventions) et src/config/textes.ts.
 */
import { L, P, entete, type PageTextes } from '../textes-outils.ts';

export const PAGES_EQUIPE: PageTextes[] = [
  {
  cle: 'equipe', libelle: 'Équipe', description: 'Page de présentation de l’équipe.', chemin: '/equipe',
  sections: [
    entete('equipe', 'Rencontrez l\'équipe {nom}', 'Chez {nom}, la passion de la moto se partage au quotidien. Découvrez les femmes et les hommes qui mettent leur expérience et leur savoir-faire au service de votre prochain projet moto.'),
    {
      titre: 'Responsable',
      aide: 'Nom, fonction, présentation et citation se modifient dans l’onglet Équipe.',
      textes: [
        L('equipe.responsable.surtitre', 'Titre au-dessus de la présentation', 'Sa vision de l\'accompagnement', undefined, 60),
      ],
    },
    {
      titre: 'À vos côtés au quotidien',
      aide: 'Les fiches des membres se modifient dans l’onglet Équipe.',
      textes: [
        L('equipe.collaborateurs.titre', 'Titre', 'À vos côtés au quotidien', undefined, 60),
      ],
    },
    {
      titre: 'Un projet moto ? Parlons-en',
      textes: [
        L('equipe.final.titre', 'Titre', 'Un projet moto ? Parlons-en', undefined, 60),
        P('equipe.final.texte', 'Texte', 'Achat, reprise, dépôt-vente ou financement : l\'équipe vous répond et vous accueille au showroom.', undefined, 240),
        L('equipe.final.bouton1', 'Bouton principal', 'Contacter notre équipe', undefined, 40),
        L('equipe.final.bouton2', 'Bouton secondaire', 'Voir nos motos', undefined, 30),
      ],
    },
  ],
},
];
