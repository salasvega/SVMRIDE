/**
 * Fonction « financing-dossier » : seul point d'accès des clients à leur
 * dossier de financement (page /financement/dossier).
 *
 * Depuis le 16/10/2026, la table user_financing_profiles et l'espace de
 * fichiers financing-documents ne sont plus accessibles au public. Le client
 * s'identifie avec son e-mail ET un code d'accès personnel :
 *  - le code est donné une seule fois, à la création du dossier ;
 *  - il est stocké haché (jamais en clair) ;
 *  - au-delà de 5 essais, l'accès est bloqué 15 minutes ; chaque essai est
 *    réservé dans la base avant vérification (fonction financement_reserver_essai),
 *    ce qui empêche de contourner la limite par des essais simultanés ;
 *  - une fois le code vérifié, le client reçoit un jeton de session signé
 *    (2 h), utilisé pour toutes les actions suivantes ;
 *  - l'admin peut générer un nouveau code (action « admin-reset-code »),
 *    ce qui invalide aussi les sessions en cours.
 *
 * Les pièces sont envoyées par lien d'envoi à usage unique et consultées par
 * lien temporaire de 5 minutes. Le client ne voit jamais les notes admin.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.57.4";

const BUCKET = "financing-documents";
const MAX_ESSAIS = 5;
const BLOCAGE_MINUTES = 15;
const LIEN_LECTURE_SECONDES = 300;
const SESSION_SECONDES = 2 * 3600;

const ALLOWED_ORIGINS = [
  "https://svmride.com",
  "https://www.svmride.com",
  "https://svmride.netlify.app",
];

function corsHeaders(origin: string | null): Record<string, string> {
  const ok =
    origin &&
    (ALLOWED_ORIGINS.includes(origin) ||
      /^https:\/\/[a-z0-9-]+--svmride\.netlify\.app$/.test(origin) ||
      /^http:\/\/localhost:\d+$/.test(origin));
  return {
    "Access-Control-Allow-Origin": ok ? origin! : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
    Vary: "Origin",
  };
}

function getSecretKey(): string {
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
    if (keys.default) return keys.default;
  } catch (_) { /* ignore */ }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
}

// Pièces justificatives : champ du dossier → nom de fichier
const PIECES: Record<string, string> = {
  id_card_front: "piece_identite_recto",
  id_card_back: "piece_identite_verso",
  driver_license_front: "permis_conduire_recto",
  driver_license_back: "permis_conduire_verso",
  proof_of_residence: "justificatif_domicile",
  payslip_1: "bulletin_salaire_1",
  payslip_2: "bulletin_salaire_2",
  payslip_3: "bulletin_salaire_3",
  tax_notice: "avis_imposition",
  rib: "rib",
  hosting_certificate: "attestation_hebergement",
  host_id_card: "piece_identite_hebergeur",
};

// Champs que le client peut remplir lui-même
const CHAMPS_CLIENT = [
  "last_name", "first_name", "birth_postal_code", "birth_date", "current_address",
  "phone_number", "email", "housing_entry_date", "housing_status", "rent_or_credit_amount",
  "job_title", "employment_start_date", "contract_type", "monthly_net_salary",
  "other_charges_or_credits", "other_income_sources", "marital_status", "dependents_count",
  "vehicle_to_finance", "desired_duration", "financing_amount", "comments",
];

// Champs jamais renvoyés au client
const CHAMPS_CACHES = ["admin_notes", "access_code_hash", "access_failed_attempts", "access_locked_until"];

const EXTENSIONS: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
  heic: "image/heic", heif: "image/heif", pdf: "application/pdf",
};

class Erreur extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

const normEmail = (e: unknown) => String(e ?? "").trim().toLowerCase();
// Recherche insensible à la casse sans jokers SQL (« _ » et « % » sont fréquents dans les e-mails)
const motifExact = (e: string) => e.replace(/[\\%_]/g, (c) => `\\${c}`);
const emailValide = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 254;

