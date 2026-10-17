/**
 * Contrat de dépôt-vente : modèle versionné, instantané des données et PDF.
 *
 * Le modèle reprend les règles données par Mattia le 16/10/2026 (rachat par SVM
 * au moment de la vente, mandat exclusif de 2 mois, 290 €, gardiennage 50 €/j à
 * J+7, reversement sous 48 h, démarches par SVM, 5 ans de conservation).
 * TEXTE À FAIRE RELIRE PAR UN JURISTE : chaque changement de texte doit changer
 * MODELE_VERSION (chaque contrat garde la version utilisée).
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "npm:pdf-lib@1.17.1";

export const MODELE_VERSION = "mandat-depot-vente-2026-10-17b";

export const SOCIETE = {
  nom: "SVM RIDE",
  forme: "SAS",
  siren: "988 004 719",
  siege: "3 Rue Émile Verhaeren, 92210 Saint-Cloud",
  showroom: "310 Avenue Roger Salengro, 92370 Chaville",
  /** Assureur du garage (réponse de Mattia, 17/10/2026) */
  assureur: "AXA",
  email: "contact@svmride.com",
  telephone: "01 84 19 01 74",
};
/** Médiateur de la consommation (obligatoire) : à renseigner dès qu'il est désigné. */
export const MEDIATEUR = "";

export interface Instantane {
  type: "mandat" | "avenant";
  numero: number;
  reference: string;
  modele_version: string;
  genere_le: string;
  representant: string;
  deposant: { civilite: string | null; prenom: string; nom: string; email: string; telephone: string; adresse: string | null; piece: string | null };
  vehicule: { marque: string; modele: string; version: string | null; immatriculation: string | null; vin: string | null; mise_circulation: string | null; annee: number | null; kilometrage: number | null };
  conditions: {
    prix_affiche: number; net_vendeur: number; remuneration: number; duree_mois: number;
    date_debut: string; date_fin: string; frais_resiliation: number; gardiennage_par_jour: number;
    gardiennage_delai_jours: number; reversement_heures: number; conservation_annees: number;
  };
  etat_des_lieux: { fait_le?: string; kilometrage?: number; etat?: string; accessoires?: string; cles?: string; remarques?: string } | null;
  avenant?: { mandat_reference: string; ancienne_date_fin: string; nouvelle_date_fin: string; prix_modifie: boolean };
}

const PIECES: Record<string, string> = { cni: "Carte d'identité", passeport: "Passeport", titre_sejour: "Titre de séjour", permis: "Permis de conduire" };

export function construireInstantane(d: Record<string, any>, p: Record<string, any>, opts: {
  type: "mandat" | "avenant"; numero: number; representant: string; dateDebut: string; dateFin: string;
  ancienneDateFin?: string; prixModifie?: boolean;
}): Instantane {
  const prix = Number(d.prix_affiche), net = Number(d.net_vendeur);
  return {
    type: opts.type,
    numero: opts.numero,
    reference: d.reference,
    modele_version: MODELE_VERSION,
    genere_le: new Date().toISOString(),
    representant: opts.representant,
    deposant: {
      civilite: d.prop_civilite, prenom: d.prop_prenom, nom: d.prop_nom, email: d.prop_email, telephone: d.prop_telephone,
      adresse: d.prop_adresse,
      piece: d.prop_piece_type ? `${PIECES[d.prop_piece_type] ?? d.prop_piece_type}${d.prop_piece_numero ? ` n° ${d.prop_piece_numero}` : ""}` : null,
    },
    vehicule: {
      marque: d.marque, modele: d.modele, version: d.version, immatriculation: d.immatriculation, vin: d.vin,
      mise_circulation: d.date_mise_circulation, annee: d.annee, kilometrage: d.etat_des_lieux?.kilometrage ?? d.kilometrage,
    },
    conditions: {
      prix_affiche: prix, net_vendeur: net, remuneration: prix - net, duree_mois: d.duree_mois,
      date_debut: opts.dateDebut, date_fin: opts.dateFin,
      frais_resiliation: d.frais_resiliation, gardiennage_par_jour: d.gardiennage_par_jour,
      gardiennage_delai_jours: d.gardiennage_delai_jours, reversement_heures: p.reversement_heures ?? 48,
      conservation_annees: p.conservation_annees ?? 5,
    },
    etat_des_lieux: d.etat_des_lieux ?? null,
    ...(opts.type === "avenant"
      ? { avenant: { mandat_reference: d.reference, ancienne_date_fin: opts.ancienneDateFin!, nouvelle_date_fin: opts.dateFin, prix_modifie: !!opts.prixModifie } }
      : {}),
  };
}

