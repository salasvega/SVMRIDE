/**
 * Fonction Netlify « avis-google » (GET /.netlify/functions/avis-google) :
 * sert au site le dernier instantané des avis synchronisés par avis-google-sync.
 * Ne contacte jamais Google (aucun quota consommé par les visiteurs).
 *
 * Réponses : le résumé (format ResumeAvis) ou { disponible: false } quand il n'y a
 * pas de données ou qu'elles ont plus de 7 jours (on masque plutôt que d'afficher
 * des informations obsolètes ; au-delà de 30 jours elles sont effacées).
 */
import { getStore } from '@netlify/blobs';
import { ageJours, CLE_RESUME, MAGASIN, OBSOLETE_JOURS, PURGE_JOURS, type ResumeSync } from '../lib/avis-google.ts';

const json = (corps: unknown, cache: string) =>
  new Response(JSON.stringify(corps), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache },
  });

export default async (req: Request) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return new Response('Méthode non autorisée', { status: 405 });
  try {
    const magasin = getStore(MAGASIN);
    const resume = (await magasin.get(CLE_RESUME, { type: 'json' })) as ResumeSync | null;
    const age = ageJours(resume?.synchroniseLe);
    if (!resume || age > OBSOLETE_JOURS) {
      if (resume && age > PURGE_JOURS) await magasin.delete(CLE_RESUME).catch(() => {});
      return json({ disponible: false }, 'public, max-age=300');
    }
    // 10 min dans le navigateur, 1 h sur le CDN Netlify
    return json(resume, 'public, max-age=600, s-maxage=3600');
  } catch (erreur) {
    console.error('avis-google :', erreur);
    return json({ disponible: false }, 'no-store');
  }
};
