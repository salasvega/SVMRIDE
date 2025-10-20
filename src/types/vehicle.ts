export type VehicleType = 'moto' | 'scooter';

export type VehicleCondition = 'excellent' | 'bon' | 'correct' | 'a-reviser';

export interface Vehicle {
  id: string;
  slug: string;
  brand: string;
  model: string;
  year: number;
  type: VehicleType;
  displacement: number;
  price: number;
  mileage: number;
  condition: VehicleCondition;
  description: string;
  images: string[];
  features: string[];
  warranty: string;
  available: boolean;
}

export interface VehicleFilters {
  brand?: string;
  type?: VehicleType;
  displacementMin?: number;
  displacementMax?: number;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  mileageMax?: number;
}
