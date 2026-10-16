/** Les 3 photos côte à côte d'un véhicule, décalées selon le doigt (voir useGlissementPhotos). */
import { DUREE_MS } from '../hooks/useGlissementPhotos';

interface PisteProps {
  images: string[];
  index: number;
  alt: (i: number) => string;
  dx: number;
  anime: boolean;
  voisinsCharges: boolean;
  classeImage?: string;
  chargement?: 'lazy' | 'eager';
}

/** Les 3 photos côte à côte (précédente, courante, suivante), décalées selon le doigt. */
export function PistePhotos({ images, index, alt, dx, anime, voisinsCharges, classeImage = '', chargement = 'lazy' }: PisteProps) {
  const n = images.length;
  const voisins = n > 1 && voisinsCharges;
  const prec = (index - 1 + n) % n;
  const suiv = (index + 1) % n;
  return (
    <div
      className="absolute inset-0 flex select-none"
      style={{
        transform: `translate3d(calc(-100% + ${dx}px),0,0)`,
        transition: anime ? `transform ${DUREE_MS}ms cubic-bezier(.22,.61,.36,1)` : 'none',
      }}
    >
      <div className="relative h-full w-full shrink-0" aria-hidden="true">
        {voisins && <img src={images[prec]} alt="" draggable={false} className={`h-full w-full object-cover ${classeImage}`} />}
      </div>
      <div className="relative h-full w-full shrink-0">
        <img src={images[index]} alt={alt(index)} draggable={false} loading={chargement} className={`h-full w-full object-cover ${classeImage}`} />
      </div>
      <div className="relative h-full w-full shrink-0" aria-hidden="true">
        {voisins && <img src={images[suiv]} alt="" draggable={false} className={`h-full w-full object-cover ${classeImage}`} />}
      </div>
    </div>
  );
}
