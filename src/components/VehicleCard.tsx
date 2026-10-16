import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PistePhotos } from './PhotosGlissantes';
import { useGlissementPhotos } from '../hooks/useGlissementPhotos';
import { Calendar, Gauge, Route, ChevronLeft, ChevronRight } from 'lucide-react';
import { Vehicle } from '../types/vehicle';
import { formatPrice, formatMileage } from '../utils/vehicle-filters';
import { Button } from './ui/Button';

interface VehicleCardProps {
  vehicle: Vehicle & {
    images?: Array<string> | Array<{ url: string; path?: string }>;
    status?: 'available' | 'reserved' | 'sold';
  };
  disableLink?: boolean;
}

// Récupère la première image (string[] ou {url,path}[])
function getAllImages(vehicle: any): string[] {
  if (!vehicle.images || vehicle.images.length === 0) return [];
  return vehicle.images.map((img: any) =>
    typeof img === 'string' ? img : img?.url
  ).filter(Boolean);
}

// Badge de statut : fond noir profond, liseré or, pastille ronde de couleur
function getStatusBadge(status?: string) {
  switch (status) {
    case 'available':
      return { label: 'Disponible', dot: 'bg-or-clair' };
    case 'reserved':
      return { label: 'Réservé', dot: 'bg-[#F0A93B]' };
    case 'sold':
      return { label: 'Vendu', dot: 'bg-[#9A9A9A]' };
    default:
      return { label: '', dot: '' };
  }
}

export function VehicleCard({ vehicle, disableLink = false }: VehicleCardProps) {
  const images = getAllImages(vehicle);
  const displayImages = images.length > 0 ? images : ['/placeholder.jpg'];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const statusInfo = getStatusBadge(vehicle.status);
  const hasMultipleImages = displayImages.length > 1;
  const glisse = useGlissementPhotos(displayImages.length, currentImageIndex, setCurrentImageIndex);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) =>
      prev === 0 ? displayImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) =>
      prev === displayImages.length - 1 ? 0 : prev + 1
    );
  };

  const content = (
    <article
      {...glisse.ecouteurs}
      className={`bg-white rounded-[18px] overflow-hidden shadow-vehicule transition-[box-shadow,transform] duration-200 ease-out hover:shadow-vehicule-fort hover:-translate-y-1 group relative h-full flex flex-col ${hasMultipleImages ? 'touch-pan-y' : ''}`}
    >
      {/* Photos : glisser au doigt (ou à la souris) en plus des flèches */}
      <div ref={glisse.zoneRef} className="relative aspect-[4/3] overflow-hidden bg-fond">
        <PistePhotos
          images={displayImages}
          index={currentImageIndex}
          alt={(i) => `${vehicle.brand} ${vehicle.model} ${vehicle.year} - Image ${i + 1}`}
          dx={glisse.dx}
          anime={glisse.anime}
          voisinsCharges={glisse.voisinsCharges}
          classeImage="transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />

        {hasMultipleImages && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-noir-profond/55 hover:bg-noir-profond/80 backdrop-blur-sm text-white p-2 rounded-full transition-[opacity,background-color] duration-180 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 z-10"
              aria-label="Image précédente"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-noir-profond/55 hover:bg-noir-profond/80 backdrop-blur-sm text-white p-2 rounded-full transition-[opacity,background-color] duration-180 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 z-10"
              aria-label="Image suivante"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {displayImages.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentImageIndex
                      ? 'bg-white w-6'
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Aller à l'image ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}

        {statusInfo.label && (
          <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-noir-profond text-white border border-or px-3 py-1 rounded-full text-xs font-semibold tracking-wide shadow-[0_2px_8px_rgba(0,0,0,0.25)] z-10">
            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} aria-hidden="true" />
            {statusInfo.label}
          </div>
        )}

        <div className="absolute top-3 right-3 bg-white border-[1.5px] border-or px-3 py-1 rounded-full text-sm font-bold text-noir shadow-[0_2px_8px_rgba(0,0,0,0.15)] z-10">
          {formatPrice(vehicle.price)}
        </div>
      </div>

      <div className="p-5 md:p-6 flex flex-col flex-1">
        <h3 className="titre-display text-[21px] md:text-[22px] mb-3">
          {disableLink ? (
            `${vehicle.brand} ${vehicle.model}`
          ) : (
            // Lien unique de la carte : sa zone cliquable couvre toute la carte
            // (les flèches et pastilles du carrousel restent au-dessus).
            <Link
              to={`/vehicules/${vehicle.slug}`}
              className="after:absolute after:inset-0 after:rounded-[18px] after:content-[''] focus-visible:outline-none focus-visible:after:ring-4 focus-visible:after:ring-bleu-vif/60"
            >
              {vehicle.brand} {vehicle.model}
            </Link>
          )}
        </h3>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-gris mb-5 pb-5 border-b border-bordure">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-or-texte" aria-hidden="true" />
            <span>{vehicle.year}</span>
          </div>
          <div className="flex items-center gap-1">
            <Gauge className="w-4 h-4 text-or-texte" aria-hidden="true" />
            <span>{vehicle.displacement} cc</span>
          </div>
          <div className="flex items-center gap-1">
            <Route className="w-4 h-4 text-or-texte" aria-hidden="true" />
            <span>{formatMileage(vehicle.mileage)}</span>
          </div>
        </div>

        {!disableLink && (
          <div className="mt-auto" aria-hidden="true">
            <Button fullWidth tabIndex={-1} type="button">
              Voir le véhicule
            </Button>
          </div>
        )}
      </div>
    </article>
  );

  return content;
}
