/**
 * Thème publié depuis le Studio Design (réglage « theme »), lu par la fonction
 * Netlify « seo » qui l'injecte dans chaque page. Gardé 60 s en mémoire.
 * En cas d'erreur ou de configuration invalide : rien n'est injecté et le site
 * garde SVM Signature (variables de src/index.css).
 */
import { cssDuTheme, couleursDuTheme, themeValide } from '../../src/config/design.ts';
import { SUPABASE_KEY, SUPABASE_URL } from '../generated/supabase-config.ts';

export interface ThemePublie {
  version: number;
  css: string;
  /** Couleur de la barre du navigateur sur mobile */
  primaire: string;
}

let memoire: { valeur: ThemePublie | null; lu: number } | null = null;

export async function themePublie(): Promise<ThemePublie | null> {
  if (memoire && Date.now() - memoire.lu < 60_000) return memoire.valeur;
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Supabase non configuré');
    const r = await fetch(`${SUPABASE_URL}/rest/v1/site_reglages?select=valeur&cle=eq.theme&limit=1`, {
      headers: { apikey: SUPABASE_KEY, accept: 'application/json' },
      signal: AbortSignal.timeout(2000),
    });
    if (!r.ok) throw new Error(`Supabase ${r.status}`);
    const rows = (await r.json()) as { valeur?: { version?: unknown; config?: unknown } }[];
    const v = rows[0]?.valeur;
    let valeur: ThemePublie | null = null;
    if (v && themeValide(v.config)) {
      valeur = { version: Number(v.version) || 0, css: cssDuTheme(v.config), primaire: couleursDuTheme(v.config).primaire };
    } else if (v) {
      console.error('thème : configuration invalide, SVM Signature conservé');
    }
    memoire = { valeur, lu: Date.now() };
    return valeur;
  } catch (e) {
    console.error('thème : SVM Signature conservé', e);
    return memoire?.valeur ?? null;
  }
}

/** Ajoute le thème dans le <head> et accorde la barre du navigateur mobile */
export function injecterTheme(html: string, theme: ThemePublie | null): string {
  if (!theme) return html;
  return html
    .replace(/<meta name="theme-color" content="#[0-9A-Fa-f]{6}" \/>/, `<meta name="theme-color" content="${theme.primaire}" />`)
    .replace('</head>', `  <style id="theme-svm" data-version="${theme.version}">${theme.css}</style>\n  </head>`);
}
