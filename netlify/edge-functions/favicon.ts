/**
 * Fonction Netlify « favicon » : quand une autre icône a été choisie dans
 * l'admin (Infos du site, bloc « Logo et icône »), /favicon.ico renvoie vers
 * elle (certains navigateurs et robots demandent ce fichier directement, sans
 * lire les balises de la page). Sinon, le fichier d'origine est servi.
 */
import type { Config, Context } from '@netlify/edge-functions';
import { identite } from '../lib/identite-edge.ts';

export default async function favicon(_request: Request, context: Context) {
  const id = await identite();
  if (!id.icone) return context.next();
  return new Response(null, {
    status: 302,
    headers: { location: id.icone.favicon_48, 'cache-control': 'public, max-age=3600' },
  });
}

export const config: Config = {
  onError: 'bypass',
  path: '/favicon.ico',
};
