/**
 * Statut « Sans suite » (17/10/2026) : les photos et pièces jointes de la demande
 * sont effacées automatiquement 7 jours après le passage dans ce statut
 * (tâche de nuit private.entretien_sans_suite, 4h53 UTC). Ce bandeau le rappelle
 * dans les fiches Dépôt-vente, Reprise et Financement.
 */
import { Clock } from 'lucide-react';

export const SANS_SUITE = 'sans_suite';
export const LIBELLE_SANS_SUITE = 'Sans suite';
export const DELAI_SANS_SUITE_JOURS = 7;

/** Date à laquelle les fichiers seront effacés : le premier passage de la tâche de nuit après 7 jours */
export function dateEffacementSansSuite(sansSuiteLe: string | null | undefined): Date | null {
  if (!sansSuiteLe) return null;
  const limite = new Date(new Date(sansSuiteLe).getTime() + DELAI_SANS_SUITE_JOURS * 86_400_000);
  const passage = new Date(Date.UTC(limite.getUTCFullYear(), limite.getUTCMonth(), limite.getUTCDate(), 4, 53));
  if (passage < limite) passage.setUTCDate(passage.getUTCDate() + 1);
  return passage;
}

export function AvisSansSuite({
  statut,
  sansSuiteLe,
  nbFichiers,
  className = '',
}: {
  /** Statut choisi (éventuellement pas encore enregistré) */
  statut: string;
  /** Date de passage en « Sans suite » enregistrée en base */
  sansSuiteLe?: string | null;
  nbFichiers: number;
  className?: string;
}) {
  if (statut !== SANS_SUITE) return null;
  const date = dateEffacementSansSuite(sansSuiteLe);
  const texte =
    nbFichiers === 0
      ? 'Sans suite : aucune photo ni pièce jointe à conserver.'
      : date
        ? `Sans suite : les photos et pièces jointes (${nbFichiers}) seront supprimées automatiquement le ${date.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', day: 'numeric', month: 'long', year: 'numeric' })}. Changez de statut d'ici là pour les garder.`
        : `Sans suite : les photos et pièces jointes (${nbFichiers}) seront supprimées automatiquement ${DELAI_SANS_SUITE_JOURS} jours après l'enregistrement de ce statut.`;
  return (
    <p className={`flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 ${className}`} role="note">
      <Clock className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <span>{texte}</span>
    </p>
  );
}
