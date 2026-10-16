/**
 * Dégradé or partagé par les icônes « trait fin » du site
 * (#8A6A1F → #D9B965). Rendu une seule fois dans la mise en page publique ;
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
          <stop offset="0%" stopColor="#8A6A1F" />
          <stop offset="100%" stopColor="#D9B965" />
        </linearGradient>
      </defs>
    </svg>
  );
}
