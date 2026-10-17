/**
 * Studio Design — registre unique des réglages graphiques du site public.
 *
 * Un thème est une fiche JSON (couleurs, nuances dérivées, exceptions par
 * section, style). Ce module, pur et sans dépendance, la valide et la
 * transforme en variables CSS. Il sert à l'éditeur de l'admin, à l'aperçu et à
 * la fonction Netlify « seo » qui injecte le thème publié dans chaque page.
 *
 * Les valeurs SVM Signature ci-dessous sont celles de src/index.css (:root),
 * qui reste le thème de secours quand aucun thème n'est injecté.
 * Ajouter un réglage = ajouter une entrée ici (et la variable dans index.css).
 */
import { canaux, estHex, estSombre, ajusterContraste, melanger, texteSur, versRgb } from './couleurs';

export const SCHEMA_THEME = 1;

/* ===== Les 10 couleurs globales ===== */

export type CleRole =
  | 'primaire'
  | 'secondaire'
  | 'accent'
  | 'arriere_plan'
  | 'surface'
  | 'texte'
  | 'texte_secondaire'
  | 'bordure'
  | 'boutons'
  | 'liens';

export interface Role {
  cle: CleRole;
  libelle: string;
  aide: string;
  /** Variable CSS alimentée (sans les deux tirets) */
  variable: string;
  signature: string;
}

export const ROLES: Role[] = [
  { cle: 'primaire', libelle: 'Couleur primaire', aide: 'Bandeaux et sections sombres, pied de page', variable: 'noir-profond', signature: '#0E0E10' },
  { cle: 'secondaire', libelle: 'Couleur secondaire', aide: 'Détails et icônes sur fond sombre', variable: 'or-clair', signature: '#D9B965' },
  { cle: 'accent', libelle: "Couleur d'accent", aide: 'Filets, liserés, icônes, contours des cartes', variable: 'or', signature: '#B8902F' },
  { cle: 'arriere_plan', libelle: 'Arrière-plan', aide: 'Fond des pages et des sections alternées', variable: 'fond', signature: '#F6F5F2' },
  { cle: 'surface', libelle: 'Surfaces et cartes', aide: 'Cartes motos, encadrés, champs, barre du haut', variable: 'surface', signature: '#FFFFFF' },
  { cle: 'texte', libelle: 'Texte principal', aide: 'Titres et textes importants', variable: 'noir', signature: '#111111' },
  { cle: 'texte_secondaire', libelle: 'Texte secondaire', aide: 'Paragraphes', variable: 'gris-texte', signature: '#4A4A4A' },
  { cle: 'bordure', libelle: 'Bordures', aide: 'Séparateurs et contours', variable: 'bordure', signature: '#ECE9E0' },
  { cle: 'boutons', libelle: 'Boutons', aide: 'Boutons principaux', variable: 'bleu', signature: '#254893' },
  { cle: 'liens', libelle: 'Liens et éléments interactifs', aide: 'Liens, onglet actif, champ sélectionné', variable: 'lien', signature: '#254893' },
];

export type Couleurs = Record<CleRole, string>;

export const COULEURS_SIGNATURE = Object.fromEntries(ROLES.map((r) => [r.cle, r.signature])) as Couleurs;

/* ===== Nuances dérivées =====
   Calculées à partir des couleurs globales quand on les change, puis gardées
   dans le thème. Pour SVM Signature, ce sont les valeurs exactes du site. */

export interface Derivee {
  variable: string;
  signature: string;
  calcul: (c: Couleurs) => string;
}

const inverse = (c: Couleurs) => texteSur(c.primaire, c.texte);
const doux = (part: number) => (c: Couleurs) => melanger(c.texte, c.surface, part);
const surSombre = (part: number) => (c: Couleurs) => melanger(inverse(c), c.primaire, part);

