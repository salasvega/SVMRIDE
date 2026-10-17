import { useEffect } from 'react';

/**
 * Menu « sandwich » ouvert : il se referme dès que la page défile (plus de
 * 24 px), pour ne pas rester affiché par-dessus le contenu. Le défilement à
 * l'intérieur du menu lui-même ne le ferme pas (ce n'est pas la page qui défile).
 */
export function useFermerAuDefilement(ouvert: boolean, fermer: () => void) {
  useEffect(() => {
    if (!ouvert) return;
    const depart = window.scrollY;
    const surDefilement = () => {
      if (Math.abs(window.scrollY - depart) > 24) fermer();
    };
    window.addEventListener('scroll', surDefilement, { passive: true });
    return () => window.removeEventListener('scroll', surDefilement);
  }, [ouvert, fermer]);
}
