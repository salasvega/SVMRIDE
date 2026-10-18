/**
 * Textes du site : Page Recherche personnalisée.
 * Registre : voir src/config/textes-outils.ts (conventions) et src/config/textes.ts.
 */
import { L, P, atouts, entete, type PageTextes } from '../textes-outils.ts';

const OPTION = 'Libellé affiché seulement : le choix transmis avec la demande ne change pas.';

export const PAGES_RECHERCHE: PageTextes[] = [
  {
  cle: 'recherche',
  libelle: 'Recherche personnalisée',
  description: 'Tous les textes de la demande de recherche sur mesure : présentation, étapes, formulaire et message après envoi.',
  chemin: '/recherche-personnalisee',
  sections: [
    entete('recherche', 'Recherche Personnalisée', 'Nous trouvons le deux-roues de vos rêves'),
    {
      titre: 'Un service sur-mesure',
      textes: [
        L('recherche.service.titre', 'Titre', 'Un service sur-mesure', undefined, 50),
        P('recherche.service.texte', 'Texte', 'Vous cherchez un modèle précis, une configuration particulière ou un véhicule rare ? Notre service de recherche personnalisée met notre expertise et notre réseau à votre disposition pour dénicher le deux-roues qui correspond exactement à vos critères.', undefined, 480),
        ...atouts('recherche.etapes.', [
          ['Définissez vos critères', 'Remplissez le formulaire avec vos souhaits : marque, modèle, budget, délai...'],
          ['Nous cherchons pour vous', 'Notre équipe active son réseau et recherche activement le véhicule correspondant.'],
          ['Vous recevez des propositions', 'Nous vous présentons les véhicules trouvés avec photos, historique et prix.'],
          ['Vous choisissez', 'Pas de pression, vous décidez librement si une proposition vous convient.'],
        ], 'Étape'),
      ],
    },
    {
      titre: 'Votre recherche',
      aide: 'Formulaire à droite de la présentation. Les messages d’erreur ne sont pas modifiables.',
      textes: [
        L('recherche.formulaire.titre', 'Titre du formulaire', 'Votre recherche', undefined, 40),
        L('recherche.formulaire.nom', 'Champ “Nom complet” : intitulé', 'Nom complet', undefined, 30),
        L('recherche.formulaire.email', 'Champ “Email” : intitulé', 'Email', undefined, 30),
        L('recherche.formulaire.telephone', 'Champ “Téléphone” : intitulé', 'Téléphone', undefined, 30),
        L('recherche.formulaire.type.intitule', 'Champ “Type de véhicule” : intitulé', 'Type de véhicule', undefined, 40),
        L('recherche.formulaire.type.vide', 'Champ “Type de véhicule” : texte avant choix', 'Sélectionnez...', undefined, 30),
        L('recherche.formulaire.type.moto', 'Champ “Type de véhicule” : choix 1', 'Moto', OPTION, 30),
        L('recherche.formulaire.type.scooter', 'Champ “Type de véhicule” : choix 2', 'Scooter', OPTION, 30),
        L('recherche.formulaire.type.indifferent', 'Champ “Type de véhicule” : choix 3', 'Indifférent', OPTION, 30),
        L('recherche.formulaire.marque.intitule', 'Champ “Marque” : intitulé', 'Marque souhaitée (optionnel)', undefined, 50),
        L('recherche.formulaire.marque.exemple', 'Champ “Marque” : exemple dans le champ', 'Ex: Yamaha, Honda...', undefined, 40),
        L('recherche.formulaire.cylindree.intitule', 'Champ “Cylindrée” : intitulé', 'Cylindrée souhaitée', undefined, 40),
        L('recherche.formulaire.cylindree.indifferent', 'Champ “Cylindrée” : choix par défaut', 'Indifférent', OPTION, 30),
        L('recherche.formulaire.cylindree.125', 'Champ “Cylindrée” : choix 125', '125 cc', OPTION, 30),
        L('recherche.formulaire.cylindree.300', 'Champ “Cylindrée” : choix 300', '300 cc', OPTION, 30),
        L('recherche.formulaire.cylindree.500', 'Champ “Cylindrée” : choix 500', '500 cc', OPTION, 30),
        L('recherche.formulaire.cylindree.650', 'Champ “Cylindrée” : choix 650', '650 cc', OPTION, 30),
        L('recherche.formulaire.cylindree.800', 'Champ “Cylindrée” : choix 800 et plus', '800 cc et plus', OPTION, 30),
        L('recherche.formulaire.annee.intitule', 'Champ “Année minimale” : intitulé', 'Année minimale', undefined, 30),
        L('recherche.formulaire.annee.exemple', 'Champ “Année minimale” : exemple dans le champ', 'Ex: 2018', undefined, 30),
        L('recherche.formulaire.budget', 'Champ “Budget maximum” : intitulé', 'Budget maximum (€)', undefined, 40),
        L('recherche.formulaire.delai.intitule', 'Champ “Délai” : intitulé', 'Délai souhaité', undefined, 30),
        L('recherche.formulaire.delai.vide', 'Champ “Délai” : texte avant choix', 'Sélectionnez...', undefined, 30),
        L('recherche.formulaire.delai.urgent', 'Champ “Délai” : choix 1', 'Urgent (moins de 2 semaines)', OPTION, 50),
        L('recherche.formulaire.delai.1_mois', 'Champ “Délai” : choix 2', '1 mois', OPTION, 30),
        L('recherche.formulaire.delai.2_mois', 'Champ “Délai” : choix 3', '2 mois', OPTION, 30),
        L('recherche.formulaire.delai.flexible', 'Champ “Délai” : choix 4', 'Flexible', OPTION, 30),
        L('recherche.formulaire.details.intitule', 'Champ “Détails” : intitulé', 'Détails supplémentaires', undefined, 50),
        L('recherche.formulaire.details.exemple', 'Champ “Détails” : exemple dans le champ', 'Modèle précis, couleur, équipements souhaités...', undefined, 90),
        L('recherche.formulaire.pieces.intitule', 'Pièces jointes : intitulé', 'Pièces jointes (optionnel)', undefined, 50),
        L('recherche.formulaire.pieces.elements', 'Pièces jointes : ce qu’on dépose', 'fichiers', 'Complète la phrase « Glissez-déposez vos … » de la zone de dépôt.', 40),
        P('recherche.formulaire.consentement.avant', 'Case d’accord : texte', 'J\'accepte que mes données soient utilisées pour traiter ma recherche conformément à la', 'Suivi du lien vers la politique de confidentialité.', 200),
        L('recherche.formulaire.consentement.lien', 'Case d’accord : texte du lien', 'politique de confidentialité', undefined, 50),
        L('recherche.formulaire.consentement.apres', 'Case d’accord : fin de phrase', '.', 'Après le lien.', 30),
        L('recherche.formulaire.televersement', 'Message pendant l’envoi des fichiers', 'Téléversement des documents...', 'Au-dessus du bouton, pendant l’envoi des pièces jointes.', 60),
        L('recherche.formulaire.bouton.texte', 'Bouton d’envoi', 'Lancer la recherche', undefined, 40),
        L('recherche.formulaire.bouton.televersement', 'Bouton pendant l’envoi des fichiers', 'Téléversement des documents...', undefined, 60),
        L('recherche.formulaire.bouton.envoi', 'Bouton pendant l’envoi de la demande', 'Envoi en cours...', undefined, 40),
      ],
    },
    {
      titre: 'Message après envoi',
      aide: 'Remplace le formulaire une fois la demande envoyée.',
      textes: [
        L('recherche.succes.titre', 'Titre', 'Recherche lancée !', undefined, 40),
        P('recherche.succes.texte', 'Texte', 'Nous avons bien reçu votre demande. Notre équipe commence immédiatement la recherche et vous tiendra informé.', undefined, 220),
      ],
    },
  ],
},
];
