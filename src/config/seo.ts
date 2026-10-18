/**
 * Référencement (SEO) — source unique des titres, descriptions et données
 * structurées du site.
 *
 * Ce fichier est utilisé à deux endroits :
 *  - dans le site (composant SEOHead), pour mettre à jour les balises quand on
 *    navigue d'une page à l'autre ;
 *  - par la fonction Netlify `netlify/edge-functions/seo.ts`, qui écrit ces
 *    mêmes balises directement dans le HTML envoyé à Google et aux réseaux
 *    sociaux (aperçus WhatsApp, Facebook, Instagram…).
 *
 * Il ne doit donc importer ni React ni aucune bibliothèque du navigateur.
 */
import { siteConfig } from './site.ts';
import { avecNom, nomSite, SEO_PAGES, texte, type Textes } from './textes.ts';
import {
  COORDONNEES_DEFAUT,
  horairesSchema,
  lienInstagram,
  lienMaps,
  phraseHoraires,
  telephoneInternational,
  type Coordonnees,
} from './coordonnees.ts';

export const SITE_URL = siteConfig.baseUrl;
export const DEFAULT_IMAGE = `${SITE_URL}${siteConfig.ogImage}`;

export interface SeoMeta {
  /** Titre complet de l'onglet et des résultats Google (≈ 60 caractères max) */
  title: string;
  /** Description des résultats Google et des aperçus de partage (≈ 155 caractères max) */
  description: string;
  /** Chemin canonique, sans domaine (ex. « /reprises ») */
  path: string;
  /** Image de partage (URL absolue ou chemin du site) */
  image?: string;
  /** Page à exclure des moteurs de recherche */
  noindex?: boolean;
  type?: 'website' | 'product';
  /** Données structurées schema.org (un objet ou une liste) */
  schema?: object | object[];
  /** Statut HTTP renvoyé par le rendu serveur (404 pour une page inexistante) */
  status?: number;
  /** Nom du site (admin, Édition du site) ; sinon celui d'origine */
  nomSite?: string;
}

// ---------------------------------------------------------------------------
// Fiche « concession » pour Google (référencement local)
// ---------------------------------------------------------------------------
/** Fiche « concession » pour Google, à partir des coordonnées (modifiables dans l'admin) */
export function dealerSchemaDe(c: Coordonnees, logo = `${SITE_URL}/icon-512.png`) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MotorcycleDealer',
    '@id': `${SITE_URL}/#concession`,
    name: siteConfig.name,
    description:
      `Concession de motos et scooters d'occasion contrôlés et garantis à ${c.showroom.ville} : vente, reprise, financement et recherche personnalisée en Île-de-France.`,
    url: `${SITE_URL}/`,
    logo: logo.startsWith('/') ? `${SITE_URL}${logo}` : logo,
    image: DEFAULT_IMAGE,
    telephone: telephoneInternational(c.telephone),
    email: c.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: c.showroom.adresse,
      postalCode: c.showroom.code_postal,
      addressLocality: c.showroom.ville,
      addressRegion: 'Île-de-France',
      addressCountry: 'FR',
    },
    hasMap: lienMaps(c),
    areaServed: { '@type': 'AdministrativeArea', name: 'Île-de-France' },
    openingHoursSpecification: horairesSchema(c.horaires),
    ...(c.instagram ? { sameAs: [lienInstagram(c.instagram)] } : {}),
  };
}

/** Valeurs de secours ; remplacées par les coordonnées à jour (avecCoordonnees) */
export const dealerSchema = dealerSchemaDe(COORDONNEES_DEFAUT);

/** Description de la page Contact */
export function descriptionContact(c: Coordonnees): string {
  const horaires = phraseHoraires(c.horaires);
  return `Contactez SVM Ride au ${c.telephone} ou par e-mail. Showroom au ${c.showroom.adresse} à ${c.showroom.ville} (${c.showroom.code_postal.slice(0, 2)})${horaires ? `, ${horaires}` : ''}.`;
}

/** Balises d'une page avec les coordonnées à jour (fiche concession, description de Contact) */
export function avecCoordonnees(meta: SeoMeta, c: Coordonnees, logo?: string): SeoMeta {
  const fiche = dealerSchemaDe(c, logo);
  const schema = Array.isArray(meta.schema)
    ? meta.schema.map((s) => (s === dealerSchema ? fiche : s))
    : meta.schema === dealerSchema ? fiche : meta.schema;
  return { ...meta, schema, ...(meta.path === '/contact' ? { description: descriptionContact(c) } : {}) };
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#site`,
  name: siteConfig.name,
  url: `${SITE_URL}/`,
  inLanguage: 'fr-FR',
  publisher: { '@id': `${SITE_URL}/#concession` },
};

