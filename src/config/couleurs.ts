/**
 * Calculs de couleurs du Studio Design (module pur, partagé par le site,
 * l'admin et la fonction Netlify « seo ») : format HEX, mélange, contraste WCAG.
 */

/** Seul format accepté partout : #RRGGBB */
export const FORMAT_HEX = /^#[0-9A-Fa-f]{6}$/;

export const estHex = (v: unknown): v is string => typeof v === 'string' && FORMAT_HEX.test(v);

export function versRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function versHex([r, g, b]: [number, number, number]): string {
  const c = (x: number) => Math.round(Math.min(255, Math.max(0, x))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

/** Canaux « R G B » pour Tailwind : rgb(var(--x-rgb) / alpha) */
export const canaux = (hex: string) => versRgb(hex).join(' ');

/** Mélange : part = 1 → a, part = 0 → b */
export function melanger(a: string, b: string, part: number): string {
  const [r1, g1, b1] = versRgb(a);
  const [r2, g2, b2] = versRgb(b);
  return versHex([r1 * part + r2 * (1 - part), g1 * part + g2 * (1 - part), b1 * part + b2 * (1 - part)]);
}

export function luminance(hex: string): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = versRgb(hex);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Rapport de contraste WCAG (1 à 21) */
export function contraste(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export const estSombre = (hex: string) => luminance(hex) < 0.18;

/**
 * Rapproche `couleur` de `vers` (noir ou blanc) par petits pas jusqu'à
 * atteindre le contraste demandé sur `fond`. Renvoie la couleur d'origine si
 * elle suffit déjà.
 */
export function ajusterContraste(couleur: string, fond: string, cible: number): string {
  const vers = estSombre(fond) ? '#FFFFFF' : '#000000';
  let c = couleur;
  for (let i = 1; i <= 20 && contraste(c, fond) < cible; i++) c = melanger(vers, couleur, i / 20);
  return c;
}

/** Texte lisible sur une couleur : blanc si possible, sinon le texte foncé donné */
export const texteSur = (fond: string, fonce: string) => (contraste('#FFFFFF', fond) >= 4.5 ? '#FFFFFF' : fonce);
