/**
 * Dégradé or partagé par les icônes « trait fin » du site
 * (or foncé → or clair, couleurs du thème). Rendu une seule fois dans la mise en page publique ;
 * une icône l'utilise avec `color={OR_ICONE}` (voir IconeOr).
 *
 * gradientUnits="userSpaceOnUse" sur la grille 24 × 24 des icônes Lucide :
 * le dégradé reste visible même sur les tracés parfaitement droits.
 */
export const OR_ICONE = 'url(#svm-degrade-or)';

export function DegradeOrDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" className="absolute">
      <defs>
        <linearGradient id="svm-degrade-or" gradientUnits="userSpaceOnUse" x1="2" y1="2" x2="22" y2="22">
          <stop offset="0%" style={{ stopColor: 'var(--or-texte)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--or-clair)' }} />
        </linearGradient>
      </defs>
    </svg>
  );
}
