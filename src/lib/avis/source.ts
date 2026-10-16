/**
 * Service de récupération des avis : choisit la source selon la configuration
 * et le contexte, et applique les règles d'affichage (fraîcheur, ordre, nombre).
 * Le composant n'appelle que `chargerAvis()`.
 */
import { AVIS_GOOGLE } from '../../config/avisGoogle';
import { AVIS_SELECTION } from '../../config/avisSelection';
import { CONTEXTE_SITE } from '../contexte';
import type { Avis, ResumeAvis } from './types';

export const URL_AVIS_GOOGLE = '/.netlify/functions/avis-google';
const DELAI_MS = 5000;

/** Sélection manuelle d'avis réels : utilisée tant que Google n'est pas actif. */
export function modeSelection(): boolean {
  return !AVIS_GOOGLE.actif && AVIS_SELECTION.avis.length > 0;
}

/** Mode démonstration : hors production, sans Google actif ni sélection réelle. */
export function modeDemo(contexte = CONTEXTE_SITE): boolean {
  return contexte !== 'production' && !AVIS_GOOGLE.actif && !modeSelection();
}

function valide(a: Avis): boolean {
  return !!a.id && !!a.auteur && Number.isFinite(a.note) && a.note >= 1 && a.note <= 5 && !Number.isNaN(Date.parse(a.publieLe));
}

/** Contrôle et prépare les données reçues ; null si elles ne doivent pas être affichées. */
export function preparer(resume: ResumeAvis | null | undefined, maintenant = Date.now()): ResumeAvis | null {
  if (!resume || !Array.isArray(resume.avis)) return null;
  if (resume.source !== 'selection') {
    // Données synchronisées : trop anciennes ou incomplètes → on masque
    const age = maintenant - Date.parse(resume.synchroniseLe);
    if (!(age >= 0) || age > AVIS_GOOGLE.joursAvantObsolescence * 86_400_000) return null;
    const note = resume.noteMoyenne ?? 0;
    if (!(note >= 1 && note <= 5) || !((resume.nombreAvis ?? 0) > 0)) return null;
  }
  const vus = new Set<string>();
  const avis = resume.avis
    .filter((a) => valide(a) && !vus.has(a.id) && vus.add(a.id))
    .sort((a, b) => Date.parse(b.publieLe) - Date.parse(a.publieLe)) // du plus récent au plus ancien
    .slice(0, AVIS_GOOGLE.maxAvis);
  return { ...resume, avis };
}

/**
 * Avis à afficher, ou null (rien à montrer : section sans note ni cartes).
 * Ne lève jamais d'erreur : une panne de la source masque simplement les avis.
 */
export async function chargerAvis(contexte = CONTEXTE_SITE): Promise<ResumeAvis | null> {
  try {
    // Le test sur __CONTEXTE_NETLIFY__ est résolu à la compilation : en production,
    // le fichier des avis fictifs n'est même pas inclus dans le site.
    if (__CONTEXTE_NETLIFY__ !== 'production' && modeDemo(contexte)) {
      const { AVIS_DEMO } = await import('./demo');
      return preparer(AVIS_DEMO);
    }
    if (modeSelection()) {
      // Pas de note moyenne ni de nombre d'avis : ils seraient vite dépassés
      return preparer({ source: 'selection', avis: AVIS_SELECTION.avis, synchroniseLe: AVIS_SELECTION.releveLe });
    }
    if (!AVIS_GOOGLE.actif) return null;
    const reponse = await fetch(URL_AVIS_GOOGLE, { signal: AbortSignal.timeout(DELAI_MS), headers: { accept: 'application/json' } });
    if (!reponse.ok) return null;
    const donnees = (await reponse.json()) as ResumeAvis | { disponible: false };
    if ('disponible' in donnees) return null;
    return donnees.source === 'google' ? preparer(donnees) : null;
  } catch {
    return null;
  }
}
