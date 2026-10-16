import { Vehicle, VehicleFilters, VehicleStatus } from '../types/vehicle';
import { cleMarque } from '../config/marques';

/** Ordre d'affichage : disponibles, puis réservés, puis vendus. */
export const STATUTS: { valeur: VehicleStatus; libelle: string; pluriel: string }[] = [
  { valeur: 'available', libelle: 'Disponible', pluriel: 'disponibles' },
  { valeur: 'reserved', libelle: 'Réservé', pluriel: 'réservés' },
  { valeur: 'sold', libelle: 'Vendu', pluriel: 'vendus' },
];

/** Statut d'un véhicule ; sans statut renseigné, il est considéré disponible. */
export function statutDe(vehicle: Pick<Vehicle, 'status'>): VehicleStatus {
  return vehicle.status === 'reserved' || vehicle.status === 'sold' ? vehicle.status : 'available';
}

const RANG: Record<VehicleStatus, number> = { available: 0, reserved: 1, sold: 2 };

/** Trie par statut (disponible → réservé → vendu) en gardant l'ordre d'origine à statut égal. */
export function trierParStatut<T extends Pick<Vehicle, 'status'>>(vehicles: T[]): T[] {
  return vehicles
    .map((v, i) => ({ v, i }))
    .sort((a, b) => RANG[statutDe(a.v)] - RANG[statutDe(b.v)] || a.i - b.i)
    .map(({ v }) => v);
}

export function filterVehicles(vehicles: Vehicle[], filters: VehicleFilters): Vehicle[] {
  return vehicles.filter(vehicle => {
    if (filters.brand && cleMarque(vehicle.brand) !== cleMarque(filters.brand)) return false;
    if (filters.status && statutDe(vehicle) !== filters.status) return false;
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
