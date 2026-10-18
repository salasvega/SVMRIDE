/**
 * Images du site réglées dans l'admin (Édition du site) — module pur, aussi
 * utilisé par la fonction Netlify « seo » :
 *  - fond de la page d'accueil (réglage « fond_accueil ») : une image pour
 *    ordinateur (format large) et une pour téléphone et tablette ;
 *  - tampon / signature du garage et logo des contrats (réglage « documents »),
 *    lus par les fonctions qui produisent les contrats et certificats.
 * Images rangées dans le bucket public « site-images », par version.
 * Absent ou null : images d'origine du dossier public/.
 */

export const CLE_FOND_ACCUEIL = 'fond_accueil';
export const CLE_DOCUMENTS = 'documents';

/** Adresse acceptée : fichier du site ou adresse https (pas de guillemets ni espaces) */
const URL_OK = /^(\/|https:\/\/)[^\s"'<>()\\]+$/;
const url = (v: unknown): string | null => (typeof v === 'string' && URL_OK.test(v) ? v : null);
const version = (v: unknown) => (typeof v === 'string' ? v.slice(0, 40) : '');

export interface FondAccueil {
  version: string;
  /** Format large (3,16:1, 2400 × 760 px) */
  ordinateur: string;
  /** Téléphone et tablette (1,6:1, 1600 × 1000 px), centré */
  mobile: string;
}

export const FOND_ACCUEIL_ORIGINE = {
  ordinateur: '/accueil-showroom-logo.webp',
  mobile: '/accueil-showroom.webp',
};

/** Formats produits par le recadrage de l'admin */
export const FORMATS_FOND = {
  ordinateur: { largeur: 2400, hauteur: 760 },
  mobile: { largeur: 1600, hauteur: 1000 },
};

export function normaliserFondAccueil(v: unknown): FondAccueil | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const ordinateur = url(o.ordinateur), mobile = url(o.mobile);
  return ordinateur && mobile ? { version: version(o.version), ordinateur, mobile } : null;
}

export interface Documents {
  version: string;
  /** Tampon / signature du garage (PNG transparent) */
  tampon: string | null;
  /** Logo en tête des contrats (PNG) */
  logo: string | null;
}

export const DOCUMENTS_ORIGINE = {
  tampon: '/contrat/tampon-svm-ride.png',
  logo: '/logo-contrat.jpg',
};

export const FORMAT_TAMPON = { largeur: 900, hauteur: 600 };
export const FORMAT_LOGO_DOCUMENTS = { largeur: 480, hauteur: 480 };

export function normaliserDocuments(v: unknown): Documents {
  const o = v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
  return { version: version(o.version), tampon: url(o.tampon), logo: url(o.logo) };
}
