import { ReactNode } from 'react';

interface SectionProps {
  children: ReactNode;
  className?: string;
  background?: 'white' | 'gray' | 'dark';
}

export function Section({ children, className = '', background = 'white' }: SectionProps) {
  const bgClasses = {
    white: 'bg-white',
    gray: 'bg-[#F9F9F9]',
    dark: 'bg-[#111111] text-white',
  };

  return (
    <section className={`py-12 md:py-16 lg:py-24 ${bgClasses[background]} ${className}`}>
      {children}
    </section>
  );
}
