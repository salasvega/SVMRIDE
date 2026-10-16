export type VehicleType = 'moto' | 'scooter';

export type VehicleCondition = 'excellent' | 'bon' | 'correct' | 'a-reviser';

export type VehicleStatus = 'available' | 'reserved' | 'sold';

export interface Vehicle {
  id: string;
  slug: string;
  brand: string;
  model: string;
  year: number;
  type: VehicleType;
  displacement: number;
  price: number;
  purchase_price: number;
  sale_price?: number;
  sale_date?: string;
  mileage: number;
  condition: VehicleCondition;
  description: string;
  images: string[];
  features: string[];
  warranty: string;
  available: boolean;
  status: VehicleStatus;
}

export interface VehicleFilters {
  brand?: string;
  status?: VehicleStatus;
  type?: VehicleType;
  displacementMin?: number;
  displacementMax?: number;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  mileageMax?: number;
}
