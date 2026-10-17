/**
 * Fonction Netlify « seo » (rendu serveur des balises de référencement).
 *
 * Le site est une application JavaScript : sans cette fonction, Google et les
 * aperçus de partage (WhatsApp, Facebook, Instagram, SMS…) ne verraient que les
 * balises de l'accueil. Ici, avant d'envoyer la page, on écrit dans le HTML :
 *  - le titre, la description, l'adresse canonique et l'image de chaque page ;
 *  - pour chaque véhicule, ses informations lues en direct dans Supabase ;
 *  - un vrai statut 404 pour les pages et véhicules inexistants.
 * Elle génère aussi /sitemap.xml avec tous les véhicules en vente.
 * La page /equipe suit le réglage « Afficher l'équipe sur le site » de l'admin.
 * Icônes (onglet, iPhone, Android) et manifeste : ceux choisis dans l'admin
 * (Infos du site, bloc « Logo et icône »), sinon ceux d'origine.
 * Couleurs : le thème publié dans le Studio Design est ajouté dans le <head>
 * (sinon, ou en cas d'erreur, SVM Signature de src/index.css).
 *
 * Les textes viennent de src/config/seo.ts (partagé avec le site).
 */
import type { Config, Context } from '@netlify/edge-functions';
import {
  avecCoordonnees,
  injectSeo,
  notFoundSeo,
  pageSeo,
  signatureSeo,
  SEO_VEHICLE_COLUMNS,
  SITE_URL,
  sitemapPages,
  vehicleNotFoundSeo,
  vehicleSeo,
  type SeoMeta,
  type SeoVehicle,
} from '../../src/config/seo.ts';
import { equipeAffichee, EQUIPE_EN_LIGNE } from '../../src/config/equipe.ts';
import { COORDONNEES_DEFAUT, normaliserCoordonnees, type Coordonnees } from '../../src/config/coordonnees.ts';
import { CONTEXTE, SUPABASE_KEY, SUPABASE_URL } from '../generated/supabase-config.ts';
import { balisesIcones, icones, manifeste, URL_MANIFESTE } from '../../src/config/identite.ts';
import { identite } from '../lib/identite-edge.ts';
import { injecterTheme, themePublie } from '../lib/theme-edge.ts';

const TIMEOUT_MS = 2500;

async function supabase<T>(query: string): Promise<T> {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Supabase non configuré');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    headers: { apikey: SUPABASE_KEY, accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  return (await res.json()) as T;
}

async function metaVehicule(slug: string, path: string): Promise<SeoMeta> {
  try {
    const rows = await supabase<SeoVehicle[]>(
      `vehicles?select=${SEO_VEHICLE_COLUMNS}&slug=eq.${encodeURIComponent(slug)}&limit=1`,
    );
    return rows[0] ? vehicleSeo(rows[0]) : vehicleNotFoundSeo;
  } catch (e) {
    // Supabase injoignable : on ne renvoie surtout pas de 404, juste des balises génériques
    console.error('seo: véhicule', slug, e);
    return { ...pageSeo['/vehicules'], path };
  }
}

/** Équipe masquée depuis l'admin (réglage « equipe_affichee » = false) ; en cas d'erreur : affichée */
async function equipeMasquee(): Promise<boolean> {
  if (!equipeAffichee(CONTEXTE)) return true;
  try {
    const rows = await supabase<{ valeur: unknown }[]>('site_reglages?select=valeur&cle=eq.equipe_affichee&limit=1');
    return rows[0]?.valeur === false;
  } catch (e) {
    console.error('seo: réglage équipe', e);
    return false;
  }
}

/** Coordonnées modifiables dans l'admin (« Infos du site ») ; valeurs de secours en cas d'erreur */
async function coordonnees(): Promise<Coordonnees> {
  try {
    const rows = await supabase<{ valeur: unknown }[]>('site_reglages?select=valeur&cle=eq.coordonnees&limit=1');
    return rows[0] ? normaliserCoordonnees(rows[0].valeur) : COORDONNEES_DEFAUT;
  } catch (e) {
    console.error('seo: coordonnées', e);
    return COORDONNEES_DEFAUT;
  }
}

