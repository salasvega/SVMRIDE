/**
 * Textes du site dans le navigateur.
 *
 * Les textes modifiés arrivent déjà dans la page (bloc JSON posé par la
 * fonction Netlify « seo ») : ils s'affichent dès le premier rendu, sans
 * clignotement. Ils sont relus une fois par visite, gardés dans le navigateur,
 * remplacés tout de suite après un enregistrement dans l'admin, et l'aperçu de
 * l'admin peut en proposer d'autres sans rien enregistrer.
 */
import { useSyncExternalStore } from 'react';
import { supabase } from './supabase';
import { CLE_TEXTES, normaliserTextes, texte, type Textes } from '../config/textes';
import { marquer } from './edition';

const MEMOIRE = 'svm-textes';

/** Réglages posés dans la page par la fonction « seo » (textes, identité) */
export function reglagesInjectes(): { textes?: unknown; identite?: unknown } | null {
  if (typeof document === 'undefined') return null;
  try {
    const el = document.getElementById('reglages-svm');
    return el?.textContent ? JSON.parse(el.textContent) : null;
  } catch {
    return null;
  }
}

function initiaux(): Textes {
  const injectes = reglagesInjectes();
  if (injectes && 'textes' in injectes) return normaliserTextes(injectes.textes);
  try {
    const brut = localStorage.getItem(MEMOIRE);
    if (brut) return normaliserTextes(JSON.parse(brut));
  } catch {
    // sans stockage : textes d'origine
  }
  return {};
}

let courants: Textes = initiaux();
let apercu: Textes | null = null;
/** Aperçu de l'admin : textes entourés de repères invisibles (édition sur la page) */
let marquage = false;
let lus = false;
const abonnes = new Set<() => void>();
const prevenir = () => abonnes.forEach((f) => f());

function publier(t: Textes) {
  courants = t;
  try {
    localStorage.setItem(MEMOIRE, JSON.stringify(t));
  } catch {
    // sans importance
  }
  prevenir();
}

async function charger() {
  if (lus || !supabase) return;
  lus = true;
  const { data, error } = await supabase.from('site_reglages').select('valeur').eq('cle', CLE_TEXTES).maybeSingle();
  if (error) {
    lus = false;
    return;
  }
  const t = normaliserTextes(data?.valeur);
  if (JSON.stringify(t) !== JSON.stringify(courants)) publier(t);
}

/** Après un enregistrement dans l'admin */
export function appliquerTextes(t: Textes) {
  lus = true;
  publier(normaliserTextes(t));
}

/** Aperçu de l'admin (null : fin de l'aperçu) */
export function apercuTextes(t: Textes | null) {
  apercu = t ? normaliserTextes(t) : null;
  prevenir();
}

/** Édition sur la page (aperçu de l'admin seulement) */
export function marquerTextes(actif: boolean) {
  if (marquage === actif) return;
  marquage = actif;
  apercu = { ...(apercu ?? courants) }; // nouvel objet : tout le site se redessine
  prevenir();
}

const lire = () => apercu ?? courants;
const sAbonner = (f: () => void) => {
  abonnes.add(f);
  charger();
  return () => abonnes.delete(f);
};

/** Textes en cours (modifiés ou d'origine) */
export function useTextes(): Textes {
  return useSyncExternalStore(sAbonner, lire, lire);
}

/** Fonction t(cle, variables?) : le texte à afficher */
export type FonctionTexte = (cle: string, variables?: Record<string, string | number>) => string;
export function useTexte(): FonctionTexte {
  const t = useTextes();
  return marquage ? (cle, variables) => marquer(cle, texte(t, cle, variables)) : (cle, variables) => texte(t, cle, variables);
}
