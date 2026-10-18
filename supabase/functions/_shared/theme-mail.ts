/**
 * Couleurs des e-mails aux clients, d'après le thème publié dans le Studio
 * Design (réglage « theme » de site_reglages) : fond de page, carte, filet
 * d'accent sous « SVM RIDE », boutons, textes et bordures.
 *
 * Les gabarits utilisent des repères ({{c_bouton}}, {{c_accent}}…) remplacés
 * au moment de l'envoi par colorier(). Seules des couleurs #RRGGBB vérifiées
 * sont reprises, la carte et les textes restent lisibles (contraste), et en
 * cas d'erreur ce sont les couleurs SVM Signature. Relu toutes les 5 minutes.
 */

export interface CouleursMail {
  fond: string;
  carte: string;
  bordure: string;
  accent: string;
  texte: string;
  gris: string;
  bouton: string;
  bouton_texte: string;
}

/** SVM Signature : valeurs historiques des e-mails */
export const COULEURS_SIGNATURE: CouleursMail = {
  fond: "#F6F5F2",
  carte: "#FFFFFF",
  bordure: "#ECE9E0",
  accent: "#B8902F",
  texte: "#111111",
  gris: "#5E5E5E",
  bouton: "#254893",
  bouton_texte: "#FFFFFF",
};

/** Repères à mettre dans les gabarits */
export const C = {
  fond: "{{c_fond}}",
  carte: "{{c_carte}}",
  bordure: "{{c_bordure}}",
  accent: "{{c_accent}}",
  texte: "{{c_texte}}",
  gris: "{{c_gris}}",
  bouton: "{{c_bouton}}",
  bouton_texte: "{{c_bouton_texte}}",
} as const;

const HEX = /^#[0-9A-Fa-f]{6}$/;
const hex = (v: unknown): string | null => (typeof v === "string" && HEX.test(v) ? v.toUpperCase() : null);

function lum(h: string): number {
  const n = parseInt(h.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((x) => {
    const s = x / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const contraste = (a: string, b: string) => {
  const x = lum(a), y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
function melanger(a: string, b: string, part: number): string {
  const p = (h: string) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const [x, y] = [p(a), p(b)];
  return "#" + x.map((v, i) => Math.round(v * part + y[i] * (1 - part)).toString(16).padStart(2, "0")).join("").toUpperCase();
}

/** Palette des e-mails à partir de la configuration du thème (lisibilité garantie) */
export function couleursMail(config: unknown): CouleursMail {
  const t = (config ?? {}) as { couleurs?: Record<string, unknown>; derivees?: Record<string, unknown>; sections?: Record<string, Record<string, unknown>> };
  const c = t.couleurs ?? {};
  const s = COULEURS_SIGNATURE;
  const surface = hex(c.surface) ?? s.carte;
  const carte = contraste(surface, "#111111") >= 7 ? surface : s.carte;
  const texteBrut = hex(c.texte) ?? s.texte;
  const texte = contraste(texteBrut, carte) >= 4.5 ? texteBrut : s.texte;
  const grisBrut = hex(t.derivees?.["doux-68"]) ?? melanger(texte, carte, 0.68);
  const gris = contraste(grisBrut, carte) >= 4.5 ? grisBrut : texte;
  const bouton = hex(t.sections?.boutons?.fond) ?? hex(c.boutons) ?? s.bouton;
  const texteBouton = hex(t.sections?.boutons?.texte) ?? hex(t.derivees?.["sur-bouton"]) ?? "#FFFFFF";
  const boutonTexte = contraste(texteBouton, bouton) >= 4.5 ? texteBouton : contraste("#FFFFFF", bouton) >= contraste(texte, bouton) ? "#FFFFFF" : texte;
  return {
    fond: hex(c.arriere_plan) ?? s.fond,
    carte,
    bordure: hex(c.bordure) ?? s.bordure,
    accent: hex(c.accent) ?? s.accent,
    texte,
    gris,
    bouton,
    bouton_texte: boutonTexte,
  };
}

let courantes: CouleursMail = COULEURS_SIGNATURE;
let luLe = 0;

function cle(): string {
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
    if (keys.default) return keys.default;
  } catch (_) { /* ignore */ }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
}

export async function themeMail(): Promise<CouleursMail> {
  if (Date.now() - luLe < 5 * 60_000) return courantes;
  try {
    const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/site_reglages?select=valeur&cle=eq.theme&limit=1`, {
      headers: { apikey: cle(), accept: "application/json" },
      signal: AbortSignal.timeout(3000),
    });
    if (!r.ok) throw new Error(`site_reglages ${r.status}`);
    const v = ((await r.json()) as { valeur?: { config?: unknown } }[])[0]?.valeur;
    courantes = v?.config ? couleursMail(v.config) : COULEURS_SIGNATURE;
    luLe = Date.now();
  } catch (e) {
    console.error("thème des e-mails : couleurs SVM Signature", e);
  }
  return courantes;
}

/** Remplace les repères de couleur (à appeler après themeMail()) */
export function colorier(html: string): string {
  let sortie = html;
  for (const [k, v] of Object.entries(courantes) as [keyof CouleursMail, string][]) sortie = sortie.replaceAll(C[k], v);
  return sortie;
}

// Lecture dès le démarrage de la fonction
themeMail();