// ---------------------------------------------------------------------------
// Pages fixes
// ---------------------------------------------------------------------------
export const pageSeo = {
  '/': {
    title: "SVM Ride – Motos et scooters d'occasion à Chaville (92)",
    description:
      "Motos et scooters d'occasion contrôlés et garantis à Chaville (92). Reprise de votre deux-roues, financement et recherche sur mesure en Île-de-France.",
    path: '/',
    schema: [dealerSchema, websiteSchema],
  },
  '/vehicules': {
    title: "Motos et scooters d'occasion à vendre | SVM Ride",
    description:
      "Toutes nos motos et scooters d'occasion à vendre près de Paris : véhicules contrôlés, garantis et au juste prix. Showroom à Chaville (92), Île-de-France.",
    path: '/vehicules',
  },
  '/reprises': {
    title: 'Reprise de moto et scooter au meilleur prix | SVM Ride',
    description:
      'Faites reprendre votre moto ou votre scooter au meilleur prix : estimation sous 24 h, offre attractive, virement immédiat. SVM Ride, Chaville (92).',
    path: '/reprises',
  },
  '/vendre-ma-moto': {
    title: 'Vendre ma moto en dépôt-vente | SVM Ride',
    description:
      "Confiez votre moto à SVM Ride : réponse sous 48 h ouvrées, nous gérons l'annonce, les visites et la vente, vous êtes payé sous 48 h. Chaville (92).",
    path: '/vendre-ma-moto',
  },
  '/financement': {
    title: "Financement moto et scooter d'occasion | SVM Ride",
    description:
      "Financez votre moto ou scooter d'occasion : simulation gratuite, réponse rapide, paiement en 3x, 4x ou 10x par carte avec Alma. SVM Ride, Chaville (92).",
    path: '/financement',
  },
  '/financement/dossier': {
    title: 'Mon dossier de financement | SVM Ride',
    description: 'Accédez à votre dossier de financement SVM Ride et déposez vos justificatifs en ligne.',
    path: '/financement/dossier',
    noindex: true,
  },
  '/suivre-ma-vente': {
    title: 'Suivre ma vente en dépôt-vente | SVM Ride',
    description: "Suivez en ligne la vente de votre moto confiée en dépôt-vente à SVM Ride : étapes, visites, offres et documents.",
    path: '/suivre-ma-vente',
    noindex: true,
  },
  '/recherche-personnalisee': {
    title: 'Recherche personnalisée de moto ou scooter | SVM Ride',
    description:
      'Vous cherchez un modèle précis ? Confiez-nous votre recherche : nous trouvons la moto ou le scooter qui vous correspond, selon vos critères et votre budget.',
    path: '/recherche-personnalisee',
  },
  '/contact': {
    title: 'Contact et showroom à Chaville | SVM Ride',
    description: descriptionContact(COORDONNEES_DEFAUT),
    path: '/contact',
    schema: dealerSchema,
  },
  '/mentions-legales': {
    title: 'Mentions légales | SVM Ride',
    description: 'Mentions légales du site SVM Ride : éditeur, hébergement et propriété intellectuelle.',
    path: '/mentions-legales',
  },
  '/politique-confidentialite': {
    title: 'Politique de confidentialité | SVM Ride',
    description: 'Comment SVM Ride collecte, utilise et protège vos données personnelles, et comment exercer vos droits.',
    path: '/politique-confidentialite',
  },
  '/politique-cookies': {
    title: 'Politique des cookies | SVM Ride',
    description: 'Les cookies utilisés sur le site SVM Ride et la façon de gérer vos préférences.',
    path: '/politique-cookies',
  },
  '/equipe': {
    title: "Notre équipe : des passionnés de moto à Chaville | SVM Ride",
    description:
      "Rencontrez l'équipe SVM Ride : Mattia et des passionnés de deux-roues pour vous conseiller dans l'achat, la reprise ou le dépôt-vente de votre moto.",
    path: '/equipe',
  },
  '/plan-du-site': {
    title: 'Plan du site | SVM Ride',
    description: 'Toutes les pages du site SVM Ride : véhicules, reprise, financement, recherche personnalisée et contact.',
    path: '/plan-du-site',
  },
} satisfies Record<string, SeoMeta>;