const xml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function sitemap(): Promise<Response> {
  const masquee = await equipeMasquee();
  const urls = sitemapPages.filter((p) => p.path !== '/equipe' || (EQUIPE_EN_LIGNE && !masquee)).map(
    (p) =>
      `  <url>\n    <loc>${SITE_URL}${p.path === '/' ? '/' : p.path}</loc>\n` +
      `    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`,
  );
  try {
    const vehicules = await supabase<Pick<SeoVehicle, 'slug' | 'updated_at' | 'images' | 'brand' | 'model' | 'year'>[]>(
      'vehicles?select=slug,updated_at,images,brand,model,year&available=eq.true' +
        '&or=(status.is.null,status.neq.sold)&order=updated_at.desc',
    );
    for (const v of vehicules) {
      const image = v.images?.find(Boolean);
      urls.push(
        `  <url>\n    <loc>${SITE_URL}/vehicules/${xml(encodeURIComponent(v.slug))}</loc>\n` +
          (v.updated_at ? `    <lastmod>${v.updated_at.slice(0, 10)}</lastmod>\n` : '') +
          `    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n` +
          (image
            ? `    <image:image>\n      <image:loc>${xml(image)}</image:loc>\n` +
              `      <image:title>${xml(`${v.brand.trim()} ${v.model.trim()} ${v.year}`)}</image:title>\n    </image:image>\n`
            : '') +
          `  </url>`,
      );
    }
  } catch (e) {
    console.error('seo: sitemap', e);
  }
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
    `${urls.join('\n')}\n</urlset>\n`;
  return new Response(body, {
    headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  });
}

export default async function seo(request: Request, context: Context) {
  const url = new URL(request.url);
  const brut = url.pathname.replace(/\/+$/, '') || '/';
  const path = brut === '/index.html' ? '/' : brut;

  if (path === '/sitemap.xml') return sitemap();
  if (path === URL_MANIFESTE) {
    return new Response(JSON.stringify(manifeste(await identite())), {
      headers: { 'content-type': 'application/manifest+json; charset=utf-8', 'cache-control': 'public, max-age=300' },
    });
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') return;

  let meta: SeoMeta;
  const vehicule = path.match(/^\/vehicules\/([^/]+)$/);
  if (path === '/equipe' && (await equipeMasquee())) {
    meta = notFoundSeo; // masquée depuis l'admin (ou pas encore publiée) : 404 pour Google
  } else if (path in pageSeo) {
    meta = pageSeo[path as keyof typeof pageSeo];
  } else if (/^\/signature\/[A-Za-z0-9_-]{20,80}$/.test(path)) {
    meta = signatureSeo;
  } else if (vehicule) {
    meta = await metaVehicule(decodeURIComponent(vehicule[1]), path);
  } else if (path === '/admin' || path.startsWith('/admin/')) {
    meta = { title: 'Administration | SVM Ride', description: 'Espace réservé.', path, noindex: true };
  } else {
    meta = notFoundSeo;
  }

  // Accueil et Contact : fiche concession (téléphone, adresse, horaires) et description à jour
  const [id, theme] = await Promise.all([identite(), themePublie()]);
  if (path === '/' || path === '/contact') meta = avecCoordonnees(meta, await coordonnees(), icones(id).icon_512);

  const res = await context.next();
  if (!(res.headers.get('content-type') ?? '').includes('text/html')) return res;

  const html = await res.text();
  const headers = new Headers(res.headers);
  headers.delete('content-length');
  headers.delete('etag');
  if (meta.noindex) headers.set('x-robots-tag', 'noindex');
  // Lien de signature personnel : jamais transmis à un autre site
  if (meta === signatureSeo) headers.set('referrer-policy', 'no-referrer');
  let page = injecterTheme(injectSeo(html, meta), theme);
  // Icônes choisies dans l'admin
  if (id.icone) page = page.replace(/<!--icones-->[\s\S]*?<!--\/icones-->/, `<!--icones-->\n    ${balisesIcones(id)}\n    <!--/icones-->`);
  return new Response(page, { status: meta.status ?? res.status, headers });
}

export const config: Config = {
  // En cas d'erreur de la fonction, la page s'affiche normalement (balises par défaut)
  onError: 'bypass',
  path: '/*',
  excludedPath: [
    '/assets/*',
    '/api/*',
    '/*.js',
    '/*.css',
    '/*.map',
    '/*.png',
    '/*.jpg',
    '/*.jpeg',
    '/*.webp',
    '/*.svg',
    '/*.ico',
    '/*.txt',
    '/*.json',
    '/*.webmanifest',
    '/*.woff2',
  ],
};
