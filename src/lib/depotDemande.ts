/**
 * Envoi d'une demande « Vendre ma moto » via la fonction serveur
 * « depot-demande » (supabase/functions/depot-demande).
 *
 * 1. preparer : la fonction contrôle les champs et renvoie un lien d'envoi
 *    à usage unique par photo ;
 * 2. chaque photo (compressée dans le navigateur) est envoyée avec son lien ;
 * 3. finaliser : la demande devient visible pour SVM Ride et les e-mails
 *    (accusé de réception, alerte interne) partent une seule fois.
 */
import { supabase } from './supabase';
import { compresserImage, extensionDe } from './compressionImage';

const URL_FONCTION = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/depot-demande`;
const CLE = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const BUCKET = 'depot-photos';

export interface DonneesDemande {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  marque: string;
  modele: string;
  version: string;
  annee: string;
  kilometrage: string;
  immatriculation: string;
  etat: string;
  entretien: string;
  prix_souhaite: string;
  commentaire: string;
}

export class ErreurDemande extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

async function appeler<T>(corps: Record<string, unknown>): Promise<T> {
  let reponse: Response;
  try {
    reponse = await fetch(URL_FONCTION, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: CLE },
      body: JSON.stringify(corps),
    });
  } catch {
    throw new ErreurDemande(0, 'reseau', 'Connexion impossible. Vérifiez votre connexion internet et réessayez.');
  }
  const json = await reponse.json().catch(() => ({}));
  if (!reponse.ok) {
    throw new ErreurDemande(reponse.status, json.error ?? 'serveur', json.message ?? 'Une erreur est survenue. Réessayez dans un instant.');
  }
  return json as T;
}

export async function envoyerDemande(
  donnees: DonneesDemande,
  photos: File[],
  options: { piege: string; dureeMs: number; consentement: boolean },
  progression?: (etape: 'compression' | 'envoi' | 'finalisation', fait: number, total: number) => void,
): Promise<{ reference: string | null; photosRefusees: string[] }> {
  // Photos allégées avant l'envoi (≈ 2000 px, JPEG)
  const allegees: File[] = [];
  for (let i = 0; i < photos.length; i++) {
    progression?.('compression', i, photos.length);
    allegees.push(await compresserImage(photos[i]));
  }

  const prep = await appeler<{ reference?: string | null; id?: string; jeton?: string; envois: { path: string; token: string }[] }>({
    action: 'preparer',
    donnees,
    photos: allegees.map((f) => ({ ext: extensionDe(f) })),
    piege: options.piege,
    duree_ms: options.dureeMs,
    consentement: options.consentement,
  });
  if (!prep.id) return { reference: prep.reference ?? null, photosRefusees: [] }; // sans photo : déjà finalisée

  // Une photo refusée ne bloque pas la demande : elle part avec les autres,
  // et le propriétaire est prévenu (il peut l'envoyer en répondant à l'e-mail).
  const refusees: string[] = [];
  for (let i = 0; i < prep.envois.length; i++) {
    progression?.('envoi', i, prep.envois.length);
    const { path, token } = prep.envois[i];
    const fichier = allegees[i];
    const { error } = await supabase.storage.from(BUCKET).uploadToSignedUrl(path, token, fichier, {
      contentType: fichier.type || 'image/jpeg',
    });
    if (error) refusees.push(photos[i].name);
  }

  progression?.('finalisation', prep.envois.length, prep.envois.length);
  const fin = await appeler<{ reference: string }>({ action: 'finaliser', id: prep.id, jeton: prep.jeton });
  return { reference: fin.reference, photosRefusees: refusees };
}
