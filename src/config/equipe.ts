/**
 * Équipe SVM Ride : section d'accueil « Des passionnés à votre service », page
 * /equipe et carte du responsable sur la page Contact.
 *
 * LES FICHES SE GÈRENT DANS L'ADMIN (onglet « Équipe », depuis le 17/10/2026) :
 * ajout, modification, ordre, photo, affichage, suppression. Elles sont lues dans
 * la table Supabase `equipe_membres` (voir src/lib/equipe.ts).
 *
 * MEMBRES ci-dessous ne sert plus que de secours, si la base ne répond pas
 * (c'est l'équipe publiée le 16/10/2026, reprise telle quelle dans la base).
 *
 * EQUIPE_EN_LIGNE = false masquerait la section, la page et le lien du pied de
 * page sur svmride.com (la page renverrait une 404).
 */

/** Change à false pour masquer l'équipe sur svmride.com. */
export const EQUIPE_EN_LIGNE = true; // publié le 16/10/2026

export interface PhotoMembre {
  /** Fichier principal (WebP en général, JPEG possible), ex. /equipe/ines.webp */
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
  /** Présentation plus longue (paragraphes), utilisée pour le responsable */
  presentation?: string[];
  ordre: number;
  /** Mis en avant (Mattia) */
  responsable?: boolean;
}

/** Secours si la base ne répond pas */
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

/** Nom affiché : « Prénom » ou « Prénom Nom » */
export const nomAffiche = (m: Pick<Membre, 'prenom' | 'nom'>) => `${m.prenom}${m.nom ? ` ${m.nom}` : ''}`;