export const DERIVEES: Derivee[] = [
  // Boutons
  { variable: 'bleu-hover', signature: '#2F5BB3', calcul: (c) => (estSombre(c.boutons) ? melanger('#FFFFFF', c.boutons, 0.1) : melanger('#000000', c.boutons, 0.12)) },
  { variable: 'bleu-clair', signature: '#6395F8', calcul: (c) => melanger('#FFFFFF', c.boutons, 0.35) },
  { variable: 'sur-bouton', signature: '#FFFFFF', calcul: (c) => texteSur(c.boutons, c.texte) },
  // Contour de focus et liens sur fond sombre
  { variable: 'bleu-vif', signature: '#1A8CFF', calcul: (c) => ajusterContraste(c.liens, c.primaire, 3) },
  // Accent lisible en texte sur fond clair
  { variable: 'or-texte', signature: '#8A6A1F', calcul: (c) => ajusterContraste(c.accent, c.arriere_plan, 4.5) },
  { variable: 'or-voile', signature: '#FBF6E9', calcul: (c) => melanger(c.accent, c.surface, 0.1) },
  { variable: 'or-voile-leger', signature: '#FBF7EE', calcul: (c) => melanger(c.accent, c.surface, 0.08) },
  { variable: 'degrade-debut', signature: '#2A2112', calcul: (c) => melanger(c.accent, '#000000', 0.2) },
  { variable: 'degrade-debut-sombre', signature: '#6E5418', calcul: (c) => melanger(c.accent, '#000000', 0.6) },
  // Champs de saisie
  { variable: 'champ', signature: '#E3E0D6', calcul: (c) => melanger('#000000', c.bordure, 0.04) },
  // Textes atténués sur fond clair (part du texte principal)
  { variable: 'doux-68', signature: '#5E5E5E', calcul: doux(0.68) },
  { variable: 'doux-64', signature: '#666666', calcul: doux(0.64) },
  { variable: 'doux-62', signature: '#6B6B6B', calcul: doux(0.62) },
  { variable: 'doux-58', signature: '#767676', calcul: doux(0.58) },
  // Textes sur fond sombre (part du blanc sur la couleur primaire)
  { variable: 'inverse', signature: '#FFFFFF', calcul: inverse },
  { variable: 'inverse-91', signature: '#E8E8E8', calcul: surSombre(0.91) },
  { variable: 'inverse-88', signature: '#E0E0E0', calcul: surSombre(0.88) },
  { variable: 'inverse-84', signature: '#D6D6D6', calcul: surSombre(0.84) },
  { variable: 'inverse-74', signature: '#BDBDBD', calcul: surSombre(0.74) },
  { variable: 'inverse-66', signature: '#AAAAAA', calcul: surSombre(0.66) },
  { variable: 'inverse-53', signature: '#8A8A8A', calcul: surSombre(0.53) },
  { variable: 'inverse-52', signature: '#888888', calcul: surSombre(0.52) },
];

export const DERIVEES_SIGNATURE = Object.fromEntries(DERIVEES.map((d) => [d.variable, d.signature])) as Record<string, string>;

/* ===== Style ===== */

export interface OptionStyle {
  cle: string;
  libelle: string;
  /** Variables posées par ce choix (la fonction reçoit les couleurs du thème) */
  variables: (c: Record<string, string>) => Record<string, string>;
}

export interface ReglageStyle {
  cle: 'arrondi_boutons' | 'arrondi_cartes' | 'ombres';
  libelle: string;
  defaut: string;
  options: OptionStyle[];
}

const ombreBoutons = (hex: string, a1: number, a2: number) => {
  const [r, g, b] = versRgb(hex);
  return {
    'ombre-bleu': `0 6px 16px rgba(${r}, ${g}, ${b}, ${a1})`,
    'ombre-bleu-fort': `0 8px 22px rgba(${r}, ${g}, ${b}, ${a2})`,
  };
};

const SANS_OMBRE = '0 0 #0000';