// Code lisible : 8 caractères sans 0/O/1/I, présenté « XXXX-XXXX »
function nouveauCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const octets = crypto.getRandomValues(new Uint8Array(8));
  const brut = Array.from(octets, (o) => alphabet[o % alphabet.length]).join("");
  return `${brut.slice(0, 4)}-${brut.slice(4)}`;
}
const normCode = (c: unknown) => String(c ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");

async function sha256(texte: string): Promise<string> {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texte));
  return Array.from(new Uint8Array(h), (b) => b.toString(16).padStart(2, "0")).join("");
}
async function hacherCode(code: string): Promise<string> {
  const sel = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
  return `${sel}:${await sha256(`${sel}:${normCode(code)}`)}`;
}
async function codeCorrect(code: string, stocke: string | null): Promise<boolean> {
  if (!stocke || !stocke.includes(":")) return false;
  const [sel, attendu] = stocke.split(":");
  const recu = await sha256(`${sel}:${normCode(code)}`);
  // comparaison à temps constant
  if (recu.length !== attendu.length) return false;
  let diff = 0;
  for (let i = 0; i < recu.length; i++) diff |= recu.charCodeAt(i) ^ attendu.charCodeAt(i);
  return diff === 0;
}

// --- Jeton de session : base64url(charge).base64url(signature HMAC-SHA256) ---
const b64u = (o: Uint8Array) => btoa(String.fromCharCode(...o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const deb64u = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
let cleHmac: CryptoKey | null = null;
async function cle(): Promise<CryptoKey> {
  cleHmac ??= await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(`financing-dossier:${getSecretKey()}`),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"],
  );
  return cleHmac;
}
// Le « sel » du code fait partie du jeton : un nouveau code invalide les sessions
const selDuCode = (hash: string | null) => (hash ?? "").split(":")[0].slice(0, 12);
async function creerSession(id: string, hash: string | null): Promise<string> {
  const charge = new TextEncoder().encode(JSON.stringify({ id, s: selDuCode(hash), exp: Math.floor(Date.now() / 1000) + SESSION_SECONDES }));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await cle(), charge));
  return `${b64u(charge)}.${b64u(sig)}`;
}
async function lireSession(jeton: string): Promise<{ id: string; s: string } | null> {
  const [c, g] = jeton.split(".");
  if (!c || !g) return null;
  try {
    const charge = deb64u(c);
    if (!(await crypto.subtle.verify("HMAC", await cle(), deb64u(g), charge))) return null;
    const v = JSON.parse(new TextDecoder().decode(charge));
    if (typeof v.id !== "string" || typeof v.exp !== "number" || v.exp < Date.now() / 1000) return null;
    return v;
  } catch {
    return null;
  }
}

function pourClient(dossier: Record<string, unknown>) {
  const copie = { ...dossier };
  for (const c of CHAMPS_CACHES) delete copie[c];
  return copie;
}

type Dossier = Record<string, unknown> & { id: string; user_email: string; status: string; access_code_hash: string | null };
const SESSION_EXPIREE = () => new Erreur(401, "session", "Votre session a expiré. Saisissez à nouveau votre e-mail et votre code.");

