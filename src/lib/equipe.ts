/**
 * Fiches de l'équipe, lues dans la table Supabase `equipe_membres` (gérées dans
 * l'admin, onglet « Équipe »). Une seule lecture par visite, partagée par
 * l'accueil, la page /equipe et la page Contact ; l'équipe de secours de
 * src/config/equipe.ts s'affiche si la base ne répond pas.
 */
import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { equipeAffichee, MEMBRES, type Membre } from '../config/equipe';
import { CONTEXTE_SITE } from './contexte';

export const BUCKET_EQUIPE = 'equipe-photos';

export interface LigneEquipe {
  id: string;
  prenom: string;
  nom: string | null;
  fonction: string;
  citation: string | null;
  presentation: string | null;
  photo_url: string | null;
  photo_avif: string | null;
  photo_jpg: string | null;
  photo_chemin: string | null;
  accord_photo_le: string | null;
  ordre: number;
  responsable: boolean;
  visible: boolean;
  created_at?: string;
  updated_at?: string;
}

export const COLONNES_PUBLIQUES = 'id, prenom, nom, fonction, citation, presentation, photo_url, photo_avif, photo_jpg, ordre, responsable';

/** Paragraphes séparés par une ligne vide */
export const paragraphes = (t: string | null | undefined) =>
  (t ?? '').split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);

export function versMembre(l: Pick<LigneEquipe, 'id' | 'prenom' | 'nom' | 'fonction' | 'citation' | 'presentation' | 'photo_url' | 'photo_avif' | 'photo_jpg' | 'ordre' | 'responsable'>): Membre {
  return {
    id: l.id,
    prenom: l.prenom,
    nom: l.nom || undefined,
    fonction: l.fonction,
    citation: l.citation || undefined,
    presentation: paragraphes(l.presentation),
    photo: l.photo_url ? { webp: l.photo_url, avif: l.photo_avif || undefined, jpg: l.photo_jpg || undefined } : undefined,
    ordre: l.ordre,
    responsable: l.responsable,
  };
}

let requete: Promise<Membre[]> | null = null;

/** Fiches affichées, dans l'ordre (le responsable d'abord à ordre égal) */
export function chargerEquipe(): Promise<Membre[]> {
  if (!equipeAffichee(CONTEXTE_SITE)) return Promise.resolve([]);
  requete ??= (async () => {
    try {
      if (!supabase) throw new Error('Supabase non configuré');
      const { data, error } = await supabase
        .from('equipe_membres')
        .select(COLONNES_PUBLIQUES)
        .eq('visible', true)
        .order('ordre')
        .order('created_at');
      if (error) throw error;
      return (data as unknown as LigneEquipe[]).map(versMembre);
    } catch (e) {
      console.error('Équipe : lecture impossible, équipe de secours affichée', e);
      requete = null; // nouvel essai à la prochaine page
      return MEMBRES;
    }
  })();
  return requete;
}

/** À appeler après une modification dans l'admin */
export function oublierEquipe() {
  requete = null;
}

/** null pendant le chargement */
export function useEquipe(): Membre[] | null {
  const [membres, setMembres] = useState<Membre[] | null>(null);
  useEffect(() => {
    let actif = true;
    chargerEquipe().then((m) => actif && setMembres(m));
    return () => {
      actif = false;
    };
  }, []);
  return membres;
}
