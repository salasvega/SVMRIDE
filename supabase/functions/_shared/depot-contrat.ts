/**
 * Contrat de dépôt-vente : modèle versionné, instantané des données et PDF.
 *
 * Le modèle reprend les règles données par Mattia le 16/10/2026 (rachat par SVM
 * au moment de la vente, mandat exclusif de 2 mois, 290 €, gardiennage 50 €/j à
 * J+7, reversement sous 48 h, démarches par SVM, 5 ans de conservation).
 * TEXTE À FAIRE RELIRE PAR UN JURISTE : chaque changement de texte doit changer
 * MODELE_VERSION (chaque contrat garde la version utilisée).
 *
 * Mise en page (17/10/2026) : celle du modèle de Mattia (« Contrat de dépôt-vente ·
 * 2 et 3 roues d'occasion ») – page 1 parties, véhicule, conditions financières ;
 * page 2 engagements du garage, état des lieux, signatures ; puis conditions
 * générales en deux colonnes. Le texte des articles est inchangé.
 *
 * Signatures (17/10/2026, demande de Mattia) : tampon SVM RIDE dans le cadre du
 * garage ; une fois le contrat signé, nom du déposant en écriture manuscrite
 * (police libre Architects Daughter) avec la date et l'heure de la signature, dans
 * les cadres du contrat et sur le certificat. Le PDF présenté à la signature reste
 * conservé tel quel : son empreinte figure sur le certificat.
 *
 * Société (17/10/2026) : raison sociale, forme, capital, SIRET, RCS, siège,
 * assureur et médiateur se modifient dans l'admin (« Infos du site », bloc
 * Société), de même que le showroom, l'e-mail et le téléphone. Chaque contrat en
 * garde une copie (Instantane.societe) : un contrat créé ou signé ne change
 * jamais ; les contrats plus anciens, sans copie, utilisent SOCIETE ci-dessous.
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage, type RGB } from "npm:pdf-lib@1.17.1";
import fontkit from "npm:@pdf-lib/fontkit@1.1.1";

export const MODELE_VERSION = "mandat-depot-vente-2026-10-17f";

export interface SocieteContrat {
  nom: string; forme: string; capital: string; siren: string; siret: string; rcs: string; siege: string;
  showroom: string; assureur: string; email: string; telephone: string;
  /** Médiateur de la consommation (vide tant qu'il n'est pas désigné) */
  mediateur: string;
}

/** Valeurs de secours, et celles des contrats créés avant le 17/10/2026 (sans copie) */
export const SOCIETE: SocieteContrat = {
  nom: "SVM RIDE",
  forme: "SAS",
  capital: "",
  siren: "988 004 719",
  siret: "988 004 719 00015",
  rcs: "RCS Nanterre",
  siege: "3 Rue Émile Verhaeren, 92210 Saint-Cloud",
  showroom: "310 Avenue Roger Salengro, 92370 Chaville",
  /** Assureur du garage (réponse de Mattia, 17/10/2026) */
  assureur: "AXA",
  email: "contact@svmride.com",
  telephone: "01 84 19 01 74",
  mediateur: "",
};

const txt = (v: unknown, max = 160) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

/**
 * Copie des informations de la société pour un nouveau contrat, à partir des
 * réglages de l'admin « societe » et « coordonnees » (table site_reglages).
 * Ce qui manque ou n'est pas valable reprend la valeur de SOCIETE.
 */
export function societeContrat(societe: unknown, coordonnees: unknown): SocieteContrat {
  const s = (societe && typeof societe === "object" ? societe : {}) as Record<string, unknown>;
  const c = (coordonnees && typeof coordonnees === "object" ? coordonnees : {}) as Record<string, any>;
  const siret = txt(s.siret, 20).replace(/\s/g, "");
  const siretOk = /^\d{14}$/.test(siret);
  const sh = c.showroom ?? {};
  const rue = txt(sh.adresse), cp = txt(sh.code_postal, 5), ville = txt(sh.ville);
  const email = txt(c.email, 120);
  const mediateur = txt(s.mediateur_nom, 120)
    ? [txt(s.mediateur_nom, 120), txt(s.mediateur_site, 120), txt(s.mediateur_adresse)].filter(Boolean).join(" – ")
    : "";
  return {
    nom: txt(s.raison_sociale, 80) || SOCIETE.nom,
    forme: txt(s.forme, 40) || SOCIETE.forme,
    capital: txt(s.capital, 40),
    siren: siretOk ? `${siret.slice(0, 3)} ${siret.slice(3, 6)} ${siret.slice(6, 9)}` : SOCIETE.siren,
    siret: siretOk ? `${siret.slice(0, 3)} ${siret.slice(3, 6)} ${siret.slice(6, 9)} ${siret.slice(9)}` : SOCIETE.siret,
    rcs: txt(s.rcs, 60) || SOCIETE.rcs,
    siege: txt(s.siege) || SOCIETE.siege,
    showroom: rue && /^\d{5}$/.test(cp) && ville ? `${rue}, ${cp} ${ville}` : SOCIETE.showroom,
    assureur: txt(s.assureur, 80) || SOCIETE.assureur,
    email: /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email) ? email : SOCIETE.email,
    telephone: /\d{2}.*\d{2}/.test(txt(c.telephone, 30)) ? txt(c.telephone, 30) : SOCIETE.telephone,
    mediateur,
  };
}

/** Société du contrat : sa copie, ou SOCIETE pour les contrats plus anciens */
const soc = (i?: { societe?: SocieteContrat } | null): SocieteContrat => i?.societe ?? SOCIETE;

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
  etat_des_lieux: { fait_le?: string; heure?: string; kilometrage?: number; etat?: string; accessoires?: string; cles?: string; remarques?: string } | null;
  /** Copie des informations de la société au moment de la création du contrat */
  societe?: SocieteContrat;
  /** Emplacements de la signature du déposant dans le PDF (renseignés par genererPdf) */
  cadres_deposant?: Cadre[];
  avenant?: { mandat_reference: string; ancienne_date_fin: string; nouvelle_date_fin: string; prix_modifie: boolean };
}

