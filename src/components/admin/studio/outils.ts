/** Studio Design — outils partagés par les composants de l'éditeur */
import { variablesDuTheme, variablesSection, type CleSection, type Niveau, type ThemeConfig } from '../../../config/design';

type Vars = Record<string, string>;

export function normaliserHex(brut: string): string | null {
  let v = brut.trim().replace(/^#/, '').toUpperCase();
  if (/^[0-9A-F]{3}$/.test(v)) v = v.split('').map((c) => c + c).join('');
  return /^[0-9A-F]{6}$/.test(v) ? `#${v}` : null;
}

export const STYLE_NIVEAU: Record<Niveau, { classe: string; libelle: string }> = {
  ok: { classe: 'border-green-300 bg-green-50 text-green-900', libelle: 'Lisible' },
  grand: { classe: 'border-amber-300 bg-amber-50 text-amber-900', libelle: 'Grands textes seulement' },
  ko: { classe: 'border-red-300 bg-red-50 text-red-800', libelle: 'Illisible' },
};

/** Couleurs résolues pour la miniature : globales (boutons compris) et par section */
export function couleursMiniature(config: ThemeConfig) {
  const globales = variablesDuTheme(config);
  const g = { ...globales, ...variablesSection(config, 'boutons', globales) };
  const zone = (cle: CleSection): Vars => ({ ...g, ...variablesSection(config, cle, g) });
  return { g, zone };
}

/** Page de l'aperçu qui montre une section (accueil par défaut ; « fiche » = une moto) */
export const PAGE_DE_ZONE: Partial<Record<CleSection, string>> = {
  catalogue: '/vehicules', cartes: '/vehicules', fiche: 'fiche', formulaires: '/contact',
};