export type PagePath = keyof typeof pageSeo;

/** Page de signature d'un contrat (lien personnel : jamais indexée ni référencée) */
export const signatureSeo: SeoMeta = {
  title: 'Signature de votre contrat | SVM Ride',
  description: 'Signature électronique de votre contrat de dépôt-vente SVM Ride.',
  path: '/signature',
  noindex: true,
};

export const notFoundSeo: SeoMeta = {
  title: 'Page introuvable | SVM Ride',
  description: "La page que vous recherchez n'existe pas ou a été déplacée.",
  path: '/404',
  noindex: true,
  status: 404,
};

/** Pages fixes à déclarer dans le sitemap */
export const sitemapPages: { path: PagePath; priority: string; changefreq: string }[] = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/vehicules', priority: '0.9', changefreq: 'daily' },
  { path: '/reprises', priority: '0.8', changefreq: 'monthly' },
  { path: '/vendre-ma-moto', priority: '0.8', changefreq: 'monthly' },
  { path: '/financement', priority: '0.8', changefreq: 'monthly' },
  { path: '/recherche-personnalisee', priority: '0.7', changefreq: 'monthly' },
  { path: '/contact', priority: '0.7', changefreq: 'monthly' },
  { path: '/equipe', priority: '0.6', changefreq: 'monthly' }, // seulement si EQUIPE_EN_LIGNE
  { path: '/mentions-legales', priority: '0.2', changefreq: 'yearly' },
  { path: '/politique-confidentialite', priority: '0.2', changefreq: 'yearly' },
  { path: '/politique-cookies', priority: '0.2', changefreq: 'yearly' },
  { path: '/plan-du-site', priority: '0.3', changefreq: 'monthly' },
];

// ---------------------------------------------------------------------------
// Fiches véhicules
// ---------------------------------------------------------------------------
/** Champs d'un véhicule utiles au référencement (jamais le prix d'achat) */
export interface SeoVehicle {
  slug: string;
  brand: string;
  model: string;
  year: number;
  type: string;
  displacement: number;
  price: number;
  mileage: number;
  description?: string | null;
  images?: string[] | null;
  warranty?: string | null;
  status?: string | null;
  updated_at?: string | null;
}

/** Colonnes demandées à Supabase par le rendu serveur et le sitemap */
export const SEO_VEHICLE_COLUMNS =
  'slug,brand,model,year,type,displacement,price,mileage,description,images,warranty,status,updated_at';

const nombre = (n: number) => new Intl.NumberFormat('fr-FR').format(n).replace(/[\u202f\u00a0]/g, ' ');

const absolu = (src: string) => (src.startsWith('http') ? src : `${SITE_URL}${src.startsWith('/') ? '' : '/'}${src}`);

export function vehicleName(v: SeoVehicle): string {
  return `${v.brand.trim()} ${v.model.trim()}`.replace(/\s+/g, ' ');
}

const disponibilite: Record<string, string> = {
  available: 'https://schema.org/InStock',
  reserved: 'https://schema.org/LimitedAvailability',
  sold: 'https://schema.org/SoldOut',
};

