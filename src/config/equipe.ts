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
 *   Portraits d'Amanda, Pedro et Valentin fournis le 16/10, recadrés en 480 px.
 */

/** Change à true pour publier sur svmride.com. */
export const EQUIPE_EN_LIGNE = true; // publié le 16/10/2026 (textes validés)

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
  },
  {
    id: 'amanda',
    prenom: 'Amanda',
    fonction: 'Conseillère en financement',
    photo: { webp: '/equipe/amanda.webp', avif: '/equipe/amanda.avif', jpg: '/equipe/amanda.jpg' },
    citation: "Trouver le financement qui colle à votre budget, c'est mon puzzle préféré.",
    ordre: 1,
  },
  {
    id: 'pedro',
    prenom: 'Pedro',
    fonction: 'Technicien atelier',
    photo: { webp: '/equipe/pedro.webp', avif: '/equipe/pedro.avif', jpg: '/equipe/pedro.jpg' },
    citation: "Une moto bien préparée, c'est une moto qu'on oublie pour ne penser qu'à la route.",
    ordre: 2,
  },
  {
    id: 'valentin',
    prenom: 'Valentin',
    fonction: 'Expert reprises et dépôt-vente',
    photo: { webp: '/equipe/valentin.webp', avif: '/equipe/valentin.avif', jpg: '/equipe/valentin.jpg' },
    citation: "J'estime chaque moto avec honnêteté, comme si c'était la mienne.",
    ordre: 3,
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
