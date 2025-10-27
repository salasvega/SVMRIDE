import { Link } from 'react-router-dom';
import { Calendar, Gauge, MapPin } from 'lucide-react';
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
function getMainImage(vehicle: any): string | undefined {
  if (!vehicle.images || vehicle.images.length === 0) return undefined;
  const first = vehicle.images[0];
  return typeof first === 'string' ? first : first?.url;
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
  const mainImage = getMainImage(vehicle) || '/placeholder.jpg';
  const statusInfo = getStatusBadge(vehicle.status);

  const content = (
    <article className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group relative">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#F9F9F9]">
        <img
          src={mainImage}
          alt={`${vehicle.brand} ${vehicle.model} ${vehicle.year}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Badge statut */}
        {statusInfo.label && (
          <div
            className={`absolute top-4 left-4 ${statusInfo.color} text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md`}
          >
            {statusInfo.label}
          </div>
        )}

        {/* Prix */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-[#D10000] shadow-md">
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
