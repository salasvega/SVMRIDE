/**
 * Textes du site : Accueil, nom du site et bandeau d'annonce.
 * Registre : voir src/config/textes-outils.ts (conventions) et src/config/textes.ts.
 */
import { L, P, U, atouts, type PageTextes } from '../textes-outils.ts';

export const PAGES_ACCUEIL: PageTextes[] = [
  {
  cle: 'identite',
  libelle: 'Nom et accroche',
  description: 'Nom affiché du site et phrase d’accroche de l’accueil.',
  chemin: '/',
  sections: [
    {
      titre: 'Identité',
      textes: [
        L('site.nom', 'Nom du site', 'SVM Ride', 'Affiché dans la barre du haut, le pied de page, l’onglet du navigateur et les résultats Google. Peut différer de la raison sociale.', 40),
        P('site.accroche', 'Phrase d’accroche', 'Votre spécialiste du deux-roues basé en Île-de-France.', 'Sous le titre de la page d’accueil.', 160),
      ],
    },
  ],
},
  {
  cle: 'annonce',
  libelle: 'Bandeau d’annonce',
  description: 'Message en haut de toutes les pages : fermeture, promotion, événement.',
  chemin: '/',
  sections: [
    {
      titre: 'Bandeau d’annonce',
      aide: 'Laissez le message vide pour ne rien afficher.',
      textes: [
        P('annonce.texte', 'Message', '', 'Ex. « Showroom fermé du 1er au 15 août. Les demandes en ligne restent traitées. »', 180),
        L('annonce.lien_texte', 'Texte du lien (facultatif)', '', 'Ex. « En savoir plus »', 40),
        { cle: 'annonce.lien', libelle: 'Adresse du lien (facultatif)', defaut: '', type: 'lien', max: 300, aide: 'Une page du site (ex. /contact) ou une adresse complète (https://…).' },
      ],
    },
  ],
},
  {
  cle: 'accueil',
  libelle: 'Accueil',
  description: 'Tous les textes de la page d’accueil, section par section.',
  chemin: '/',
  sections: [
    {
      titre: 'Bandeau principal',
      textes: [
        L('accueil.hero.titre', 'Titre', 'Bienvenue chez {nom}', undefined, 60),
        P('site.accroche', 'Phrase d’accroche', 'Votre spécialiste du deux-roues basé en Île-de-France.', 'Aussi modifiable dans Édition du site.', 160),
        L('accueil.hero.bouton1', 'Bouton principal', 'Voir nos véhicules', undefined, 30),
        L('accueil.hero.bouton2', 'Bouton secondaire', 'Nous contacter', undefined, 30),
      ],
    },
    {
      titre: 'Vente de véhicules d’occasion',
      textes: [
        L('accueil.vente.titre', 'Titre', 'Vente de véhicules d\'occasion', undefined, 60),
        P('accueil.vente.texte', 'Texte', 'Découvrez notre sélection de motos et scooters d\'occasion de qualité', undefined, 200),
        ...atouts('accueil.vente.atout', [
          ['Sélection vérifiée', 'Chaque véhicule est rigoureusement contrôlé et garanti'],
          ['Accompagnement', 'Conseils personnalisés pour trouver le deux-roues idéal'],
          ['Financement', 'Solutions de financement adaptées à votre budget'],
          ['Démarches simplifiées', 'Nous gérons toute la paperasse pour vous'],
        ]),
      ],
    },
    {
      titre: 'Derniers arrivages',
      textes: [
        L('accueil.arrivages.titre', 'Titre', 'Derniers arrivages', undefined, 50),
        L('accueil.arrivages.lien', 'Lien vers le catalogue', 'Voir toutes nos motos', 'Le nombre de motos en vente est ajouté automatiquement.', 40),
      ],
    },
    {
      titre: 'Explorez les marques',
      textes: [
        L('accueil.marques.titre', 'Titre', 'Explorez les marques', undefined, 50),
        P('accueil.marques.texte', 'Texte', 'Retrouvez les plus grandes marques de motos et découvrez les modèles actuellement disponibles chez {nom}.', undefined, 240),
      ],
    },
    {
      titre: 'Reprise de votre véhicule',
      textes: [
        L('accueil.reprise.titre', 'Titre', 'Reprise de votre véhicule', undefined, 60),
        P('accueil.reprise.texte', 'Texte', 'Faites reprendre votre deux-roues rapidement et au meilleur prix. Notre équipe vous propose une expertise rapide, une offre attractive, un virement immédiat et des démarches simplifiées.'),
        L('accueil.reprise.bouton', 'Bouton', 'Demande de reprise', undefined, 30),
        L('accueil.reprise.depot', 'Phrase vers le dépôt-vente', 'Vous préférez vendre au meilleur prix ?', undefined, 80),
        L('accueil.reprise.depot_lien', 'Lien vers le dépôt-vente', 'Confiez-nous votre moto en dépôt-vente', undefined, 60),
        ...atouts('accueil.reprise.atout', [
          ['Expertise rapide', 'Évaluation en moins de 24h'],
          ['Offre attractive', 'Prix juste et compétitif'],
          ['Virement immédiat', 'Paiement sécurisé rapide'],
          ['Sans contrainte', 'Démarches simplifiées'],
        ]),
      ],
    },
    {
      titre: 'Services',
      textes: [
        L('accueil.service1.titre', 'Service 1 : titre', 'Personnalisation', undefined, 40),
        P('accueil.service1.texte', 'Service 1 : texte', 'Transformez votre deux-roues selon vos envies. Échappements, kits esthétiques, selles confort et bien plus encore.', undefined, 240),
        L('accueil.service1.lien', 'Service 1 : lien', 'En savoir plus →', undefined, 30),
        U('accueil.service1.adresse', 'Service 1 : adresse du lien', '/contact', 'Une page du site (ex. /contact) ou une adresse complète (https://…).'),
        L('accueil.service2.titre', 'Service 2 : titre', 'Accessoires', undefined, 40),
        P('accueil.service2.texte', 'Service 2 : texte', 'Large gamme d\'accessoires et d\'équipements pour votre sécurité et votre confort. Casques, gants, bagagerie et plus.', undefined, 240),
        L('accueil.service2.lien', 'Service 2 : lien', 'En savoir plus →', undefined, 30),
        U('accueil.service2.adresse', 'Service 2 : adresse du lien', '/contact', 'Une page du site (ex. /contact) ou une adresse complète (https://…).'),
        L('accueil.service3.titre', 'Service 3 : titre', 'Entretien & Réparation', undefined, 40),
        P('accueil.service3.texte', 'Service 3 : texte', 'Service d\'entretien et de réparation pour tous types de deux-roues. Prenez rendez-vous par téléphone ou par notre formulaire de contact.', undefined, 240),
        L('accueil.service3.lien', 'Service 3 : lien', 'Prendre rendez-vous →', undefined, 30),
        U('accueil.service3.adresse', 'Service 3 : adresse du lien', '/contact', 'Une page du site (ex. /contact) ou une adresse complète (https://…).'),
      ],
    },
    {
      titre: 'Pourquoi nous choisir ?',
      textes: [
        L('accueil.pourquoi.titre', 'Titre', 'Pourquoi nous choisir ?', undefined, 60),
        ...atouts('accueil.pourquoi.point', [
          ['Expertise & Passion', 'Une équipe de passionnés à votre service, avec des années d\'expérience dans le deux-roues.'],
          ['Qualité & Fiabilité', 'Des véhicules soigneusement sélectionnés et vérifiés pour votre tranquillité d\'esprit.'],
          ['Satisfaction Client', 'Votre satisfaction est notre priorité. Service personnalisé et suivi après-vente.'],
        ], 'Point'),
      ],
    },
    {
      titre: 'Avis clients',
      textes: [
        L('accueil.avis.titre', 'Titre', 'Votre confiance, notre plus belle récompense', undefined, 70),
        P('accueil.avis.texte', 'Texte', 'Découvrez ce que nos clients pensent de leur expérience chez {nom}.', undefined, 200),
      ],
    },
    {
      titre: 'Équipe',
      aide: 'Section visible si l’équipe est affichée (onglet Équipe).',
      textes: [
        L('accueil.equipe.titre', 'Titre', 'Des passionnés à votre service', undefined, 60),
        P('accueil.equipe.texte', 'Texte', 'Derrière chaque moto, il y a une équipe de passionnés à votre écoute pour vous conseiller et vous accompagner dans votre projet.', undefined, 240),
        L('accueil.equipe.bouton', 'Bouton', 'Découvrir notre équipe', undefined, 30),
      ],
    },
    {
      titre: 'Appel final',
      textes: [
        L('accueil.final.titre', 'Titre', 'Prêt à trouver votre deux-roues ?', undefined, 60),
        P('accueil.final.texte', 'Texte', 'Contactez-nous dès maintenant pour discuter de votre projet ou visiter notre showroom.', undefined, 240),
        L('accueil.final.bouton', 'Bouton', 'Nous contacter', undefined, 30),
      ],
    },
  ],
},
];
