/**
 * Fonction « depot-signature » : signature électronique d'un contrat de dépôt-vente
 * par le déposant, depuis le lien reçu (ou le QR code montré au showroom).
 *
 *  - ouvrir      : lien valable ? → résumé du contrat + lien temporaire vers le PDF
 *  - envoyer-code: code à 6 chiffres par e-mail (10 min ; 1 envoi / 60 s ; 5 envois max)
 *  - signer      : accords cochés + code exact (5 essais) → PDF signé avec certificat,
 *                  empreinte, dossier de preuve, mandat actif, copies par e-mail
 *
 * Le lien n'est jamais stocké en clair (empreinte seulement) et devient inutilisable
 * après la signature, l'annulation ou l'expiration.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.57.4";
import {
  base, BOITE_SVM, BUCKET_DOCS, code6, cors, dateFr, echapper, egal, empreinte, envoyer, Erreur, euros, gabarit,
  ip, reponse, sha256, URL_ADMIN,
} from "../_shared/depot-commun.ts";
import { pdfSigne, type Instantane } from "../_shared/depot-contrat.ts";

const CODE_MINUTES = 10;
const CODE_ESSAIS = 5;
const CODE_ENVOIS = 5;

type Contrat = Record<string, any>;

async function contratDuLien(db: SupabaseClient, jeton: unknown): Promise<Contrat> {
  const j = String(jeton ?? "");
  if (j.length < 30 || j.length > 60) throw new Erreur(404, "lien", "Ce lien de signature n'est pas valable.");
  const { data: c } = await db.from("depot_contrats").select("*").eq("invitation_hash", await empreinte(j, "invitation")).maybeSingle();
  if (!c) throw new Erreur(404, "lien", "Ce lien de signature n'est plus valable : il a été remplacé, annulé ou déjà utilisé. Contactez SVM Ride au 01 84 19 01 74.");
  if (c.statut !== "a_signer") throw new Erreur(410, "lien", "Ce contrat n'est plus à signer.");
  if (new Date(c.invitation_expire_le) < new Date()) throw new Erreur(410, "lien", "Ce lien de signature a expiré. Demandez-en un nouveau à SVM Ride.");
  return c;
}

const titreContrat = (c: Contrat) => (c.type === "mandat" ? "Mandat de dépôt-vente exclusif" : `Avenant n° ${c.numero - 1} au mandat de dépôt-vente`);

function resume(c: Contrat) {
  const i = c.donnees as Instantane;
  return {
    titre: titreContrat(c),
    type: c.type,
    reference: i.reference,
    deposant: `${i.deposant.prenom} ${i.deposant.nom}`,
    email_masque: i.deposant.email.replace(/^(.{2}).*(@.*)$/, "$1•••$2"),
    vehicule: `${i.vehicule.marque} ${i.vehicule.modele}${i.vehicule.version ? ` ${i.vehicule.version}` : ""}`,
    immatriculation: i.vehicule.immatriculation,
    prix_affiche: i.conditions.prix_affiche,
    net_vendeur: i.conditions.net_vendeur,
    date_debut: i.conditions.date_debut,
    date_fin: i.conditions.date_fin,
    duree_mois: i.conditions.duree_mois,
    frais_resiliation: i.conditions.frais_resiliation,
    gardiennage_par_jour: i.conditions.gardiennage_par_jour,
    gardiennage_delai_jours: i.conditions.gardiennage_delai_jours,
    avenant: i.avenant ?? null,
    empreinte: c.pdf_sha256,
    expire_le: c.invitation_expire_le,
    code_envoye: !!c.code_expire_le && new Date(c.code_expire_le) > new Date(),
  };
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: cors(origin) });
  const json = reponse(origin);
  try {
    if (req.method !== "POST") throw new Erreur(405, "methode", "Méthode non autorisée.");
    const db = base();
    const body = (await req.json().catch(() => ({}))) as Record<string, any>;
    const c = await contratDuLien(db, body.jeton);
    const trace = { ip: ip(req), navigateur: (req.headers.get("user-agent") ?? "").slice(0, 400) };
    const preuve = (evenement: string, detail?: unknown) =>
      db.from("depot_contrat_preuves").insert({ contrat_id: c.id, evenement, ...trace, detail: detail ?? null });

    switch (String(body.action ?? "")) {
      case "ouvrir": {
        const { data: lien } = await db.storage.from(BUCKET_DOCS).createSignedUrl(c.pdf_chemin, 900);
        await preuve("document_ouvert");
        return json(200, { contrat: resume(c), pdf: lien?.signedUrl ?? null });
      }

      case "envoyer-code": {
        if (c.code_envoye_le && Date.now() - new Date(c.code_envoye_le).getTime() < 60_000) {
          throw new Erreur(429, "attendre", "Un code vient d'être envoyé. Patientez une minute avant d'en demander un autre.");
        }
        if (c.codes_envoyes >= CODE_ENVOIS) throw new Erreur(429, "trop", "Trop de codes envoyés. Contactez SVM Ride pour recevoir un nouveau lien.");
        const code = code6();
        const maintenant = new Date().toISOString();
        const { error } = await db.from("depot_contrats").update({
          code_hash: await empreinte(`${c.id}:${code}`, "code-signature"),
          code_expire_le: new Date(Date.now() + CODE_MINUTES * 60_000).toISOString(),
          code_essais: 0, codes_envoyes: c.codes_envoyes + 1, code_envoye_le: maintenant,
        }).eq("id", c.id).eq("statut", "a_signer");
        if (error) throw error;
        const i = c.donnees as Instantane;
        await envoyer({
          to: i.deposant.email,
          subject: `${code} – votre code de signature SVM Ride`,
          html: gabarit(`<p>Bonjour ${echapper(i.deposant.prenom)},</p>
<p>Votre code pour signer le document « ${echapper(titreContrat(c))} » (${echapper(i.reference)}) :</p>
<p style="font-size:32px;font-weight:bold;letter-spacing:6px;margin:20px 0">${code}</p>
<p>Il est valable ${CODE_MINUTES} minutes. Ne le communiquez à personne : il vaut signature.</p>
<p style="font-size:13px;color:#5E5E5E">Si vous n'êtes pas en train de signer un contrat avec SVM Ride, ignorez ce message et prévenez-nous au 01 84 19 01 74.</p>`),
          sansCopie: true,
        });
        await preuve("code_envoye", { a: i.deposant.email });
        return json(200, { ok: true, email: resume(c).email_masque, minutes: CODE_MINUTES });
      }

      case "signer": {
        if (body.accord !== true) throw new Erreur(400, "accord", "Cochez la case indiquant que vous avez lu et acceptez le contrat.");
        if (c.type === "mandat" && body.renonciation !== true) {
          throw new Erreur(400, "renonciation", "Cochez la case de demande d'exécution immédiate pour signer le mandat.");
        }
        if (!c.code_hash || !c.code_expire_le || new Date(c.code_expire_le) < new Date()) {
          throw new Erreur(400, "code_expire", "Le code a expiré. Demandez-en un nouveau.");
        }
        if (c.code_essais >= CODE_ESSAIS) throw new Erreur(429, "bloque", "Trop d'essais. Demandez un nouveau code.");
        const saisi = String(body.code ?? "").replace(/\D/g, "");
        // Essai compté avant la vérification (pas d'essais en parallèle)
        const { data: compte } = await db.from("depot_contrats").update({ code_essais: c.code_essais + 1 })
          .eq("id", c.id).eq("code_essais", c.code_essais).select("id").maybeSingle();
        if (!compte) throw new Erreur(409, "reessayer", "Réessayez.");
        if (saisi.length !== 6 || !egal(await empreinte(`${c.id}:${saisi}`, "code-signature"), c.code_hash)) {
          await preuve("code_refuse");
          const reste = CODE_ESSAIS - c.code_essais - 1;
          throw new Erreur(400, "code", reste > 0 ? `Code incorrect. Il vous reste ${reste} essai${reste > 1 ? "s" : ""}.` : "Code incorrect. Demandez un nouveau code.");
        }

        // PDF d'origine : contrôle de l'empreinte avant de signer
        const { data: fichier, error: el } = await db.storage.from(BUCKET_DOCS).download(c.pdf_chemin);
        if (el || !fichier) throw new Error("PDF introuvable");
        const original = new Uint8Array(await fichier.arrayBuffer());
        if ((await sha256(original)) !== c.pdf_sha256) {
          await preuve("empreinte_differente");
          throw new Erreur(409, "integrite", "Le document a été modifié depuis sa création : signature impossible. Contactez SVM Ride.");
        }
        const i = c.donnees as Instantane;
        const signeLe = new Date().toISOString();
        const { data: ouverture } = await db.from("depot_contrat_preuves").select("fait_le").eq("contrat_id", c.id)
          .eq("evenement", "document_ouvert").order("fait_le").limit(1).maybeSingle();
        const signe = await pdfSigne(original, {
          reference: i.reference, titre: titreContrat(c), empreinte_original: c.pdf_sha256,
          signataire: `${i.deposant.prenom} ${i.deposant.nom}`, email: i.deposant.email, signe_le: signeLe,
          ip: trace.ip, navigateur: trace.navigateur, code_envoye_le: c.code_envoye_le,
          renonciation: c.type === "mandat" ? true : null, ouvert_le: ouverture?.fait_le ?? null, modele_version: c.modele_version,
        });
        const hashSigne = await sha256(signe);
        const chemin = c.pdf_chemin.replace(/\.pdf$/, "-signe.pdf");
        const { error: eu } = await db.storage.from(BUCKET_DOCS).upload(chemin, signe, { contentType: "application/pdf", upsert: false });
        if (eu) throw eu;
        const { data: ok } = await db.from("depot_contrats").update({
          statut: "signe", signe_le: signeLe, signe_pdf_chemin: chemin, signe_pdf_sha256: hashSigne,
          renonciation_retractation: c.type === "mandat" ? true : null,
          invitation_hash: null, code_hash: null, code_expire_le: null,
        }).eq("id", c.id).eq("statut", "a_signer").select("id").maybeSingle();
        if (!ok) throw new Erreur(409, "deja", "Ce contrat a déjà été signé.");
        await preuve("signe", { empreinte_original: c.pdf_sha256, empreinte_signe: hashSigne, accord: true, renonciation: c.type === "mandat" });

        await db.from("depot_documents").insert({
          dossier_id: c.dossier_id, type: "contrat_signe", nom: `${c.type === "mandat" ? "Mandat" : `Avenant ${c.numero - 1}`} signé`,
          chemin, taille: signe.length, mime: "application/pdf", visible_proprietaire: true, ajoute_par: "signature électronique",
        });
        // Dossier : mandat actif (dates du contrat) ou prolongation (avenant)
        if (c.type === "mandat") {
          await db.from("depot_dossiers").update({
            statut_mandat: "actif", date_debut: i.conditions.date_debut, date_fin: i.conditions.date_fin,
          }).eq("id", c.dossier_id);
        } else {
          await db.from("depot_dossiers").update({
            date_fin: i.conditions.date_fin, statut_mandat: "actif", alerte_j7_le: null, alerte_fin_le: null, alerte_gardiennage_le: null,
            ...(i.avenant?.prix_modifie ? { prix_affiche: i.conditions.prix_affiche, net_vendeur: i.conditions.net_vendeur } : {}),
          }).eq("id", c.dossier_id);
        }
        await db.from("depot_evenements").insert({
          dossier_id: c.dossier_id, par: "signature électronique", type: "contrat", visible_proprietaire: true,
          titre: c.type === "mandat" ? "Contrat de dépôt-vente signé" : `Avenant n° ${c.numero - 1} signé : mandat prolongé jusqu'au ${dateFr(i.conditions.date_fin)}`,
        });

        // Copies : déposant (avec le PDF signé) et SVM Ride
        const pj = [{ filename: `${i.reference}-${c.type}-signe.pdf`, content: btoa(Array.from(signe, (b) => String.fromCharCode(b)).join("")) }];
        try {
          await envoyer({
            to: i.deposant.email,
            subject: `SVM Ride – ${titreContrat(c)} signé (${i.reference})`,
            html: gabarit(`<p>Bonjour ${echapper(i.deposant.prenom)},</p>
<p>Merci, votre ${c.type === "mandat" ? "contrat de dépôt-vente" : "avenant"} est signé. Vous en trouverez la copie en pièce jointe.</p>
<p><strong>${echapper(i.vehicule.marque)} ${echapper(i.vehicule.modele)}</strong> – prix affiché ${euros(i.conditions.prix_affiche)}, net vendeur ${euros(i.conditions.net_vendeur)}, mandat jusqu'au ${dateFr(i.conditions.date_fin)}.</p>
<p>Suivez l'avancement de la vente à tout moment sur <a href="https://svmride.com/suivre-ma-vente">svmride.com/suivre-ma-vente</a> (connexion avec votre adresse e-mail).</p>`),
            attachments: pj,
            sansCopie: true,
          });
          await envoyer({
            to: BOITE_SVM,
            subject: `[Dépôt-vente] ${titreContrat(c)} signé – ${i.reference} – ${i.deposant.prenom} ${i.deposant.nom}`,
            html: gabarit(`<p>${echapper(titreContrat(c))} signé par ${echapper(i.deposant.prenom)} ${echapper(i.deposant.nom)} le ${new Date(signeLe).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}.</p>
<p>${echapper(i.vehicule.marque)} ${echapper(i.vehicule.modele)} – fin du mandat le ${dateFr(i.conditions.date_fin)}.</p>
<p><a href="${URL_ADMIN}/${c.dossier_id}">Ouvrir le dossier</a></p>`),
            attachments: pj,
            sansCopie: true,
          });
        } catch (e) {
          console.error("copie du contrat signé", e);
        }
        const { data: lien } = await db.storage.from(BUCKET_DOCS).createSignedUrl(chemin, 900, { download: `${i.reference}-${c.type}-signe.pdf` });
        return json(200, { ok: true, pdf: lien?.signedUrl ?? null, signe_le: signeLe });
      }

      default:
        throw new Erreur(400, "action", "Action inconnue.");
    }
  } catch (e) {
    if (e instanceof Erreur) return json(e.status, { error: e.code, message: e.message });
    console.error("depot-signature", e);
    return json(500, { error: "serveur", message: "Une erreur est survenue. Réessayez dans un instant." });
  }
});
