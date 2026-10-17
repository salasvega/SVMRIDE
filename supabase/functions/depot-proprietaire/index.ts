/**
 * Fonction « depot-proprietaire » : espace « Suivre ma vente » du déposant.
 *
 *  - code      : e-mail → code à 6 chiffres (10 min), seulement si un dossier existe ;
 *                réponse identique dans tous les cas (on ne révèle pas qui est client)
 *  - connexion : e-mail + code (5 essais, puis blocage 15 min) → session signée de 12 h,
 *                ou de 30 jours si « Rester connecté sur cet appareil » est coché
 *  - dossiers  : dossiers du déposant, sans les données internes
 *  - document  : lien temporaire (5 min) vers un document partagé
 *  - demande   : rappel, prolongation, reprise anticipée, nouveau prix, question
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.57.4";
import {
  base, BUCKET_DOCS, code6, cors, creerSession, echapper, egal, empreinte, envoyer, Erreur, gabarit, lireSession,
  reponse, TELEPHONE,
} from "../_shared/depot-commun.ts";

const CODE_MINUTES = 10;
const ESSAIS = 5;
const BLOCAGE_MIN = 15;
const ENVOIS_PAR_HEURE = 5;
const SESSION_HEURES = 12;
const SESSION_LONGUE_HEURES = 30 * 24;
const STATUTS_VISIBLES = ["a_signer", "actif", "vendu", "resilie", "expire", "cloture"];

const normEmail = (e: unknown) => String(e ?? "").trim().toLowerCase();
const emailValide = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 254;

async function dossiersDe(db: SupabaseClient, email: string) {
  const { data } = await db.from("depot_dossiers").select("*").eq("prop_email", email)
    .in("statut_mandat", STATUTS_VISIBLES).order("created_at", { ascending: false });
  return (data ?? []) as Record<string, any>[];
}

async function session(req: Request): Promise<string> {
  const jeton = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const email = await lireSession(jeton);
  if (!email) throw new Erreur(401, "session", "Votre session a expiré. Reconnectez-vous avec votre e-mail.");
  return email;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: cors(origin) });
  const json = reponse(origin);
  try {
    if (req.method !== "POST") throw new Erreur(405, "methode", "Méthode non autorisée.");
    const db = base();
    const body = (await req.json().catch(() => ({}))) as Record<string, any>;

    switch (String(body.action ?? "")) {
      case "code": {
        const email = normEmail(body.email);
        if (!emailValide(email)) throw new Erreur(400, "email", "Adresse e-mail non valide.");
        const neutre = { ok: true, message: "Si un dossier de dépôt-vente est associé à cette adresse, vous allez recevoir un code par e-mail." };
        const dossiers = await dossiersDe(db, email);
        if (!dossiers.length) return json(200, neutre);
        const { data: acces } = await db.from("depot_acces").select("*").eq("email", email).maybeSingle();
        const heure = Date.now() - 3600_000;
        const envois = ((acces?.envois ?? []) as string[]).filter((t) => Date.parse(t) > heure);
        if (envois.length >= ENVOIS_PAR_HEURE) throw new Erreur(429, "trop", "Trop de codes demandés. Réessayez dans une heure.");
        if (envois.length && Date.now() - Date.parse(envois.at(-1)!) < 60_000) {
          throw new Erreur(429, "attendre", "Un code vient d'être envoyé. Patientez une minute.");
        }
        const code = code6();
        await db.from("depot_acces").upsert({
          email, code_hash: await empreinte(`${email}:${code}`, "code-proprietaire"),
          code_expire_le: new Date(Date.now() + CODE_MINUTES * 60_000).toISOString(),
          essais: 0, envois: [...envois, new Date().toISOString()],
        });
        await envoyer({
          to: email,
          subject: `${code} – votre code de connexion SVM Ride`,
          html: gabarit(`<p>Bonjour ${echapper(dossiers[0].prop_prenom)},</p>
<p>Votre code pour accéder au suivi de votre dépôt-vente :</p>
<p style="font-size:32px;font-weight:bold;letter-spacing:6px;margin:20px 0">${code}</p>
<p>Il est valable ${CODE_MINUTES} minutes. Si vous n'avez rien demandé, ignorez ce message.</p>`),
          sansCopie: true,
        });
        return json(200, neutre);
      }

      case "connexion": {
        const email = normEmail(body.email);
        const saisi = String(body.code ?? "").replace(/\D/g, "");
        const { data: a } = await db.from("depot_acces").select("*").eq("email", email).maybeSingle();
        const refus = new Erreur(400, "code", "Code incorrect ou expiré.");
        if (!a?.code_hash || !a.code_expire_le) throw refus;
        if (a.bloque_jusqu_au && new Date(a.bloque_jusqu_au) > new Date()) {
          throw new Erreur(429, "bloque", "Trop d'essais. Réessayez dans quelques minutes.");
        }
        if (new Date(a.code_expire_le) < new Date()) throw new Erreur(400, "expire", "Ce code a expiré. Demandez-en un nouveau.");
        const { data: compte } = await db.from("depot_acces").update({
          essais: a.essais + 1,
          bloque_jusqu_au: a.essais + 1 >= ESSAIS ? new Date(Date.now() + BLOCAGE_MIN * 60_000).toISOString() : null,
          ...(a.essais + 1 >= ESSAIS ? { code_hash: null } : {}),
        }).eq("email", email).eq("essais", a.essais).select("email").maybeSingle();
        if (!compte) throw new Erreur(409, "reessayer", "Réessayez.");
        if (saisi.length !== 6 || !egal(await empreinte(`${email}:${saisi}`, "code-proprietaire"), a.code_hash)) throw refus;
        await db.from("depot_acces").update({ code_hash: null, code_expire_le: null, essais: 0, bloque_jusqu_au: null, derniere_connexion: new Date().toISOString() }).eq("email", email);
        const heures = body.rester === true ? SESSION_LONGUE_HEURES : SESSION_HEURES;
        return json(200, { session: await creerSession(email, heures), heures });
      }

      case "dossiers": {
        const email = await session(req);
        const dossiers = await dossiersDe(db, email);
        const ids = dossiers.map((d) => d.id);
        const [{ data: ev }, { data: docs }, { data: dem }, { data: ctr }, { data: veh }] = await Promise.all([
          db.from("depot_evenements").select("dossier_id, fait_le, type, titre, detail, montant").in("dossier_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"])
            .eq("visible_proprietaire", true).order("fait_le", { ascending: false }),
          db.from("depot_documents").select("dossier_id, type, nom, chemin, ajoute_le").in("dossier_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"])
            .eq("visible_proprietaire", true).order("ajoute_le", { ascending: false }),
          db.from("depot_demandes_proprietaire").select("id, dossier_id, cree_le, type, message, statut, reponse").in("dossier_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"])
            .order("cree_le", { ascending: false }),
          db.from("depot_contrats").select("dossier_id, type, numero, statut").in("dossier_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]).eq("statut", "a_signer"),
          db.from("vehicles").select("id, slug, images, available").in("id", dossiers.map((d) => d.vehicle_id).filter(Boolean).length ? dossiers.map((d) => d.vehicle_id).filter(Boolean) : ["00000000-0000-0000-0000-000000000000"]),
        ]);
        const photo = (d: Record<string, any>) => {
          const v = (veh ?? []).find((x) => x.id === d.vehicle_id);
          const im = Array.isArray(v?.images) ? v!.images[0] : null;
          return typeof im === "string" ? im : (im as { url?: string } | null)?.url ?? null;
        };
        return json(200, {
          email,
          dossiers: dossiers.map((d) => ({
            id: d.id, reference: d.reference, marque: d.marque, modele: d.modele, version: d.version, annee: d.annee,
            immatriculation: d.immatriculation, prix_affiche: d.prix_affiche, net_vendeur: d.net_vendeur,
            date_debut: d.date_debut, date_fin: d.date_fin, statut_mandat: d.statut_mandat, statut_vente: d.statut_vente,
            vendu_le: d.vendu_le, paye_le: d.paye_le, frais_resiliation: d.frais_resiliation,
            annonce: (() => { const v = (veh ?? []).find((x) => x.id === d.vehicle_id); return v?.available && d.statut_vente !== "a_publier" ? `/vehicules/${v.slug}` : null; })(),
            photo: photo(d),
            a_signer: (ctr ?? []).some((c) => c.dossier_id === d.id),
            fil: (ev ?? []).filter((e) => e.dossier_id === d.id).map(({ dossier_id: _, ...e }) => e),
            documents: (docs ?? []).filter((x) => x.dossier_id === d.id).map(({ dossier_id: _, ...x }) => x),
            demandes: (dem ?? []).filter((x) => x.dossier_id === d.id).map(({ dossier_id: _, ...x }) => x),
          })),
        });
      }

      case "document": {
        const email = await session(req);
        const { data: doc } = await db.from("depot_documents").select("chemin, nom, dossier_id, visible_proprietaire").eq("chemin", String(body.chemin ?? "")).maybeSingle();
        if (!doc || !doc.visible_proprietaire) throw new Erreur(404, "document", "Document introuvable.");
        const { data: d } = await db.from("depot_dossiers").select("prop_email").eq("id", doc.dossier_id).single();
        if (d?.prop_email !== email) throw new Erreur(404, "document", "Document introuvable.");
        const { data } = await db.storage.from(BUCKET_DOCS).createSignedUrl(doc.chemin, 300, { download: `${doc.nom}.pdf`.replace(/\.pdf\.pdf$/, ".pdf") });
        return json(200, { url: data?.signedUrl });
      }

      case "demande": {
        const email = await session(req);
        const type = String(body.type ?? "");
        if (!["rappel", "prolongation", "reprise_anticipee", "baisse_prix", "question"].includes(type)) throw new Erreur(400, "type", "Type de demande inconnu.");
        const message = String(body.message ?? "").trim().slice(0, 2000) || null;
        if (["baisse_prix", "question"].includes(type) && !message) throw new Erreur(400, "message", "Précisez votre demande.");
        const { data: d } = await db.from("depot_dossiers").select("id, prop_email, statut_mandat").eq("id", String(body.dossier_id ?? "")).maybeSingle();
        if (!d || d.prop_email !== email) throw new Erreur(404, "dossier", "Dossier introuvable.");
        // Anti-doublon : une demande du même type encore ouverte suffit
        const { data: ouverte } = await db.from("depot_demandes_proprietaire").select("id").eq("dossier_id", d.id).eq("type", type)
          .in("statut", ["nouvelle", "en_cours"]).limit(1).maybeSingle();
        if (ouverte && type !== "question") throw new Erreur(409, "deja", "Une demande de ce type est déjà en cours de traitement.");
        const { count } = await db.from("depot_demandes_proprietaire").select("id", { count: "exact", head: true })
          .eq("dossier_id", d.id).gte("cree_le", new Date(Date.now() - 86_400_000).toISOString());
        if ((count ?? 0) >= 10) throw new Erreur(429, "trop", `Vous avez déjà envoyé plusieurs demandes aujourd'hui. Appelez-nous au ${TELEPHONE}.`);
        const { error } = await db.from("depot_demandes_proprietaire").insert({ dossier_id: d.id, type, message });
        if (error) throw error;
        return json(200, { ok: true });
      }

      default:
        throw new Erreur(400, "action", "Action inconnue.");
    }
  } catch (e) {
    if (e instanceof Erreur) return json(e.status, { error: e.code, message: e.message });
    console.error("depot-proprietaire", e);
    return json(500, { error: "serveur", message: "Une erreur est survenue. Réessayez dans un instant." });
  }
});
