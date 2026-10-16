import type { LucideIcon } from 'lucide-react';
import { OR_ICONE } from './DegradeOrDefs';

interface IconeOrProps {
  icon: LucideIcon;
  className?: string;
}

/** Icône Lucide en trait fin (1,6 px) avec le dégradé or du logo. */
export function IconeOr({ icon: Icon, className = 'w-7 h-7' }: IconeOrProps) {
  return <Icon className={className} color={OR_ICONE} strokeWidth={1.6} aria-hidden="true" />;
}
