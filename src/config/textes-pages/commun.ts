/**
 * Textes du site : Éléments communs à toutes les pages (en-tête, pied de page, cookies, page introuvable, plan du site).
 * Registre : voir src/config/textes-outils.ts (conventions) et src/config/textes.ts.
 */
import { L, P, type PageTextes } from '../textes-outils.ts';

export const PAGES_COMMUN: PageTextes[] = [
  {
  cle: 'navigation', libelle: 'Menu et en-tête', description: 'Barre du haut de toutes les pages : liens du menu et bouton de contact.', chemin: '/',
  sections: [
    {
      titre: 'Menu',
      aide: 'Les mêmes libellés servent au menu de l’ordinateur et au menu déroulant du téléphone.',
      textes: [
        L('navigation.menu.accueil', 'Lien “Accueil”', 'Accueil', undefined, 30),
        L('navigation.menu.vehicules', 'Lien “Nos Véhicules”', 'Nos Véhicules', undefined, 30),
        L('navigation.menu.reprises', 'Lien “Reprises”', 'Reprises', undefined, 30),
        L('navigation.menu.depot_vente', 'Lien “Dépôt-vente”', 'Dépôt-vente', undefined, 30),
        L('navigation.menu.financement', 'Lien “Financement”', 'Financement', undefined, 30),
        L('navigation.menu.recherche', 'Lien “Recherche personnalisée”', 'Recherche personnalisée', undefined, 40),
        L('navigation.contact', 'Bouton de contact', 'Contactez-nous', undefined, 30),
      ],
    },
  ],
},
  {
  cle: 'pied', libelle: 'Pied de page', description: 'Bas de toutes les pages.', chemin: '/',
  sections: [
    {
      titre: 'Pied de page',
      textes: [
        P('pied.description', 'Phrase sous le nom', 'Spécialiste du deux-roues en Île-de-France', undefined, 200),
        L('pied.showroom.titre', 'Titre “Notre showroom”', 'Notre showroom', 'L’adresse et les horaires viennent de l’onglet Édition du site.', 40),
      ],
    },
    {
      titre: 'Contact',
      aide: 'L’e-mail, le téléphone et Instagram viennent de l’onglet Édition du site.',
      textes: [L('pied.contact.titre', 'Titre', 'Contact', undefined, 30)],
    },
    {
      titre: 'Liens utiles',
      textes: [
        L('pied.liens.titre', 'Titre', 'Liens utiles', undefined, 30),
        L('pied.liens.equipe', 'Lien “Notre équipe”', 'Notre équipe', 'Visible si l’équipe est affichée (onglet Équipe).', 40),
        L('pied.liens.suivre', 'Lien “Suivre ma vente”', 'Suivre ma vente (dépôt-vente)', undefined, 50),
        L('pied.liens.mentions', 'Lien “Mentions légales”', 'Mentions légales', undefined, 40),
        L('pied.liens.confidentialite', 'Lien “Politique de confidentialité”', 'Politique de confidentialité', undefined, 50),
        L('pied.liens.cookies', 'Lien “Politique des cookies”', 'Politique des cookies', undefined, 40),
        L('pied.liens.plan', 'Lien “Plan du site”', 'Plan du site', undefined, 30),
      ],
    },
    {
      titre: 'Bas du pied de page',
      textes: [
        L('pied.copyright', 'Mention de droits', '© {annee} {nom}. Tous droits réservés.', '{annee} est remplacé par l’année en cours.', 80),
        L('pied.espace_pro', 'Lien vers l’espace pro', 'Espace pro', undefined, 30),
      ],
    },
  ],
},
  {
  cle: 'cookies', libelle: 'Bandeau cookies', description: 'Bandeau affiché en bas de l’écran tant que le visiteur n’a pas fait son choix.', chemin: '/',
  sections: [
    {
      titre: 'Gestion des cookies',
      aide: 'Le bandeau n’apparaît plus une fois un choix fait sur cet appareil.',
      textes: [
        L('cookies.titre', 'Titre', 'Gestion des cookies', undefined, 50),
        P('cookies.texte', 'Texte', 'Nous utilisons des cookies pour améliorer votre expérience sur notre site. Les cookies essentiels sont nécessaires au fonctionnement du site, tandis que les cookies analytiques nous aident à comprendre comment vous utilisez notre site.', undefined, 480),
        L('cookies.essentiels', 'Bouton “Essentiels uniquement”', 'Essentiels uniquement', undefined, 40),
        L('cookies.tout', 'Bouton “Tout accepter”', 'Tout accepter', undefined, 30),
      ],
    },
  ],
},
  {
  cle: 'introuvable', libelle: 'Page introuvable', description: 'Page affichée quand une adresse n’existe pas (erreur 404).', chemin: '/page-inexistante',
  sections: [
    {
      titre: 'Page non trouvée',
      textes: [
        L('introuvable.titre', 'Titre', 'Page non trouvée', undefined, 50),
        P('introuvable.texte', 'Texte', 'La page que vous recherchez n\'existe pas ou a été déplacée. Vérifiez l\'URL ou retournez à l\'accueil.', undefined, 240),
        L('introuvable.bouton', 'Bouton', 'Retour à l\'accueil', undefined, 30),
      ],
    },
  ],
},
  {
  cle: 'plan', libelle: 'Plan du site', description: 'Liste de toutes les pages du site.', chemin: '/plan-du-site',
  sections: [
    {
      titre: 'En-tête de la page',
      textes: [L('plan.titre', 'Titre', 'Plan du Site', undefined, 40)],
    },
    {
      titre: 'Pages principales',
      textes: [
        L('plan.principales.titre', 'Titre', 'Pages principales', undefined, 40),
        L('plan.principales.accueil', 'Lien “Accueil”', 'Accueil', undefined, 40),
        L('plan.principales.vehicules', 'Lien “Nos Véhicules”', 'Nos Véhicules', undefined, 40),
        L('plan.principales.reprises', 'Lien “Reprise de véhicule”', 'Reprise de véhicule', undefined, 40),
        L('plan.principales.depot_vente', 'Lien “Dépôt-vente”', 'Dépôt-vente', undefined, 40),
        L('plan.principales.financement', 'Lien “Solutions de financement”', 'Solutions de financement', undefined, 50),
        L('plan.principales.recherche', 'Lien “Recherche personnalisée”', 'Recherche personnalisée', undefined, 50),
        L('plan.principales.equipe', 'Lien “Notre équipe”', 'Notre équipe', 'Visible si l’équipe est affichée (onglet Équipe).', 40),
        L('plan.principales.contact', 'Lien “Contact”', 'Contact', undefined, 40),
      ],
    },
    {
      titre: 'Informations légales',
      textes: [
        L('plan.legales.titre', 'Titre', 'Informations légales', undefined, 40),
        L('plan.legales.mentions', 'Lien “Mentions légales”', 'Mentions légales', undefined, 40),
        L('plan.legales.confidentialite', 'Lien “Politique de confidentialité”', 'Politique de confidentialité', undefined, 50),
        L('plan.legales.cookies', 'Lien “Politique des cookies”', 'Politique des cookies', undefined, 40),
        L('plan.legales.plan', 'Lien “Plan du site”', 'Plan du site', undefined, 40),
      ],
    },
  ],
},
  {
  cle: 'avis', libelle: 'Avis Google', description: 'Petites mentions des cartes d’avis clients (les avis eux-mêmes ne sont pas modifiables).', chemin: '/',
  sections: [
    {
      titre: 'Cartes d’avis',
      textes: [
        L('avis.carte.lire_suite', 'Lien “Lire la suite”', 'Lire la suite', 'Affiché quand un avis est trop long pour la carte.', 30),
        L('avis.carte.sans_commentaire', 'Avis sans texte', 'Note sans commentaire.', undefined, 50),
        L('avis.carte.google', 'Mention en bas de carte', 'Publié sur Google', undefined, 40),
        L('avis.carte.demo', 'Mention en bas de carte (avis de démonstration)', 'Avis de démonstration', undefined, 40),
      ],
    },
    {
      titre: 'Avis ouvert en entier',
      textes: [
        L('avis.lecture.google', 'Mention en bas de l’avis', 'Publié sur Google', undefined, 40),
        L('avis.lecture.demo', 'Mention en bas de l’avis (avis de démonstration)', 'Avis de démonstration', undefined, 40),
      ],
    },
  ],
},
  {
  cle: 'fichiers', libelle: 'Envoi de fichiers', description: 'Zones d’envoi de photos et de documents des formulaires.', chemin: '/reprises',
  sections: [
    {
      titre: 'Zone d’envoi de plusieurs fichiers',
      aide: 'Formulaires de reprise, de dépôt-vente, de contact et de recherche personnalisée.',
      textes: [
        L('fichiers.multiple.glisser', 'Invitation', 'Glissez-déposez vos {elements}', '{elements} est remplacé par « photos », « fichiers »… selon le formulaire.', 60),
        L('fichiers.multiple.parcourir', 'Invitation (suite)', 'ou cliquez pour parcourir', undefined, 50),
        L('fichiers.multiple.compteur', 'Compteur', '{n}/{max} fichier(s) ajouté(s)', '{n} et {max} sont remplacés par le nombre de fichiers ajoutés et le maximum.', 60),
        L('fichiers.multiple.taille', 'Taille maximale', 'Max {taille} Mo / fichier', '{taille} est remplacé par la taille maximale.', 50),
        L('fichiers.multiple.qualite', 'Alerte photo de faible qualité', 'Qualité faible : photo floue ou trop petite', undefined, 80),
      ],
    },
    {
      titre: 'Zone d’envoi d’un seul fichier',
      aide: 'Pièces justificatives du dossier de financement.',
      textes: [
        L('fichiers.unique.choisir', 'Bouton', 'Cliquer pour choisir un fichier', undefined, 50),
        L('fichiers.unique.qualite', 'Alerte photo de faible qualité', 'Qualité faible : photo floue ou trop petite', undefined, 80),
      ],
    },
    {
      titre: 'Boutons sur téléphone et tablette',
      aide: 'Affichés sous les zones d’envoi sur les écrans tactiles.',
      textes: [
        L('fichiers.mobile.phototheque_fichiers', 'Bouton « photos et fichiers »', 'Photothèque / fichiers', undefined, 40),
        L('fichiers.mobile.phototheque', 'Bouton « photos »', 'Photothèque', undefined, 30),
        L('fichiers.mobile.camera', 'Bouton « appareil photo »', 'Caméra', undefined, 30),
      ],
    },
  ],
},
];
