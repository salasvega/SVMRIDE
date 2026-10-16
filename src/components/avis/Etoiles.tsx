/** Note en étoiles (pleines, partielles pour les moyennes), lue « Note : 4,7 sur 5 ». */
export function Etoiles({ note, taille = 16, className = '' }: { note: number; taille?: number; className?: string }) {
  const libelle = `Note : ${note.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} sur 5`;
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} role="img" aria-label={libelle}>
      {[0, 1, 2, 3, 4].map((i) => {
        const remplissage = Math.max(0, Math.min(1, note - i)) * 100;
        return (
          <span key={i} className="relative inline-block" style={{ width: taille, height: taille }} aria-hidden="true">
            <svg viewBox="0 0 20 20" width={taille} height={taille} className="absolute inset-0 text-champ">
              <path fill="currentColor" d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L10 14.8l-5.2 2.8 1-5.8L1.5 7.7l5.9-.8z" />
            </svg>
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${remplissage}%` }}>
              <svg viewBox="0 0 20 20" width={taille} height={taille} className="text-or">
                <path fill="currentColor" d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L10 14.8l-5.2 2.8 1-5.8L1.5 7.7l5.9-.8z" />
              </svg>
            </span>
          </span>
        );
      })}
    </span>
  );
}