// --- Texte ---
const eur = (n: number) => `${Math.round(n).toLocaleString("fr-FR").replace(/[  ]/g, " ")} €`;
const jour = (iso: string | null | undefined) =>
  iso ? new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—";
const nomComplet = (i: Instantane) => `${i.deposant.civilite ? `${i.deposant.civilite} ` : ""}${i.deposant.prenom} ${i.deposant.nom.toUpperCase()}`;

type Bloc = { titre?: string; texte: string[] };

function articlesMandat(i: Instantane): Bloc[] {
  const c = i.conditions, v = i.vehicule;
  return [
    { titre: "Article 1 – Objet", texte: [
      `Le Déposant confie à ${SOCIETE.nom}, qui l'accepte, la vente du véhicule désigné à l'article 2, dans le cadre d'un mandat de dépôt-vente exclusif.`,
    ] },
    { titre: "Article 2 – Véhicule et déclarations du Déposant", texte: [
      `${v.marque} ${v.modele}${v.version ? ` ${v.version}` : ""} – immatriculation : ${v.immatriculation ?? "—"} – n° d'identification (VIN) : ${v.vin ?? "—"} – 1re mise en circulation : ${v.mise_circulation ? jour(v.mise_circulation) : v.annee ?? "—"} – kilométrage au dépôt : ${v.kilometrage != null ? `${v.kilometrage.toLocaleString("fr-FR").replace(/[  ]/g, " ")} km` : "—"}.`,
      "Le Déposant déclare être propriétaire du véhicule et seul titulaire du certificat d'immatriculation, que le véhicule n'est ni gagé ni frappé d'opposition, et qu'il n'a pas connaissance d'autres défauts que ceux mentionnés à l'état des lieux annexé.",
    ] },
    { titre: "Article 3 – Prix", texte: [
      `Prix de vente affiché : ${eur(c.prix_affiche)} TTC. Somme revenant au Déposant (« net vendeur ») : ${eur(c.net_vendeur)}.`,
      "Le prix de vente ne peut être modifié qu'avec l'accord écrit du Déposant (un e-mail suffit). Sauf accord différent, une baisse du prix de vente réduit le net vendeur du même montant.",
    ] },
    { titre: "Article 4 – Rémunération de SVM RIDE", texte: [
      `La rémunération de ${SOCIETE.nom} est égale à la différence entre le prix de vente effectif et le net vendeur, soit ${eur(c.remuneration)} TTC sur la base du prix affiché.`,
      "Aucun autre frais n'est facturé au Déposant, à l'exception des frais d'entretien ou de remise en état nécessaires à la vente, qui ne sont engagés qu'avec son accord préalable sur devis.",
    ] },
    { titre: "Article 5 – Déroulement de la vente", texte: [
      `Au moment de la vente, ${SOCIETE.nom} acquiert le véhicule auprès du Déposant au montant du net vendeur et le revend en son nom à l'acheteur. ${SOCIETE.nom} assume seule la relation avec l'acheteur, les garanties qu'elle lui consent et le service après-vente. Le Déposant n'a aucune garantie à assurer envers l'acheteur, sous réserve de l'exactitude de ses déclarations (article 2).`,
    ] },
    { titre: "Article 6 – Durée", texte: [
      `Le mandat est conclu pour une durée de ${c.duree_mois} mois, du ${jour(c.date_debut)} au ${jour(c.date_fin)}. Il ne peut être prolongé que par un avenant écrit signé des deux parties. À défaut de vente ou de prolongation, il prend fin à son terme.`,
    ] },
    { titre: "Article 7 – Exclusivité", texte: [
      "Pendant la durée du mandat, le Déposant s'interdit de proposer le véhicule à la vente, directement ou par un intermédiaire, notamment sur les plateformes d'annonces en ligne.",
    ] },
    { titre: "Article 8 – Fin anticipée", texte: [
      `Le Déposant peut reprendre son véhicule avant le terme du mandat ; une indemnité forfaitaire de ${eur(c.frais_resiliation)} TTC est alors due à ${SOCIETE.nom}. Cette indemnité est également due si le véhicule est vendu pendant la durée du mandat par un autre canal que ${SOCIETE.nom}. ${SOCIETE.nom} peut y renoncer, notamment en cas de cession du véhicule à un proche du Déposant.`,
    ] },
    { titre: "Article 9 – Garde, assurance et essais", texte: [
      `Pendant le dépôt, le véhicule est conservé au showroom de ${SOCIETE.nom}, ${SOCIETE.showroom}, sauf accord contraire, et couvert par l'assurance professionnelle du garage, souscrite auprès d'${SOCIETE.assureur}. Aucun essai routier n'est réalisé sans l'accord préalable du Déposant.`,
    ] },
    { titre: "Article 10 – État des lieux et documents", texte: [
      "Un état des lieux contradictoire est établi à la remise du véhicule (kilométrage, état, accessoires, clés) ; il figure en annexe.",
      "Le Déposant remet, le cas échéant : le certificat d'immatriculation, une pièce d'identité, un certificat de situation administrative (non-gage) de moins de 15 jours, le double des clés, le carnet d'entretien et les factures. Il remet son relevé d'identité bancaire au moment de la vente.",
    ] },
    { titre: "Article 11 – Encaissement et paiement du Déposant", texte: [
      `${SOCIETE.nom} encaisse le prix payé par l'acheteur et verse le net vendeur au Déposant par virement, sous ${c.reversement_heures} heures à compter de l'encaissement intégral du prix.`,
      `En cas de réservation avec acompte, si l'acheteur renonce à son achat, l'acompte reste acquis à ${SOCIETE.nom}, sans aucune conséquence pour le Déposant.`,
    ] },
    { titre: "Article 12 – Démarches administratives", texte: [
      `${SOCIETE.nom} effectue la déclaration de cession et les démarches de changement de titulaire du certificat d'immatriculation. Le Déposant signe les documents nécessaires.`,
    ] },
    { titre: "Article 13 – Fin du mandat sans vente et gardiennage", texte: [
      `À la fin du mandat sans vente ni prolongation, le Déposant récupère son véhicule au showroom. À compter du ${c.gardiennage_delai_jours}e jour suivant la fin du mandat, des frais de gardiennage de ${eur(c.gardiennage_par_jour)} TTC par jour sont dus.`,
    ] },
    { titre: "Article 14 – Données personnelles", texte: [
      `Les données du Déposant sont traitées par ${SOCIETE.nom} pour l'exécution du présent mandat et le respect de ses obligations légales (notamment la tenue du registre des objets mobiliers). Elles sont conservées ${c.conservation_annees} ans après la fin du mandat. Le Déposant peut exercer ses droits d'accès, de rectification et d'effacement en écrivant à ${SOCIETE.email}. Détails : svmride.com/politique-confidentialite.`,
    ] },
    { titre: "Article 15 – Signature électronique et preuve", texte: [
      "Le présent contrat est signé électroniquement. La signature du Déposant est liée à un code à usage unique envoyé à son adresse e-mail. Les parties conviennent que le dossier de preuve conservé par SVM RIDE (horodatage, adresse IP, empreinte SHA-256 du document, étapes de la signature) fait foi entre elles.",
    ] },
    { titre: "Article 16 – Rétractation", texte: [
      "Le présent contrat est conclu dans les locaux de SVM RIDE. Si un droit de rétractation devait néanmoins s'appliquer, le Déposant, en cochant la case prévue lors de la signature, demande l'exécution immédiate du mandat et renonce expressément à ce droit dans la mesure permise par la loi.",
    ] },
    { titre: "Article 17 – Litiges", texte: [
      MEDIATEUR
        ? `En cas de litige, le Déposant peut recourir gratuitement au médiateur de la consommation : ${MEDIATEUR}. Le contrat est soumis au droit français.`
        : "Les parties rechercheront d'abord une solution amiable. Le contrat est soumis au droit français.",
    ] },
  ];
}

