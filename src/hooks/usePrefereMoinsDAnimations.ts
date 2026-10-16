import { useEffect, useState } from 'react';

/** Vrai quand le système demande de réduire les animations (suivi en direct). */
export function usePrefereMoinsDAnimations() {
  const [reduit, setReduit] = useState(
    () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const maj = () => setReduit(mq.matches);
    mq.addEventListener?.('change', maj);
    return () => mq.removeEventListener?.('change', maj);
  }, []);
  return reduit;
}
