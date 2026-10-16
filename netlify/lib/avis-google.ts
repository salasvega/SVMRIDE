/**
 * Service Google Business Profile — récupération des avis de la fiche SVM Ride.
 * Utilisé uniquement côté serveur (fonctions Netlify) : les identifiants OAuth
 * ne quittent jamais Netlify et ne sont jamais envoyés au navigateur.
 *
 * Variables d'environnement Netlify (secrètes, portée « Functions ») :
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET  — client OAuth 2.0 (Google Cloud)
 *   GOOGLE_REFRESH_TOKEN                    — autorisation du propriétaire de la fiche
 *                                             (portée https://www.googleapis.com/auth/business.manage)
 *   GBP_ACCOUNT_ID, GBP_LOCATION_ID          — identifiants numériques du compte et de l'établissement
 * Procédure complète : docs/avis-google.md.
 *
 * Le format produit est celui de src/lib/avis/types.ts (ResumeAvis).
 */

export interface AvisSync {
  id: string;
  auteur: string;
  note: number;
  texte?: string;
  publieLe: string;
  modifieLe?: string;
}

export interface ResumeSync {
  source: 'google';
  noteMoyenne: number;
  nombreAvis: number;
  avis: AvisSync[];
  synchroniseLe: string;
}

export interface ConfigGoogle {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  compte: string;
  etablissement: string;
}

/** Nom du magasin Netlify Blobs et des clés utilisées. */
export const MAGASIN = 'avis-google';
export const CLE_RESUME = 'resume';
export const CLE_ETAT = 'etat';

/** Au-delà, les données ne sont plus servies ; au-delà de PURGE, elles sont effacées. */
export const OBSOLETE_JOURS = 7;
export const PURGE_JOURS = 30;
/** Nombre d'avis conservés (les plus récents) */
export const AVIS_CONSERVES = 50;

const ETOILES: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
const DELAI_MS = 10_000;
const PAGES_MAX = 20; // 50 avis par page : jusqu'à 1 000 avis

export function lireConfig(env: (cle: string) => string | undefined): ConfigGoogle | null {
  const c = {
    clientId: env('GOOGLE_CLIENT_ID') ?? '',
    clientSecret: env('GOOGLE_CLIENT_SECRET') ?? '',
    refreshToken: env('GOOGLE_REFRESH_TOKEN') ?? '',
    compte: (env('GBP_ACCOUNT_ID') ?? '').replace(/^accounts\//, ''),
    etablissement: (env('GBP_LOCATION_ID') ?? '').replace(/^locations\//, ''),
  };
  return Object.values(c).every(Boolean) ? c : null;
}

async function jetonAcces(c: ConfigGoogle): Promise<string> {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: c.clientId,
      client_secret: c.clientSecret,
      refresh_token: c.refreshToken,
      grant_type: 'refresh_token',
    }),
    signal: AbortSignal.timeout(DELAI_MS),
  });
  const j = (await r.json().catch(() => ({}))) as { access_token?: string; error?: string };
  if (!r.ok || !j.access_token) throw new Error(`OAuth Google refusé (${r.status} ${j.error ?? ''})`);
  return j.access_token;
}

interface ReviewGoogle {
  reviewId?: string;
  reviewer?: { displayName?: string; isAnonymous?: boolean };
  starRating?: string;
  comment?: string;
  createTime?: string;
  updateTime?: string;
}

/**
 * Google ajoute parfois une traduction automatique :
 * « (Translated by Google) … (Original) … ». On garde le texte original de l'auteur.
 */
export function texteOriginal(commentaire?: string): string | undefined {
  if (!commentaire) return undefined;
  const marque = commentaire.indexOf('(Original)');
  const texte = marque >= 0 ? commentaire.slice(marque + '(Original)'.length) : commentaire.replace(/^\(Translated by Google\)\s*/, '');
  return texte.trim() || undefined;
}

export function convertir(r: ReviewGoogle): AvisSync | null {
  const note = ETOILES[r.starRating ?? ''];
  if (!r.reviewId || !note || !r.createTime) return null;
  return {
    id: r.reviewId,
    auteur: r.reviewer?.isAnonymous || !r.reviewer?.displayName ? 'Client Google' : r.reviewer.displayName,
    note,
    texte: texteOriginal(r.comment),
    publieLe: r.createTime,
    modifieLe: r.updateTime,
  };
}

/** Récupère tous les avis (pagination), la note moyenne et le nombre total. */
export async function recupererAvis(c: ConfigGoogle): Promise<ResumeSync> {
  const jeton = await jetonAcces(c);
  const base = `https://mybusiness.googleapis.com/v4/accounts/${c.compte}/locations/${c.etablissement}/reviews`;
  const parId = new Map<string, AvisSync>();
  let noteMoyenne = 0;
  let nombreAvis = 0;
  let page: string | undefined;

  for (let i = 0; i < PAGES_MAX; i++) {
    const url = new URL(base);
    url.searchParams.set('pageSize', '50');
    url.searchParams.set('orderBy', 'updateTime desc');
    if (page) url.searchParams.set('pageToken', page);
    const r = await fetch(url, { headers: { authorization: `Bearer ${jeton}` }, signal: AbortSignal.timeout(DELAI_MS) });
    if (!r.ok) throw new Error(`API Google Business Profile : ${r.status} ${(await r.text()).slice(0, 300)}`);
    const j = (await r.json()) as { reviews?: ReviewGoogle[]; averageRating?: number; totalReviewCount?: number; nextPageToken?: string };
    if (i === 0) {
      noteMoyenne = Number(j.averageRating ?? 0);
      nombreAvis = Number(j.totalReviewCount ?? 0);
    }
    for (const brut of j.reviews ?? []) {
      const a = convertir(brut);
      if (!a) continue;
      // Un identifiant = un avis (pas de doublon) ; on garde la version la plus récente
      const deja = parId.get(a.id);
      const date = (x: AvisSync) => Date.parse(x.modifieLe ?? x.publieLe);
      if (!deja || date(a) > date(deja)) parId.set(a.id, a);
    }
    page = j.nextPageToken;
    if (!page) break;
  }

  const avis = [...parId.values()]
    .sort((a, b) => Date.parse(b.publieLe) - Date.parse(a.publieLe))
    .slice(0, AVIS_CONSERVES);

  if (!(noteMoyenne >= 1 && noteMoyenne <= 5) || !(nombreAvis > 0)) {
    throw new Error(`Réponse Google incomplète (note ${noteMoyenne}, ${nombreAvis} avis)`);
  }
  return { source: 'google', noteMoyenne, nombreAvis, avis, synchroniseLe: new Date().toISOString() };
}

export const ageJours = (iso?: string) => (iso ? (Date.now() - Date.parse(iso)) / 86_400_000 : Infinity);
