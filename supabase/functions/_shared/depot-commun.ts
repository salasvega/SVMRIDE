/**
 * Outils communs aux fonctions du dépôt-vente (depot-admin, depot-signature,
 * depot-proprietaire, depot-notifications).
 */
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.57.4";
import { ADRESSE, coordonnees, EMAIL_AFFICHE, RECEPTION, remplir, TEL } from "./coordonnees.ts";

// E-mails (domaine svmride.com vérifié chez Resend)
export const EXPEDITEUR = "SVM Ride <contact@svmride.com>";
/** Adresse qui reçoit les demandes (admin, « Infos du site ») : repère remplacé à l'envoi */
export const BOITE_SVM = RECEPTION;
/** E-mail affiché aux clients */
export const EMAIL_CONTACT = EMAIL_AFFICHE;
// Copie cachée au développeur pendant les tests ; vider la liste pour l'arrêter.
// Jamais pour les e-mails qui contiennent un code ou un contrat signé (voir sansCopie).
export const COPIE_DEV: string[] = ["salasvega@gmail.com"];
/** Téléphone (admin, « Infos du site ») : repère remplacé à l'envoi et dans les réponses */
export const TELEPHONE = TEL;
export const SITE = "https://svmride.com";
export const URL_ADMIN = `${SITE}/admin/depot-vente/dossiers`;
export const BUCKET_DOCS = "depot-documents";

const ORIGINES = ["https://svmride.com", "https://www.svmride.com", "https://svmride.netlify.app"];

export function cors(origin: string | null): Record<string, string> {
  const ok =
    origin &&
    (ORIGINES.includes(origin) ||
      /^https:\/\/[a-z0-9-]+--svmride\.netlify\.app$/.test(origin) ||
      /^http:\/\/localhost:\d+$/.test(origin));
  return {
    "Access-Control-Allow-Origin": ok ? origin! : ORIGINES[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
    Vary: "Origin",
  };
}

export function cleSecrete(): string {
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
    if (keys.default) return keys.default;
  } catch (_) { /* ignore */ }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
}

export function base(): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, cleSecrete(), { auth: { persistSession: false } });
}

/** Appel interne (déclencheurs de la base) : la clé secrète dans l'en-tête apikey. */
export function appelInterne(req: Request): boolean {
  const apikey = req.headers.get("apikey") ?? "";
  if (!apikey) return false;
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
    return Object.values(keys).includes(apikey);
  } catch (_) {
    return false;
  }
}

export class Erreur extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export function reponse(origin: string | null) {
  return (status: number, data: unknown) =>
    new Response(remplir(JSON.stringify(data)), { status, headers: { ...cors(origin), "Content-Type": "application/json" } });
}

/** Vérifie que l'appelant est un administrateur (jeton de session Supabase). */
export async function admin(db: SupabaseClient, req: Request): Promise<{ id: string; email: string }> {
  const jeton = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: u, error } = await db.auth.getUser(jeton);
  if (error || !u?.user) throw new Erreur(401, "admin", "Réservé à l'administration.");
  const { data: ok } = await db.rpc("est_admin_compte", { p_user: u.user.id });
  if (ok !== true) throw new Erreur(403, "admin", "Réservé à l'administration.");
  return { id: u.user.id, email: u.user.email ?? "admin" };
}

