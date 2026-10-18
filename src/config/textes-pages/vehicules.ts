/**
 * Textes du site : Catalogue et fiche véhicule.
 * Registre : voir src/config/textes-outils.ts (conventions) et src/config/textes.ts.
 */
import { L, P, entete, type PageTextes } from '../textes-outils.ts';

export const PAGES_VEHICULES: PageTextes[] = [
  {
  cle: 'vehicules', libelle: 'Nos véhicules', description: 'Catalogue des motos et scooters.', chemin: '/vehicules',
  sections: [
    entete('vehicules', 'Nos Véhicules d\'Occasion'),
    {
      titre: 'Compteur de véhicules',
      aide: '{n} est remplacé par le nombre de véhicules, {marque} par la marque choisie. Les statuts s’ajoutent après, par exemple « 5 véhicules : 3 disponibles, 2 vendus ».',
      textes: [
        L('vehicules.compteur.chargement', 'Pendant le chargement', 'Chargement...', undefined, 40),
        L('vehicules.compteur.aucun', 'Aucun véhicule', 'Aucun véhicule pour le moment', undefined, 60),
        L('vehicules.compteur.aucun_marque', 'Aucun véhicule (marque choisie)', 'Aucun véhicule {marque} pour le moment', undefined, 70),
        L('vehicules.compteur.un', 'Un véhicule', '{n} véhicule', undefined, 40),
        L('vehicules.compteur.plusieurs', 'Plusieurs véhicules', '{n} véhicules', undefined, 40),
        L('vehicules.compteur.un_marque', 'Un véhicule (marque choisie)', '{n} véhicule {marque}', undefined, 50),
        L('vehicules.compteur.plusieurs_marque', 'Plusieurs véhicules (marque choisie)', '{n} véhicules {marque}', undefined, 50),
        L('vehicules.compteur.disponible', 'Statut « disponible » (un)', 'disponible', undefined, 30),
        L('vehicules.compteur.disponibles', 'Statut « disponibles » (plusieurs)', 'disponibles', undefined, 30),
        L('vehicules.compteur.reserve', 'Statut « réservé » (un)', 'réservé', undefined, 30),
        L('vehicules.compteur.reserves', 'Statut « réservés » (plusieurs)', 'réservés', undefined, 30),
        L('vehicules.compteur.vendu', 'Statut « vendu » (un)', 'vendu', undefined, 30),
        L('vehicules.compteur.vendus', 'Statut « vendus » (plusieurs)', 'vendus', undefined, 30),
      ],
    },
    {
      titre: 'Recherche et filtres',
      textes: [
        L('vehicules.recherche.placeholder', 'Barre de recherche : exemple dans le champ', 'Rechercher une marque ou un modèle...', undefined, 70),
        L('vehicules.filtres.titre', 'Bouton d’ouverture des filtres', 'Filtres avancés', undefined, 40),
        L('vehicules.filtres.marque', 'Filtre “Marque” : intitulé', 'Marque', undefined, 30),
        L('vehicules.filtres.marque_toutes', 'Filtre “Marque” : choix par défaut', 'Toutes les marques', undefined, 40),
        L('vehicules.filtres.statut', 'Filtre “Disponibilité” : intitulé', 'Disponibilité', undefined, 30),
        L('vehicules.filtres.statut_tous', 'Filtre “Disponibilité” : choix par défaut', 'Tous les statuts', undefined, 40),
        L('vehicules.filtres.statut.disponible', 'Filtre “Disponibilité” : choix « Disponible »', 'Disponible', 'Aussi affiché dans les filtres actifs.', 30),
        L('vehicules.filtres.statut.reserve', 'Filtre “Disponibilité” : choix « Réservé »', 'Réservé', 'Aussi affiché dans les filtres actifs.', 30),
        L('vehicules.filtres.statut.vendu', 'Filtre “Disponibilité” : choix « Vendu »', 'Vendu', 'Aussi affiché dans les filtres actifs.', 30),
        L('vehicules.filtres.type', 'Filtre “Type” : intitulé', 'Type', undefined, 30),
        L('vehicules.filtres.type_tous', 'Filtre “Type” : choix par défaut', 'Tous les types', undefined, 40),
        L('vehicules.filtres.type.moto', 'Filtre “Type” : choix « Moto »', 'Moto', 'Aussi affiché dans les filtres actifs.', 30),
        L('vehicules.filtres.type.scooter', 'Filtre “Type” : choix « Scooter »', 'Scooter', 'Aussi affiché dans les filtres actifs.', 30),
        L('vehicules.filtres.cylindree', 'Filtre “Cylindrée min” : intitulé', 'Cylindrée min', undefined, 30),
        L('vehicules.filtres.cylindree_aucune', 'Filtre “Cylindrée min” : choix par défaut', 'Aucune', undefined, 30),
        L('vehicules.filtres.cylindree_option', 'Filtre “Cylindrée min” : choix', '{n} cc', '{n} est remplacé par la cylindrée (125, 300…).', 30),
        L('vehicules.filtres.annee', 'Filtre “Année min” : intitulé', 'Année min', undefined, 30),
        L('vehicules.filtres.annee_toutes', 'Filtre “Année min” : choix par défaut', 'Toutes', undefined, 30),
        L('vehicules.filtres.prix', 'Filtre “Prix max” : intitulé', 'Prix max', undefined, 30),
        L('vehicules.filtres.prix_aucun', 'Filtre “Prix max” : choix par défaut', 'Aucun', undefined, 30),
        L('vehicules.filtres.prix_option', 'Filtre “Prix max” : choix', '{prix} €', '{prix} est remplacé par le montant (3 000, 5 000…).', 30),
      ],
    },
    {
      titre: 'Filtres actifs',
      aide: '{n} et {prix} sont remplacés par la valeur choisie.',
      textes: [
        L('vehicules.filtres_actifs.titre', 'Titre', 'Filtres actifs :', undefined, 40),
        L('vehicules.filtres_actifs.cylindree_min', 'Cylindrée minimum', '≥ {n} cc', undefined, 30),
        L('vehicules.filtres_actifs.cylindree_max', 'Cylindrée maximum', '≤ {n} cc', undefined, 30),
        L('vehicules.filtres_actifs.annee_min', 'Année minimum', '≥ {n}', undefined, 30),
        L('vehicules.filtres_actifs.prix_max', 'Prix maximum', '≤ {prix} €', undefined, 30),
        L('vehicules.filtres_actifs.effacer', 'Lien pour tout effacer', 'Tout effacer', undefined, 30),
      ],
    },
    {
      titre: 'Liste des véhicules',
      textes: [
        L('vehicules.liste.chargement', 'Pendant le chargement', 'Chargement des véhicules...', undefined, 60),
        P('vehicules.liste.marque_sans_stock', 'Marque choisie sans moto disponible : texte', 'Aucune moto disponible actuellement pour cette marque.', 'Affiché sous le nom de la marque.', 200),
        L('vehicules.liste.marque_sans_stock_bouton', 'Marque choisie sans moto disponible : bouton', 'Voir toutes les motos', undefined, 40),
        L('vehicules.liste.deja_vendues', 'Marque choisie sans moto disponible : titre des autres motos', 'Déjà réservées ou vendues', undefined, 50),
        P('vehicules.liste.aucun_resultat', 'Aucun résultat', 'Aucun véhicule ne correspond à vos critères. Essayez de modifier les filtres.', undefined, 200),
      ],
    },
    {
      titre: 'Carte d’un véhicule',
      aide: 'Cartes du catalogue, aussi utilisées dans « Derniers arrivages » sur l’accueil.',
      textes: [
        L('vehicules.carte.statut.disponible', 'Badge « Disponible »', 'Disponible', undefined, 30),
        L('vehicules.carte.statut.reserve', 'Badge « Réservé »', 'Réservé', undefined, 30),
        L('vehicules.carte.statut.vendu', 'Badge « Vendu »', 'Vendu', undefined, 30),
        L('vehicules.carte.cylindree', 'Cylindrée', '{n} cc', '{n} est remplacé par la cylindrée du véhicule.', 30),
        L('vehicules.carte.bouton', 'Bouton', 'Voir le véhicule', undefined, 30),
      ],
    },
  ],
},
  {
  cle: 'fiche', libelle: 'Fiche véhicule', description: 'Page de chaque véhicule.', chemin: '/vehicules/:premier',
  sections: [
    {
      titre: 'Chargement et véhicule introuvable',
      textes: [
        L('fiche.chargement', 'Pendant le chargement', 'Chargement...', undefined, 40),
        L('fiche.introuvable.titre', 'Véhicule introuvable : titre', 'Véhicule non trouvé', undefined, 50),
        L('fiche.introuvable.bouton', 'Véhicule introuvable : bouton', 'Retour aux véhicules', undefined, 40),
      ],
    },
    {
      titre: 'Retour aux véhicules',
      textes: [
        L('fiche.retour', 'Lien de retour', 'Retour aux véhicules', undefined, 40),
      ],
    },
    {
      titre: 'Caractéristiques',
      aide: 'Les valeurs (année, cylindrée, kilométrage, type) viennent de la fiche du véhicule.',
      textes: [
        L('fiche.carac.annee', 'Année', 'Année', undefined, 30),
        L('fiche.carac.cylindree', 'Cylindrée', 'Cylindrée', undefined, 30),
        L('fiche.carac.cylindree_valeur', 'Cylindrée : valeur', '{n} cc', '{n} est remplacé par la cylindrée du véhicule.', 30),
        L('fiche.carac.kilometrage', 'Kilométrage', 'Kilométrage', undefined, 30),
        L('fiche.carac.type', 'Type', 'Type', undefined, 30),
      ],
    },
    {
      titre: 'Description, équipements et garantie',
      textes: [
        L('fiche.description.titre', 'Titre de la description', 'Description', undefined, 40),
        L('fiche.equipements.titre', 'Titre des équipements', 'Équipements', undefined, 40),
        L('fiche.garantie.titre', 'Titre de la garantie', 'Garantie', undefined, 40),
      ],
    },
    {
      titre: 'Boutons',
      textes: [
        L('fiche.bouton.informations', 'Bouton principal', 'Demander des informations', undefined, 50),
        L('fiche.bouton.financement', 'Bouton secondaire', 'Demander un financement', undefined, 50),
      ],
    },
  ],
},
];