// Dossier du client : par jeton de session, ou par e-mail + code (connexion)
async function dossierDuClient(db: SupabaseClient, body: Record<string, unknown>): Promise<Dossier> {
  if (typeof body.session === "string" && body.session) {
    const s = await lireSession(body.session);
    if (!s) throw SESSION_EXPIREE();
    const { data: d, error } = await db.from("user_financing_profiles").select("*").eq("id", s.id).maybeSingle();
    if (error) throw error;
    if (!d || selDuCode(d.access_code_hash) !== s.s) throw SESSION_EXPIREE();
    return d as Dossier;
  }

  const email = normEmail(body.email);
  const code = normCode(body.code);
  if (!emailValide(email) || code.length !== 8) {
    throw new Erreur(401, "acces_refuse", "E-mail ou code d'accès incorrect.");
  }
  const { data: d, error } = await db
    .from("user_financing_profiles")
    .select("*")
    .ilike("user_email", motifExact(email))
    .maybeSingle();
  if (error) throw error;
  if (!d) throw new Erreur(401, "acces_refuse", "E-mail ou code d'accès incorrect.");
  if (!d.access_code_hash) {
    throw new Erreur(403, "code_a_demander",
      "Votre dossier a été créé avant la mise en place des codes d'accès. Contactez SVM Ride au 01 84 19 01 74 pour recevoir votre code.");
  }

  // Réserve l'essai AVANT de vérifier le code (atomique dans la base)
  const { data: essai, error: e2 } = await db.rpc("financement_reserver_essai", { p_id: d.id }).single();
  if (e2) throw e2;
  const { essais, bloque_jusqua } = essai as { essais: number; bloque_jusqua: string | null };
  const bloque = new Erreur(429, "bloque", `Trop d'essais. Réessayez dans ${BLOCAGE_MINUTES} minutes ou contactez SVM Ride.`);
  if (bloque_jusqua && new Date(bloque_jusqua) > new Date()) throw bloque;
  if (essais > MAX_ESSAIS) {
    await db.from("user_financing_profiles")
      .update({ access_locked_until: new Date(Date.now() + BLOCAGE_MINUTES * 60_000).toISOString() })
      .eq("id", d.id).is("access_locked_until", null);
    throw bloque;
  }
  if (!(await codeCorrect(code, d.access_code_hash))) {
    throw new Erreur(401, "acces_refuse", "E-mail ou code d'accès incorrect.");
  }
  await db.from("user_financing_profiles").update({ access_failed_attempts: 0, access_locked_until: null }).eq("id", d.id);
  return d as Dossier;
}

const nonSoumis = (d: { status: string }) => {
  if (d.status === "submitted") {
    throw new Erreur(409, "deja_soumis", "Ce dossier a été soumis. Rouvrez-le pour le modifier.");
  }
};

function champsPropres(entree: Record<string, unknown>) {
  const sortie: Record<string, unknown> = {};
  for (const c of CHAMPS_CLIENT) {
    if (!(c in entree)) continue;
    let v = entree[c];
    if (typeof v === "string") v = v.slice(0, 2000);
    if (["birth_date", "housing_entry_date", "employment_start_date"].includes(c) && !v) v = null;
    if (["rent_or_credit_amount", "monthly_net_salary", "financing_amount"].includes(c)) {
      const n = Number(v);
      v = Number.isFinite(n) && n >= 0 ? n : 0;
    }
    if (["dependents_count", "desired_duration"].includes(c)) {
      const n = Math.trunc(Number(v));
      v = Number.isFinite(n) && n >= 0 ? n : 0;
    }
    sortie[c] = v;
  }
  return sortie;
}

function manquants(d: Record<string, unknown>): string | null {
  const obligatoires = [
    "last_name", "first_name", "birth_postal_code", "birth_date", "current_address", "phone_number",
    "email", "housing_entry_date", "housing_status", "job_title", "employment_start_date",
    "contract_type", "monthly_net_salary", "marital_status", "vehicle_to_finance", "desired_duration",
    "id_card_front", "id_card_back", "driver_license_front", "driver_license_back", "proof_of_residence",
    "payslip_1", "payslip_2", "payslip_3", "tax_notice", "rib",
  ];
  if (d.housing_status === "hébergé") obligatoires.push("hosting_certificate", "host_id_card");
  return obligatoires.find((c) => !d[c]) ?? null;
}

// Enregistre les champs saisis par le client (rien à faire s'il n'y en a pas)
async function majChamps(db: SupabaseClient, d: Dossier, entree: unknown) {
  const champs = champsPropres((entree ?? {}) as Record<string, unknown>);
  if (!Object.keys(champs).length) return d;
  const { data, error } = await db.from("user_financing_profiles").update(champs).eq("id", d.id).select("*").single();
  if (error) throw error;
  return data as Record<string, unknown>;
}