function articlesAvenant(i: Instantane): Bloc[] {
  const a = i.avenant!, c = i.conditions;
  const blocs: Bloc[] = [
    { titre: "Article 1 – Prolongation", texte: [
      `Le mandat de dépôt-vente ${a.mandat_reference}, qui prenait fin le ${jour(a.ancienne_date_fin)}, est prolongé jusqu'au ${jour(a.nouvelle_date_fin)}.`,
    ] },
  ];
  if (a.prix_modifie) {
    blocs.push({ titre: "Article 2 – Prix", texte: [
      `À compter de la signature du présent avenant : prix de vente affiché ${eur(c.prix_affiche)} TTC ; net vendeur ${eur(c.net_vendeur)} ; rémunération de SVM RIDE ${eur(c.remuneration)} TTC sur la base du prix affiché.`,
    ] });
  }
  blocs.push({ titre: `Article ${blocs.length + 1} – Autres clauses`, texte: [
    "Toutes les autres clauses du mandat restent inchangées. Le présent avenant est signé électroniquement dans les mêmes conditions que le mandat.",
  ] });
  return blocs;
}

// --- PDF ---
// Les polices standard du PDF n'acceptent que l'alphabet WinAnsi : on remplace le reste.
const WINANSI_EXTRA = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";
function propre(t: string): string {
  return t
    .replace(/[   ]/g, " ")
    .replace(/[‐‑]/g, "-")
    .split("")
    .map((ch) => {
      const c = ch.charCodeAt(0);
      if (c === 10 || (c >= 32 && c <= 126) || (c >= 160 && c <= 255) || WINANSI_EXTRA.includes(ch)) return ch;
      return "?";
    })
    .join("");
}