export const STYLE: ReglageStyle[] = [
  {
    cle: 'arrondi_boutons',
    libelle: 'Arrondi des boutons',
    defaut: 'arrondi',
    options: [
      { cle: 'carre', libelle: 'Carré', variables: () => ({ 'rayon-bouton': '0px' }) },
      { cle: 'leger', libelle: 'Léger', variables: () => ({ 'rayon-bouton': '6px' }) },
      { cle: 'arrondi', libelle: 'Arrondi', variables: () => ({ 'rayon-bouton': '12px' }) },
      { cle: 'pilule', libelle: 'Pilule', variables: () => ({ 'rayon-bouton': '9999px' }) },
    ],
  },
  {
    cle: 'arrondi_cartes',
    libelle: 'Arrondi des cartes',
    defaut: 'arrondi',
    options: [
      { cle: 'carre', libelle: 'Carré', variables: () => ({ 'rayon-carte': '0px', 'rayon-carte-moto': '0px' }) },
      { cle: 'leger', libelle: 'Léger', variables: () => ({ 'rayon-carte': '8px', 'rayon-carte-moto': '10px' }) },
      { cle: 'arrondi', libelle: 'Arrondi', variables: () => ({ 'rayon-carte': '16px', 'rayon-carte-moto': '18px' }) },
    ],
  },
  {
    cle: 'ombres',
    libelle: 'Ombres',
    defaut: 'legeres',
    options: [
      {
        cle: 'aucune',
        libelle: 'Aucune',
        variables: () => ({
          'ombre-carte': SANS_OMBRE, 'ombre-vehicule': SANS_OMBRE, 'ombre-vehicule-fort': SANS_OMBRE,
          'ombre-bleu': SANS_OMBRE, 'ombre-bleu-fort': SANS_OMBRE,
        }),
      },
      {
        cle: 'legeres',
        libelle: 'Légères',
        variables: (c) => ({
          'ombre-carte': '0 1px 2px rgba(17, 17, 17, 0.04), 0 4px 14px rgba(17, 17, 17, 0.04)',
          'ombre-vehicule': '0 8px 24px rgba(0, 0, 0, 0.08)',
          'ombre-vehicule-fort': '0 14px 32px rgba(0, 0, 0, 0.12)',
          // Ombre pleine au repos : rendu historique du site (la classe shadow-bleu prenait la couleur bleu)
          ...ombreBoutons(c.bleu, 1, 0.4),
        }),
      },
      {
        cle: 'marquees',
        libelle: 'Marquées',
        variables: (c) => ({
          'ombre-carte': '0 2px 4px rgba(17, 17, 17, 0.08), 0 8px 24px rgba(17, 17, 17, 0.1)',
          'ombre-vehicule': '0 12px 32px rgba(0, 0, 0, 0.16)',
          'ombre-vehicule-fort': '0 18px 40px rgba(0, 0, 0, 0.22)',
          ...ombreBoutons(c.bleu, 1, 0.55),
        }),
      },
    ],
  },
];

export type Style = Partial<Record<ReglageStyle['cle'], string>>;

/* ===== Sections (attribut data-zone posé sur leur élément racine) ===== */

export type CleSection =
  | 'header'
  | 'hero'
  | 'catalogue'
  | 'cartes'
  | 'fiche'
  | 'marques'
  | 'equipe'
  | 'avis'
  | 'formulaires'
  | 'boutons'
  | 'footer';

export const SECTIONS: { cle: CleSection; libelle: string }[] = [
  { cle: 'header', libelle: 'Header et navigation' },
  { cle: 'hero', libelle: "Bandeau principal de l'accueil" },
  { cle: 'catalogue', libelle: 'Catalogue de motos' },
  { cle: 'cartes', libelle: 'Cartes de présentation des motos' },
  { cle: 'fiche', libelle: 'Fiches détaillées des motos' },
  { cle: 'marques', libelle: 'Section marques' },
  { cle: 'equipe', libelle: 'Section équipe' },
  { cle: 'avis', libelle: 'Section avis clients' },
  { cle: 'formulaires', libelle: 'Formulaires' },
  { cle: 'boutons', libelle: 'Boutons et appels à l’action' },
  { cle: 'footer', libelle: 'Footer' },
];

export const REGLAGES_SECTION = ['fond', 'texte', 'titres', 'accent', 'bouton', 'bordure'] as const;
export type ReglageSection = (typeof REGLAGES_SECTION)[number];

/* ===== Thème ===== */

export interface ThemeConfig {
  schema: number;
  couleurs: Partial<Couleurs>;
  derivees?: Record<string, string>;
  sections?: Partial<Record<CleSection, Partial<Record<ReglageSection, string>>>>;
  style?: Style;
}

export const THEME_SIGNATURE: ThemeConfig = {
  schema: SCHEMA_THEME,
  couleurs: { ...COULEURS_SIGNATURE },
  derivees: { ...DERIVEES_SIGNATURE },
  sections: {},
  style: { arrondi_boutons: 'arrondi', arrondi_cartes: 'arrondi', ombres: 'legeres' },
};

