/**
 * Section qu'on peut masquer dans l'admin (« Textes du site »).
 * Visiteurs : la section telle quelle, ou rien si elle est masquée.
 * Aperçu de l'admin : la section est repérée (barre « Masquer ») ; masquée,
 * elle est remplacée par un bandeau « Section masquée » (barre « Afficher »).
 */
import type { ReactNode } from 'react';
import { EN_APERCU } from '../../lib/apercuDemo';
import { SECTIONS_PAR_ID } from '../../config/textes-sections';
import { useMasquee } from '../../lib/listes';

export function Masquable({ id, children, className = '' }: { id: string; children: ReactNode; className?: string }) {
  const masquee = useMasquee(id);
  if (!EN_APERCU) return masquee ? null : <>{children}</>;
  if (masquee) {
    return (
      <div data-section={id} data-masquee="oui" className={className}
        style={{ margin: '12px auto', maxWidth: 1180, padding: '14px 18px', border: '2px dashed #9CA3AF', borderRadius: 14, background: 'repeating-linear-gradient(135deg,#F9FAFB 0 10px,#F3F4F6 10px 20px)', color: '#4B5563', font: '600 14px/1.4 system-ui,sans-serif', textAlign: 'center' }}>
        Section masquée : « {SECTIONS_PAR_ID[id]?.libelle ?? id} » — invisible pour les visiteurs
      </div>
    );
  }
  return <div data-section={id} className={className}>{children}</div>;
}
