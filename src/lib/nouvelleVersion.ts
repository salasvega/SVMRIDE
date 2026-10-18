/**
 * Après une mise en ligne, un onglet resté ouvert garde l'ancienne version du
 * site : ses pages chargées à la demande (admin, Équipe, Suivre ma vente…) ont
 * changé de nom et ne se chargent plus. On recharge alors la page une fois,
 * pour prendre la nouvelle version, au lieu d'afficher une page cassée.
 */
const CLE = 'svm-rechargement';

/** Recharge la page, sauf si on vient déjà de le faire (pas de boucle). Renvoie true si la page se recharge. */
export function rechargerPourNouvelleVersion(): boolean {
  try {
    const dernier = Number(sessionStorage.getItem(CLE) ?? 0);
    if (Date.now() - dernier < 15_000) return false;
    sessionStorage.setItem(CLE, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

/** Import à la demande qui recharge la page si le fichier n'existe plus */
export function importer<T>(charger: () => Promise<T>): () => Promise<T> {
  return () => charger().catch((erreur) => {
    if (rechargerPourNouvelleVersion()) return new Promise<T>(() => {});
    throw erreur;
  });
}

/** Préchargements de Vite qui échouent (même cause) */
export function surveillerNouvelleVersion() {
  window.addEventListener('vite:preloadError', (e) => {
    if (rechargerPourNouvelleVersion()) e.preventDefault();
  });
}
