import { Link } from 'react-router-dom';
import { Calendar, Gauge, MapPin } from 'lucide-react';
import { Vehicle } from '../types/vehicle';
import { formatPrice, formatMileage } from '../utils/vehicle-filters';
import { Button } from './ui/Button';

interface VehicleCardProps {
  vehicle: Vehicle;
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  return (
    <article className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group">
      <Link to={`/vehicules/${vehicle.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-[#F9F9F9]">
          <img
            src={vehicle.images[0]}
            alt={`${vehicle.brand} ${vehicle.model} ${vehicle.year}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-semibold text-[#D10000]">
            {formatPrice(vehicle.price)}
          </div>
        </div>
      </Link>

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

        <Link to={`/vehicules/${vehicle.slug}`}>
          <Button variant="outline" fullWidth>
            Voir le véhicule
          </Button>
        </Link>
      </div>
    </article>
  );
}
