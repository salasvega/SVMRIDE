/**
 * Logo et icône du site (admin, « Infos du site », bloc « Logo et icône »).
 *
 * Une image carrée envoyée dans l'admin est déclinée dans le navigateur en
 * plusieurs tailles (bucket public « site-images ») : logo de la barre du haut
 * et du pied de page, icône d'onglet, icône iPhone et Android, logo pour Google.
 * Elles sont enregistrées dans le réglage « identite » de site_reglages.
 * Sans icône personnalisée (icone: null), ce sont les fichiers d'origine du
 * dossier public/ qui servent.
 *
 * Ce fichier ne dépend de rien d'autre : il est aussi utilisé par la fonction
 * Netlify « seo » (balises d'icônes de chaque page, manifeste).
 */

export interface Icone {
  /** Horodatage de la version (dossier icone/<version>/ du bucket) */
  version: string;
  /** Logo de la barre du haut et du pied de page (176 px) */
  logo: string;
  favicon_32: string;
  favicon_48: string;
  /** Icône iPhone (fond plein) */
  apple_180: string;
  icon_192: string;
  icon_512: string;
  /** Icône Android « adaptative » (marge de sécurité, fond plein) */
  maskable_512: string;
}

export interface Identite {
  icone: Icone | null;
}

export const CLE_IDENTITE = 'identite';
export const IDENTITE_DEFAUT: Identite = { icone: null };

/** Fichiers d'origine (dossier public/) */
export const ICONES_ORIGINE: Omit<Icone, 'version'> = {
  logo: '/logo-header.webp',
  favicon_32: '/favicon-32x32.png',
  favicon_48: '/favicon.ico',
  apple_180: '/apple-touch-icon.png',
  icon_192: '/icon-192.png',
  icon_512: '/icon-512.png',
  maskable_512: '/icon-maskable-512.png',
};

const CHAMPS: (keyof Omit<Icone, 'version'>)[] = ['logo', 'favicon_32', 'favicon_48', 'apple_180', 'icon_192', 'icon_512', 'maskable_512'];
const URL_OK = /^https:\/\/[^\s"'<>]+$/;

export function normaliserIdentite(v: unknown): Identite {
  if (!v || typeof v !== 'object') return IDENTITE_DEFAUT;
  const i = (v as { icone?: unknown }).icone;
  if (!i || typeof i !== 'object') return IDENTITE_DEFAUT;
  const o = i as Record<string, unknown>;
  if (!CHAMPS.every((k) => typeof o[k] === 'string' && URL_OK.test(o[k] as string))) return IDENTITE_DEFAUT;
  return {
    icone: {
      version: typeof o.version === 'string' ? o.version.slice(0, 40) : '',
      ...(Object.fromEntries(CHAMPS.map((k) => [k, o[k] as string])) as Omit<Icone, 'version'>),
    },
  };
}

/** Adresses à utiliser (personnalisées ou d'origine) */
export const icones = (id: Identite): Omit<Icone, 'version'> => id.icone ?? ICONES_ORIGINE;

/** Adresse du manifeste (servi par la fonction « seo » quand l'icône est personnalisée) */
export const URL_MANIFESTE = '/manifeste-site';

const attr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** Balises <link> des icônes pour le <head> de chaque page */
export function balisesIcones(id: Identite, nomPerso = false): string {
  const x = icones(id);
  const perso = !!id.icone;
  return [
    perso
      ? `<link rel="icon" type="image/png" sizes="48x48" href="${attr(x.favicon_48)}" />`
      : `<link rel="icon" href="${attr(x.favicon_48)}" sizes="48x48" />`,
    `<link rel="icon" type="image/png" sizes="32x32" href="${attr(x.favicon_32)}" />`,
    `<link rel="apple-touch-icon" href="${attr(x.apple_180)}" />`,
    `<link rel="manifest" href="${perso || nomPerso ? URL_MANIFESTE : '/site.webmanifest'}" />`,
  ].join('\n    ');
}

/** Manifeste de l'application (écran d'accueil Android) avec les icônes en cours */
export function manifeste(id: Identite, nom = 'SVM Ride') {
  const x = icones(id);
  return {
    name: `${nom} – Motos et scooters d'occasion`,
    short_name: nom,
    description: "Motos et scooters d'occasion contrôlés et garantis à Chaville (92), Île-de-France.",
    lang: 'fr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#F6F5F2',
    theme_color: '#0E0E10',
    icons: [
      { src: x.icon_192, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: x.icon_512, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: x.maskable_512, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
