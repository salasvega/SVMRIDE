/**
 * Textes du site : Page Reprises (/reprises).
 * Registre : voir src/config/textes-outils.ts (conventions) et src/config/textes.ts.
 */
import { L, P, atouts, entete, type PageTextes } from '../textes-outils.ts';

const OPTION = 'Libellé affiché seulement : le choix transmis avec la demande ne change pas.';

export const PAGES_REPRISES: PageTextes[] = [
  {
  cle: 'reprises',
  libelle: 'Reprises',
  description: 'Tous les textes de la page de demande de reprise : étapes, formulaire et message après envoi.',
  chemin: '/reprises',
  sections: [
    entete('reprises', 'Reprise de votre véhicule', 'Obtenez une estimation rapide et au meilleur prix'),
    {
      titre: 'Comment ça marche ?',
      textes: [
        L('reprises.etapes.titre', 'Titre', 'Comment ça marche ?', undefined, 40),
        ...atouts('reprises.etapes.', [
          ['Remplissez le formulaire', 'Décrivez votre véhicule et son état en quelques clics. Plus vous êtes précis, plus notre estimation sera juste.'],
          ['Recevez une estimation', 'Notre équipe étudie votre demande et vous contacte sous 24h avec une première estimation.'],
          ['Expertise sur place', 'Un rendez-vous est organisé pour examiner le véhicule et finaliser l\'offre.'],
          ['Virement immédiat', 'Si vous acceptez l\'offre, le paiement est effectué immédiatement et nous gérons toutes les démarches.'],
        ], 'Étape'),
      ],
    },
    {
      titre: 'Demande de reprise',
      aide: 'Formulaire à droite des étapes. Les messages d’erreur ne sont pas modifiables.',
      textes: [
        L('reprises.formulaire.titre', 'Titre du formulaire', 'Demande de reprise', undefined, 40),
        L('reprises.formulaire.nom', 'Champ “Nom complet” : intitulé', 'Nom complet', undefined, 30),
        L('reprises.formulaire.email', 'Champ “Email” : intitulé', 'Email', undefined, 30),
        L('reprises.formulaire.telephone', 'Champ “Téléphone” : intitulé', 'Téléphone', undefined, 30),
        L('reprises.formulaire.marque', 'Champ “Marque” : intitulé', 'Marque', undefined, 30),
        L('reprises.formulaire.modele', 'Champ “Modèle” : intitulé', 'Modèle', undefined, 30),
        L('reprises.formulaire.annee', 'Champ “Année” : intitulé', 'Année', undefined, 30),
        L('reprises.formulaire.kilometrage', 'Champ “Kilométrage” : intitulé', 'Kilométrage', undefined, 30),
        L('reprises.formulaire.etat.intitule', 'Champ “État général” : intitulé', 'État général', undefined, 30),
        L('reprises.formulaire.etat.vide', 'Champ “État général” : texte avant choix', 'Sélectionnez...', undefined, 30),
        L('reprises.formulaire.etat.excellent', 'Champ “État général” : choix 1', 'Excellent', OPTION, 30),
        L('reprises.formulaire.etat.bon', 'Champ “État général” : choix 2', 'Bon', OPTION, 30),
        L('reprises.formulaire.etat.correct', 'Champ “État général” : choix 3', 'Correct', OPTION, 30),
        L('reprises.formulaire.etat.a_reviser', 'Champ “État général” : choix 4', 'À réviser', OPTION, 30),
        L('reprises.formulaire.commentaires.intitule', 'Champ “Commentaires” : intitulé', 'Commentaires additionnels', undefined, 50),
        L('reprises.formulaire.commentaires.exemple', 'Champ “Commentaires” : exemple dans le champ', 'Historique, modifications, points à signaler...', undefined, 90),
        L('reprises.formulaire.photos.intitule', 'Photos : intitulé', 'Photos du véhicule (fortement recommandé)', undefined, 80),
        L('reprises.formulaire.photos.elements', 'Photos : ce qu’on dépose', 'photos ou documents', 'Complète la phrase « Glissez-déposez vos … » de la zone de dépôt.', 40),
        P('reprises.formulaire.consentement.avant', 'Case d’accord : texte', 'J\'accepte que mes données soient utilisées pour traiter ma demande de reprise conformément à la', 'Suivi du lien vers la politique de confidentialité.', 200),
        L('reprises.formulaire.consentement.lien', 'Case d’accord : texte du lien', 'politique de confidentialité', undefined, 50),
        L('reprises.formulaire.consentement.apres', 'Case d’accord : fin de phrase', '.', 'Après le lien.', 30),
        L('reprises.formulaire.televersement', 'Message pendant l’envoi des photos', 'Téléversement des documents...', 'Au-dessus du bouton, pendant l’envoi des photos.', 60),
        L('reprises.formulaire.bouton.texte', 'Bouton d’envoi', 'Envoyer ma demande', undefined, 40),
        L('reprises.formulaire.bouton.televersement', 'Bouton pendant l’envoi des photos', 'Téléversement des documents...', undefined, 60),
        L('reprises.formulaire.bouton.envoi', 'Bouton pendant l’envoi de la demande', 'Envoi en cours...', undefined, 40),
      ],
    },
    {
      titre: 'Message après envoi',
      aide: 'Remplace le formulaire une fois la demande envoyée.',
      textes: [
        L('reprises.succes.titre', 'Titre', 'Demande envoyée !', undefined, 40),
        P('reprises.succes.texte', 'Texte', 'Nous avons bien reçu votre demande de reprise. Notre équipe vous contactera sous 24h.', undefined, 200),
      ],
    },
  ],
},
];
