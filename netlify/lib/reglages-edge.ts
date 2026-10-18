/**
 * Textes du site et fond de l'accueil (admin : Textes du site, Infos du site),
 * lus par la fonction Netlify « seo » : titres Google et nom du site, et bloc
 * JSON posé dans la page pour un premier affichage sans clignotement.
 * Gardés 60 s en mémoire ; en cas d'erreur : textes et image d'origine.
 */
import { normaliserTextes, type Textes } from '../../src/config/textes.ts';
import { FOND_ACCUEIL_ORIGINE, normaliserFondAccueil, type FondAccueil } from '../../src/config/medias.ts';
import { SUPABASE_KEY, SUPABASE_URL } from '../generated/supabase-config.ts';

export interface ReglagesPage {
  textes: Textes;
  fond_accueil: FondAccueil | null;
}

const VIDE: ReglagesPage = { textes: {}, fond_accueil: null };
let memoire: { valeur: ReglagesPage; lu: number } | null = null;

export async function reglagesPage(): Promise<ReglagesPage> {
  if (memoire && Date.now() - memoire.lu < 60_000) return memoire.valeur;
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Supabase non configuré');
    const r = await fetch(`${SUPABASE_URL}/rest/v1/site_reglages?select=cle,valeur&cle=in.(textes,fond_accueil)`, {
      headers: { apikey: SUPABASE_KEY, accept: 'application/json' },
      signal: AbortSignal.timeout(2000),
    });
    if (!r.ok) throw new Error(`Supabase ${r.status}`);
    const rows = (await r.json()) as { cle: string; valeur: unknown }[];
    const v = (cle: string) => rows.find((x) => x.cle === cle)?.valeur;
    memoire = { valeur: { textes: normaliserTextes(v('textes')), fond_accueil: normaliserFondAccueil(v('fond_accueil')) }, lu: Date.now() };
    return memoire.valeur;
  } catch (e) {
    console.error('réglages de la page : valeurs d\'origine', e);
    return memoire?.valeur ?? VIDE;
  }
}

/** Bloc JSON lu par le site au démarrage (src/lib/textes.ts, src/lib/medias.ts) */
export function injecterReglages(html: string, r: ReglagesPage): string {
  const json = JSON.stringify(r).replace(/</g, '\\u003c');
  let page = html;
  // Image d'accueil choisie dans l'admin : préchargée à la place de celle d'origine
  const fond = r.fond_accueil;
  if (fond) {
    const attr = (u: string) => u.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    page = page
      .replace(`href="${FOND_ACCUEIL_ORIGINE.mobile}"`, () => `href="${attr(fond.mobile)}"`)
      .replace(`href="${FOND_ACCUEIL_ORIGINE.ordinateur}"`, () => `href="${attr(fond.ordinateur)}"`);
  }
  return page.replace('</head>', `  <script id="reglages-svm" type="application/json">${json}</script>\n  </head>`);
}
