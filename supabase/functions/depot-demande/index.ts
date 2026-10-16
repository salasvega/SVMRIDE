/**
 * Fonction « depot-demande » : réception des demandes d'estimation de la page
 * « Vendre ma moto » (dépôt-vente, lot 1).
 *
 * Le navigateur n'écrit jamais directement dans la base :
 *  1. « preparer » : contrôle des champs, anti-abus (champ piège, délai de
 *     remplissage, 3 demandes par heure et par adresse IP, 3 par jour et par
 *     e-mail), création de la demande (invisible tant que l'envoi n'est pas
 *     terminé) et liens d'envoi à usage unique pour les photos ;
 *  2. le navigateur envoie les photos (déjà compressées) avec ces liens ;
 *  3. « finaliser » : rattache les photos, rend la demande visible dans
 *     l'admin, puis envoie l'accusé de réception au propriétaire et l'alerte
 *     interne, une seule fois chacun (même si l'appel est répété).
 * Aucune estimation automatique : SVM Ride répond sous 48 h ouvrées.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.57.4";

const BUCKET = "depot-photos";
const MAX_PHOTOS = 10;
const DELAI_MIN_MS = 3000;
const MAX_PAR_IP_HEURE = 3;
const MAX_PAR_EMAIL_JOUR = 3;
const VERSION_CONSENTEMENT = "depot-vente-2026-10-16";

// E-mails (domaine svmride.com vérifié chez Resend)
const EXPEDITEUR = "SVM Ride <contact@svmride.com>";
const BOITE_SVM = "contact@svmride.com";
// Copie cachée au développeur pendant les tests ; vider la liste pour l'arrêter.
const COPIE_DEV: string[] = ["salasvega@gmail.com"];
const TELEPHONE = "01 84 19 01 74";
const URL_ADMIN = "https://svmride.com/admin/depot-vente";

const ALLOWED_ORIGINS = ["https://svmride.com", "https://www.svmride.com", "https://svmride.netlify.app"];

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

class Erreur extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

const ETATS: Record<string, string> = {
  excellent: "Excellent", tres_bon: "Très bon", bon: "Bon", correct: "Correct", a_reviser: "À réviser",
};
const ENTRETIENS: Record<string, string> = {
  complet: "Carnet à jour (factures)", partiel: "Entretien partiel", inconnu: "Ne sait pas",
};
const EXTENSIONS = ["jpg", "jpeg", "png", "webp", "heic", "heif"];

// --- Jeton de finalisation : HMAC-SHA256 de l'identifiant de la demande ---
const b64u = (o: Uint8Array) => btoa(String.fromCharCode(...o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
let cleHmac: CryptoKey | null = null;
async function cle(): Promise<CryptoKey> {
  cleHmac ??= await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(`depot-demande:${getSecretKey()}`),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  return cleHmac;
}
async function signer(texte: string): Promise<string> {
  return b64u(new Uint8Array(await crypto.subtle.sign("HMAC", await cle(), new TextEncoder().encode(texte))));
}
function egal(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

// --- Contrôle des champs ---
const texte = (v: unknown, max: number, obligatoire: boolean, libelle: string): string | null => {
  const s = String(v ?? "").replace(/\s+/g, " ").trim();
  if (!s) {
    if (obligatoire) throw new Erreur(400, "champ", `Le champ « ${libelle} » est obligatoire.`);
    return null;
  }
  if (s.length > max) throw new Erreur(400, "champ", `Le champ « ${libelle} » est trop long.`);
  return s;
};
const entier = (v: unknown, min: number, max: number, obligatoire: boolean, libelle: string): number | null => {
  const s = String(v ?? "").replace(/[\s.  ]/g, "");
  if (!s) {
    if (obligatoire) throw new Erreur(400, "champ", `Le champ « ${libelle} » est obligatoire.`);
    return null;
  }
  const n = Number(s);
  if (!Number.isInteger(n) || n < min || n > max) throw new Erreur(400, "champ", `Le champ « ${libelle} » n'est pas valide.`);
  return n;
};

function controler(d: Record<string, unknown>) {
  const email = texte(d.email, 254, true, "E-mail")!.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Erreur(400, "champ", "L'adresse e-mail n'est pas valide.");
  const telephone = texte(d.telephone, 30, true, "Téléphone")!;
  const chiffres = telephone.replace(/\D/g, "");
  if (chiffres.length < 9 || chiffres.length > 15 || !/^[+\d\s().-]+$/.test(telephone)) {
    throw new Erreur(400, "champ", "Le numéro de téléphone n'est pas valide.");
  }
  const etat = String(d.etat ?? "");
  if (!(etat in ETATS)) throw new Erreur(400, "champ", "Indiquez l'état général de la moto.");
  const entretien = d.entretien ? String(d.entretien) : null;
  if (entretien && !(entretien in ENTRETIENS)) throw new Erreur(400, "champ", "Le champ « Entretien » n'est pas valide.");
  const immat = texte(d.immatriculation, 20, false, "Immatriculation");
  return {
    prenom: texte(d.prenom, 80, true, "Prénom")!,
    nom: texte(d.nom, 80, true, "Nom")!,
    email,
    telephone,
    marque: texte(d.marque, 60, true, "Marque")!,
    modele: texte(d.modele, 80, true, "Modèle")!,
    version: texte(d.version, 80, false, "Version"),
    annee: entier(d.annee, 1950, new Date().getFullYear() + 1, true, "Année")!,
    kilometrage: entier(d.kilometrage, 0, 1_000_000, true, "Kilométrage")!,
    immatriculation: immat ? immat.toUpperCase() : null,
    etat,
    entretien,
    prix_souhaite: entier(d.prix_souhaite, 0, 1_000_000, false, "Prix souhaité"),
    commentaire: d.commentaire ? String(d.commentaire).trim().slice(0, 3000) || null : null,
  };
}

// --- E-mails ---
const echapper = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const euros = (n: number | null) => (n == null ? "Non précisé" : `${n.toLocaleString("fr-FR")} €`);
const km = (n: number) => `${n.toLocaleString("fr-FR")} km`;

function gabarit(contenu: string): string {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#F6F5F2;font-family:Arial,Helvetica,sans-serif;color:#111111">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F5F2;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #ECE9E0;border-radius:12px">
<tr><td style="padding:20px 24px;border-bottom:3px solid #B8902F;font-size:20px;font-weight:bold;letter-spacing:.5px">SVM RIDE</td></tr>
<tr><td style="padding:24px;font-size:15px;line-height:1.6">${contenu}</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #ECE9E0;font-size:12px;color:#5E5E5E">SVM Ride · 310 Avenue Roger Salengro, 92370 Chaville · ${TELEPHONE} · svmride.com</td></tr>
</table></td></tr></table></body></html>`;
}

type Demande = {
  id: string; reference: string; prenom: string; nom: string; email: string; telephone: string;
  marque: string; modele: string; version: string | null; annee: number; kilometrage: number;
  immatriculation: string | null; etat: string; entretien: string | null; prix_souhaite: number | null;
  commentaire: string | null; photos: { path: string }[]; created_at: string;
};

function accuseHtml(d: Demande): string {
  return gabarit(`
<p>Bonjour ${echapper(d.prenom)},</p>
<p>Merci de nous confier votre projet de vente. Nous avons bien reçu votre demande d'estimation
<strong>${echapper(d.reference)}</strong> pour votre <strong>${echapper(d.marque)} ${echapper(d.modele)}</strong>
(${d.annee}, ${km(d.kilometrage)}).</p>
<p>Un conseiller SVM Ride étudie votre moto et revient vers vous <strong>sous 48 h ouvrées</strong>
pour en parler avec vous. Il n'y a pas d'estimation automatique : le prix de vente conseillé et les
conditions du dépôt-vente vous sont présentés de vive voix, avant tout engagement.</p>
<p>Une question en attendant ? Répondez simplement à cet e-mail ou appelez-nous au ${TELEPHONE}.</p>
<p style="margin-top:24px">À très vite,<br>L'équipe SVM Ride</p>
<p style="margin-top:24px;font-size:12px;color:#5E5E5E">Vos informations servent uniquement à traiter votre demande. Elles sont conservées
au plus 3 ans si votre moto n'est pas confiée à SVM Ride, et vos photos 12 mois au plus. Vous pouvez à tout moment
demander à les consulter ou à les supprimer en écrivant à ${BOITE_SVM}.</p>`);
}

function alerteHtml(d: Demande): string {
  const ligne = (l: string, v: string) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#5E5E5E;vertical-align:top;white-space:nowrap">${l}</td><td style="padding:4px 0">${v}</td></tr>`;
  return gabarit(`
<p style="margin-top:0"><strong>Nouvelle demande de dépôt-vente ${echapper(d.reference)}</strong></p>
<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px">
${ligne("Propriétaire", `${echapper(d.prenom)} ${echapper(d.nom)}`)}
${ligne("E-mail", `<a href="mailto:${echapper(d.email)}">${echapper(d.email)}</a>`)}
${ligne("Téléphone", `<a href="tel:${echapper(d.telephone.replace(/[^\d+]/g, ""))}">${echapper(d.telephone)}</a>`)}
${ligne("Moto", `${echapper(d.marque)} ${echapper(d.modele)}${d.version ? ` ${echapper(d.version)}` : ""}`)}
${ligne("Année", String(d.annee))}
${ligne("Kilométrage", km(d.kilometrage))}
${ligne("État", ETATS[d.etat] ?? echapper(d.etat))}
${ligne("Entretien", d.entretien ? ENTRETIENS[d.entretien] : "Non précisé")}
${ligne("Immatriculation", d.immatriculation ? echapper(d.immatriculation) : "Non précisée")}
${ligne("Prix souhaité", euros(d.prix_souhaite))}
${ligne("Photos", `${d.photos.length} (dans l'admin)`)}
</table>
${d.commentaire ? `<p><strong>Commentaire</strong><br>${echapper(d.commentaire).replace(/\n/g, "<br>")}</p>` : ""}
<p style="margin-top:20px"><a href="${URL_ADMIN}?demande=${d.id}" style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:bold">Ouvrir la demande dans l'admin</a></p>
<p style="font-size:13px;color:#5E5E5E">Délai de réponse annoncé au propriétaire : 48 h ouvrées. Répondre à cet e-mail écrit directement au propriétaire.</p>`);
}

async function envoyerEmail(message: Record<string, unknown>): Promise<void> {
  const cleResend = Deno.env.get("RESEND_API_KEY");
  if (!cleResend) throw new Error("RESEND_API_KEY manquante");
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cleResend}` },
    body: JSON.stringify({ from: EXPEDITEUR, ...(COPIE_DEV.length ? { bcc: COPIE_DEV } : {}), ...message }),
  });
  if (!r.ok) throw new Error(`Resend ${r.status} : ${await r.text()}`);
}

// Envoie un e-mail une seule fois : la date est posée AVANT l'envoi, de façon
// atomique (deux appels simultanés ne peuvent pas envoyer tous les deux).
async function envoyerUneFois(
  db: SupabaseClient, id: string, colonne: "accuse_envoye_le" | "alerte_envoyee_le", envoi: () => Promise<void>,
) {
  const { data } = await db.from("depot_demandes").update({ [colonne]: new Date().toISOString() })
    .eq("id", id).is(colonne, null).select("id");
  if (!data?.length) return;
  try {
    await envoi();
  } catch (e) {
    console.error(`depot-demande : ${colonne} non envoyé`, id, e);
    await db.from("depot_demandes").update({ [colonne]: null }).eq("id", id);
  }
}

async function finaliser(db: SupabaseClient, id: string): Promise<string> {
  const { data: d0, error } = await db.from("depot_demandes").select("id, reference, envoi_termine").eq("id", id).single();
  if (error || !d0) throw new Erreur(404, "introuvable", "Demande introuvable.");

  if (!d0.envoi_termine) {
    const { data: fichiers } = await db.storage.from(BUCKET).list(id, { limit: 100 });
    const photos = (fichiers ?? [])
      .filter((f) => f.name && !f.name.startsWith("."))
      .sort((a, b) => a.name.localeCompare(b.name, "fr", { numeric: true }))
      .map((f) => ({ path: `${id}/${f.name}`, taille: (f.metadata as { size?: number } | null)?.size ?? null }));
    await db.from("depot_demandes").update({ photos, envoi_termine: true }).eq("id", id).eq("envoi_termine", false);
  }

  const { data: d } = await db.from("depot_demandes").select("*").eq("id", id).single();
  const demande = d as Demande;
  await envoyerUneFois(db, id, "accuse_envoye_le", () =>
    envoyerEmail({
      to: demande.email,
      reply_to: BOITE_SVM,
      subject: `Votre demande d'estimation ${demande.reference} — SVM Ride`,
      html: accuseHtml(demande),
    }));
  await envoyerUneFois(db, id, "alerte_envoyee_le", () =>
    envoyerEmail({
      to: BOITE_SVM,
      reply_to: demande.email,
      subject: `Dépôt-vente ${demande.reference} — ${demande.marque} ${demande.modele} ${demande.annee}`,
      html: alerteHtml(demande),
    }));
  return demande.reference;
}

const json = (status: number, corps: unknown, cors: Record<string, string>) =>
  new Response(JSON.stringify(corps), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: cors });
  if (req.method !== "POST") return json(405, { error: "methode" }, cors);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, getSecretKey(), { auth: { persistSession: false } });

  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "");

    if (action === "preparer") {
      // Robots : champ piège rempli ou formulaire rempli trop vite → réponse
      // normale, mais rien n'est enregistré ni envoyé.
      if (String(body.piege ?? "") !== "" || Number(body.duree_ms ?? 0) < DELAI_MIN_MS) {
        return json(200, { ok: true, reference: null, envois: [] }, cors);
      }
      if (body.consentement !== true) {
        throw new Erreur(400, "consentement", "Merci d'accepter l'utilisation de vos données pour traiter votre demande.");
      }
      const champs = controler(body.donnees ?? {});
      const photos = Array.isArray(body.photos) ? body.photos.slice(0, MAX_PHOTOS + 1) : [];
      if (photos.length > MAX_PHOTOS) throw new Erreur(400, "photos", `${MAX_PHOTOS} photos au maximum.`);
      const exts = photos.map((p: { ext?: string }) => String(p?.ext ?? "").toLowerCase().replace(/[^a-z]/g, ""));
      if (exts.some((e: string) => !EXTENSIONS.includes(e))) {
        throw new Erreur(400, "format", "Formats de photo acceptés : JPG, PNG, WEBP ou HEIC.");
      }

      // Limites anti-abus
      const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "inconnue";
      const ipEmpreinte = await signer(`ip:${ip}`);
      const depuis1h = new Date(Date.now() - 3600_000).toISOString();
      const depuis24h = new Date(Date.now() - 86400_000).toISOString();
      const [{ count: parIp }, { count: parEmail }] = await Promise.all([
        db.from("depot_demandes").select("id", { count: "exact", head: true })
          .eq("ip_empreinte", ipEmpreinte).gte("created_at", depuis1h),
        db.from("depot_demandes").select("id", { count: "exact", head: true })
          .ilike("email", champs.email.replace(/[\\%_]/g, (c) => `\\${c}`)).gte("created_at", depuis24h),
      ]);
      if ((parIp ?? 0) >= MAX_PAR_IP_HEURE || (parEmail ?? 0) >= MAX_PAR_EMAIL_JOUR) {
        throw new Erreur(429, "limite", `Plusieurs demandes ont déjà été envoyées. Réessayez plus tard ou appelez-nous au ${TELEPHONE}.`);
      }

      const { data: cree, error } = await db.from("depot_demandes").insert({
        ...champs,
        consentement_version: VERSION_CONSENTEMENT,
        consentement_le: new Date().toISOString(),
        ip_empreinte: ipEmpreinte,
      }).select("id, reference").single();
      if (error || !cree) throw error ?? new Error("insertion");

      if (!exts.length) {
        const reference = await finaliser(db, cree.id);
        return json(200, { ok: true, reference, envois: [] }, cors);
      }

      const envois = [];
      for (let i = 0; i < exts.length; i++) {
        const ext = exts[i] === "jpeg" ? "jpg" : exts[i];
        const chemin = `${cree.id}/photo-${String(i + 1).padStart(2, "0")}.${ext}`;
        const { data, error: e } = await db.storage.from(BUCKET).createSignedUploadUrl(chemin);
        if (e || !data) throw e ?? new Error("lien d'envoi");
        envois.push({ path: data.path, token: data.token });
      }
      return json(200, { ok: true, id: cree.id, jeton: await signer(`finaliser:${cree.id}`), envois }, cors);
    }

    if (action === "finaliser") {
      const id = String(body.id ?? "");
      if (!/^[0-9a-f-]{36}$/.test(id) || !egal(String(body.jeton ?? ""), await signer(`finaliser:${id}`))) {
        throw new Erreur(403, "jeton", "Envoi non reconnu. Rechargez la page et réessayez.");
      }
      const reference = await finaliser(db, id);
      return json(200, { ok: true, reference }, cors);
    }

    throw new Erreur(400, "action", "Action inconnue.");
  } catch (e) {
    if (e instanceof Erreur) return json(e.status, { error: e.code, message: e.message }, cors);
    console.error("depot-demande", e);
    return json(500, { error: "serveur", message: `Une erreur est survenue. Réessayez ou appelez-nous au ${TELEPHONE}.` }, cors);
  }
});
