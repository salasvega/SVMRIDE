/**
 * Équipe SVM Ride : section d'accueil « Des passionnés à votre service » et page /equipe.
 *
 * PUBLICATION
 * - EQUIPE_EN_LIGNE = false : section et page visibles uniquement en aperçu
 *   (développement, aperçus Netlify), jamais sur svmride.com (la page y renvoie une 404).
 * - Passer à true une fois les vraies photos et les textes validés par Mattia,
 *   et après l'accord écrit de chaque personne pour publier sa photo et son prénom.
 * - Les fiches `exemple: true` (contenu fictif) ne s'affichent JAMAIS en production,
 *   même si EQUIPE_EN_LIGNE vaut true : il faut les remplacer par les vraies personnes.
 *
 * AJOUTER / MODIFIER / RETIRER UNE PERSONNE
 * - Une entrée par personne ci-dessous ; `ordre` fixe la position (le responsable
 *   est toujours mis en avant à part). Supprimer l'entrée retire la fiche partout.
 * - Photo : portrait carré d'au moins 600 px, déposé dans public/equipe/ en WebP
 *   (et AVIF si possible) ; sans photo, des initiales s'affichent à la place.
 *   Les portraits d'Inès, Thomas et Hugo (16/10) sont des images d'illustration
 *   fournies pour les tests, recadrées en 480 px : à remplacer par les vraies photos.
 */

/** Change à true pour publier sur svmride.com. */
export const EQUIPE_EN_LIGNE = false;

export interface PhotoMembre {
  /** Chemin du fichier WebP (obligatoire), ex. /equipe/ines.webp */
  webp: string;
  /** Version AVIF, plus légère (facultative) */
  avif?: string;
  /** Version JPEG de secours pour les très vieux navigateurs (facultative) */
  jpg?: string;
}

export interface Membre {
  id: string;
  prenom: string;
  nom?: string;
  fonction: string;
  photo?: PhotoMembre;
  /** Phrase personnelle (facultative), affichée entre guillemets */
  citation?: string;
  /** Présentation plus longue, utilisée pour le responsable */
  presentation?: string[];
  ordre: number;
  /** Mis en avant (Mattia) */
  responsable?: boolean;
  /** Personne fictive pour les tests : jamais affichée en production */
  exemple?: boolean;
  /** Personne réelle mais textes en attente de validation */
  textesProvisoires?: boolean;
}

export const MEMBRES: Membre[] = [
  {
    id: 'mattia',
    prenom: 'Mattia',
    fonction: 'Responsable commercial',
    photo: { webp: '/equipe-mattia.webp', avif: '/equipe/mattia.avif', jpg: '/equipe/mattia.jpg' },
    presentation: [
      "Chez SVM Ride, chaque moto est choisie, contrôlée et présentée comme si elle devait rejoindre mon propre garage.",
      "Mon rôle est de vous conseiller franchement, sans pression : vous expliquer l'histoire de la moto, son entretien, ses points forts, et trouver avec vous la solution de financement ou de reprise qui vous convient. Et je reste disponible après la vente.",
    ],
    citation: "Une bonne affaire, c'est une moto dont on est encore content un an après.",
    ordre: 0,
    responsable: true,
    textesProvisoires: true,
  },
  {
    id: 'ines',
    prenom: 'Inès',
    fonction: 'Conseillère vente et financement',
    photo: { webp: '/equipe/ines.webp', avif: '/equipe/ines.avif', jpg: '/equipe/ines.jpg' },
    citation: "Trouver la moto qui colle à votre budget, c'est mon puzzle préféré.",
    ordre: 1,
    exemple: true,
  },
  {
    id: 'thomas',
    prenom: 'Thomas',
    fonction: 'Technicien atelier',
    photo: { webp: '/equipe/thomas.webp', avif: '/equipe/thomas.avif', jpg: '/equipe/thomas.jpg' },
    citation: "Une moto bien préparée, c'est une moto qu'on oublie pour ne penser qu'à la route.",
    ordre: 2,
    exemple: true,
  },
  {
    id: 'hugo',
    prenom: 'Hugo',
    fonction: 'Expert reprises et dépôt-vente',
    photo: { webp: '/equipe/hugo.webp', avif: '/equipe/hugo.avif', jpg: '/equipe/hugo.jpg' },
    citation: "J'estime chaque moto avec honnêteté, comme si c'était la mienne.",
    ordre: 3,
    exemple: true,
  },
];

/** Contexte de build Netlify : 'production', 'deploy-preview', 'branch-deploy' ou 'local'. */
export function equipeAffichee(contexte: string): boolean {
  return EQUIPE_EN_LIGNE || contexte !== 'production';
}

/** Membres à afficher dans ce contexte (jamais de fiche fictive en production). */
export function membresAffiches(contexte: string): Membre[] {
  if (!equipeAffichee(contexte)) return [];
  return MEMBRES.filter((m) => contexte !== 'production' || !m.exemple).sort((a, b) => a.ordre - b.ordre);
}

/** Vrai si l'aperçu contient des fiches fictives ou des textes provisoires. */
export function contenuProvisoire(membres: Membre[]): boolean {
  return membres.some((m) => m.exemple || m.textesProvisoires);
}