function fichiersDuDossier(d: Record<string, unknown>): string[] {
  return Object.keys(PIECES).map((k) => d[k]).filter((p): p is string => typeof p === "string" && p.length > 0);
}

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req.headers.get("Origin"));
  const json = (status: number, data: unknown) =>
    new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json(405, { error: "methode", message: "Méthode non autorisée." });

  const db = createClient(Deno.env.get("SUPABASE_URL")!, getSecretKey(), { auth: { persistSession: false } });

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const action = String(body.action ?? "");

    switch (action) {
      // Création d'un dossier : renvoie le code d'accès, affiché une seule fois
      case "create": {
        const email = normEmail(body.email);
        if (!emailValide(email)) throw new Erreur(400, "email", "Adresse e-mail invalide.");
        const { data: existant } = await db.from("user_financing_profiles").select("id").ilike("user_email", motifExact(email)).maybeSingle();
        if (existant) {
          throw new Erreur(409, "existe", "Un dossier existe déjà pour cette adresse : saisissez votre code d'accès.");
        }
        const code = nouveauCode();
        const initial = champsPropres((body.profile ?? {}) as Record<string, unknown>);
        const { data, error } = await db.from("user_financing_profiles").insert({
          ...initial,
          user_email: email,
          email,
          status: "draft",
          is_complete: false,
          access_code_hash: await hacherCode(code),
        }).select("*").single();
        if (error) throw error;
        return json(200, { code, session: await creerSession(data.id, data.access_code_hash), profile: pourClient(data) });
      }

      case "open": {
        const d = await dossierDuClient(db, body);
        return json(200, { session: await creerSession(d.id, d.access_code_hash), profile: pourClient(d) });
      }

      // Liens de consultation temporaires de toutes les pièces, en un seul appel
      case "file-urls": {
        const d = await dossierDuClient(db, body);
        const urls: Record<string, string> = {};
        const champs = Object.keys(PIECES).filter((k) => typeof d[k] === "string" && d[k]);
        if (champs.length) {
          const { data, error } = await db.storage.from(BUCKET)
            .createSignedUrls(champs.map((k) => d[k] as string), LIEN_LECTURE_SECONDES);
          if (error) throw error;
          data.forEach((r, i) => { if (r.signedUrl) urls[champs[i]] = r.signedUrl; });
        }
        return json(200, { urls });
      }

      case "save": {
        const d = await dossierDuClient(db, body);
        nonSoumis(d);
        return json(200, { profile: pourClient(await majChamps(db, d, body.profile)) });
      }

      case "submit": {
        const d = await dossierDuClient(db, body);
        nonSoumis(d);
        const maj = await majChamps(db, d, body.profile);
        const manque = manquants(maj);
        if (manque) throw new Erreur(400, "incomplet", `Champ ou document manquant : ${manque}.`);
        const { data, error } = await db.from("user_financing_profiles")
          .update({ status: "submitted", is_complete: true, submitted_at: new Date().toISOString() })
          .eq("id", d.id).select("*").single();
        if (error) throw error;
        return json(200, { profile: pourClient(data) });
      }

      case "reopen": {
        const d = await dossierDuClient(db, body);
        const { data, error } = await db.from("user_financing_profiles")
          .update({ status: "draft", is_complete: false, submitted_at: null })
          .eq("id", d.id).select("*").single();
        if (error) throw error;
        return json(200, { profile: pourClient(data) });
      }

      case "delete": {
        const d = await dossierDuClient(db, body);
        const fichiers = fichiersDuDossier(d);
        if (fichiers.length) await db.storage.from(BUCKET).remove(fichiers);
        const { error } = await db.from("user_financing_profiles").delete().eq("id", d.id);
        if (error) throw error;
        return json(200, { ok: true });
      }

      // Lien d'envoi à usage unique pour une pièce
      case "upload-url": {
        const d = await dossierDuClient(db, body);
        nonSoumis(d);
        const champ = String(body.field ?? "");
        if (!(champ in PIECES)) throw new Erreur(400, "champ", "Document inconnu.");
        const ext = String(body.ext ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
        if (!(ext in EXTENSIONS)) throw new Erreur(400, "format", "Formats acceptés : JPG, PNG, WEBP, HEIC ou PDF.");
        const chemin = `${d.id}/${PIECES[champ]}_${Date.now()}.${ext}`;
        const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(chemin);
        if (error) throw error;
        return json(200, { path: data.path, token: data.token });
      }

      // Rattache une pièce envoyée au dossier (et supprime l'ancienne)
      case "attach": {
        const d = await dossierDuClient(db, body);
        nonSoumis(d);
        const champ = String(body.field ?? "");
        const chemin = String(body.path ?? "");
        if (!(champ in PIECES)) throw new Erreur(400, "champ", "Document inconnu.");
        const dossierFichier = `${d.id}/`;
        if (!chemin.startsWith(dossierFichier) || chemin.includes("..")) throw new Erreur(400, "chemin", "Fichier invalide.");
        const nom = chemin.slice(dossierFichier.length);
        const { data: liste } = await db.storage.from(BUCKET).list(d.id, { search: nom, limit: 1 });
        if (!liste?.some((f) => f.name === nom)) throw new Erreur(400, "absent", "Le fichier n'a pas été reçu, réessayez.");
        const ancien = d[champ];
        const { data, error } = await db.from("user_financing_profiles").update({ [champ]: chemin }).eq("id", d.id).select("*").single();
        if (error) throw error;
        if (typeof ancien === "string" && ancien && ancien !== chemin) await db.storage.from(BUCKET).remove([ancien]);
        return json(200, { profile: pourClient(data) });
      }

      // Lien de consultation temporaire d'une pièce du dossier
      case "file-url": {
        const d = await dossierDuClient(db, body);
        const champ = String(body.field ?? "");
        const chemin = d[champ];
        if (!(champ in PIECES) || typeof chemin !== "string" || !chemin) throw new Erreur(404, "absent", "Document introuvable.");
        const { data, error } = await db.storage.from(BUCKET).createSignedUrl(chemin, LIEN_LECTURE_SECONDES);
        if (error) throw error;
        return json(200, { url: data.signedUrl });
      }

      case "delete-file": {
        const d = await dossierDuClient(db, body);
        nonSoumis(d);
        const champ = String(body.field ?? "");
        const chemin = d[champ];
        if (!(champ in PIECES)) throw new Erreur(400, "champ", "Document inconnu.");
        if (typeof chemin === "string" && chemin) await db.storage.from(BUCKET).remove([chemin]);
        const { data, error } = await db.from("user_financing_profiles").update({ [champ]: "" }).eq("id", d.id).select("*").single();
        if (error) throw error;
        return json(200, { profile: pourClient(data) });
      }

      // Admin : nouveau code d'accès pour un client (ex. dossier créé avant les codes)
      case "admin-reset-code": {
        const jeton = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
        const { data: u, error: eu } = await db.auth.getUser(jeton);
        if (eu || !u?.user) throw new Erreur(401, "admin", "Réservé à l'administration.");
        const id = String(body.profileId ?? "");
        const code = nouveauCode();
        const { error } = await db.from("user_financing_profiles").update({
          access_code_hash: await hacherCode(code),
          access_failed_attempts: 0,
          access_locked_until: null,
        }).eq("id", id);
        if (error) throw error;
        return json(200, { code });
      }

      default:
        throw new Erreur(400, "action", "Action inconnue.");
    }
  } catch (e) {
    if (e instanceof Erreur) return json(e.status, { error: e.code, message: e.message });
    console.error("financing-dossier", e);
    return json(500, { error: "serveur", message: "Une erreur est survenue. Réessayez dans un instant." });
  }
});