const NOIR = rgb(0.067, 0.067, 0.067);
const GRIS = rgb(0.37, 0.37, 0.37);
const OR = rgb(0.72, 0.565, 0.184);

class Mise {
  doc: PDFDocument;
  page!: PDFPage;
  y = 0;
  constructor(doc: PDFDocument, public f: PDFFont, public fb: PDFFont, public pied: string) {
    this.doc = doc;
    this.nouvelle();
  }
  nouvelle() {
    this.page = this.doc.addPage([595.28, 841.89]);
    this.y = 841.89 - 56;
  }
  place(h: number) {
    if (this.y - h < 64) this.nouvelle();
  }
  lignes(texte: string, police: PDFFont, taille: number, largeur: number): string[] {
    const sortie: string[] = [];
    for (const para of propre(texte).split("\n")) {
      let ligne = "";
      for (const mot of para.split(/\s+/)) {
        const essai = ligne ? `${ligne} ${mot}` : mot;
        if (police.widthOfTextAtSize(essai, taille) > largeur && ligne) {
          sortie.push(ligne);
          ligne = mot;
        } else ligne = essai;
      }
      sortie.push(ligne);
    }
    return sortie;
  }
  texte(t: string, o: { taille?: number; gras?: boolean; couleur?: ReturnType<typeof rgb>; x?: number; largeur?: number; apres?: number } = {}) {
    const taille = o.taille ?? 9.5, police = o.gras ? this.fb : this.f, x = o.x ?? 56, largeur = o.largeur ?? 595.28 - 112;
    for (const l of this.lignes(t, police, taille, largeur)) {
      this.place(taille + 4);
      this.page.drawText(l, { x, y: this.y, size: taille, font: police, color: o.couleur ?? NOIR });
      this.y -= taille + 3.6;
    }
    this.y -= o.apres ?? 4;
  }
  filet() {
    this.place(10);
    this.page.drawLine({ start: { x: 56, y: this.y + 4 }, end: { x: 595.28 - 56, y: this.y + 4 }, thickness: 0.6, color: OR });
    this.y -= 8;
  }
  numeroter() {
    const pages = this.doc.getPages();
    pages.forEach((p, i) => {
      const t = propre(`${this.pied} – page ${i + 1}/${pages.length}`);
      p.drawText(t, { x: 56, y: 36, size: 7.5, font: this.f, color: GRIS });
    });
  }
}

