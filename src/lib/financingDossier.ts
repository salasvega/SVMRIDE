/**
 * Accès client au dossier de financement, via la fonction serveur
 * « financing-dossier » (supabase/functions/financing-dossier).
 *
 * Le navigateur n'accède plus jamais directement à la table ni aux fichiers :
 * tout passe par cette fonction, qui vérifie l'e-mail et le code d'accès,
 * puis un jeton de session.
 */
import { supabase } from './supabase';

const URL_FONCTION = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/financing-dossier`;
const CLE = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
export const BUCKET_FINANCEMENT = 'financing-documents';

export class ErreurDossier extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export async function appelDossier<T = Record<string, unknown>>(
  action: string,
  donnees: Record<string, unknown> = {},
): Promise<T> {
  let reponse: Response;
  try {
    reponse = await fetch(URL_FONCTION, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: CLE },
      body: JSON.stringify({ action, ...donnees }),
    });
  } catch {
    throw new ErreurDossier(0, 'reseau', 'Connexion impossible. Vérifiez votre connexion internet et réessayez.');
  }
  const corps = await reponse.json().catch(() => ({}));
  if (!reponse.ok) {
    throw new ErreurDossier(
      reponse.status,
      corps.error ?? 'serveur',
      corps.message ?? 'Une erreur est survenue. Réessayez dans un instant.',
    );
  }
  return corps as T;
}

/** Envoie une pièce : lien d'envoi à usage unique, puis rattachement au dossier */
export async function envoyerPiece<P>(session: string, field: string, fichier: File): Promise<P> {
  const ext = (fichier.name.split('.').pop() || '').toLowerCase();
  const { path, token } = await appelDossier<{ path: string; token: string }>('upload-url', { session, field, ext });
  const { error } = await supabase.storage.from(BUCKET_FINANCEMENT).uploadToSignedUrl(path, token, fichier, {
    contentType: fichier.type || undefined,
  });
  if (error) {
    throw new ErreurDossier(400, 'envoi', "L'envoi du fichier a échoué. Formats acceptés : JPG, PNG, WEBP, HEIC ou PDF, 10 Mo maximum.");
  }
  const { profile } = await appelDossier<{ profile: P }>('attach', { session, field, path });
  return profile;
}
