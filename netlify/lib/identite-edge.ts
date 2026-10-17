/**
 * Logo et icône choisis dans l'admin (réglage « identite »), lus par les
 * fonctions Netlify « seo » et « favicon ». Gardés 60 s en mémoire ; en cas
 * d'erreur, ce sont les icônes d'origine (on n'affiche jamais une page cassée).
 */
import { IDENTITE_DEFAUT, normaliserIdentite, type Identite } from '../../src/config/identite.ts';
import { SUPABASE_KEY, SUPABASE_URL } from '../generated/supabase-config.ts';

let memoire: { valeur: Identite; lu: number } | null = null;

export async function identite(): Promise<Identite> {
  if (memoire && Date.now() - memoire.lu < 60_000) return memoire.valeur;
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Supabase non configuré');
    const r = await fetch(`${SUPABASE_URL}/rest/v1/site_reglages?select=valeur&cle=eq.identite&limit=1`, {
      headers: { apikey: SUPABASE_KEY, accept: 'application/json' },
      signal: AbortSignal.timeout(2000),
    });
    if (!r.ok) throw new Error(`Supabase ${r.status}`);
    const rows = (await r.json()) as { valeur: unknown }[];
    memoire = { valeur: normaliserIdentite(rows[0]?.valeur), lu: Date.now() };
    return memoire.valeur;
  } catch (e) {
    console.error('identité : icônes d\'origine', e);
    return memoire?.valeur ?? IDENTITE_DEFAUT;
  }
}
