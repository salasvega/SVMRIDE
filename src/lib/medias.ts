/**
 * Fond de la page d'accueil choisi dans l'admin (Infos du site). Il arrive
 * déjà dans la page (bloc JSON de la fonction « seo ») : affiché dès le premier
 * rendu ; relu une fois par visite et remplacé tout de suite après un
 * enregistrement dans l'admin.
 */
import { useSyncExternalStore } from 'react';
import { supabase } from './supabase';
import { reglagesInjectes } from './textes';
import { CLE_FOND_ACCUEIL, normaliserFondAccueil, type FondAccueil } from '../config/medias';

const MEMOIRE = 'svm-fond-accueil';

function initial(): FondAccueil | null {
  const injectes = reglagesInjectes() as { fond_accueil?: unknown } | null;
  if (injectes && 'fond_accueil' in injectes) return normaliserFondAccueil(injectes.fond_accueil);
  try {
    const brut = localStorage.getItem(MEMOIRE);
    if (brut) return normaliserFondAccueil(JSON.parse(brut));
  } catch {
    // image d'origine
  }
  return null;
}

let courant: FondAccueil | null = initial();
let lu = false;
const abonnes = new Set<() => void>();

function publier(f: FondAccueil | null) {
  courant = f;
  try {
    localStorage.setItem(MEMOIRE, JSON.stringify(f));
  } catch {
    // sans importance
  }
  abonnes.forEach((x) => x());
}

async function charger() {
  if (lu || !supabase) return;
  lu = true;
  const { data, error } = await supabase.from('site_reglages').select('valeur').eq('cle', CLE_FOND_ACCUEIL).maybeSingle();
  if (error) {
    lu = false;
    return;
  }
  const f = normaliserFondAccueil(data?.valeur);
  if (JSON.stringify(f) !== JSON.stringify(courant)) publier(f);
}

export function appliquerFondAccueil(f: FondAccueil | null) {
  lu = true;
  publier(f);
}

const sAbonner = (f: () => void) => {
  abonnes.add(f);
  charger();
  return () => abonnes.delete(f);
};
const lire = () => courant;

export function useFondAccueil(): FondAccueil | null {
  return useSyncExternalStore(sAbonner, lire, lire);
}
