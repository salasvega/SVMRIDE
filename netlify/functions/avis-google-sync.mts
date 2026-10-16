/**
 * Fonction planifiée Netlify « avis-google-sync » : synchronise chaque jour les
 * avis de la fiche Google SVM Ride dans Netlify Blobs (magasin « avis-google »).
 *
 * - Remplace entièrement l'instantané à chaque passage : nouveaux avis ajoutés,
 *   avis modifiés mis à jour, avis supprimés chez Google retirés, pas de doublon.
 * - En cas d'erreur : l'ancien instantané est conservé (il sera masqué par la
 *   lecture au-delà de 7 jours) puis effacé au-delà de 30 jours.
 * - Sans identifiants Google configurés : ne fait rien (le site n'en souffre pas).
 *
 * Lancement manuel : interface Netlify > Functions > avis-google-sync > « Run now ».
 */
import { getStore } from '@netlify/blobs';
import {
  ageJours,
  CLE_ETAT,
  CLE_RESUME,
  lireConfig,
  MAGASIN,
  PURGE_JOURS,
  recupererAvis,
  type ResumeSync,
} from '../lib/avis-google.ts';

export default async () => {
  const config = lireConfig((cle) => process.env[cle]);
  if (!config) {
    console.log('avis-google-sync : identifiants Google non configurés, rien à faire');
    return new Response('non configuré', { status: 200 });
  }

  const magasin = getStore(MAGASIN);
  const debut = Date.now();
  try {
    const resume = await recupererAvis(config);
    await magasin.setJSON(CLE_RESUME, resume);
    await magasin.setJSON(CLE_ETAT, { ok: true, le: resume.synchroniseLe, avis: resume.avis.length, total: resume.nombreAvis });
    const message = `avis-google-sync : ${resume.avis.length} avis (total ${resume.nombreAvis}, note ${resume.noteMoyenne}) en ${Date.now() - debut} ms`;
    console.log(message);
    return new Response(message);
  } catch (erreur) {
    const message = erreur instanceof Error ? erreur.message : String(erreur);
    console.error('avis-google-sync : échec —', message);
    await magasin.setJSON(CLE_ETAT, { ok: false, le: new Date().toISOString(), erreur: message.slice(0, 500) }).catch(() => {});
    const ancien = (await magasin.get(CLE_RESUME, { type: 'json' }).catch(() => null)) as ResumeSync | null;
    if (ancien && ageJours(ancien.synchroniseLe) > PURGE_JOURS) {
      await magasin.delete(CLE_RESUME).catch(() => {});
      console.error('avis-google-sync : données de plus de 30 jours effacées');
    }
    return new Response('échec', { status: 502 });
  }
};

export const config = {
  // 5h17 UTC chaque jour
  schedule: '17 5 * * *',
};
