import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Gauge, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
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

// Donne le label et la couleur selon le statut
function getStatusBadge(status?: string) {
  switch (status) {
    case 'available':
      return { label: 'Disponible', color: 'bg-green-600' };
    case 'reserved':
      return { label: 'Réservé', color: 'bg-yellow-500' };
    case 'sold':
      return { label: 'Vendu', color: 'bg-gray-600' };
    default:
      return { label: '', color: '' };
  }
}

export function VehicleCard({ vehicle, disableLink = false }: VehicleCardProps) {
  const images = getAllImages(vehicle);
  const displayImages = images.length > 0 ? images : ['/placeholder.jpg'];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const statusInfo = getStatusBadge(vehicle.status);
  const hasMultipleImages = displayImages.length > 1;

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
    <article className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group relative">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#F9F9F9]">
        <img
          src={displayImages[currentImageIndex]}
          alt={`${vehicle.brand} ${vehicle.model} ${vehicle.year} - Image ${currentImageIndex + 1}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {hasMultipleImages && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 z-10"
              aria-label="Image précédente"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 z-10"
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
          <div
            className={`absolute top-4 left-4 ${statusInfo.color} text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md z-10`}
          >
            {statusInfo.label}
          </div>
        )}

        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-brand shadow-md z-10">
          {formatPrice(vehicle.price)}
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-[#111111] mb-2">
          {vehicle.brand} {vehicle.model}
        </h3>

        <div className="flex flex-wrap gap-4 text-sm text-[#444444] mb-4">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" aria-hidden="true" />
            <span>{vehicle.year}</span>
          </div>
          <div className="flex items-center gap-1">
            <Gauge className="w-4 h-4" aria-hidden="true" />
            <span>{vehicle.displacement} cc</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" aria-hidden="true" />
            <span>{formatMileage(vehicle.mileage)}</span>
          </div>
        </div>

        {!disableLink && (
          <Link to={`/vehicules/${vehicle.slug}`}>
            <Button variant="outline" fullWidth>
              Voir le véhicule
            </Button>
          </Link>
        )}
      </div>
    </article>
  );

  if (disableLink) return content;

  return (
    <Link to={`/vehicules/${vehicle.slug}`} className="block">
      {content}
    </Link>
  );
}
