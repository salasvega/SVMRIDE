/**
 * Avis Google — réglages de la section d'accueil « Votre confiance, notre plus belle récompense ».
 *
 * SUR SVMRIDE.COM (production)
 * - `actif: false` (aujourd'hui) : aucune note, aucun nombre d'avis, aucune carte.
 *   Si `placeId` est renseigné ET `liensVerifies: true`, seuls les deux boutons
 *   vers Google s'affichent ; sinon la section est entièrement masquée.
 * - `actif: true` : avis réels lus depuis la synchronisation Google
 *   (fonction Netlify /.netlify/functions/avis-google). Les données trop anciennes
 *   ou absentes sont masquées.
 * - Les avis de démonstration ne s'affichent JAMAIS en production.
 *
 * EN LOCAL ET DANS LES APERÇUS NETLIFY
 * - Tant que `actif` vaut false, des avis fictifs marqués « démo » remplissent la section.
 *
 * Mise en service : voir docs/avis-google.md.
 */
export const AVIS_GOOGLE = {
  /** Passer à true une fois la synchronisation Google opérationnelle (phase B). */
  actif: false,
  /**
   * Identifiant Google de la fiche SVM Ride (Place ID, commence souvent par « ChIJ »).
   * Sert à construire les deux liens ci-dessous.
   */
  placeId: '',
  /** Passer à true après avoir testé les deux liens sur ordinateur et sur mobile. */
  liensVerifies: false,
  /** Au-delà de ce délai sans synchronisation réussie, note et avis sont masqués. */
  joursAvantObsolescence: 7,
  /** Nombre maximal d'avis dans le carrousel. */
  maxAvis: 12,
};

/** Liens officiels Google construits à partir du Place ID (null si non configuré). */
export function liensGoogle(placeId = AVIS_GOOGLE.placeId) {
  if (!placeId) return null;
  const id = encodeURIComponent(placeId);
  return {
    voirTous: `https://search.google.com/local/reviews?placeid=${id}`,
    donnerAvis: `https://search.google.com/local/writereview?placeid=${id}`,
  };
}