// --- Cryptographie ---
const enc = new TextEncoder();
export const hex = (b: ArrayBuffer | Uint8Array) =>
  [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
export async function sha256(donnees: string | Uint8Array): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", typeof donnees === "string" ? enc.encode(donnees) : donnees));
}
export const b64u = (o: Uint8Array) => btoa(String.fromCharCode(...o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
export function jetonAleatoire(octets = 32): string {
  return b64u(crypto.getRandomValues(new Uint8Array(octets)));
}
export function code6(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return String(n).padStart(6, "0");
}
/** Empreinte salée par la clé secrète du projet (codes, jetons). */
export async function empreinte(valeur: string, usage: string): Promise<string> {
  return sha256(`${usage}:${cleSecrete()}:${valeur}`);
}
export function egal(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
let cleHmac: CryptoKey | null = null;
async function cleSession(): Promise<CryptoKey> {
  cleHmac ??= await crypto.subtle.importKey("raw", enc.encode(`depot-session:${cleSecrete()}`),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return cleHmac;
}
/** Jeton de session signé : « email.expiration.signature ». */
export async function creerSession(email: string, heures: number): Promise<string> {
  const corps = `${b64u(enc.encode(email))}.${Date.now() + heures * 3600_000}`;
  const sig = b64u(new Uint8Array(await crypto.subtle.sign("HMAC", await cleSession(), enc.encode(corps))));
  return `${corps}.${sig}`;
}
export async function lireSession(jeton: string): Promise<string | null> {
  const [e, exp, sig] = String(jeton ?? "").split(".");
  if (!e || !exp || !sig || Number(exp) < Date.now()) return null;
  const attendu = b64u(new Uint8Array(await crypto.subtle.sign("HMAC", await cleSession(), enc.encode(`${e}.${exp}`))));
  if (!egal(attendu, sig)) return null;
  try {
    return new TextDecoder().decode(Uint8Array.from(atob(e.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)));
  } catch {
    return null;
  }
}

export function ip(req: Request): string {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("cf-connecting-ip") || "";
}

// --- Mise en forme ---
export const echapper = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const euros = (n: number | null | undefined) =>
  n == null ? "—" : `${Math.round(n).toLocaleString("fr-FR").replace(/ /g, " ")} €`;
export const dateFr = (iso: string | null | undefined) =>
  iso ? new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long", year: "numeric" }) : "—";

export function gabarit(contenu: string): string {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#F6F5F2;font-family:Arial,Helvetica,sans-serif;color:#111111">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F5F2;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #ECE9E0;border-radius:12px">
<tr><td style="padding:20px 24px;border-bottom:3px solid #B8902F;font-size:20px;font-weight:bold;letter-spacing:.5px">SVM RIDE</td></tr>
<tr><td style="padding:24px;font-size:15px;line-height:1.6">${contenu}</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #ECE9E0;font-size:12px;color:#5E5E5E">SVM Ride · ${ADRESSE} · ${TELEPHONE} · svmride.com</td></tr>
</table></td></tr></table></body></html>`;
}

export function bouton(url: string, libelle: string): string {
  return `<p style="margin:24px 0"><a href="${echapper(url)}" style="display:inline-block;background:#254893;color:#ffffff;text-decoration:none;font-weight:bold;padding:13px 22px;border-radius:10px">${echapper(libelle)}</a></p>`;
}

export interface Courriel {
  to: string | string[];
  subject: string;
  html: string;
  reply_to?: string;
  attachments?: { filename: string; content: string }[];
  /** true : pas de copie au développeur (codes, contrats signés) */
  sansCopie?: boolean;
}

export async function envoyer(m: Courriel): Promise<string | null> {
  const cle = Deno.env.get("RESEND_API_KEY");
  if (!cle) throw new Error("RESEND_API_KEY manquante");
  // Coordonnées à jour dans les destinataires et le texte
  await coordonnees();
  const { sansCopie, ...brut } = m;
  const message = {
    ...brut,
    to: Array.isArray(brut.to) ? brut.to.map((t) => remplir(t)) : remplir(brut.to),
    subject: remplir(brut.subject),
    html: remplir(brut.html, true),
    ...(brut.reply_to ? { reply_to: remplir(brut.reply_to) } : {}),
  };
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cle}` },
    body: JSON.stringify({ from: EXPEDITEUR, ...(!sansCopie && COPIE_DEV.length ? { bcc: COPIE_DEV } : {}), ...message }),
  });
  if (!r.ok) throw new Error(`Resend ${r.status} : ${(await r.text()).slice(0, 300)}`);
  const j = await r.json().catch(() => ({}));
  return (j as { id?: string }).id ?? null;
}

/**
 * Envoi unique : la clé est réservée dans depot_emails AVANT l'envoi (deux appels
 * simultanés ne peuvent pas envoyer tous les deux) ; un échec est consigné et
 * pourra être relancé.
 */
export async function envoyerUneFois(db: SupabaseClient, cle: string, dossierId: string | null, m: Courriel): Promise<boolean> {
  await coordonnees();
  const destinataire = remplir(Array.isArray(m.to) ? m.to.join(", ") : m.to);
  const { data: existant } = await db.from("depot_emails").select("id, statut").eq("cle", cle).maybeSingle();
  if (existant && existant.statut !== "erreur") return false;
  if (!existant) {
    const { error } = await db.from("depot_emails").insert({ cle, dossier_id: dossierId, destinataire, sujet: m.subject });
    if (error) return false; // déjà réservé par un autre appel
  }
  try {
    await envoyer(m);
    await db.from("depot_emails").update({ statut: "envoye", envoye_le: new Date().toISOString(), erreur: null })
      .eq("cle", cle);
    return true;
  } catch (e) {
    const { data } = await db.from("depot_emails").select("tentatives").eq("cle", cle).single();
    await db.from("depot_emails").update({ statut: "erreur", erreur: String(e).slice(0, 500), tentatives: (data?.tentatives ?? 0) + 1 })
      .eq("cle", cle);
    console.error("e-mail", cle, e);
    return false;
  }
}
