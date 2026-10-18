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
import { ajusterContraste, canaux, contraste, estHex, estSombre, melanger, texteSur, versRgb } from './couleurs.ts';

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
  /** Police Google Fonts à charger quand ce choix est utilisé (paramètre « family » de l'adresse) */
  google?: string;
  /** Une ligne de présentation (polices) */
  aide?: string;
}

export interface ReglageStyle {
  cle: 'police_titres' | 'police_texte' | 'taille_titres' | 'graisse_titres' | 'casse_titres' | 'arrondi_boutons' | 'arrondi_cartes' | 'ombres';
  libelle: string;
  groupe: 'typographie' | 'formes';
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

/** Polices des titres (gratuites, Google Fonts) ; Oswald est déjà chargée par le site */
const titres = (cle: string, libelle: string, pile: string, aide: string, google?: string): OptionStyle => ({
  cle, libelle, aide, google, variables: () => ({ 'police-titres': pile }),
});
const texte = (cle: string, libelle: string, pile: string, aide: string, google?: string): OptionStyle => ({
  cle, libelle, aide, google, variables: () => ({ 'police-texte': pile }),
});
const SECOURS_TEXTE = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const STYLE: ReglageStyle[] = [
  {
    cle: 'police_titres',
    libelle: 'Police des titres',
    groupe: 'typographie',
    defaut: 'oswald',
    options: [
      titres('oswald', 'Oswald', 'Oswald, Impact, "Arial Narrow", sans-serif', 'Condensée et sportive, comme le logo (actuelle)'),
      titres('bebas', 'Bebas Neue', '"Bebas Neue", Impact, sans-serif', 'Affiche, très impactante', 'Bebas+Neue'),
      titres('barlow', 'Barlow Condensed', '"Barlow Condensed", "Arial Narrow", sans-serif', 'Condensée, nette et moderne', 'Barlow+Condensed:wght@500;600;700'),
      titres('anton', 'Anton', 'Anton, Impact, sans-serif', 'Très grasse, esprit compétition', 'Anton'),
      titres('rajdhani', 'Rajdhani', 'Rajdhani, sans-serif', 'Technique, esprit tableau de bord', 'Rajdhani:wght@500;600;700'),
      titres('montserrat', 'Montserrat', 'Montserrat, sans-serif', 'Géométrique, moderne et lisible', 'Montserrat:wght@500;600;700'),
      titres('playfair', 'Playfair Display', '"Playfair Display", Georgia, serif', 'Élégante, haut de gamme', 'Playfair+Display:wght@500;600;700'),
    ],
  },
  {
    cle: 'police_texte',
    libelle: 'Police du texte',
    groupe: 'typographie',
    defaut: 'inter',
    options: [
      texte('inter', 'Inter', `Inter, ${SECOURS_TEXTE}`, 'Très lisible sur écran (actuelle)'),
      texte('dmsans', 'DM Sans', `"DM Sans", ${SECOURS_TEXTE}`, 'Douce et moderne', 'DM+Sans:wght@400;500;600;700'),
      texte('roboto', 'Roboto', `Roboto, ${SECOURS_TEXTE}`, 'Neutre et technique', 'Roboto:wght@400;500;700'),
      texte('lato', 'Lato', `Lato, ${SECOURS_TEXTE}`, 'Chaleureuse et classique', 'Lato:wght@400;700'),
      texte('opensans', 'Open Sans', `"Open Sans", ${SECOURS_TEXTE}`, 'Ouverte et accessible', 'Open+Sans:wght@400;500;600;700'),
      texte('sourcesans', 'Source Sans 3', `"Source Sans 3", ${SECOURS_TEXTE}`, 'Sobre et compacte', 'Source+Sans+3:wght@400;500;600;700'),
    ],
  },
  {
    cle: 'taille_titres',
    libelle: 'Taille des titres',
    groupe: 'typographie',
    defaut: 'normale',
    options: [
      { cle: 'compacte', libelle: 'Compacte', variables: () => ({ 'echelle-titres': '0.9' }) },
      { cle: 'normale', libelle: 'Normale', variables: () => ({ 'echelle-titres': '1' }) },
      { cle: 'grande', libelle: 'Grande', variables: () => ({ 'echelle-titres': '1.12' }) },
      { cle: 'tres_grande', libelle: 'Très grande', variables: () => ({ 'echelle-titres': '1.25' }) },
    ],
  },
  {
    cle: 'graisse_titres',
    libelle: 'Graisse des titres',
    groupe: 'typographie',
    defaut: 'semi_grasse',
    options: [
      { cle: 'normale', libelle: 'Normale', variables: () => ({ 'graisse-titres': '500' }) },
      { cle: 'semi_grasse', libelle: 'Semi-grasse', variables: () => ({ 'graisse-titres': '600' }) },
      { cle: 'grasse', libelle: 'Grasse', variables: () => ({ 'graisse-titres': '700' }) },
    ],
  },
  {
    cle: 'casse_titres',
    libelle: 'Écriture des titres',
    groupe: 'typographie',
    defaut: 'majuscules',
    options: [
      { cle: 'majuscules', libelle: 'MAJUSCULES', variables: () => ({ 'casse-titres': 'uppercase', 'espacement-titres': '0.5px' }) },
      { cle: 'normale', libelle: 'Normale', variables: () => ({ 'casse-titres': 'none', 'espacement-titres': 'normal' }) },
    ],
  },
  {
    cle: 'arrondi_boutons',
    libelle: 'Arrondi des boutons',
    groupe: 'formes',
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
    groupe: 'formes',
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
    groupe: 'formes',
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

/**
 * Adresse Google Fonts des polices choisies par un thème (celles qui ne sont
 * pas déjà chargées par le site), ou null. Construite uniquement à partir du
 * registre : aucune saisie n'y entre.
 */
export function urlPolices(t: ThemeConfig): string | null {
  const familles = STYLE.filter((r) => r.groupe === 'typographie')
    .map((r) => r.options.find((o) => o.cle === t.style?.[r.cle])?.google)
    .filter((g): g is string => !!g);
  return familles.length ? `https://fonts.googleapis.com/css2?${[...new Set(familles)].map((f) => `family=${f}`).join('&')}&display=swap` : null;
}

/** Toutes les polices proposées (pour les échantillons de l'éditeur) */
export function urlToutesPolices(): string {
  const familles = STYLE.flatMap((r) => r.options.map((o) => o.google)).filter((g): g is string => !!g);
  return `https://fonts.googleapis.com/css2?${familles.map((f) => `family=${f}`).join('&')}&display=swap`;
}

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

export const REGLAGES_SECTION = ['fond', 'texte', 'titres', 'accent', 'bouton', 'bordure'] as const;
export type ReglageSection = (typeof REGLAGES_SECTION)[number];

export interface Section {
  cle: CleSection;
  libelle: string;
  aide: string;
  /** Section sur fond sombre (couleur primaire) */
  sombre: boolean;
  /** Couleurs globales remplacées par le réglage « fond » */
  fond: CleRole[];
  reglages: { cle: ReglageSection; libelle: string }[];
}

const REGLAGES_CLAIRS: Section['reglages'] = [
  { cle: 'fond', libelle: 'Arrière-plan' },
  { cle: 'titres', libelle: 'Titres' },
  { cle: 'texte', libelle: 'Texte' },
  { cle: 'accent', libelle: 'Accent' },
  { cle: 'bouton', libelle: 'Boutons' },
  { cle: 'bordure', libelle: 'Bordures' },
];

export const SECTIONS: Section[] = [
  { cle: 'header', libelle: 'Header et navigation', aide: 'Barre du haut, menu et lien actif', sombre: false, fond: ['surface'], reglages: REGLAGES_CLAIRS },
  { cle: 'hero', libelle: "Bandeau principal de l'accueil", aide: 'Grande photo, titre et boutons en haut de l’accueil', sombre: true, fond: ['primaire'], reglages: REGLAGES_CLAIRS },
  { cle: 'catalogue', libelle: 'Catalogue de motos', aide: 'Page Nos véhicules : recherche, filtres et liste', sombre: false, fond: ['arriere_plan'], reglages: REGLAGES_CLAIRS },
  { cle: 'cartes', libelle: 'Cartes de présentation des motos', aide: 'Cartes du catalogue et des derniers arrivages', sombre: false, fond: ['surface'], reglages: REGLAGES_CLAIRS },
  { cle: 'fiche', libelle: 'Fiches détaillées des motos', aide: 'Page d’une moto : photos, prix, caractéristiques', sombre: false, fond: ['arriere_plan', 'surface'], reglages: REGLAGES_CLAIRS },
  { cle: 'marques', libelle: 'Section marques', aide: 'Bandeau « Explorez les marques » de l’accueil', sombre: false, fond: ['arriere_plan'], reglages: REGLAGES_CLAIRS },
  { cle: 'equipe', libelle: 'Section équipe', aide: 'Équipe sur l’accueil et page Équipe', sombre: false, fond: ['surface'], reglages: REGLAGES_CLAIRS },
  { cle: 'avis', libelle: 'Section avis clients', aide: 'Avis Google sur l’accueil', sombre: false, fond: ['arriere_plan'], reglages: REGLAGES_CLAIRS },
  { cle: 'formulaires', libelle: 'Formulaires', aide: 'Contact, reprise, financement, dépôt-vente…', sombre: false, fond: ['arriere_plan', 'surface'], reglages: REGLAGES_CLAIRS },
  {
    cle: 'boutons', libelle: 'Boutons et appels à l’action', aide: 'Boutons principaux de tout le site', sombre: false, fond: ['boutons'],
    reglages: [{ cle: 'fond', libelle: 'Fond des boutons' }, { cle: 'texte', libelle: 'Texte des boutons' }],
  },
  { cle: 'footer', libelle: 'Footer', aide: 'Pied de page', sombre: true, fond: ['primaire'], reglages: REGLAGES_CLAIRS },
];

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
  style: Object.fromEntries(STYLE.map((r) => [r.cle, r.defaut])) as Style,
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

/** Nuances dérivées recalculées à partir des couleurs */
export function calculerDerivees(c: Couleurs): Record<string, string> {
  return Object.fromEntries(DERIVEES.map((d) => [d.variable, d.calcul(c)]));
}

/** Couleurs globales dont dépend chaque nuance dérivée (calculé une fois) */
let dependances: Record<string, CleRole[]> | null = null;
function dependancesDerivees(): Record<string, CleRole[]> {
  if (dependances) return dependances;
  const essais = ['#000000', '#FFFFFF', '#7F3FBF', '#20A060'];
  dependances = {};
  for (const d of DERIVEES) {
    dependances[d.variable] = ROLES.filter((r) =>
      essais.some((x) => d.calcul({ ...COULEURS_SIGNATURE, [r.cle]: x }) !== d.calcul(COULEURS_SIGNATURE)),
    ).map((r) => r.cle);
  }
  return dependances;
}

/**
 * Nuances dérivées d'un thème en cours de modification : celles dont les
 * couleurs d'origine n'ont pas changé gardent la valeur du thème de départ
 * (pour SVM Signature, les valeurs exactes du site) ; les autres sont recalculées.
 */
export function deriveesPour(couleurs: Couleurs, base: ThemeConfig): Record<string, string> {
  const dep = dependancesDerivees();
  const origine = couleursDuTheme(base);
  const sortie: Record<string, string> = {};
  for (const d of DERIVEES) {
    const intacte = dep[d.variable].every((r) => couleurs[r] === origine[r]);
    const figee = base.derivees?.[d.variable];
    sortie[d.variable] = intacte && estHex(figee) ? figee.toUpperCase() : d.calcul(couleurs);
  }
  return sortie;
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
 * Variables d'une section personnalisée : ses couleurs remplacent celles du
 * thème global, les nuances qui en dépendent sont recalculées, et seules les
 * variables qui changent sont renvoyées (le reste est hérité du thème global).
 */
export function variablesSection(t: ThemeConfig, cle: CleSection, globales = variablesDuTheme(t)): Record<string, string> {
  const section = SECTIONS.find((s) => s.cle === cle);
  const r = t.sections?.[cle];
  if (!section || !r) return {};
  const v = (k: ReglageSection) => (estHex(r[k]) ? r[k]!.toUpperCase() : undefined);
  const c = couleursDuTheme(t);
  const fond = v('fond');
  if (fond) for (const role of section.fond) c[role] = fond;
  if (cle === 'boutons') {
    const derivees = deriveesPour(c, t);
    if (v('texte')) derivees['sur-bouton'] = v('texte')!;
    return difference(variablesDuTheme({ ...t, couleurs: c, derivees }), globales);
  }
  // Les sections partent des boutons tels que réglés pour tout le site
  const boutons = t.sections?.boutons;
  if (estHex(boutons?.fond)) c.boutons = boutons.fond.toUpperCase();
  if (!section.sombre) {
    if (v('titres')) c.texte = v('titres')!;
    if (v('texte')) c.texte_secondaire = v('texte')!;
  }
  if (v('accent')) {
    c.accent = v('accent')!;
    if (section.sombre) c.secondaire = v('accent')!;
  }
  if (v('bouton')) c.boutons = v('bouton')!;
  if (v('bordure')) c.bordure = v('bordure')!;
  const derivees = deriveesPour(c, t);
  if (estHex(boutons?.texte) && !v('bouton')) derivees['sur-bouton'] = boutons.texte.toUpperCase();
  if (section.sombre) {
    const titres = v('titres');
    const texte = v('texte');
    if (titres) derivees.inverse = titres;
    if (texte) {
      for (const n of ['91', '88', '84']) derivees[`inverse-${n}`] = texte;
      for (const n of ['74', '66']) derivees[`inverse-${n}`] = melanger(texte, c.primaire, 0.85);
      for (const n of ['53', '52']) derivees[`inverse-${n}`] = melanger(texte, c.primaire, 0.65);
    }
  }
  return difference(variablesDuTheme({ ...t, couleurs: c, derivees }), globales);
}

function difference(a: Record<string, string>, b: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(a).filter(([k, x]) => b[k] !== x));
}

const declarations = (vars: Record<string, string>) =>
  Object.entries(vars)
    .map(([k, v]) => `--${k}:${v}`)
    .join(';');

/**
 * Bloc CSS du thème. Il vise le site public (.site) : l'admin garde toujours
 * sa propre charte. Les sections personnalisées suivent (attribut data-zone).
 * Le texte produit ne contient que des noms du registre et des valeurs
 * vérifiées : aucune saisie n'y est recopiée telle quelle.
 */
export function cssDuTheme(t: ThemeConfig, selecteur = '.site'): string {
  const globales = variablesDuTheme(t);
  let css = `${selecteur}{${declarations(globales)}}`;
  const boutons = variablesSection(t, 'boutons', globales);
  if (Object.keys(boutons).length) css += `${selecteur}{${declarations(boutons)}}`;
  for (const s of SECTIONS) {
    if (s.cle === 'boutons') continue;
    const vars = variablesSection(t, s.cle, { ...globales, ...boutons });
    if (Object.keys(vars).length) css += `${selecteur} [data-zone="${s.cle}"]{${declarations(vars)}}`;
  }
  return css;
}

/**
 * Bloc CSS de l'administration : seulement les accents (boutons et liens de
 * l'admin, focus, or, liseré) et les polices. Les fonds et textes de l'admin
 * restent neutres, et les accents sont foncés si besoin pour rester lisibles
 * sur fond blanc (texte blanc sur les boutons, liens sur les pages).
 */
export function cssAdmin(t: ThemeConfig, selecteur = '.admin'): string {
  const globales = variablesDuTheme(t);
  const g = { ...globales, ...variablesSection(t, 'boutons', globales) };
  const lisible = (v: string, seuil: number) => (contraste(v, '#FFFFFF') >= seuil ? v : ajusterContraste(v, '#FFFFFF', seuil));
  const couleurs: Record<string, string> = {
    bleu: lisible(g.bleu, 4.5),
    'bleu-hover': lisible(g['bleu-hover'], 4.5),
    'bleu-clair': g['bleu-clair'],
    'bleu-vif': lisible(g['bleu-vif'], 3),
    lien: lisible(g.lien, 4.5),
    or: g.or,
    'or-texte': lisible(g['or-texte'], 4.5),
    'or-clair': g['or-clair'],
  };
  const vars: Record<string, string> = {};
  for (const [k, v] of Object.entries(couleurs)) {
    vars[k] = v;
    vars[`${k}-rgb`] = canaux(v);
  }
  for (const k of ['degrade-debut', 'degrade-or', 'police-texte', 'police-titres']) vars[k] = g[k];
  return `${selecteur}{${declarations(vars)}}`;
}

/** Forme complète et ordonnée d'un thème (enregistrement et comparaison) */
export function themeComplet(t: ThemeConfig): ThemeConfig {
  const couleurs = couleursDuTheme(t);
  const sections: NonNullable<ThemeConfig['sections']> = {};
  for (const s of SECTIONS) {
    const r = t.sections?.[s.cle];
    if (!r) continue;
    const propre: Partial<Record<ReglageSection, string>> = {};
    for (const k of REGLAGES_SECTION) {
      const v = r[k];
      if (estHex(v)) propre[k] = v.toUpperCase();
    }
    if (Object.keys(propre).length) sections[s.cle] = propre;
  }
  return {
    schema: SCHEMA_THEME,
    couleurs,
    derivees: deriveesPour(couleurs, t),
    sections,
    style: Object.fromEntries(STYLE.map((s) => [s.cle, t.style?.[s.cle] ?? s.defaut])) as Style,
  };
}

/* ===== Contrôles de lisibilité (WCAG AA) ===== */

export interface Controle {
  cle: string;
  libelle: string;
  /** Couleurs globales concernées (pastille affichée sur leur ligne) */
  roles: CleRole[];
  avant: string;
  fond: string;
  /** 4,5 pour du texte courant, 3 pour les grands textes et éléments graphiques */
  seuil: 4.5 | 3;
  /** Correction proposée : couleur globale à ajuster, contre quelle variable */
  corrige: { role: CleRole; contre: string };
}

export const CONTROLES: Controle[] = [
  { cle: 'texte-fond', libelle: 'Texte principal sur l’arrière-plan', roles: ['texte', 'arriere_plan'], avant: 'noir', fond: 'fond', seuil: 4.5, corrige: { role: 'texte', contre: 'fond' } },
  { cle: 'texte-surface', libelle: 'Texte principal sur les cartes', roles: ['texte', 'surface'], avant: 'noir', fond: 'surface', seuil: 4.5, corrige: { role: 'texte', contre: 'surface' } },
  { cle: 'texte2-fond', libelle: 'Paragraphes sur l’arrière-plan', roles: ['texte_secondaire', 'arriere_plan'], avant: 'gris-texte', fond: 'fond', seuil: 4.5, corrige: { role: 'texte_secondaire', contre: 'fond' } },
  { cle: 'texte2-surface', libelle: 'Paragraphes sur les cartes', roles: ['texte_secondaire', 'surface'], avant: 'gris-texte', fond: 'surface', seuil: 4.5, corrige: { role: 'texte_secondaire', contre: 'surface' } },
  { cle: 'bouton', libelle: 'Texte des boutons', roles: ['boutons'], avant: 'sur-bouton', fond: 'bleu', seuil: 4.5, corrige: { role: 'boutons', contre: 'sur-bouton' } },
  { cle: 'bouton-survol', libelle: 'Texte des boutons au survol', roles: ['boutons'], avant: 'sur-bouton', fond: 'bleu-hover', seuil: 4.5, corrige: { role: 'boutons', contre: 'sur-bouton' } },
  { cle: 'lien-fond', libelle: 'Liens sur l’arrière-plan', roles: ['liens', 'arriere_plan'], avant: 'lien', fond: 'fond', seuil: 4.5, corrige: { role: 'liens', contre: 'fond' } },
  { cle: 'lien-surface', libelle: 'Liens sur les cartes', roles: ['liens', 'surface'], avant: 'lien', fond: 'surface', seuil: 4.5, corrige: { role: 'liens', contre: 'surface' } },
  { cle: 'sombre-texte', libelle: 'Texte sur les sections sombres', roles: ['primaire'], avant: 'inverse', fond: 'noir-profond', seuil: 4.5, corrige: { role: 'primaire', contre: 'inverse' } },
  { cle: 'sombre-secondaire', libelle: 'Détails sur les sections sombres', roles: ['secondaire', 'primaire'], avant: 'or-clair', fond: 'noir-profond', seuil: 3, corrige: { role: 'secondaire', contre: 'noir-profond' } },
  { cle: 'sombre-accent', libelle: 'Accent sur les sections sombres', roles: ['accent', 'primaire'], avant: 'or', fond: 'noir-profond', seuil: 3, corrige: { role: 'accent', contre: 'noir-profond' } },
  { cle: 'accent-texte', libelle: 'Accent en texte sur l’arrière-plan', roles: ['accent', 'arriere_plan'], avant: 'or-texte', fond: 'fond', seuil: 4.5, corrige: { role: 'accent', contre: 'fond' } },
  { cle: 'focus', libelle: 'Contour du champ sélectionné', roles: ['liens', 'arriere_plan'], avant: 'bleu-vif', fond: 'fond', seuil: 3, corrige: { role: 'liens', contre: 'fond' } },
];

export type Niveau = 'ok' | 'grand' | 'ko';

export interface Resultat {
  controle: Controle;
  ratio: number;
  niveau: Niveau;
}

/**
 * Couleur corrigée pour réussir un contrôle : la couleur globale concernée,
 * foncée ou éclaircie juste assez (marge de 0,3 au-dessus du seuil).
 */
export function correction(r: Resultat, c: Couleurs, vars: Record<string, string>): { role: CleRole; couleur: string } {
  const { role, contre } = r.controle.corrige;
  const cible = r.controle.seuil + 0.3 + (r.controle.cle === 'bouton-survol' ? 1 : 0);
  return { role, couleur: ajusterContraste(c[role], vars[contre], cible) };
}

/** Contrôles de contraste d'un thème (valeurs résolues, nuances dérivées comprises) */
export function controlerTheme(t: ThemeConfig, vars = variablesDuTheme(t)): Resultat[] {
  return CONTROLES.map((controle) => {
    const ratio = contraste(vars[controle.avant], vars[controle.fond]);
    const niveau: Niveau = ratio >= controle.seuil ? 'ok' : controle.seuil === 4.5 && ratio >= 3 ? 'grand' : 'ko';
    return { controle, ratio, niveau };
  });
}