const estObjet = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * Vérification stricte avant enregistrement ou publication : schéma connu,
 * uniquement des clés du registre et des couleurs au format #RRGGBB.
 */
export function themeValide(brut: unknown): brut is ThemeConfig {
  if (!estObjet(brut) || brut.schema !== SCHEMA_THEME) return false;
  if (Object.keys(brut).some((k) => !['schema', 'couleurs', 'derivees', 'sections', 'style'].includes(k))) return false;
  const roles = new Set(ROLES.map((r) => r.cle as string));
  if (!estObjet(brut.couleurs) || Object.entries(brut.couleurs).some(([k, v]) => !roles.has(k) || !estHex(v))) return false;
  if (brut.derivees !== undefined) {
    const derivees = new Set(DERIVEES.map((d) => d.variable));
    if (!estObjet(brut.derivees) || Object.entries(brut.derivees).some(([k, v]) => !derivees.has(k) || !estHex(v))) return false;
  }
  if (brut.sections !== undefined) {
    const sections = new Set(SECTIONS.map((s) => s.cle as string));
    if (!estObjet(brut.sections)) return false;
    for (const [k, v] of Object.entries(brut.sections)) {
      if (!sections.has(k) || !estObjet(v)) return false;
      if (Object.entries(v).some(([r, c]) => !(REGLAGES_SECTION as readonly string[]).includes(r) || !estHex(c))) return false;
    }
  }
  if (brut.style !== undefined) {
    if (!estObjet(brut.style)) return false;
    for (const [k, v] of Object.entries(brut.style)) {
      const reglage = STYLE.find((s) => s.cle === k);
      if (!reglage || !reglage.options.some((o) => o.cle === v)) return false;
    }
  }
  return true;
}

/** Couleurs complètes : celles du thème, SVM Signature pour celles qui manquent */
export function couleursDuTheme(t: ThemeConfig): Couleurs {
  const c = { ...COULEURS_SIGNATURE };
  for (const r of ROLES) {
    const v = t.couleurs?.[r.cle];
    if (estHex(v)) c[r.cle] = v.toUpperCase();
  }
  return c;
}

/** Nuances dérivées recalculées à partir des couleurs (après un changement dans l'éditeur) */
export function calculerDerivees(c: Couleurs): Record<string, string> {
  return Object.fromEntries(DERIVEES.map((d) => [d.variable, d.calcul(c)]));
}

/**
 * Toutes les variables CSS d'un thème, sans les deux tirets : couleurs en HEX
 * et en canaux R G B (pour Tailwind), dégradés, arrondis et ombres.
 */
export function variablesDuTheme(t: ThemeConfig): Record<string, string> {
  const c = couleursDuTheme(t);
  const hex: Record<string, string> = {};
  for (const r of ROLES) hex[r.variable] = c[r.cle];
  for (const d of DERIVEES) {
    const v = t.derivees?.[d.variable];
    hex[d.variable] = estHex(v) ? v.toUpperCase() : d.calcul(c);
  }
  const vars: Record<string, string> = {};
  for (const [nom, v] of Object.entries(hex)) {
    vars[nom] = v;
    vars[`${nom}-rgb`] = canaux(v);
  }
  vars['degrade-or'] = `linear-gradient(90deg, ${hex['degrade-debut']}, ${hex.or} 55%, ${hex['or-clair']})`;
  vars['degrade-or-sombre'] = `linear-gradient(90deg, ${hex['degrade-debut-sombre']}, ${hex.or} 55%, ${hex['or-clair']})`;
  for (const reglage of STYLE) {
    const choix = t.style?.[reglage.cle];
    const option = reglage.options.find((o) => o.cle === choix) ?? reglage.options.find((o) => o.cle === reglage.defaut)!;
    Object.assign(vars, option.variables(hex));
  }
  return vars;
}

/**
 * Bloc CSS du thème. Il vise le site public (.site) : l'admin garde toujours
 * sa propre charte. Le texte produit ne contient que des noms du registre et
 * des valeurs vérifiées : aucune saisie n'y est recopiée telle quelle.
 */
export function cssDuTheme(t: ThemeConfig, selecteur = '.site'): string {
  const vars = variablesDuTheme(t);
  const corps = Object.entries(vars)
    .map(([k, v]) => `--${k}:${v}`)
    .join(';');
  return `${selecteur}{${corps}}`;
}
