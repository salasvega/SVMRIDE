/**
 * Format commun des avis, indépendant de la source (Google aujourd'hui,
 * autre chose demain). Le composant d'affichage ne connaît que ce format.
 * Le même format est produit par la synchronisation Netlify
 * (netlify/lib/avis-google.ts) : garder les deux fichiers alignés.
 */
export interface Avis {
  /** Identifiant stable fourni par la source (évite les doublons) */
  id: string;
  /** Nom public tel que fourni par la source */
  auteur: string;
  /** 1 à 5 */
  note: number;
  /** Commentaire (absent quand le client n'a laissé qu'une note) */
  texte?: string;
  /** Date de publication (ISO 8601) */
  publieLe: string;
  /** Date de dernière modification (ISO 8601) */
  modifieLe?: string;
  /** Date affichée telle quelle quand la date exacte est inconnue (sélection manuelle) */
  dateLibelle?: string;
}

export interface ResumeAvis {
  /** google : synchronisé ; selection : avis réels recopiés à la main ; demo : fictifs (aperçu) */
  source: 'google' | 'selection' | 'demo';
  /** Note moyenne de l'établissement (sur 5) — absente pour une sélection manuelle */
  noteMoyenne?: number;
  /** Nombre total d'avis de l'établissement — absent pour une sélection manuelle */
  nombreAvis?: number;
  /** Avis à afficher, du plus récent au plus ancien */
  avis: Avis[];
  /** Date de la dernière synchronisation réussie (ISO 8601) */
  synchroniseLe: string;
}
