import type { Membre } from '../../config/equipe';

interface PortraitProps {
  membre: Membre;
  /** Côté affiché en px (le portrait est rond) */
  taille: number;
  className?: string;
  /** Anneau or (mise en avant) */
  anneauOr?: boolean;
  /** Le portrait est décoratif quand le nom est écrit juste à côté */
  decoratif?: boolean;
  chargement?: 'lazy' | 'eager';
  /** Portrait posé sur un fond sombre (décalage de l'anneau assorti) */
  surSombre?: boolean;
}

/**
 * Portrait rond, même cadrage pour toute l'équipe : AVIF puis WebP puis JPEG,
 * sans déformation (object-cover). Sans photo : initiales sur fond noir et or.
 */
export function Portrait({ membre, taille, className = '', anneauOr = false, decoratif = true, chargement = 'lazy', surSombre = false }: PortraitProps) {
  const anneau = anneauOr
    ? `ring-2 ring-or ring-offset-[3px] ${surSombre ? 'ring-offset-noir-profond' : 'ring-offset-white'}`
    : 'ring-1 ring-bordure';
  const alt = decoratif ? '' : `${membre.prenom}${membre.nom ? ` ${membre.nom}` : ''}, ${membre.fonction}`;
  const style = { width: taille, height: taille };

  if (!membre.photo) {
    const initiales = `${membre.prenom[0] ?? ''}${membre.nom?.[0] ?? ''}`.toUpperCase();
    return (
      <span
        className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-noir-profond ${anneau} ${className}`}
        style={style}
        role={decoratif ? undefined : 'img'}
        aria-label={decoratif ? undefined : alt}
        aria-hidden={decoratif ? true : undefined}
      >
        <span
          className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(217,185,101,0.28),transparent_60%)]"
          aria-hidden="true"
        />
        <span className="titre-display relative !text-or-clair leading-none" style={{ fontSize: Math.round(taille * 0.36) }}>
          {initiales}
        </span>
      </span>
    );
  }

  return (
    <picture className={`inline-block shrink-0 overflow-hidden rounded-full bg-fond ${anneau} ${className}`} style={style}>
      {membre.photo.avif && <source srcSet={membre.photo.avif} type="image/avif" />}
      <source srcSet={membre.photo.webp} type="image/webp" />
      <img
        src={membre.photo.jpg ?? membre.photo.webp}
        alt={alt}
        width={taille}
        height={taille}
        loading={chargement}
        decoding="async"
        className="h-full w-full object-cover"
      />
    </picture>
  );
}
