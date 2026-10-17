import { ReactNode } from 'react';
import type { CleSection } from '../../config/design';

interface SectionProps {
  children: ReactNode;
  className?: string;
  background?: 'white' | 'gray' | 'dark';
  /** Zone personnalisable dans le Studio Design */
  zone?: CleSection;
}

export function Section({ children, className = '', background = 'white', zone }: SectionProps) {
  const bgClasses = {
    white: 'bg-surface',
    gray: 'bg-fond',
    dark: 'sur-sombre bg-noir-profond text-inverse',
  };

  return (
    <section data-zone={zone} className={`py-12 md:py-16 lg:py-24 ${bgClasses[background]} ${className}`}>
      {children}
    </section>
  );
}
