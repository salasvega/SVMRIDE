/**
 * Textes du site modifiables dans l'admin (page « Textes du site », et le nom
 * et l'accroche dans « Édition du site »). Module pur, partagé avec la fonction
 * Netlify « seo » (titres Google, nom du site).
 *
 * Chaque texte a une valeur d'origine (celle du site) ; seuls les textes
 * changés sont enregistrés (réglage « textes » de site_reglages, objet
 * clé → texte). « {nom} » est remplacé par le nom du site.
 */

export const CLE_TEXTES = 'textes';

export type { DefTexte, SectionTextes, PageTextes } from './textes-outils.ts';
import type { PageTextes, DefTexte } from './textes-outils.ts';
import { PAGES_ACCUEIL } from './textes-pages/accueil.ts';
import { PAGES_VEHICULES } from './textes-pages/vehicules.ts';
import { PAGES_REPRISES } from './textes-pages/reprises.ts';
import { PAGES_VENDRE } from './textes-pages/vendre.ts';
import { PAGES_FINANCEMENT } from './textes-pages/financement.ts';
import { PAGES_RECHERCHE } from './textes-pages/recherche.ts';
import { PAGES_CONTACT } from './textes-pages/contact.ts';
import { PAGES_EQUIPE } from './textes-pages/equipe.ts';
import { PAGES_SUIVRE } from './textes-pages/suivre.ts';
import { PAGES_COMMUN } from './textes-pages/commun.ts';
import { PAGES_SEO } from './textes-pages/seo.ts';
import { cleOrdre, ID_AJOUTE, LISTES, lireOrdre, NOMS_ICONES } from './textes-listes.ts';

/** Pages de l'admin « Textes du site », dans l'ordre du menu */
export const PAGES_TEXTES: PageTextes[] = [
  ...PAGES_ACCUEIL, ...PAGES_VEHICULES, ...PAGES_REPRISES, ...PAGES_VENDRE, ...PAGES_FINANCEMENT, ...PAGES_RECHERCHE,
  ...PAGES_CONTACT, ...PAGES_EQUIPE, ...PAGES_SUIVRE, ...PAGES_COMMUN, ...PAGES_SEO,
];

/** Tous les textes, par clé (un texte présent sur deux pages n'est compté qu'une fois) */
export const TEXTES: Record<string, DefTexte> = Object.fromEntries(
  PAGES_TEXTES.flatMap((p) => p.sections.flatMap((s) => s.textes)).map((t) => [t.cle, t]),
);

/** Pages du site dont le référencement peut être modifié (chemin → clé seo) */
export const SEO_PAGES: Record<string, string> = {
  '/': 'accueil', '/vehicules': 'vehicules', '/reprises': 'reprises', '/vendre-ma-moto': 'vendre',
  '/financement': 'financement', '/recherche-personnalisee': 'recherche', '/contact': 'contact', '/equipe': 'equipe',
};

export type Textes = Record<string, string>;

/** Caractères de contrôle retirés (sauf tabulation et retour à la ligne) */
const sansControle = (v: string) =>
  Array.from(v).filter((c) => { const n = c.charCodeAt(0); return n === 9 || n === 10 || (n >= 32 && n !== 127); }).join('');
const nettoyer = (v: string, max: number) => sansControle(v.replace(/\r\n?/g, '\n')).trim().slice(0, max);
const LIEN = /^(\/[^\s]*|https:\/\/[^\s]+)$/;

/** Garde les seuls textes connus, nettoyés et limités ; ignore les valeurs identiques à l'origine */
export function normaliserTextes(brut: unknown): Textes {
  const sortie: Textes = {};
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) return sortie;
  const entree = brut as Record<string, unknown>;
  for (const [cle, v] of Object.entries(entree)) {
    if (typeof v !== 'string') continue;
    const def = TEXTES[cle];
    if (def) {
      const propre = nettoyer(v, def.max ?? 420);
      if (def.type === 'lien' && propre && !LIEN.test(propre)) continue;
      if (propre !== def.defaut) sortie[cle] = propre;
      continue;
    }
    // Listes modulables : ordre, icônes, textes des éléments ajoutés
    for (const l of LISTES) {
      if (!cle.startsWith(`${l.id}.`)) continue;
      if (cle === cleOrdre(l)) {
        const ids = lireOrdre(l, v);
        if (ids && ids.join(',') !== l.ids.join(',')) sortie[cle] = ids.join(',');
        break;
      }
      const [id, champ, ...reste] = cle.slice(l.id.length + 1).split('.');
      if (reste.length || !id || !champ) break;
      const connu = l.ids.includes(id) || ID_AJOUTE.test(id);
      if (champ === 'icone') {
        const origine = l.icones?.[id] ?? l.iconeNouveau;
        if (connu && l.icones && (NOMS_ICONES as readonly string[]).includes(v) && v !== origine) sortie[cle] = v;
        break;
      }
      const c = l.champs.find((x) => x.nom === champ);
      if (c && ID_AJOUTE.test(id)) {
        const propre = nettoyer(v, c.max);
        if (c.type === 'lien' && propre && !LIEN.test(propre)) break;
        sortie[cle] = propre;
      }
      break;
    }
  }
  // Textes et icônes d'éléments ajoutés puis supprimés : retirés
  for (const l of LISTES) {
    const ids = new Set(lireOrdre(l, sortie[cleOrdre(l)]) ?? l.ids);
    for (const cle of Object.keys(sortie)) {
      if (!cle.startsWith(`${l.id}.`) || cle === cleOrdre(l)) continue;
      const id = cle.slice(l.id.length + 1).split('.')[0];
      if (ID_AJOUTE.test(id) && !ids.has(id)) delete sortie[cle];
    }
  }
  return sortie;
}

/** Nom du site (texte « site.nom ») */
export const nomSite = (t: Textes) => (t['site.nom']?.trim() || TEXTES['site.nom'].defaut);

/**
 * Texte final d'une clé : la version modifiée, sinon celle d'origine ; un texte
 * vidé reprend l'origine (sauf ceux qui sont vides à l'origine : annonce…).
 * « {nom} » devient le nom du site ; les variables (« {n} »…) leur valeur.
 */
export function texte(t: Textes, cle: string, variables?: Record<string, string | number>): string {
  const def = TEXTES[cle];
  const brut = t[cle];
  let v = brut !== undefined && (brut.trim() || !def?.defaut) ? brut : def?.defaut ?? '';
  if (cle !== 'site.nom') v = v.split('{nom}').join(nomSite(t));
  if (variables) for (const [k, x] of Object.entries(variables)) v = v.split(`{${k}}`).join(String(x));
  return v;
}

/** Remplace le nom d'origine par le nom du site (titres, descriptions, données Google) */
export function avecNom(s: string, t: Textes): string {
  const nom = nomSite(t);
  return nom === 'SVM Ride' ? s : s.split('SVM Ride').join(nom);
}
