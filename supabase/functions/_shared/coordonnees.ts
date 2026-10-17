/**
 * Coordonnées de SVM Ride pour les e-mails et les messages des fonctions :
 * téléphone, e-mail affiché, adresse qui reçoit les demandes, adresse du showroom.
 *
 * Elles se modifient dans l'admin, onglet « Infos du site » (réglage
 * « coordonnees » de la table site_reglages). Les textes utilisent des repères
 * ({{telephone}}, {{reception}}…) remplacés au moment de l'envoi par
 * remplir() ; valeurs de secours si la base ne répond pas. Relues toutes les
 * 5 minutes au plus.
 */

export interface CoordonneesMail {
  telephone: string;
  email: string;
  reception: string;
  adresse: string;
}

export const COORDONNEES_SECOURS: CoordonneesMail = {
  telephone: "01 84 19 01 74",
  email: "contact@svmride.com",
  reception: "contact@svmride.com",
  adresse: "310 Avenue Roger Salengro, 92370 Chaville",
};

/** Repères à mettre dans les textes */
export const TEL = "{{telephone}}";
export const EMAIL_AFFICHE = "{{email}}";
export const RECEPTION = "{{reception}}";
export const ADRESSE = "{{adresse}}";

const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const texte = (v: unknown, max = 160) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

let courantes: CoordonneesMail = COORDONNEES_SECOURS;
let luLe = 0;

function cle(): string {
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
    if (keys.default) return keys.default;
  } catch (_) { /* ignore */ }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
}

export async function coordonnees(): Promise<CoordonneesMail> {
  if (Date.now() - luLe < 5 * 60_000) return courantes;
  try {
    const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/site_reglages?select=valeur&cle=eq.coordonnees&limit=1`, {
      headers: { apikey: cle(), accept: "application/json" },
      signal: AbortSignal.timeout(3000),
    });
    if (!r.ok) throw new Error(`site_reglages ${r.status}`);
    const v = ((await r.json()) as { valeur?: Record<string, any> }[])[0]?.valeur ?? {};
    const s = v.showroom ?? {};
    const email = texte(v.email), reception = texte(v.email_reception);
    const tel = texte(v.telephone, 30);
    const rue = texte(s.adresse), cp = texte(s.code_postal, 5), ville = texte(s.ville);
    courantes = {
      telephone: /\d{2}.*\d{2}/.test(tel) ? tel : COORDONNEES_SECOURS.telephone,
      email: EMAIL.test(email) ? email : COORDONNEES_SECOURS.email,
      reception: EMAIL.test(reception) ? reception : EMAIL.test(email) ? email : COORDONNEES_SECOURS.reception,
      adresse: rue && /^\d{5}$/.test(cp) && ville ? `${rue}, ${cp} ${ville}` : COORDONNEES_SECOURS.adresse,
    };
    luLe = Date.now();
  } catch (e) {
    console.error("coordonnées : valeurs de secours", e);
  }
  return courantes;
}

const echapper = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Remplace les repères par les coordonnées connues (à appeler après coordonnees()) */
export function remplir(t: string, html = false): string {
  const v = (s: string) => (html ? echapper(s) : s);
  return t
    .replaceAll(TEL, v(courantes.telephone))
    .replaceAll(EMAIL_AFFICHE, v(courantes.email))
    .replaceAll(RECEPTION, v(courantes.reception))
    .replaceAll(ADRESSE, v(courantes.adresse));
}

// Lecture dès le démarrage de la fonction
coordonnees();
