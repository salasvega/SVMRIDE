/**
 * Fonction planifiée Netlify « maintien-supabase » (tous les jours).
 *
 * Sur l'offre gratuite, Supabase met le projet en pause après 7 jours sans
 * activité : le site ne pourrait plus lire les véhicules ni recevoir les
 * formulaires. Une petite lecture quotidienne de l'API suffit à l'éviter.
 * Elle lit un seul identifiant de véhicule (donnée publique).
 */
import { SUPABASE_KEY, SUPABASE_URL } from '../generated/supabase-config.ts';

export default async () => {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('maintien-supabase : Supabase non configuré');
    return new Response('non configuré', { status: 500 });
  }
  const debut = Date.now();
  const reponse = await fetch(`${SUPABASE_URL}/rest/v1/vehicles?select=id&limit=1`, {
    headers: { apikey: SUPABASE_KEY, accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  });
  const message = `maintien-supabase : ${reponse.status} en ${Date.now() - debut} ms`;
  if (!reponse.ok) console.error(message, await reponse.text());
  else console.log(message);
  return new Response(message, { status: reponse.ok ? 200 : 502 });
};

export const config = {
  // 6h05 UTC chaque jour
  schedule: '5 6 * * *',
};
