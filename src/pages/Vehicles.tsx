import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { SEOHead } from '../components/layout/SEOHead';
import { Section } from '../components/ui/Section';
import { Container } from '../components/ui/Container';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { VehicleCard } from '../components/VehicleCard';
import { getUniqueBrands } from '../utils/vehicle-filters';
import { VehicleFilters } from '../types/vehicle';
import { useVehicles } from '../hooks/useVehicles';

export function Vehicles() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [filters, setFilters] = useState<VehicleFilters>({
    brand: searchParams.get('brand') || undefined,
    type: (searchParams.get('type') as 'moto' | 'scooter') || undefined,
    displacementMin: searchParams.get('displacementMin') ? Number(searchParams.get('displacementMin')) : undefined,
    displacementMax: searchParams.get('displacementMax') ? Number(searchParams.get('displacementMax')) : undefined,
    yearMin: searchParams.get('yearMin') ? Number(searchParams.get('yearMin')) : undefined,
    priceMax: searchParams.get('priceMax') ? Number(searchParams.get('priceMax')) : undefined,
  });

  const { vehicles: allVehicles, loading, error } = useVehicles(filters);
  const brands = useMemo(() => getUniqueBrands(allVehicles), [allVehicles]);

  const vehicles = useMemo(() => {
    if (!searchQuery.trim()) return allVehicles;

    const query = searchQuery.toLowerCase();
    return allVehicles.filter(vehicle =>
      vehicle.brand.toLowerCase().includes(query) ||
      vehicle.model.toLowerCase().includes(query) ||
      `${vehicle.brand} ${vehicle.model}`.toLowerCase().includes(query)
    );
  }, [allVehicles, searchQuery]);

  const updateFilter = (key: keyof VehicleFilters, value: string) => {
    const newFilters = { ...filters };

    if (value === '') {
      delete newFilters[key];
    } else {
      if (key === 'brand' || key === 'type') {
        newFilters[key] = value as any;
      } else {
        newFilters[key] = Number(value) as any;
      }
    }

    setFilters(newFilters);

    const newParams = new URLSearchParams();
    if (searchQuery) {
      newParams.set('search', searchQuery);
    }
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v !== undefined) {
        newParams.set(k, String(v));
      }
    });
    setSearchParams(newParams);
  };

  const updateSearch = (value: string) => {
    setSearchQuery(value);

    const newParams = new URLSearchParams();
    if (value.trim()) {
      newParams.set('search', value);
    }
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined) {
        newParams.set(k, String(v));
      }
    });
    setSearchParams(newParams);
  };

  return (
    <>
      <SEOHead
        title="Nos Véhicules d'Occasion"
        description="Découvrez notre sélection de motos et scooters d'occasion en Île-de-France. Véhicules vérifiés, garantis et au meilleur prix."
        path="/vehicules"
      />

      <Section background="gray" className="!py-8">
        <Container>
          <h1 className="text-3xl md:text-4xl font-bold text-[#111111] mb-2">
            Nos Véhicules d'Occasion
          </h1>
          <p className="text-lg text-[#444444]">
            {loading ? 'Chargement...' : `${vehicles.length} véhicule${vehicles.length > 1 ? 's' : ''} disponible${vehicles.length > 1 ? 's' : ''}`}
          </p>
      
          <div className="bg-[#F9F9F9] p-6 rounded-xl mb-12">
            <h2 className="text-lg font-semibold text-[#111111] mb-4">Filtrer les véhicules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select
                label="Marque"
                value={filters.brand || ''}
                onChange={(e) => updateFilter('brand', e.target.value)}
              >
                <option value="">Toutes les marques</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </Select>

              <Select
                label="Type"
                value={filters.type || ''}
                onChange={(e) => updateFilter('type', e.target.value)}
              >
                <option value="">Tous les types</option>
                <option value="moto">Moto</option>
                <option value="scooter">Scooter</option>
              </Select>

              <Select
                label="Cylindrée min"
                value={filters.displacementMin || ''}
                onChange={(e) => updateFilter('displacementMin', e.target.value)}
              >
                <option value="">Aucune</option>
                <option value="125">125 cc</option>
                <option value="300">300 cc</option>
                <option value="500">500 cc</option>
                <option value="650">650 cc</option>
              </Select>

              <Select
                label="Année min"
                value={filters.yearMin || ''}
                onChange={(e) => updateFilter('yearMin', e.target.value)}
              >
                <option value="">Toutes</option>
                <option value="2018">2018</option>
                <option value="2019">2019</option>
                <option value="2020">2020</option>
                <option value="2021">2021</option>
                <option value="2022">2022</option>
              </Select>

              <Select
                label="Prix max"
                value={filters.priceMax || ''}
                onChange={(e) => updateFilter('priceMax', e.target.value)}
              >
                <option value="">Aucun</option>
                <option value="3000">3 000 €</option>
                <option value="5000">5 000 €</option>
                <option value="7000">7 000 €</option>
                <option value="10000">10 000 €</option>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-lg text-[#444444]">Chargement des véhicules...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-lg text-red-600">Erreur lors du chargement des véhicules.</p>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-[#444444]">
                Aucun véhicule ne correspond à vos critères. Essayez de modifier les filtres.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {vehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