export async function genererPdf(i: Instantane): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const titre = i.type === "mandat" ? "Mandat de dépôt-vente exclusif" : `Avenant n° ${i.numero - 1} au mandat de dépôt-vente`;
  doc.setTitle(`${titre} ${i.reference}`);
  doc.setAuthor(SOCIETE.nom);
  doc.setSubject(`${i.reference} – ${i.vehicule.marque} ${i.vehicule.modele}`);
  doc.setCreationDate(new Date(i.genere_le));
  doc.setModificationDate(new Date(i.genere_le));
  doc.setProducer("svmride.com");
  doc.setCreator("svmride.com");
  const f = await doc.embedFont(StandardFonts.Helvetica);
  const fb = await doc.embedFont(StandardFonts.HelveticaBold);
  const m = new Mise(doc, f, fb, `${titre} ${i.reference} – modèle ${i.modele_version}`);

  m.texte("SVM RIDE", { taille: 18, gras: true, apres: 2 });
  m.texte(`${SOCIETE.forme} – SIREN ${SOCIETE.siren} – siège : ${SOCIETE.siege} – showroom : ${SOCIETE.showroom}`, { taille: 8, couleur: GRIS, apres: 10 });
  m.filet();
  m.texte(titre.toUpperCase(), { taille: 13, gras: true, apres: 2 });
  m.texte(`Référence ${i.reference}${i.type === "avenant" ? ` – avenant n° ${i.numero - 1}` : ""}`, { taille: 9, couleur: GRIS, apres: 12 });

  m.texte("ENTRE LES SOUSSIGNÉS", { taille: 9, gras: true, apres: 4 });
  m.texte(`${SOCIETE.nom}, ${SOCIETE.forme}, SIREN ${SOCIETE.siren}, dont le siège est ${SOCIETE.siege}, représentée par ${i.representant}, ci-après « SVM RIDE »,`, { apres: 4 });
  m.texte("ET", { gras: true, apres: 4 });
  const d = i.deposant;
  m.texte(`${nomComplet(i)}, demeurant ${d.adresse ?? "—"}, e-mail ${d.email}, téléphone ${d.telephone}${d.piece ? `, ${d.piece}` : ""}, ci-après « le Déposant ».`, { apres: 12 });

  for (const b of i.type === "mandat" ? articlesMandat(i) : articlesAvenant(i)) {
    m.place(40);
    if (b.titre) m.texte(b.titre, { gras: true, taille: 10, apres: 2 });
    for (const t of b.texte) m.texte(t, { apres: 3 });
    m.y -= 4;
  }

  if (i.type === "mandat") {
    m.place(120);
    m.filet();
    m.texte("ANNEXE – ÉTAT DES LIEUX D'ENTRÉE", { gras: true, taille: 10, apres: 4 });
    const e = i.etat_des_lieux ?? {};
    const ligne = (l: string, v: unknown) => m.texte(`${l} : ${v != null && v !== "" ? v : "—"}`, { apres: 1 });
    ligne("Date", e.fait_le ? jour(e.fait_le) : null);
    ligne("Kilométrage", e.kilometrage != null ? `${Number(e.kilometrage).toLocaleString("fr-FR").replace(/[  ]/g, " ")} km` : null);
    ligne("État général", e.etat);
    ligne("Accessoires remis", e.accessoires);
    ligne("Clés remises", e.cles);
    ligne("Défauts et remarques", e.remarques);
    m.y -= 6;
  }

  m.place(70);
  m.filet();
  m.texte(`Fait à Chaville. Signature électronique du Déposant : voir le certificat de signature joint à la version signée de ce document. Pour ${SOCIETE.nom} : ${i.representant}.`, { taille: 8.5, couleur: GRIS });
  m.numeroter();
  return await doc.save({ useObjectStreams: false });
}

/** Ajoute le certificat de signature (dernière page) au PDF d'origine. */
export async function pdfSigne(original: Uint8Array, preuve: {
  reference: string; titre: string; empreinte_original: string; signataire: string; email: string;
  signe_le: string; ip: string; navigateur: string; code_envoye_le: string | null; renonciation: boolean | null;
  ouvert_le: string | null; modele_version: string;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.load(original);
  const f = await doc.embedFont(StandardFonts.Helvetica);
  const fb = await doc.embedFont(StandardFonts.HelveticaBold);
  const m = new Mise(doc, f, fb, `Certificat de signature ${preuve.reference}`);
  const heure = (iso: string | null) => (iso ? new Date(iso).toLocaleString("fr-FR", { timeZone: "Europe/Paris" }) + " (heure de Paris)" : "—");
  m.texte("CERTIFICAT DE SIGNATURE ÉLECTRONIQUE", { taille: 13, gras: true, apres: 6 });
  m.filet();
  const l = (a: string, b: string) => m.texte(`${a} : ${b}`, { apres: 2 });
  l("Document", `${preuve.titre} ${preuve.reference} (modèle ${preuve.modele_version})`);
  l("Empreinte SHA-256 du document signé (pages précédentes)", preuve.empreinte_original);
  l("Signataire", `${preuve.signataire} – ${preuve.email}`);
  l("Document ouvert le", heure(preuve.ouvert_le));
  l("Code à usage unique envoyé à", `${preuve.email}, le ${heure(preuve.code_envoye_le)}`);
  l("Code validé et document signé le", heure(preuve.signe_le));
  l("Adresse IP", preuve.ip || "—");
  l("Navigateur", preuve.navigateur.slice(0, 180) || "—");
  l("Lecture et acceptation du contrat", "case cochée par le signataire");
  if (preuve.renonciation !== null) {
    l("Exécution immédiate et renonciation au délai de rétractation", preuve.renonciation ? "case cochée par le signataire" : "non");
  }
  m.y -= 8;
  m.texte("Ce certificat est généré automatiquement par svmride.com au moment de la signature. Le dossier de preuve complet (journal horodaté des étapes) est conservé par SVM RIDE. Toute modification des pages précédentes change leur empreinte SHA-256 et peut être détectée en la recalculant sur le document d'origine.", { taille: 8.5, couleur: GRIS });
  m.numeroter = () => {};
  return await doc.save({ useObjectStreams: false });
}
