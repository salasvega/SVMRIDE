/**
 * Fonction « depot-admin » : actions de l'administration sur les dossiers de
 * dépôt-vente qui ne peuvent pas se faire depuis le navigateur.
 *
 *  - convertir         : demande d'estimation → dossier (photos copiées dans le dossier)
 *  - contrat-preparer  : contrôle du dossier, PDF figé côté serveur + empreinte SHA-256,
 *                        invitation à signer (lien à usage unique, 7 jours), e-mail facultatif
 *  - contrat-renvoyer  : nouveau lien (l'ancien ne marche plus) et nouvel e-mail
 *  - contrat-annuler   : contrat non signé annulé
 *  - document-lien     : lien temporaire (5 min) vers un document du dossier
 *
 * Réservée aux administrateurs (jeton de session + est_admin_compte).
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  admin, base, bouton, BUCKET_DOCS, C, cors, dateFr, echapper, empreinte, envoyer, Erreur, euros, gabarit,
  jetonAleatoire, reponse, sha256, SITE,
} from "../_shared/depot-commun.ts";
import { construireInstantane, genererPdf, MODELE_VERSION, societeContrat } from "../_shared/depot-contrat.ts";

const VALIDITE_INVITATION_JOURS = 7;
/** Pièces exigées avant la signature (réponses de Mattia : « obligatoires pour signer ») */
const PIECES_OBLIGATOIRES: Record<string, string> = {
  carte_grise: "carte grise",
  piece_identite: "pièce d'identité",
  non_gage: "certificat de non-gage",
  double_cles: "double des clés",
};

const ajouterMois = (iso: string, mois: number) => {
  const d = new Date(`${iso}T12:00:00Z`);
  const jour = d.getUTCDate();
  d.setUTCMonth(d.getUTCMonth() + mois);
  if (d.getUTCDate() < jour) d.setUTCDate(0); // 31 janvier + 1 mois = 28/29 février
  return d.toISOString().slice(0, 10);
};
const aujourdhui = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });

function controlerAvantContrat(d: Record<string, any>, type: string) {
  const manque: string[] = [];
  if (!d.prop_adresse) manque.push("adresse du déposant");
  if (!d.prix_affiche) manque.push("prix affiché");
  if (d.net_vendeur == null) manque.push("net vendeur");
  if (d.prix_affiche && d.net_vendeur != null && d.net_vendeur > d.prix_affiche) manque.push("net vendeur inférieur au prix affiché");
  if (type === "mandat") {
    for (const [cle, libelle] of Object.entries(PIECES_OBLIGATOIRES)) {
      if (!d.pieces?.[cle]?.recu) manque.push(libelle);
    }
    if (!d.etat_des_lieux?.fait_le) manque.push("état des lieux d'entrée");
    if (!d.immatriculation) manque.push("immatriculation");
  }
  if (manque.length) throw new Erreur(400, "incomplet", `Avant de préparer le contrat, complétez : ${manque.join(", ")}.`);
}