export function vehicleSeo(v: SeoVehicle): SeoMeta {
  const nom = vehicleName(v);
  const genre = v.type === 'scooter' ? 'Scooter' : 'Moto';
  const path = `/vehicules/${v.slug}`;
  const images = (v.images ?? []).filter(Boolean).map(absolu);
  const statut = v.status === 'sold' ? ' (vendu)' : v.status === 'reserved' ? ' (réservé)' : '';

  const garantie = v.warranty?.trim() ? `, ${v.warranty.trim().replace(/^Garantie/, 'garantie')}` : '';
  const description = `${genre} ${nom} ${v.year} d'occasion${statut} à ${nombre(v.price)} € : ${nombre(v.mileage)} km, ${v.displacement} cm³${garantie}. SVM Ride, Chaville (92).`;

  const url = `${SITE_URL}${path}`;
  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': ['Product', 'Motorcycle'],
      '@id': `${url}#vehicule`,
      name: `${nom} ${v.year}`,
      description: v.description?.trim() || description,
      url,
      image: images.length ? images : [DEFAULT_IMAGE],
      brand: { '@type': 'Brand', name: v.brand.trim() },
      model: v.model.trim(),
      vehicleModelDate: String(v.year),
      productionDate: String(v.year),
      itemCondition: 'https://schema.org/UsedCondition',
      mileageFromOdometer: { '@type': 'QuantitativeValue', value: v.mileage, unitCode: 'KMT' },
      vehicleEngine: { '@type': 'EngineSpecification', engineDisplacement: { '@type': 'QuantitativeValue', value: v.displacement, unitCode: 'CMQ' } },
      offers: {
        '@type': 'Offer',
        url,
        price: v.price,
        priceCurrency: 'EUR',
        itemCondition: 'https://schema.org/UsedCondition',
        availability: disponibilite[v.status ?? 'available'] ?? disponibilite.available,
        seller: { '@id': `${SITE_URL}/#concession` },
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Nos véhicules', item: `${SITE_URL}/vehicules` },
        { '@type': 'ListItem', position: 3, name: `${nom} ${v.year}`, item: url },
      ],
    },
  ];

  return {
    title: `${nom} ${v.year} d'occasion – ${nombre(v.price)} € | SVM Ride`,
    description: description.length > 160 ? `${description.slice(0, 157).trimEnd()}…` : description,
    path,
    image: images[0] ?? DEFAULT_IMAGE,
    type: 'product',
    schema,
  };
}

export const vehicleNotFoundSeo: SeoMeta = {
  title: 'Véhicule introuvable | SVM Ride',
  description: "Ce véhicule n'est plus disponible. Découvrez nos autres motos et scooters d'occasion.",
  path: '/vehicules',
  noindex: true,
  status: 404,
};

// ---------------------------------------------------------------------------
// Balises HTML (utilisées par le rendu serveur)
// ---------------------------------------------------------------------------
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function canonicalUrl(meta: SeoMeta): string {
  return meta.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${meta.path}`;
}

export function renderHeadTags(meta: SeoMeta): string {
  const url = canonicalUrl(meta);
  const image = absolu(meta.image ?? DEFAULT_IMAGE);
  const schemas = meta.schema ? (Array.isArray(meta.schema) ? meta.schema : [meta.schema]) : [];
  const json = schemas.length
    ? JSON.stringify(schemas.length === 1 ? schemas[0] : schemas).replace(/</g, '\\u003c')
    : '';
  return [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}" />`,
    `<meta name="robots" content="${meta.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}" />`,
    meta.noindex ? '' : `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:site_name" content="${esc(meta.nomSite ?? siteConfig.name)}" />`,
    `<meta property="og:locale" content="fr_FR" />`,
    `<meta property="og:type" content="${meta.type === 'product' ? 'product' : 'website'}" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(meta.description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
    json ? `<script type="application/ld+json" id="seo-jsonld">${json}</script>` : '',
  ]
    .filter(Boolean)
    .join('\n    ');
}

/** Remplace le bloc <!--seo-->…<!--/seo--> de index.html par les balises de la page */
export function injectSeo(html: string, meta: SeoMeta): string {
  return html.replace(/<!--seo-->[\s\S]*?<!--\/seo-->/, `<!--seo-->\n    ${renderHeadTags(meta)}\n    <!--/seo-->`);
}

/**
 * Titres et descriptions modifiés dans l'admin (Textes du site › Référencement
 * Google) et nom du site : remplace « SVM Ride » dans le titre, la description
 * et les données structurées. Sans modification, la page est inchangée.
 */
export function avecTextes(meta: SeoMeta, t: Textes): SeoMeta {
  const slug = SEO_PAGES[meta.path];
  let { title, description } = meta;
  if (slug) {
    if (t[`seo.${slug}.titre`]?.trim()) title = texte(t, `seo.${slug}.titre`);
    if (t[`seo.${slug}.description`]?.trim()) description = texte(t, `seo.${slug}.description`);
  }
  const nom = nomSite(t);
  if (nom === 'SVM Ride' && title === meta.title && description === meta.description) return meta;
  return {
    ...meta,
    title: avecNom(title, t),
    description: avecNom(description, t),
    nomSite: nom,
    schema: meta.schema ? (JSON.parse(avecNom(JSON.stringify(meta.schema), t)) as object | object[]) : undefined,
  };
}

