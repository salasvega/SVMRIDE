/**
 * Fonction « depot-notifications » : e-mails du dépôt-vente, appelée uniquement
 * par la base (déclencheurs et tâche quotidienne, clé secrète en en-tête).
 *
 *  - vente               : annonce en ligne, réservée, vendue, livrée, paiement effectué
 *  - evenement           : offre reçue (événement visible par le propriétaire)
 *  - demande_proprietaire: alerte interne + accusé au propriétaire
 *  - alertes (quotidien) : fin de mandat à J-7 et à échéance (propriétaire + interne),
 *                          début du gardiennage (interne)
 *
 * Chaque e-mail a une clé unique dans depot_emails : jamais deux fois le même.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  appelInterne, base, BOITE_SVM, bouton, C, dateFr, echapper, envoyerUneFois, euros, gabarit, SITE, TELEPHONE, URL_ADMIN,
} from "../_shared/depot-commun.ts";

const ESPACE = `${SITE}/suivre-ma-vente`;

const MESSAGES_VENTE: Record<string, { sujet: string; texte: (d: Record<string, any>) => string }> = {
  en_ligne: {
    sujet: "Votre moto est en ligne",
    texte: (d) => `Bonne nouvelle : l'annonce de votre <strong>${echapper(d.marque)} ${echapper(d.modele)}</strong> est en ligne sur svmride.com au prix de ${euros(d.prix_affiche)}. Nous vous tiendrons informé des visites et des offres.`,
  },
  reservee: {
    sujet: "Votre moto est réservée",
    texte: (d) => `Votre <strong>${echapper(d.marque)} ${echapper(d.modele)}</strong> vient d'être réservée par un acheteur. Nous vous prévenons dès que la vente est conclue.`,
  },
  vendue: {
    sujet: "Votre moto est vendue",
    texte: (d) => `Félicitations : votre <strong>${echapper(d.marque)} ${echapper(d.modele)}</strong> est vendue. Nous préparons la livraison et nous occupons de toutes les démarches administratives. Pour le virement de ${euros(d.net_vendeur)}, pensez à nous transmettre votre RIB si ce n'est pas déjà fait.`,
  },
  livree: {
    sujet: "Votre moto a été livrée",
    texte: (d) => `Votre <strong>${echapper(d.marque)} ${echapper(d.modele)}</strong> a été livrée à son nouveau propriétaire. Le virement de votre net vendeur (${euros(d.net_vendeur)}) suit.`,
  },
  payee: {
    sujet: "Votre paiement a été effectué",
    texte: (d) => `Nous avons effectué le virement de <strong>${euros(d.net_vendeur)}</strong> pour la vente de votre ${echapper(d.marque)} ${echapper(d.modele)}. Merci de votre confiance !`,
  },
};

const TYPES_DEMANDE: Record<string, string> = {
  rappel: "Demande de rappel",
  prolongation: "Demande de prolongation du mandat",
  reprise_anticipee: "Demande de reprise anticipée de la moto",
  baisse_prix: "Proposition de nouveau prix",
  question: "Question",
};

const signature = `<p style="margin-top:20px">L'équipe SVM Ride<br><span style="color:${C.gris}">${TELEPHONE}</span></p>`;
const lienEspace = bouton(ESPACE, "Suivre ma vente");

Deno.serve(async (req: Request) => {
  if (!appelInterne(req)) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const db = base();
  const corps = (await req.json().catch(() => ({}))) as Record<string, any>;
  const resultat: string[] = [];
  const dossier = async (id: string) => {
    const { data } = await db.from("depot_dossiers").select("*").eq("id", id).maybeSingle();
    return data as Record<string, any> | null;
  };

  try {
    switch (corps.type) {
      case "vente": {
        const d = await dossier(corps.dossier_id);
        const m = MESSAGES_VENTE[corps.statut];
        if (!d || !m) break;
        const ok = await envoyerUneFois(db, `vente:${d.id}:${corps.statut}`, d.id, {
          to: d.prop_email,
          subject: `SVM Ride – ${m.sujet} (${d.reference})`,
          html: gabarit(`<p>Bonjour ${echapper(d.prop_prenom)},</p><p>${m.texte(d)}</p>${lienEspace}${signature}`),
          reply_to: BOITE_SVM,
        });
        resultat.push(`vente ${corps.statut} : ${ok}`);
        break;
      }

      case "evenement": {
        const d = await dossier(corps.dossier_id);
        const { data: e } = await db.from("depot_evenements").select("*").eq("id", corps.evenement_id).maybeSingle();
        if (!d || !e || e.type !== "offre") break;
        const ok = await envoyerUneFois(db, `offre:${e.id}`, d.id, {
          to: d.prop_email,
          subject: `SVM Ride – Offre reçue pour votre ${d.marque} ${d.modele}`,
          html: gabarit(`<p>Bonjour ${echapper(d.prop_prenom)},</p>
<p>Nous avons reçu une offre pour votre <strong>${echapper(d.marque)} ${echapper(d.modele)}</strong>${e.montant ? ` : <strong>${euros(e.montant)}</strong>` : ""}.</p>
${e.detail ? `<p>${echapper(e.detail).replace(/\n/g, "<br>")}</p>` : ""}
<p>Rien ne se fait sans votre accord : nous vous appelons pour en parler. Vous pouvez aussi nous répondre depuis votre espace.</p>${lienEspace}${signature}`),
          reply_to: BOITE_SVM,
        });
        resultat.push(`offre : ${ok}`);
        break;
      }

      case "demande_proprietaire": {
        const d = await dossier(corps.dossier_id);
        const { data: q } = await db.from("depot_demandes_proprietaire").select("*").eq("id", corps.demande_id).maybeSingle();
        if (!d || !q) break;
        const libelle = TYPES_DEMANDE[q.type] ?? "Demande";
        await envoyerUneFois(db, `demande-interne:${q.id}`, d.id, {
          to: BOITE_SVM,
          subject: `[Dépôt-vente] ${libelle} – ${d.reference} – ${d.prop_prenom} ${d.prop_nom}`,
          html: gabarit(`<p><strong>${echapper(libelle)}</strong> de ${echapper(d.prop_prenom)} ${echapper(d.prop_nom)} (${echapper(d.prop_telephone)}) pour la ${echapper(d.marque)} ${echapper(d.modele)}.</p>
${q.message ? `<p style="background:${C.fond};padding:12px;border-radius:8px">${echapper(q.message).replace(/\n/g, "<br>")}</p>` : ""}
${q.type === "reprise_anticipee" ? `<p>Rappel : frais de reprise anticipée prévus au contrat : ${euros(d.frais_resiliation)}.</p>` : ""}
${bouton(`${URL_ADMIN}/${d.id}`, "Ouvrir le dossier")}`),
          reply_to: d.prop_email,
        });
        await envoyerUneFois(db, `demande-accuse:${q.id}`, d.id, {
          to: d.prop_email,
          subject: `SVM Ride – Nous avons bien reçu votre demande (${d.reference})`,
          html: gabarit(`<p>Bonjour ${echapper(d.prop_prenom)},</p><p>Nous avons bien reçu votre demande « ${echapper(libelle)} ». Nous revenons vers vous rapidement, sous 48 h ouvrées au plus tard.</p>${lienEspace}${signature}`),
          reply_to: BOITE_SVM,
        });
        resultat.push("demande");
        break;
      }

      case "alertes": {
        const aujourdhui = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
        const dans = (j: number) => {
          const x = new Date(`${aujourdhui}T12:00:00Z`);
          x.setUTCDate(x.getUTCDate() + j);
          return x.toISOString().slice(0, 10);
        };
        // J-7 : mandat bientôt terminé
        const { data: j7 } = await db.from("depot_dossiers").select("*").eq("statut_mandat", "actif")
          .in("statut_vente", ["a_publier", "en_ligne"]).lte("date_fin", dans(7)).gte("date_fin", aujourdhui).is("alerte_j7_le", null);
        for (const d of j7 ?? []) {
          await envoyerUneFois(db, `j7:${d.id}:${d.date_fin}`, d.id, {
            to: d.prop_email,
            subject: `SVM Ride – Votre mandat de dépôt-vente se termine le ${dateFr(d.date_fin)}`,
            html: gabarit(`<p>Bonjour ${echapper(d.prop_prenom)},</p>
<p>Votre mandat de dépôt-vente pour la <strong>${echapper(d.marque)} ${echapper(d.modele)}</strong> se termine le <strong>${dateFr(d.date_fin)}</strong>.</p>
<p>Vous pouvez le prolonger (un avenant vous sera proposé à la signature), ajuster le prix, ou prévoir de récupérer votre moto. Faites-nous signe depuis votre espace ou au ${TELEPHONE}.</p>${lienEspace}${signature}`),
            reply_to: BOITE_SVM,
          });
          await envoyerUneFois(db, `j7-interne:${d.id}:${d.date_fin}`, d.id, {
            to: BOITE_SVM,
            subject: `[Dépôt-vente] Fin de mandat dans 7 jours – ${d.reference} – ${d.marque} ${d.modele}`,
            html: gabarit(`<p>Le mandat ${echapper(d.reference)} (${echapper(d.prop_prenom)} ${echapper(d.prop_nom)}, ${echapper(d.prop_telephone)}) se termine le ${dateFr(d.date_fin)} sans vente à ce jour.</p>${bouton(`${URL_ADMIN}/${d.id}`, "Ouvrir le dossier")}`),
          });
          await db.from("depot_dossiers").update({ alerte_j7_le: new Date().toISOString() }).eq("id", d.id);
          await db.from("depot_evenements").insert({ dossier_id: d.id, par: "système", type: "alerte", titre: `Fin du mandat le ${dateFr(d.date_fin)} : rappel envoyé`, visible_proprietaire: true });
        }
        // Échéance atteinte (mandat passé à « expire » par la tâche quotidienne)
        const { data: fins } = await db.from("depot_dossiers").select("*").eq("statut_mandat", "expire").is("alerte_fin_le", null);
        for (const d of fins ?? []) {
          await envoyerUneFois(db, `fin:${d.id}:${d.date_fin}`, d.id, {
            to: d.prop_email,
            subject: `SVM Ride – Votre mandat de dépôt-vente est arrivé à échéance`,
            html: gabarit(`<p>Bonjour ${echapper(d.prop_prenom)},</p>
<p>Votre mandat pour la <strong>${echapper(d.marque)} ${echapper(d.modele)}</strong> est arrivé à échéance le ${dateFr(d.date_fin)}.</p>
<p>Contactez-nous pour le prolonger ou convenir de la récupération de votre moto. Comme prévu au contrat, des frais de gardiennage de ${euros(d.gardiennage_par_jour)} par jour s'appliquent à partir du ${d.gardiennage_delai_jours}e jour suivant la fin du mandat.</p>${lienEspace}${signature}`),
            reply_to: BOITE_SVM,
          });
          await envoyerUneFois(db, `fin-interne:${d.id}:${d.date_fin}`, d.id, {
            to: BOITE_SVM,
            subject: `[Dépôt-vente] Mandat échu – ${d.reference} – ${d.marque} ${d.modele}`,
            html: gabarit(`<p>Le mandat ${echapper(d.reference)} est arrivé à échéance le ${dateFr(d.date_fin)} sans vente. L'annonce a été retirée du site. À traiter : prolongation, reprise par le propriétaire ou clôture.</p>${bouton(`${URL_ADMIN}/${d.id}`, "Ouvrir le dossier")}`),
          });
          await db.from("depot_dossiers").update({ alerte_fin_le: new Date().toISOString() }).eq("id", d.id);
        }
        // Gardiennage : début à J + délai après la fin du mandat (alerte interne)
        const { data: garde } = await db.from("depot_dossiers").select("*").eq("statut_mandat", "expire").is("alerte_gardiennage_le", null);
        for (const d of garde ?? []) {
          const debut = new Date(`${d.date_fin}T12:00:00Z`);
          debut.setUTCDate(debut.getUTCDate() + d.gardiennage_delai_jours);
          if (debut.toISOString().slice(0, 10) > aujourdhui) continue;
          await envoyerUneFois(db, `gardiennage:${d.id}:${d.date_fin}`, d.id, {
            to: BOITE_SVM,
            subject: `[Dépôt-vente] Gardiennage facturable – ${d.reference}`,
            html: gabarit(`<p>La moto du dossier ${echapper(d.reference)} (${echapper(d.prop_prenom)} ${echapper(d.prop_nom)}) est toujours au showroom ${d.gardiennage_delai_jours} jours après la fin du mandat : le gardiennage (${euros(d.gardiennage_par_jour)} / jour) s'applique depuis le ${dateFr(debut.toISOString().slice(0, 10))}.</p>${bouton(`${URL_ADMIN}/${d.id}`, "Ouvrir le dossier")}`),
          });
          await db.from("depot_dossiers").update({ alerte_gardiennage_le: new Date().toISOString() }).eq("id", d.id);
          await db.from("depot_evenements").insert({ dossier_id: d.id, par: "système", type: "alerte", titre: "Début des frais de gardiennage", visible_proprietaire: true });
        }
        resultat.push(`alertes : j7 ${j7?.length ?? 0}, fins ${fins?.length ?? 0}, gardiennage ${garde?.length ?? 0}`);
        break;
      }
    }
    return new Response(JSON.stringify({ ok: true, resultat }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error("depot-notifications", e);
    return new Response(JSON.stringify({ ok: false }), { status: 500 });
  }
});