function courrielInvitation(d: Record<string, any>, type: string, url: string, expire: string) {
  const objet = type === "mandat" ? "votre contrat de dépôt-vente" : "l'avenant à votre contrat de dépôt-vente";
  return {
    to: d.prop_email,
    subject: `SVM Ride – ${type === "mandat" ? "Votre contrat de dépôt-vente à signer" : "Avenant à signer"} (${d.reference})`,
    html: gabarit(`<p>Bonjour ${echapper(d.prop_prenom)},</p>
<p>Voici ${objet} pour votre <strong>${echapper(d.marque)} ${echapper(d.modele)}</strong> (référence ${echapper(d.reference)}).</p>
<p>Prix de vente affiché : <strong>${euros(d.prix_affiche)}</strong><br>Net vendeur (ce que vous percevez) : <strong>${euros(d.net_vendeur)}</strong></p>
<p>Lisez le contrat puis signez-le en ligne : un code de confirmation vous sera envoyé par e-mail au moment de signer.</p>
${bouton(url, "Lire et signer le contrat")}
<p style="font-size:13px;color:${C.gris}">Ce lien est personnel et valable jusqu'au ${dateFr(expire)}. Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>`),
    reply_to: "contact@svmride.com",
    sansCopie: true,
  };
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: cors(origin) });
  const json = reponse(origin);
  try {
    if (req.method !== "POST") throw new Erreur(405, "methode", "Méthode non autorisée.");
    const db = base();
    const moi = await admin(db, req);
    const body = (await req.json().catch(() => ({}))) as Record<string, any>;

    const dossier = async (id: unknown) => {
      const { data } = await db.from("depot_dossiers").select("*").eq("id", String(id ?? "")).maybeSingle();
      if (!data) throw new Erreur(404, "dossier", "Dossier introuvable.");
      return data as Record<string, any>;
    };
    const preuve = (contratId: string, evenement: string, detail?: unknown) =>
      db.from("depot_contrat_preuves").insert({ contrat_id: contratId, evenement, detail: { par: moi.email, ...(detail ?? {}) } });

    async function nouvelleInvitation(c: { id: string }, d: Record<string, any>, type: string, envoyerEmail: boolean) {
      const jeton = jetonAleatoire(32);
      const expire = new Date(Date.now() + VALIDITE_INVITATION_JOURS * 86_400_000).toISOString();
      const { error } = await db.from("depot_contrats").update({
        invitation_hash: await empreinte(jeton, "invitation"), invitation_expire_le: expire,
        code_hash: null, code_expire_le: null, code_essais: 0,
      }).eq("id", c.id);
      if (error) throw error;
      const url = `${SITE}/signature/${jeton}`;
      await preuve(c.id, "invitation_creee", { expire_le: expire, email: envoyerEmail });
      if (envoyerEmail) {
        await envoyer(courrielInvitation(d, type, url, expire));
        await preuve(c.id, "invitation_envoyee", { a: d.prop_email });
      }
      return { url, expire };
    }

    switch (String(body.action ?? "")) {
      case "convertir": {
        const { data: dem } = await db.from("depot_demandes").select("*").eq("id", String(body.demande_id ?? "")).maybeSingle();
        if (!dem || !dem.envoi_termine) throw new Erreur(404, "demande", "Demande introuvable.");
        const { data: deja } = await db.from("depot_dossiers").select("id, reference").eq("demande_id", dem.id).maybeSingle();
        if (deja) return json(200, { dossier: deja, existant: true });
        const { data: p } = await db.from("depot_parametres").select("*").single();
        const { data: d, error } = await db.from("depot_dossiers").insert({
          demande_id: dem.id,
          prop_prenom: dem.prenom, prop_nom: dem.nom, prop_email: dem.email, prop_telephone: dem.telephone,
          marque: dem.marque, modele: dem.modele, version: dem.version, annee: dem.annee,
          kilometrage: dem.kilometrage, immatriculation: dem.immatriculation,
          prix_affiche: dem.prix_souhaite,
          duree_mois: p?.duree_mois ?? 2, frais_resiliation: p?.frais_resiliation ?? 290,
          gardiennage_par_jour: p?.gardiennage_par_jour ?? 50, gardiennage_delai_jours: p?.gardiennage_delai_jours ?? 7,
          notes_internes: [dem.commentaire ? `Message du propriétaire : ${dem.commentaire}` : null, dem.notes_internes].filter(Boolean).join("\n\n") || null,
        }).select("id, reference").single();
        if (error) throw error;
        // Photos de la demande copiées dans le dossier (la demande garde les siennes)
        let n = 0;
        for (const ph of (dem.photos ?? []) as { path: string; taille?: number }[]) {
          const ext = ph.path.split(".").pop() ?? "jpg";
          const dest = `${d.id}/photos/demande-${String(++n).padStart(2, "0")}.${ext}`;
          const { error: ec } = await db.storage.from("depot-photos").copy(ph.path, dest, { destinationBucket: BUCKET_DOCS });
          if (!ec) {
            await db.from("depot_documents").insert({
              dossier_id: d.id, type: "photo", nom: `Photo ${n} (demande)`, chemin: dest, taille: ph.taille ?? null,
              mime: ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg", ajoute_par: moi.email,
            });
          } else console.error("copie photo", ec);
        }
        if (!["acceptee"].includes(dem.statut)) await db.from("depot_demandes").update({ statut: "acceptee" }).eq("id", dem.id);
        await db.from("depot_demandes_historique").insert({
          demande_id: dem.id, par: moi.email, action: "note", note: `Dossier ${d.reference} ouvert.`,
        });
        return json(200, { dossier: d });
      }

      case "contrat-preparer": {
        const d = await dossier(body.dossier_id);
        const type = body.type === "avenant" ? "avenant" : "mandat";
        const { data: p } = await db.from("depot_parametres").select("*").single();
        const { data: contrats } = await db.from("depot_contrats").select("id, numero, type, statut").eq("dossier_id", d.id).order("numero");
        const signes = (contrats ?? []).filter((c) => c.statut === "signe");
        if (type === "mandat" && signes.some((c) => c.type === "mandat")) throw new Erreur(409, "deja_signe", "Le mandat est déjà signé : préparez un avenant.");
        if (type === "avenant" && !signes.some((c) => c.type === "mandat")) throw new Erreur(409, "pas_de_mandat", "Un avenant suppose un mandat signé.");
        if (type === "mandat" && !["preparation", "a_signer"].includes(d.statut_mandat)) throw new Erreur(409, "statut", "Ce dossier n'attend pas de mandat.");

        let dateDebut: string, dateFin: string, ancienneDateFin: string | undefined, prixModifie = false;
        if (type === "mandat") {
          dateDebut = aujourdhui();
          dateFin = ajouterMois(dateDebut, d.duree_mois);
        } else {
          if (!["actif", "expire"].includes(d.statut_mandat)) throw new Erreur(409, "statut", "Seul un mandat en cours ou arrivé à échéance peut être prolongé.");
          ancienneDateFin = d.date_fin;
          dateDebut = d.date_debut;
          const nouvelle = String(body.nouvelle_date_fin ?? "") || ajouterMois(d.date_fin ?? aujourdhui(), Number(body.mois ?? d.duree_mois));
          if (!/^\d{4}-\d{2}-\d{2}$/.test(nouvelle) || nouvelle <= (d.date_fin ?? "")) throw new Erreur(400, "date", "La nouvelle date de fin doit être postérieure à l'actuelle.");
          dateFin = nouvelle;
          // Nouveau prix facultatif (avec l'accord du déposant, qui signe l'avenant)
          if (body.prix_affiche != null || body.net_vendeur != null) {
            const prix = Number(body.prix_affiche ?? d.prix_affiche), net = Number(body.net_vendeur ?? d.net_vendeur);
            if (!(prix > 0) || !(net >= 0) || net > prix) throw new Erreur(400, "prix", "Prix ou net vendeur invalide.");
            prixModifie = prix !== d.prix_affiche || net !== d.net_vendeur;
            d.prix_affiche = prix;
            d.net_vendeur = net;
          }
        }
        controlerAvantContrat(d, type);

        // Un seul contrat « à signer » à la fois : les précédents sont annulés
        for (const c of (contrats ?? []).filter((c) => c.statut === "a_signer")) {
          await db.from("depot_contrats").update({ statut: "annule", invitation_hash: null, code_hash: null }).eq("id", c.id);
          await preuve(c.id, "annule", { motif: "remplacé par une nouvelle version" });
        }
        const numero = ((contrats ?? []).at(-1)?.numero ?? 0) + 1;
        const representant = String(body.representant ?? "").trim().slice(0, 80) || "Mattia SARAVIA";
        // Société et coordonnées du moment (admin, « Infos du site ») : copiées dans le contrat
        const { data: reglages } = await db.from("site_reglages").select("cle, valeur").in("cle", ["societe", "coordonnees"]);
        const reglage = (cle: string) => reglages?.find((r) => r.cle === cle)?.valeur;
        const societe = societeContrat(reglage("societe"), reglage("coordonnees"));
        const inst = construireInstantane(d, p ?? {}, { type, numero, representant, dateDebut, dateFin, ancienneDateFin, prixModifie, societe });
        const pdf = await genererPdf(inst);
        const hash = await sha256(pdf);
        const chemin = `${d.id}/contrats/${String(numero).padStart(2, "0")}-${type}-${hash.slice(0, 12)}.pdf`;
        const { error: eu } = await db.storage.from(BUCKET_DOCS).upload(chemin, pdf, { contentType: "application/pdf", upsert: false });
        if (eu) throw eu;
        const { data: c, error } = await db.from("depot_contrats").insert({
          dossier_id: d.id, type, numero, modele_version: MODELE_VERSION, donnees: inst,
          pdf_chemin: chemin, pdf_sha256: hash, cree_par: moi.email,
        }).select("id").single();
        if (error) throw error;
        await db.from("depot_documents").insert({
          dossier_id: d.id, type: "contrat", nom: `${type === "mandat" ? "Mandat" : `Avenant ${numero - 1}`} – à signer`, chemin,
          taille: pdf.length, mime: "application/pdf", ajoute_par: moi.email,
        });
        await preuve(c.id, "cree", { empreinte: hash, modele: MODELE_VERSION });
        if (type === "mandat" && d.statut_mandat === "preparation") {
          await db.from("depot_dossiers").update({ statut_mandat: "a_signer" }).eq("id", d.id);
        }
        await db.from("depot_evenements").insert({
          dossier_id: d.id, par: moi.email, type: "contrat",
          titre: type === "mandat" ? "Contrat de dépôt-vente prêt à signer" : `Avenant n° ${numero - 1} prêt à signer`,
          visible_proprietaire: true,
        });
        const inv = await nouvelleInvitation(c, d, type, body.envoyer_email === true);
        return json(200, { contrat_id: c.id, url: inv.url, expire_le: inv.expire, empreinte: hash });
      }

      case "contrat-renvoyer": {
        const { data: c } = await db.from("depot_contrats").select("id, dossier_id, type, statut").eq("id", String(body.contrat_id ?? "")).maybeSingle();
        if (!c || c.statut !== "a_signer") throw new Erreur(409, "statut", "Ce contrat n'est plus à signer.");
        const d = await dossier(c.dossier_id);
        const inv = await nouvelleInvitation(c, d, c.type, body.envoyer_email === true);
        return json(200, { url: inv.url, expire_le: inv.expire });
      }

      case "contrat-annuler": {
        const { data: c } = await db.from("depot_contrats").select("id, dossier_id, type, statut").eq("id", String(body.contrat_id ?? "")).maybeSingle();
        if (!c || c.statut !== "a_signer") throw new Erreur(409, "statut", "Seul un contrat non signé peut être annulé.");
        await db.from("depot_contrats").update({ statut: "annule", invitation_hash: null, code_hash: null }).eq("id", c.id);
        await preuve(c.id, "annule", { motif: String(body.motif ?? "").slice(0, 300) || null });
        if (c.type === "mandat") {
          await db.from("depot_dossiers").update({ statut_mandat: "preparation" }).eq("id", c.dossier_id).eq("statut_mandat", "a_signer");
        }
        return json(200, { ok: true });
      }

      case "document-lien": {
        const chemin = String(body.chemin ?? "");
        const { data: doc } = await db.from("depot_documents").select("chemin").eq("chemin", chemin).maybeSingle();
        const { data: ctr } = doc ? { data: null } : await db.from("depot_contrats").select("id").or(`pdf_chemin.eq.${chemin},signe_pdf_chemin.eq.${chemin}`).maybeSingle();
        if (!doc && !ctr) throw new Erreur(404, "document", "Document introuvable.");
        const { data, error } = await db.storage.from(BUCKET_DOCS).createSignedUrl(chemin, 300, { download: body.telecharger ? true : undefined });
        if (error) throw error;
        return json(200, { url: data.signedUrl });
      }

      default:
        throw new Erreur(400, "action", "Action inconnue.");
    }
  } catch (e) {
    if (e instanceof Erreur) return json(e.status, { error: e.code, message: e.message });
    console.error("depot-admin", e);
    return json(500, { error: "serveur", message: "Une erreur est survenue. Réessayez dans un instant." });
  }
});
