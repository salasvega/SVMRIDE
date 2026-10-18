/**
 * Listes modulables dans les pages (étapes, atouts, avantages, FAQ) :
 * éléments affichés et leur ordre (choisis dans l'admin, « Textes du site »).
 *
 *   const etapes = useListe('reprises.etapes');
 *   etapes.ids.map((id, i) => <li key={id} {...etapes.attrs(id)}>{i + 1} {t(etapes.cle(id, 'titre'))}</li>)
 *
 * attrs() repère chaque élément pour la barre d'outils de l'aperçu de l'admin
 * (rien n'est ajouté pour les visiteurs).
 */
import type { LucideIcon } from 'lucide-react';
import { useTextes } from './textes';
import { EN_APERCU } from './apercuDemo';
import { cleElement, cleIcone, cleOrdre, LISTES_PAR_ID, lireOrdre } from '../config/textes-listes';
import { ICONES } from '../config/icones';

export interface Liste {
  ids: string[];
  /** Clé d'un texte d'un élément */
  cle: (id: string, champ: string) => string;
  /** Icône d'un élément (listes à icônes) */
  icone: (id: string) => LucideIcon;
  /** Attributs de repérage de l'élément (aperçu de l'admin seulement) */
  attrs: (id: string) => Record<string, string>;
  /** Élément à présentation particulière (ex. Alma) */
  special: (id: string) => boolean;
}

export function useListe(listeId: string): Liste {
  const t = useTextes();
  const l = LISTES_PAR_ID[listeId];
  const ids = lireOrdre(l, t[cleOrdre(l)]) ?? l.ids;
  return {
    ids,
    cle: (id, champ) => cleElement(l, id, champ),
    icone: (id) => {
      const nom = t[cleIcone(l, id)] ?? l.icones?.[id] ?? l.iconeNouveau ?? 'Star';
      return ICONES[nom as keyof typeof ICONES] ?? ICONES.Star;
    },
    attrs: (id): Record<string, string> => (EN_APERCU ? { 'data-liste': l.id, 'data-element': id } : {}),
    special: (id) => !!l.speciaux?.includes(id),
  };
}

/**
 * Classes de grille selon le nombre d'éléments : celles d'origine pour le
 * nombre d'origine, sinon un nombre de colonnes qui évite les lignes trop vides.
 */
export function colonnes(n: number, origine: { n: number; classes: string }, parNombre: Record<number, string>): string {
  if (n === origine.n) return origine.classes;
  return parNombre[n] ?? parNombre[0] ?? origine.classes;
}
