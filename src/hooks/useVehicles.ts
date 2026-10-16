import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Vehicle, VehicleFilters } from '../types/vehicle';

/**
 * Colonnes lisibles par les visiteurs. Ne jamais remettre select('*') ici :
 * prix d'achat, prix et date de vente sont réservés à l'admin, et Supabase
 * refuse désormais de les donner aux visiteurs (la requête échouerait).
 */
export const PUBLIC_VEHICLE_COLUMNS =
  'id,slug,brand,model,year,type,displacement,price,mileage,condition,description,images,features,warranty,available,status,created_at,updated_at';

export function useVehicles(filters?: VehicleFilters) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchVehicles() {
      try {
        setLoading(true);
        let query = supabase
          .from('vehicles')
          .select(PUBLIC_VEHICLE_COLUMNS)
          .eq('available', true)
          .order('created_at', { ascending: false });

        if (filters?.brand) {
          query = query.eq('brand', filters.brand);
        }
        if (filters?.type) {
          query = query.eq('type', filters.type);
        }
        if (filters?.displacementMin) {
          query = query.gte('displacement', filters.displacementMin);
        }
        if (filters?.displacementMax) {
          query = query.lte('displacement', filters.displacementMax);
        }
        if (filters?.yearMin) {
          query = query.gte('year', filters.yearMin);
        }
        if (filters?.yearMax) {
          query = query.lte('year', filters.yearMax);
        }
        if (filters?.priceMin) {
          query = query.gte('price', filters.priceMin);
        }
        if (filters?.priceMax) {
          query = query.lte('price', filters.priceMax);
        }
        if (filters?.mileageMax) {
          query = query.lte('mileage', filters.mileageMax);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        setVehicles(data as Vehicle[]);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
      } finally {
        setLoading(false);
      }
    }

    fetchVehicles();
  }, [filters?.brand, filters?.type, filters?.displacementMin, filters?.displacementMax, filters?.yearMin, filters?.yearMax, filters?.priceMin, filters?.priceMax, filters?.mileageMax]);

  return { vehicles, loading, error };
}

export function useVehicle(slug: string) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchVehicle() {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('vehicles')
          .select(PUBLIC_VEHICLE_COLUMNS)
          .eq('slug', slug)
          .single();

        if (fetchError) throw fetchError;

        setVehicle(data as Vehicle);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
      } finally {
        setLoading(false);
      }
    }

    fetchVehicle();
  }, [slug]);

  return { vehicle, loading, error };
}
