import { Vehicle, VehicleFilters } from '../types/vehicle';

export function filterVehicles(vehicles: Vehicle[], filters: VehicleFilters): Vehicle[] {
  return vehicles.filter(vehicle => {
    if (filters.brand && vehicle.brand !== filters.brand) return false;
    if (filters.type && vehicle.type !== filters.type) return false;
    if (filters.displacementMin && vehicle.displacement < filters.displacementMin) return false;
    if (filters.displacementMax && vehicle.displacement > filters.displacementMax) return false;
    if (filters.yearMin && vehicle.year < filters.yearMin) return false;
    if (filters.yearMax && vehicle.year > filters.yearMax) return false;
    if (filters.priceMin && vehicle.price < filters.priceMin) return false;
    if (filters.priceMax && vehicle.price > filters.priceMax) return false;
    if (filters.mileageMax && vehicle.mileage > filters.mileageMax) return false;
    return vehicle.available;
  });
}

export function getUniqueBrands(vehicles: Vehicle[]): string[] {
  const brands = new Set(vehicles.map(v => v.brand));
  return Array.from(brands).sort();
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatMileage(mileage: number): string {
  return new Intl.NumberFormat('fr-FR').format(mileage) + ' km';
}
