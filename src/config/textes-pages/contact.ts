/**
 * Textes du site : Page Contact.
 * Registre : voir src/config/textes-outils.ts (conventions) et src/config/textes.ts.
 */
import { L, P, entete, type PageTextes } from '../textes-outils.ts';

export const PAGES_CONTACT: PageTextes[] = [
  {
  cle: 'contact', libelle: 'Contact', description: 'Page de contact et du showroom.', chemin: '/contact',
  sections: [
    entete('contact', 'Contactez-nous', 'Nous sommes à votre écoute'),
    {
      titre: 'Nos coordonnées',
      aide: 'Le téléphone, l’adresse et les horaires eux-mêmes se modifient dans Édition du site.',
      textes: [
        L('contact.coordonnees.titre', 'Titre', 'Nos coordonnées', undefined, 50),
        L('contact.showroom.titre', 'Titre du showroom', 'Notre showroom', undefined, 50),
        L('contact.showroom.lien_maps', 'Lien vers la carte', 'Voir sur Google Maps', undefined, 40),
        L('contact.horaires.titre', 'Titre des horaires', 'Horaires', undefined, 40),
      ],
    },
    {
      titre: 'Envoyez-nous un message',
      textes: [
        L('contact.formulaire.titre', 'Titre du formulaire', 'Envoyez-nous un message', undefined, 60),
        L('contact.formulaire.nom', 'Champ “Nom complet” : intitulé', 'Nom complet', undefined, 40),
        L('contact.formulaire.email', 'Champ “Email” : intitulé', 'Email', undefined, 30),
        L('contact.formulaire.sujet', 'Champ “Sujet” : intitulé', 'Sujet', undefined, 30),
        L('contact.formulaire.sujet_vehicule', 'Champ “Sujet” : texte pré-rempli depuis une fiche véhicule', 'Demande d\'information - {vehicule}', '{vehicule} est remplacé par la marque, le modèle et l’année du véhicule consulté.', 80),
        L('contact.formulaire.message', 'Champ “Message” : intitulé', 'Message', undefined, 30),
        L('contact.formulaire.pieces', 'Champ “Pièces jointes” : intitulé', 'Pièces jointes (optionnel)', undefined, 50),
        P('contact.formulaire.consentement_avant', 'Case d’accord : texte avant le lien', 'J\'accepte que mes données soient utilisées pour traiter ma demande conformément à la', undefined, 200),
        L('contact.formulaire.consentement_lien', 'Case d’accord : texte du lien', 'politique de confidentialité', undefined, 50),
        L('contact.formulaire.consentement_apres', 'Case d’accord : texte après le lien', '.', undefined, 30),
        L('contact.formulaire.televersement', 'Message pendant l’envoi des pièces jointes', 'Téléversement des documents...', undefined, 60),
        L('contact.formulaire.bouton', 'Bouton', 'Envoyer le message', undefined, 40),
        L('contact.formulaire.bouton_televersement', 'Bouton pendant l’envoi des pièces jointes', 'Téléversement des documents...', undefined, 60),
        L('contact.formulaire.bouton_envoi', 'Bouton pendant l’envoi', 'Envoi en cours...', undefined, 40),
      ],
    },
    {
      titre: 'Message après envoi',
      textes: [
        L('contact.confirmation.titre', 'Titre', 'Message envoyé !', undefined, 50),
        P('contact.confirmation.texte', 'Texte', 'Nous avons bien reçu votre message. Notre équipe vous répondra dans les plus brefs délais.', undefined, 200),
      ],
    },
  ],
},
];