const PIECES: Record<string, string> = { cni: "Carte d'identité", passeport: "Passeport", titre_sejour: "Titre de séjour", permis: "Permis de conduire" };

export function construireInstantane(d: Record<string, any>, p: Record<string, any>, opts: {
  type: "mandat" | "avenant"; numero: number; representant: string; dateDebut: string; dateFin: string;
  ancienneDateFin?: string; prixModifie?: boolean; societe?: SocieteContrat;
}): Instantane {
  const prix = Number(d.prix_affiche), net = Number(d.net_vendeur);
  return {
    type: opts.type,
    numero: opts.numero,
    reference: d.reference,
    modele_version: MODELE_VERSION,
    genere_le: new Date().toISOString(),
    representant: opts.representant,
    societe: opts.societe ?? SOCIETE,
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

export interface Cadre { page: number; x: number; y: number; l: number; h: number }
/** Signature réalisée : nom à écrire à la main et date de signature */
export interface SignatureFaite { nom: string; signe_le: string }

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
      `Le Déposant confie à ${soc(i).nom}, qui l'accepte, la vente du véhicule désigné à l'article 2, dans le cadre d'un mandat de dépôt-vente exclusif.`,
    ] },
    { titre: "Article 2 – Véhicule et déclarations du Déposant", texte: [
      `${v.marque} ${v.modele}${v.version ? ` ${v.version}` : ""} – immatriculation : ${v.immatriculation ?? "—"} – n° d'identification (VIN) : ${v.vin ?? "—"} – 1re mise en circulation : ${v.mise_circulation ? jour(v.mise_circulation) : v.annee ?? "—"} – kilométrage au dépôt : ${v.kilometrage != null ? `${v.kilometrage.toLocaleString("fr-FR").replace(/[  ]/g, " ")} km` : "—"}.`,
      "Le Déposant déclare être propriétaire du véhicule et seul titulaire du certificat d'immatriculation, que le véhicule n'est ni gagé ni frappé d'opposition, et qu'il n'a pas connaissance d'autres défauts que ceux mentionnés à l'état des lieux du présent contrat.",
    ] },
    { titre: "Article 3 – Prix", texte: [
      `Prix de vente affiché : ${eur(c.prix_affiche)} TTC. Somme revenant au Déposant (« net vendeur ») : ${eur(c.net_vendeur)}.`,
      "Le prix de vente ne peut être modifié qu'avec l'accord écrit du Déposant (un e-mail suffit). Sauf accord différent, une baisse du prix de vente réduit le net vendeur du même montant.",
    ] },
    { titre: "Article 4 – Rémunération de SVM RIDE", texte: [
      `La rémunération de ${soc(i).nom} est égale à la différence entre le prix de vente effectif et le net vendeur, soit ${eur(c.remuneration)} TTC sur la base du prix affiché.`,
      "Aucun autre frais n'est facturé au Déposant, à l'exception des frais d'entretien ou de remise en état nécessaires à la vente, qui ne sont engagés qu'avec son accord préalable sur devis.",
    ] },
    { titre: "Article 5 – Déroulement de la vente", texte: [
      `Au moment de la vente, ${soc(i).nom} acquiert le véhicule auprès du Déposant au montant du net vendeur et le revend en son nom à l'acheteur. ${soc(i).nom} assume seule la relation avec l'acheteur, les garanties qu'elle lui consent et le service après-vente. Le Déposant n'a aucune garantie à assurer envers l'acheteur, sous réserve de l'exactitude de ses déclarations (article 2).`,
    ] },
    { titre: "Article 6 – Durée", texte: [
      `Le mandat est conclu pour une durée de ${c.duree_mois} mois, du ${jour(c.date_debut)} au ${jour(c.date_fin)}. Il ne peut être prolongé que par un avenant écrit signé des deux parties. À défaut de vente ou de prolongation, il prend fin à son terme.`,
    ] },
    { titre: "Article 7 – Exclusivité", texte: [
      "Pendant la durée du mandat, le Déposant s'interdit de proposer le véhicule à la vente, directement ou par un intermédiaire, notamment sur les plateformes d'annonces en ligne.",
    ] },
    { titre: "Article 8 – Fin anticipée", texte: [
      `Le Déposant peut reprendre son véhicule avant le terme du mandat ; une indemnité forfaitaire de ${eur(c.frais_resiliation)} TTC est alors due à ${soc(i).nom}. Cette indemnité est également due si le véhicule est vendu pendant la durée du mandat par un autre canal que ${soc(i).nom}. ${soc(i).nom} peut y renoncer, notamment en cas de cession du véhicule à un proche du Déposant.`,
    ] },
    { titre: "Article 9 – Garde, assurance et essais", texte: [
      `Pendant le dépôt, le véhicule est conservé au showroom de ${soc(i).nom}, ${soc(i).showroom}, sauf accord contraire, et couvert par l'assurance professionnelle du garage, souscrite auprès d'${soc(i).assureur}. Aucun essai routier n'est réalisé sans l'accord préalable du Déposant.`,
    ] },
    { titre: "Article 10 – État des lieux et documents", texte: [
      "Un état des lieux contradictoire est établi à la remise du véhicule (kilométrage, état, accessoires, clés) ; il figure dans le présent contrat, rubrique « État des lieux contradictoire ».",
      "Le Déposant remet, le cas échéant : le certificat d'immatriculation, une pièce d'identité, un certificat de situation administrative (non-gage) de moins de 15 jours, le double des clés, le carnet d'entretien et les factures. Il remet son relevé d'identité bancaire au moment de la vente.",
    ] },
    { titre: "Article 11 – Encaissement et paiement du Déposant", texte: [
      `${soc(i).nom} encaisse le prix payé par l'acheteur et verse le net vendeur au Déposant par virement, sous ${c.reversement_heures} heures à compter de l'encaissement intégral du prix.`,
      `En cas de réservation avec acompte, si l'acheteur renonce à son achat, l'acompte reste acquis à ${soc(i).nom}, sans aucune conséquence pour le Déposant.`,
    ] },
    { titre: "Article 12 – Démarches administratives", texte: [
      `${soc(i).nom} effectue la déclaration de cession et les démarches de changement de titulaire du certificat d'immatriculation. Le Déposant signe les documents nécessaires.`,
    ] },
    { titre: "Article 13 – Fin du mandat sans vente et gardiennage", texte: [
      `À la fin du mandat sans vente ni prolongation, le Déposant récupère son véhicule au showroom. À compter du ${c.gardiennage_delai_jours}e jour suivant la fin du mandat, des frais de gardiennage de ${eur(c.gardiennage_par_jour)} TTC par jour sont dus.`,
    ] },
    { titre: "Article 14 – Données personnelles", texte: [
      `Les données du Déposant sont traitées par ${soc(i).nom} pour l'exécution du présent mandat et le respect de ses obligations légales (notamment la tenue du registre des objets mobiliers). Elles sont conservées ${c.conservation_annees} ans après la fin du mandat. Le Déposant peut exercer ses droits d'accès, de rectification et d'effacement en écrivant à ${soc(i).email}. Détails : svmride.com/politique-confidentialite.`,
    ] },
    { titre: "Article 15 – Signature électronique et preuve", texte: [
      "Le présent contrat est signé électroniquement. La signature du Déposant est liée à un code à usage unique envoyé à son adresse e-mail. Les parties conviennent que le dossier de preuve conservé par SVM RIDE (horodatage, adresse IP, empreinte SHA-256 du document, étapes de la signature) fait foi entre elles.",
    ] },
    { titre: "Article 16 – Rétractation", texte: [
      "Le présent contrat est conclu dans les locaux de SVM RIDE. Si un droit de rétractation devait néanmoins s'appliquer, le Déposant, en cochant la case prévue lors de la signature, demande l'exécution immédiate du mandat et renonce expressément à ce droit dans la mesure permise par la loi.",
    ] },
    { titre: "Article 17 – Litiges", texte: [
      soc(i).mediateur
        ? `En cas de litige, le Déposant peut recourir gratuitement au médiateur de la consommation : ${soc(i).mediateur}. Le contrat est soumis au droit français.`
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
const GRIS = rgb(0.4, 0.4, 0.4);
const GRIS_CLAIR = rgb(0.8, 0.8, 0.8);
const FOND = rgb(0.955, 0.955, 0.955);

/**
 * Fichiers lus sur le site (dossier public/) et gardés en mémoire une fois lus :
 * logo de l'en-tête, tampon SVM RIDE, police manuscrite. Si le site ne répond pas,
 * le document est produit sans eux (et ils sont redemandés la fois suivante).
 */
export const URL_LOGO = "https://svmride.com/logo-contrat.jpg";
const RESSOURCES = {
  logo: URL_LOGO,
  tampon: "https://svmride.com/contrat/tampon-svm-ride.png",
  ecriture: "https://svmride.com/contrat/ecriture.ttf",
};
type NomRessource = keyof typeof RESSOURCES;
const cache: Partial<Record<NomRessource, Uint8Array>> = {};
async function ressource(nom: NomRessource): Promise<Uint8Array | null> {
  if (cache[nom]) return cache[nom]!;
  try {
    const r = await fetch(RESSOURCES[nom], { signal: AbortSignal.timeout(4000) });
    if (r.ok) cache[nom] = new Uint8Array(await r.arrayBuffer());
  } catch (_) {
    // sans ce fichier cette fois-ci
  }
  return cache[nom] ?? null;
}
/** Pour les tests : fichiers fournis directement */
export function definirRessources(f: Partial<Record<NomRessource, Uint8Array>>) {
  Object.assign(cache, f);
}
export function definirLogo(octets: Uint8Array | null) {
  if (octets) cache.logo = octets;
}

const quandParis = (iso: string) => {
  const d = new Date(iso);
  const jourTxt = d.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long", year: "numeric" });
  const h = d.toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" }).replace(":", " h ");
  return `${jourTxt} à ${h}`;
};
/** Nom écrit à la main, comme sur le modèle de Mattia : « NOM PRÉNOM » */
const nomManuscrit = (i: Instantane) => `${i.deposant.nom} ${i.deposant.prenom}`.toUpperCase();

// A4, marges du modèle de Mattia
const L = 595.28, H = 841.89, M = 56, LARG = L - 2 * M, BAS = 60;
const ENTETE = "Contrat de dépôt-vente · 2 et 3 roues d'occasion";

interface Opt {
  taille?: number; gras?: boolean; italique?: boolean; couleur?: RGB; x?: number; largeur?: number;
  apres?: number; centre?: boolean; justifie?: boolean; retrait?: number; interligne?: number;
}

/** Mise en page : en-tête (logo) et pied de page sur chaque page, texte qui coule d'une page à l'autre, deux colonnes. */
class Mise {
  page!: PDFPage;
  y = 0;
  /** Société du document (pied de page) */
  soc: SocieteContrat = SOCIETE;
  private cols: { x: number[]; largeur: number; i: number; haut: number; bas: number; limite: number } | null = null;

  constructor(
    public doc: PDFDocument, public f: PDFFont, public fb: PDFFont, public fi: PDFFont,
    public logo: PDFImage | null, public pied: string,
    public tampon: PDFImage | null = null, public fe: PDFFont | null = null,
  ) {
    this.nouvelle();
  }

  static async creer(doc: PDFDocument, pied: string) {
    const [f, fb, fi] = await Promise.all([
      doc.embedFont(StandardFonts.Helvetica), doc.embedFont(StandardFonts.HelveticaBold), doc.embedFont(StandardFonts.HelveticaOblique),
    ]);
    const [o1, o2, o3] = await Promise.all([ressource("logo"), ressource("tampon"), ressource("ecriture")]);
    const logo = o1 ? await doc.embedJpg(o1).catch(() => null) : null;
    const tampon = o2 ? await doc.embedPng(o2).catch(() => null) : null;
    let fe: PDFFont | null = null;
    if (o3) {
      doc.registerFontkit(fontkit);
      fe = await doc.embedFont(o3, { subset: true }).catch(() => null);
    }
    return new Mise(doc, f, fb, fi, logo, pied, tampon, fe);
  }

  nouvelle() {
    if (this.cols && this.page) this.filetColonnes(Math.min(this.cols.bas, this.y));
    this.page = this.doc.addPage([L, H]);
    if (this.logo) this.page.drawImage(this.logo, { x: M - 12, y: H - 92, width: 62, height: 62 });
    const t = propre(ENTETE);
    this.page.drawText(t, { x: L - M - this.f.widthOfTextAtSize(t, 7.5), y: H - 50, size: 7.5, font: this.f, color: GRIS });
    this.page.drawLine({ start: { x: M, y: H - 100 }, end: { x: L - M, y: H - 100 }, thickness: 0.5, color: GRIS_CLAIR });
    this.y = H - 120;
    if (this.cols) Object.assign(this.cols, { i: 0, haut: this.y, bas: this.y, limite: -Infinity });
  }

  get x() { return this.cols ? this.cols.x[this.cols.i] : M; }
  get largeur() { return this.cols ? this.cols.largeur : LARG; }

  /** Place pour h points, sinon colonne suivante ou nouvelle page */
  place(h: number) {
    if (this.cols && this.cols.i === 0 && this.y - h < this.cols.limite) {
      this.cols.bas = this.y;
      this.cols.i = 1;
      this.y = this.cols.haut;
      return;
    }
    if (this.y - h >= BAS) return;
    if (this.cols && this.cols.i === 0) {
      this.cols.bas = this.y;
      this.cols.i = 1;
      this.y = this.cols.haut;
      return;
    }
    this.nouvelle();
  }

  /** Deux colonnes ; avec la hauteur totale du texte, elles sont équilibrées */
  colonnes(hauteurTotale?: number) {
    const ecart = 26;
    const limite = hauteurTotale ? this.y - hauteurTotale / 2 - 6 : -Infinity;
    this.cols = { x: [M, M + (LARG + ecart) / 2], largeur: (LARG - ecart) / 2, i: 0, haut: this.y, bas: this.y, limite };
  }
  get largeurColonne() { return (LARG - 26) / 2; }
  finColonnes() {
    if (!this.cols) return;
    const bas = this.cols.i === 1 ? Math.min(this.cols.bas, this.y) : this.y;
    this.filetColonnes(bas);
    this.cols = null;
    this.y = bas - 6;
  }
  private filetColonnes(bas: number) {
    if (!this.cols || this.cols.i === 0) return; // une seule colonne remplie sur cette page
    const x = M + LARG / 2;
    this.page.drawLine({ start: { x, y: this.cols.haut }, end: { x, y: bas + 4 }, thickness: 0.5, color: GRIS_CLAIR });
  }

  police(o: Opt) { return o.gras ? this.fb : o.italique ? this.fi : this.f; }

  couper(texte: string, police: PDFFont, taille: number, largeur: number): string[] {
    const sortie: string[] = [];
    for (const para of propre(texte).split("\n")) {
      let ligne = "";
      for (const mot of para.split(/\s+/).filter(Boolean)) {
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

  /** Dessine une ligne (y = haut de la ligne), éventuellement justifiée */
  private ligne(l: string, x: number, y: number, larg: number, taille: number, police: PDFFont, couleur: RGB, o: Opt, derniere: boolean) {
    const w = police.widthOfTextAtSize(l, taille);
    const base = y - taille;
    if (o.justifie && !derniere && l.includes(" ")) {
      const mots = l.split(" ");
      const total = mots.reduce((s, m) => s + police.widthOfTextAtSize(m, taille), 0);
      const espace = (larg - total) / (mots.length - 1);
      if (espace < taille * 1.2) {
        let cx = x;
        for (const m of mots) {
          this.page.drawText(m, { x: cx, y: base, size: taille, font: police, color: couleur });
          cx += police.widthOfTextAtSize(m, taille) + espace;
        }
        return;
      }
    }
    const cx = o.centre ? x + (larg - w) / 2 : x;
    this.page.drawText(l, { x: cx, y: base, size: taille, font: police, color: couleur });
  }

  /** Texte qui coule (colonnes, pages) */
  texte(t: string, o: Opt = {}) {
    const taille = o.taille ?? 9, police = this.police(o), inter = taille * (o.interligne ?? 1.35), retrait = o.retrait ?? 0;
    const larg = (o.largeur ?? this.largeur) - retrait;
    const lignes = this.couper(t, police, taille, larg);
    lignes.forEach((l, k) => {
      this.place(inter);
      this.ligne(l, (o.x ?? this.x) + retrait, this.y, larg, taille, police, o.couleur ?? NOIR, o, k === lignes.length - 1);
      this.y -= inter;
    });
    this.y -= o.apres ?? 3;
  }

  /** Texte à une position donnée, sans saut de page ; renvoie la hauteur utilisée */
  bloc(t: string, x: number, y: number, larg: number, o: Opt = {}): number {
    const taille = o.taille ?? 9, police = this.police(o), inter = taille * 1.35;
    const lignes = this.couper(t, police, taille, larg);
    lignes.forEach((l, k) => this.ligne(l, x, y - k * inter, larg, taille, police, o.couleur ?? NOIR, o, k === lignes.length - 1));
    return lignes.length * inter;
  }
  hauteur(t: string, larg: number, o: Opt = {}) {
    const taille = o.taille ?? 9;
    return this.couper(t, this.police(o), taille, larg).length * taille * (o.interligne ?? 1.35);
  }

  /** Suite de morceaux sur une ligne (libellés gris, montants en gras), centrée */
  morceaux(parts: { t: string; gras?: boolean; gris?: boolean }[], taille: number) {
    const largeur = (s: number) => parts.reduce((w, p) => w + (p.gras ? this.fb : this.f).widthOfTextAtSize(propre(p.t), s), 0);
    let s = taille;
    while (largeur(s) > LARG && s > 7) s -= 0.5;
    this.place(s * 1.6);
    let x = M + (LARG - largeur(s)) / 2;
    for (const p of parts) {
      const t = propre(p.t), police = p.gras ? this.fb : this.f;
      this.page.drawText(t, { x, y: this.y - s, size: s, font: police, color: p.gris ? GRIS : NOIR });
      x += police.widthOfTextAtSize(t, s);
    }
    this.y -= s * 1.6 + 4;
  }

  trait(epaisseur = 0.5, couleur: RGB = GRIS_CLAIR) {
    this.page.drawLine({ start: { x: M, y: this.y }, end: { x: L - M, y: this.y }, thickness: epaisseur, color: couleur });
  }

  /** Titre de rubrique : « VEHICULE DÉPOSÉ » souligné d'un trait noir */
  section(titre: string, place = 70) {
    this.place(place);
    this.y -= 14;
    this.texte(titre.toUpperCase(), { gras: true, taille: 8.5, apres: 0 });
    this.y -= 2;
    this.trait(0.9, NOIR);
    this.y -= 10;
  }

  /** Libellé / valeur, deux paires par ligne (ou une seule si large) */
  paires(items: { l: string; v: string; gras?: boolean }[], parLigne: 1 | 2 = 2) {
    const largCol = parLigne === 2 ? (LARG - 20) / 2 : LARG;
    const largLib = parLigne === 2 ? 92 : 130;
    for (let i = 0; i < items.length; i += parLigne) {
      const rang = items.slice(i, i + parLigne);
      const h = Math.max(...rang.map((it) => Math.max(this.hauteur(it.l, largLib - 6, { taille: 8.5 }), this.hauteur(it.v, largCol - largLib, { taille: 8.5, gras: it.gras }))));
      this.place(h + 4);
      rang.forEach((it, k) => {
        const x = M + k * (largCol + 20);
        this.bloc(it.l, x, this.y, largLib - 6, { taille: 8.5, couleur: GRIS });
        this.bloc(it.v, x + largLib, this.y, largCol - largLib, { taille: 8.5, gras: it.gras });
      });
      this.y -= h + 4;
    }
  }

  /** Deux blocs côte à côte (rubrique « Responsabilités » du modèle) */
  deuxBlocs(gauche: (x: number, larg: number) => void, droite: (x: number, larg: number) => void) {
    const ecart = 30, larg = (LARG - ecart) / 2, haut = this.y;
    gauche(M, larg);
    const basG = this.y;
    this.y = haut;
    droite(M + larg + ecart, larg);
    const bas = Math.min(basG, this.y);
    this.page.drawLine({ start: { x: M + LARG / 2, y: haut }, end: { x: M + LARG / 2, y: bas + 6 }, thickness: 0.5, color: GRIS_CLAIR });
    this.y = bas;
  }

  /** Cadres de signature : le Déposant à gauche, SVM RIDE à droite (tampon). */
  signatures(i: Instantane, titre?: string, faite?: SignatureFaite) {
    const h = 90;
    this.place(h + (titre ? 24 : 12));
    if (titre) this.texte(titre, { gras: true, taille: 9, apres: 5 });
    const larg = (LARG - 30) / 2, haut = this.y;
    const fond = (x: number) => this.page.drawRectangle({ x, y: haut - h, width: larg, height: h, color: FOND });
    const filet = (x: number) => this.page.drawLine({ start: { x: x + 12, y: haut - h + 20 }, end: { x: x + larg - 12, y: haut - h + 20 }, thickness: 0.6, color: NOIR });

    // Déposant
    fond(M);
    this.bloc("Le Déposant", M + 12, haut - 12, larg - 24, { gras: true, taille: 9 });
    this.bloc(nomComplet(i), M + 12, haut - 25, larg - 24, { italique: true, taille: 7.5, couleur: GRIS });
    filet(M);
    this.bloc("Signature électronique · voir le certificat de signature", M + 12, haut - h + 15, larg - 24, { taille: 6.5, couleur: GRIS });
    const cadre: Cadre = { page: this.doc.getPages().indexOf(this.page), x: M + 12, y: haut - h + 22, l: larg - 24, h: 44 };
    (i.cadres_deposant ??= []).push(cadre);
    if (faite) this.signer(this.page, cadre, faite);

    // Garage
    const xg = M + larg + 30;
    fond(xg);
    this.bloc(`Le Garage – ${soc(i).nom}`, xg + 12, haut - 12, larg - 24, { gras: true, taille: 9 });
    this.bloc("Lu et approuvé · Bon pour dépôt", xg + 12, haut - 25, larg - 24, { italique: true, taille: 7.5, couleur: GRIS });
    // Signataire et date à gauche, tampon à droite (il déborde sur le trait, comme sur le modèle de Mattia)
    const lt = 118, largTexte = larg - 24 - (this.tampon ? lt - 10 : 0);
    let yt = haut - 37;
    yt -= this.bloc(`Pour ${soc(i).nom} :`, xg + 12, yt, largTexte, { taille: 7.5 });
    yt -= this.bloc(i.representant, xg + 12, yt, largTexte, { taille: 7.5, gras: true });
    this.bloc(`Chaville, ${new Date(i.genere_le).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })}`, xg + 12, yt, largTexte, { taille: 7.5, couleur: GRIS });
    filet(xg);
    this.bloc("Signature et cachet", xg + 12, haut - h + 15, largTexte, { taille: 6.5, couleur: GRIS });
    if (this.tampon) {
      const ht = lt * this.tampon.height / this.tampon.width;
      this.page.drawImage(this.tampon, { x: xg + larg - lt - 4, y: haut - h - 4, width: lt, height: ht });
    }
    this.y = haut - h - 10;
  }

  /** Nom en écriture manuscrite + date et heure, dans un cadre de signature */
  signer(page: PDFPage, c: Cadre, faite: SignatureFaite) {
    const police = this.fe ?? this.fi;
    const nom = propre(faite.nom);
    let taille = 20;
    while (police.widthOfTextAtSize(nom, taille) > c.l && taille > 9) taille -= 1;
    page.drawText(nom, { x: c.x + 2, y: c.y + 18, size: taille, font: police, color: rgb(0.08, 0.13, 0.33) });
    const mention = propre(`Signé électroniquement le ${quandParis(faite.signe_le)}`);
    page.drawText(mention, { x: c.x + 2, y: c.y + 5, size: 6.5, font: this.f, color: GRIS });
  }

  /** Pied de page : société au centre, n° de page à droite, référence du document dessous */
  numeroter(premiere = 0, total?: number) {
    const pages = this.doc.getPages();
    const n = total ?? pages.length;
    pages.slice(premiere).forEach((p, k) => this.piedDePage(p, `${premiere + k + 1} / ${n}`));
  }
  piedDePage(p: PDFPage, droite: string) {
    p.drawLine({ start: { x: M, y: 52 }, end: { x: L - M, y: 52 }, thickness: 0.5, color: GRIS_CLAIR });
    const centre = propre(`${this.soc.nom} · ${this.soc.rcs.toUpperCase()} · SIRET ${this.soc.siret}`);
    p.drawText(centre, { x: (L - this.f.widthOfTextAtSize(centre, 7)) / 2, y: 40, size: 7, font: this.f, color: GRIS });
    const d = propre(droite);
    p.drawText(d, { x: L - M - this.f.widthOfTextAtSize(d, 7), y: 40, size: 7, font: this.f, color: GRIS });
    const bas = propre(this.pied);
    p.drawText(bas, { x: (L - this.f.widthOfTextAtSize(bas, 6)) / 2, y: 30, size: 6, font: this.f, color: GRIS });
  }
}

const dateParis = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long", year: "numeric" });
const km = (n: number | null | undefined) =>
  n != null ? `${Number(n).toLocaleString("fr-FR").replace(/[  ]/g, " ")} km` : "—";
const ou = (v: unknown) => (v != null && v !== "" ? String(v) : "—");
/** « Article 9 – Garde, assurance et essais » → « 9.  GARDE, ASSURANCE ET ESSAIS » */
const titreCG = (t: string) => t.replace(/^Article (\d+) – (.*)$/, (_, n, s) => `${n}.  ${s.toUpperCase()}`);

/** En-tête commun : titre, sous-titre, référence, puis les deux parties côte à côte */
function enTete(m: Mise, i: Instantane, titre: string, sousTitre: string) {
  m.texte(titre, { gras: true, taille: 19, centre: true, apres: 6 });
  m.texte(sousTitre, { italique: true, taille: 10, centre: true, apres: 3 });
  m.texte(`Réf. ${i.reference}   ·   Chaville, le ${dateParis(i.genere_le)}`, { taille: 8, centre: true, couleur: GRIS, apres: 14 });
  m.trait();
  m.y -= 16;
  const d = i.deposant;
  m.deuxBlocs(
    (x, larg) => {
      m.texte("LE DÉPOSANT", { gras: true, taille: 7.5, x: x + 10, largeur: larg - 10, apres: 1 });
      m.texte(nomComplet(i), { gras: true, taille: 10, x: x + 10, largeur: larg - 10, apres: 1 });
      for (const l of [`Adresse : ${ou(d.adresse)}`, `Tél. : ${d.telephone} · ${d.email}`, ...(d.piece ? [d.piece] : [])]) {
        m.texte(l, { taille: 8, couleur: GRIS, x: x + 10, largeur: larg - 10, apres: 0 });
      }
      m.texte("Ci-après désigné « le Déposant »", { italique: true, taille: 8, couleur: GRIS, x: x + 10, largeur: larg - 10, apres: 0 });
    },
    (x, larg) => {
      m.texte("LE GARAGE", { gras: true, taille: 7.5, x, largeur: larg, apres: 1 });
      m.texte(soc(i).nom, { gras: true, taille: 10, x, largeur: larg, apres: 1 });
      for (const l of [
        `${soc(i).forme}${soc(i).capital ? ` au capital de ${soc(i).capital}` : ""} – siège : ${soc(i).siege}`, `SIRET : ${soc(i).siret} – ${soc(i).rcs}`,
        `Showroom : ${soc(i).showroom}`, `Représentée par ${i.representant}`,
      ]) m.texte(l, { taille: 8, couleur: GRIS, x, largeur: larg, apres: 0 });
      m.texte("Ci-après désigné « SVM RIDE » ou « le Garage »", { italique: true, taille: 8, couleur: GRIS, x, largeur: larg, apres: 0 });
    },
  );
  m.y -= 12;
  m.trait();
}

export async function genererPdf(i: Instantane): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const titre = i.type === "mandat" ? "Mandat de dépôt-vente exclusif" : `Avenant n° ${i.numero - 1} au mandat de dépôt-vente`;
  doc.setTitle(`${titre} ${i.reference}`);
  doc.setAuthor(soc(i).nom);
  doc.setSubject(`${i.reference} – ${i.vehicule.marque} ${i.vehicule.modele}`);
  doc.setCreationDate(new Date(i.genere_le));
  doc.setModificationDate(new Date(i.genere_le));
  doc.setProducer("svmride.com");
  doc.setCreator("svmride.com");
  const m = await Mise.creer(doc, `${titre} ${i.reference} – modèle ${i.modele_version}`);
  m.soc = soc(i);
  const v = i.vehicule, c = i.conditions, e = i.etat_des_lieux ?? {};
  i.cadres_deposant = []; // renseignés par m.signatures(), gardés avec les données du contrat

  if (i.type === "mandat") {
    const art = articlesMandat(i);
    // ---- Page 1 : parties, véhicule, conditions ----
    enTete(m, i, "CONTRAT DE DÉPÔT-VENTE", "Mandat de dépôt-vente exclusif · véhicule deux ou trois roues d'occasion");
    m.section("Véhicule déposé");
    m.paires([
      { l: "Marque", v: v.marque }, { l: "N° de série (VIN)", v: ou(v.vin) },
      { l: "Modèle", v: `${v.modele}${v.version ? ` ${v.version}` : ""}`, gras: true }, { l: "Kilométrage", v: km(v.kilometrage) },
      { l: "Immatriculation", v: ou(v.immatriculation) }, { l: "1re mise en circulation", v: v.mise_circulation ? jour(v.mise_circulation) : ou(v.annee) },
      { l: "État général", v: ou(e.etat) }, { l: "Date de dépôt", v: e.fait_le ? jour(e.fait_le) : "—" },
    ]);
    m.y -= 4;
    m.section("Conditions financières & mandat");
    m.morceaux([
      { t: "Prix de vente public  ", gris: true }, { t: eur(c.prix_affiche), gras: true }, { t: "  TTC        ", gris: true },
      { t: "Rémunération SVM RIDE  ", gris: true }, { t: eur(c.remuneration), gras: true }, { t: "  TTC        ", gris: true },
      { t: "Prix net vendeur  ", gris: true }, { t: eur(c.net_vendeur), gras: true },
    ], 11);
    m.texte(`Reversement du net vendeur par virement, sous ${c.reversement_heures} heures à compter de l'encaissement intégral du prix (art. 11).`, { italique: true, taille: 8, couleur: GRIS, apres: 10 });
    m.paires([
      { l: "Durée du mandat", v: `${c.duree_mois} mois, du ${jour(c.date_debut)} au ${jour(c.date_fin)} ; prolongation par avenant écrit uniquement (art. 6)` },
      { l: "Type de mandat", v: "Exclusif – le Déposant s'interdit de proposer le véhicule à la vente, directement ou par un intermédiaire (art. 7)" },
      { l: "Prix", v: "Le prix de vente ne peut être modifié qu'avec l'accord écrit du Déposant (art. 3)" },
      { l: "Rémunération", v: "Différence entre le prix de vente effectif et le net vendeur ; aucun autre frais sans accord préalable sur devis (art. 4)" },
      { l: "Fin du mandat sans vente", v: `Frais de gardiennage de ${eur(c.gardiennage_par_jour)} TTC par jour à compter du ${c.gardiennage_delai_jours}e jour suivant la fin du mandat (art. 13)` },
    ], 1);
    m.y -= 10;
    m.place(70);
    m.trait(0.9, NOIR);
    m.y -= 10;
    m.texte(`Frais de résiliation anticipée par le Déposant : ${eur(c.frais_resiliation)} TTC`, { gras: true, taille: 11, apres: 3 });
    m.texte(`Indemnité forfaitaire due à ${soc(i).nom} si le Déposant reprend son véhicule avant le terme du mandat, ou si le véhicule est vendu pendant le mandat par un autre canal (art. 8).`, { italique: true, taille: 8, couleur: GRIS, apres: 8 });
    m.trait(0.9, NOIR);

    // ---- Page 2 : engagements du garage, état des lieux, signatures ----
    m.nouvelle();
    m.section("Responsabilités, assurances & obligations du garage", 200);
    m.deuxBlocs(
      (x, larg) => {
        m.texte("Garde, assurance et essais", { gras: true, taille: 8.5, x, largeur: larg, apres: 2 });
        m.texte(art[8].texte.join(" "), { taille: 8, x, largeur: larg, justifie: true, apres: 8 });
        m.texte("Déroulement de la vente", { gras: true, taille: 8.5, x, largeur: larg, apres: 2 });
        m.texte(art[4].texte.join(" "), { taille: 8, x, largeur: larg, justifie: true, apres: 0 });
      },
      (x, larg) => {
        m.texte(`Engagements de ${soc(i).nom}`, { gras: true, taille: 8.5, x, largeur: larg, apres: 4 });
        for (const puce of [
          `Conservation du véhicule au showroom de Chaville (art. 9)`,
          `Assurance professionnelle du garage, souscrite auprès d'${soc(i).assureur} (art. 9)`,
          "Aucun essai routier sans l'accord préalable du Déposant (art. 9)",
          "Aucun entretien ni remise en état sans accord préalable sur devis (art. 4)",
          "Prix modifié uniquement avec l'accord écrit du Déposant (art. 3)",
          `Encaissement du prix et virement du net vendeur sous ${c.reversement_heures} h (art. 11)`,
          "Déclaration de cession et changement de titulaire du certificat d'immatriculation (art. 12)",
          "État des lieux contradictoire à la remise du véhicule (art. 10)",
        ]) {
          const y = m.y;
          m.page.drawText("–", { x, y: y - 8, size: 8, font: m.f, color: GRIS });
          m.texte(puce, { taille: 8, x, largeur: larg, retrait: 11, apres: 3 });
        }
      },
    );
    m.section("État des lieux contradictoire – à la remise des clés", 190);
    const lignesEdl: [string, string][] = [
      ["Date et heure", e.fait_le ? `${jour(e.fait_le)}${/^\d{2}:\d{2}/.test(e.heure ?? "") ? ` à ${e.heure!.slice(0, 2)} h ${e.heure!.slice(3, 5)}` : ""}` : "—"],
      ["Kilométrage relevé", km(e.kilometrage)],
      ["Clés remises", ou(e.cles)],
      ["État général", ou(e.etat)],
      ["Accessoires remis", ou(e.accessoires)],
      ["Défauts et remarques", ou(e.remarques)],
    ];
    const largLib = 150;
    m.place(40);
    m.bloc("Élément contrôlé", M + 4, m.y, largLib - 10, { gras: true, taille: 8 });
    m.bloc("Constat à l'entrée", M + largLib, m.y, LARG - largLib, { gras: true, taille: 8 });
    m.y -= 8 * 1.35 + 3;
    m.trait(0.6, NOIR);
    m.y -= 2;
    lignesEdl.forEach(([l, val], k) => {
      const h = Math.max(m.hauteur(l, largLib - 10, { taille: 8.5 }), m.hauteur(val, LARG - largLib - 8, { taille: 8.5 })) + 10;
      m.place(h);
      if (k % 2 === 1) m.page.drawRectangle({ x: M, y: m.y - h, width: LARG, height: h, color: FOND });
      m.bloc(l, M + 4, m.y - 5, largLib - 10, { taille: 8.5, couleur: GRIS });
      m.bloc(val, M + largLib, m.y - 5, LARG - largLib - 8, { taille: 8.5 });
      m.y -= h;
      m.page.drawLine({ start: { x: M, y: m.y }, end: { x: L - M, y: m.y }, thickness: 0.4, color: GRIS_CLAIR });
    });
    m.y -= 14;
    m.texte("Les parties reconnaissent avoir pris connaissance de l'intégralité du présent contrat et des conditions générales qui suivent.", { italique: true, taille: 8, couleur: GRIS, apres: 10 });
    m.signatures(i);

    // ---- Conditions générales, en deux colonnes ----
    m.nouvelle();
    m.y += 6;
    m.texte("Conditions générales du contrat de dépôt-vente", { gras: true, taille: 12, centre: true, apres: 6 });
    m.trait();
    m.y -= 10;
    const optTitre: Opt = { gras: true, taille: 7.2, interligne: 1.25, apres: 0.8 };
    const optTexte: Opt = { taille: 6.9, interligne: 1.2, justifie: true, apres: 1 };
    const lc = m.largeurColonne;
    const total = art.reduce((h, b) =>
      h + (b.titre ? m.hauteur(titreCG(b.titre), lc, optTitre) + 0.8 : 0) +
      b.texte.reduce((s, t) => s + m.hauteur(t, lc, optTexte) + 1, 0) + 2.5, 0);
    m.colonnes(total);
    for (const b of art) {
      m.place(24);
      if (b.titre) m.texte(titreCG(b.titre), optTitre);
      for (const t of b.texte) m.texte(t, optTexte);
      m.y -= 2.5;
    }
    m.finColonnes();
    m.y -= 2;
    const rappel = `Rappel art. 8 – Fin anticipée : toute reprise du véhicule par le Déposant avant le terme du mandat entraîne une indemnité forfaitaire de ${eur(c.frais_resiliation)} TTC.`;
    const hRappel = m.hauteur(rappel, LARG, { gras: true, taille: 8 });
    m.place(hRappel + 4);
    m.page.drawLine({ start: { x: M - 7, y: m.y + 1 }, end: { x: M - 7, y: m.y - hRappel + 1 }, thickness: 1.5, color: NOIR });
    m.texte(rappel, { gras: true, taille: 8, apres: 8 });
    m.signatures(i, "Signatures – Bon pour acceptation des conditions générales :");
  } else {
    // ---- Avenant ----
    enTete(m, i, `AVENANT N° ${i.numero - 1}`, `au contrat de dépôt-vente ${i.avenant?.mandat_reference ?? i.reference}`);
    m.section("Véhicule déposé");
    m.paires([
      { l: "Marque", v: v.marque }, { l: "N° de série (VIN)", v: ou(v.vin) },
      { l: "Modèle", v: `${v.modele}${v.version ? ` ${v.version}` : ""}`, gras: true }, { l: "Immatriculation", v: ou(v.immatriculation) },
    ]);
    m.section("Objet de l'avenant");
    for (const b of articlesAvenant(i)) {
      m.place(40);
      if (b.titre) m.texte(b.titre, { gras: true, taille: 9.5, apres: 2 });
      for (const t of b.texte) m.texte(t, { taille: 9, justifie: true, apres: 3 });
      m.y -= 6;
    }
    m.y -= 10;
    m.signatures(i);
  }
  m.numeroter();
  return await doc.save({ useObjectStreams: false });
}

/**
 * Version signée : le PDF présenté à la signature, avec le nom du déposant en
 * écriture manuscrite et la date de signature dans ses cadres, puis le certificat
 * de signature (dernière page). Le PDF présenté reste conservé tel quel ; son
 * empreinte figure sur le certificat.
 */
export async function pdfSigne(original: Uint8Array, preuve: {
  reference: string; titre: string; empreinte_original: string; signataire: string; email: string;
  signe_le: string; ip: string; navigateur: string; code_envoye_le: string | null; renonciation: boolean | null;
  ouvert_le: string | null; modele_version: string;
}, instantane?: Instantane): Promise<Uint8Array> {
  const doc = await PDFDocument.load(original);
  const m = await Mise.creer(doc, `Certificat de signature ${preuve.reference}`);
  m.soc = soc(instantane);
  const faite: SignatureFaite | null = instantane ? { nom: nomManuscrit(instantane), signe_le: preuve.signe_le } : null;
  const pages = doc.getPages();
  if (faite) {
    for (const c of instantane!.cadres_deposant ?? []) {
      if (pages[c.page] && pages[c.page] !== m.page) m.signer(pages[c.page], c, faite);
    }
  }
  const heure = (iso: string | null) => (iso ? new Date(iso).toLocaleString("fr-FR", { timeZone: "Europe/Paris" }) + " (heure de Paris)" : "—");
  m.texte("CERTIFICAT DE SIGNATURE ÉLECTRONIQUE", { taille: 14, gras: true, centre: true, apres: 10 });
  m.trait();
  m.y -= 12;
  const lignes: [string, string][] = [
    ["Document", `${preuve.titre} ${preuve.reference} (modèle ${preuve.modele_version})`],
    ["Empreinte SHA-256 du document présenté à la signature", preuve.empreinte_original],
    ["Signataire", `${preuve.signataire} – ${preuve.email}`],
    ["Document ouvert le", heure(preuve.ouvert_le)],
    ["Code à usage unique envoyé à", `${preuve.email}, le ${heure(preuve.code_envoye_le)}`],
    ["Code validé et document signé le", heure(preuve.signe_le)],
    ["Adresse IP", preuve.ip || "—"],
    ["Navigateur", preuve.navigateur.slice(0, 180) || "—"],
    ["Lecture et acceptation du contrat", "case cochée par le signataire"],
  ];
  if (preuve.renonciation !== null) {
    lignes.push(["Exécution immédiate et renonciation au délai de rétractation", preuve.renonciation ? "case cochée par le signataire" : "non"]);
  }
  m.paires(lignes.map(([l, v]) => ({ l, v })), 1);
  m.y -= 10;
  m.texte("Ce certificat est généré automatiquement par svmride.com au moment de la signature. Le nom du signataire en écriture manuscrite, la date de signature et le tampon de SVM RIDE sont des mentions visuelles ; la signature repose sur le code à usage unique et sur le dossier de preuve (journal horodaté des étapes), conservé par SVM RIDE avec le document présenté à la signature. Toute modification de ce document change son empreinte SHA-256 ci-dessus et peut être détectée en la recalculant.", { taille: 8, couleur: GRIS, justifie: true });
  if (instantane && faite) {
    m.y -= 8;
    const cadres = instantane.cadres_deposant;
    m.signatures({ ...instantane, cadres_deposant: [] }, "Signatures", faite);
    instantane.cadres_deposant = cadres;
  }
  m.piedDePage(m.page, "Certificat de signature");
  return await doc.save({ useObjectStreams: false });
}
