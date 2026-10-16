import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, ChevronDown, ChevronUp, X, SlidersHorizontal } from 'lucide-react';
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
  const [filtersOpen, setFiltersOpen] = useState(false);
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

  const clearAllFilters = () => {
    setFilters({});
    setSearchQuery('');
    setSearchParams(new URLSearchParams());
  };

  const removeFilter = (key: keyof VehicleFilters) => {
    updateFilter(key, '');
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== undefined).length;

  const getFilterLabel = (key: keyof VehicleFilters, value: string | number) => {
    const labels: Record<string, string> = {
      brand: value as string,
      type: value === 'moto' ? 'Moto' : 'Scooter',
      displacementMin: `≥ ${value} cc`,
      displacementMax: `≤ ${value} cc`,
      yearMin: `≥ ${value}`,
      priceMax: `≤ ${value.toLocaleString('fr-FR')} €`,
    };
    return labels[key] || String(value);
  };

  return (
    <>
      <SEOHead
        title="Nos Véhicules d'Occasion"
        description="Découvrez notre sélection de motos et scooters d'occasion en Île-de-France. Véhicules vérifiés, garantis et au meilleur prix."
        path="/vehicules"
      />

      <Section background="gray" className="!pt-8 md:!pt-12">
        <Container>
          <h1 className="filet-apres mb-4">
            Nos Véhicules d'Occasion
          </h1>
          <p className="text-base md:text-lg text-gris mb-6">
            {loading ? 'Chargement...' : `${vehicles.length} véhicule${vehicles.length > 1 ? 's' : ''} disponible${vehicles.length > 1 ? 's' : ''}`}
          </p>

          <div className="space-y-4 mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gris pointer-events-none" aria-hidden="true" />
              <input
                type="text"
                placeholder="Rechercher une marque ou un modèle..."
                aria-label="Rechercher une marque ou un modèle"
                value={searchQuery}
                onChange={(e) => updateSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-[15px] bg-white border-[1.5px] border-champ rounded-xl text-noir placeholder:text-[#767676] focus:border-bleu focus:outline-none focus:ring-4 focus:ring-bleu/15 transition-[border-color,box-shadow] duration-150"
              />
            </div>

            <div className="bg-white border-[1.5px] border-champ rounded-xl overflow-hidden">
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                aria-expanded={filtersOpen}
                className="w-full px-5 md:px-6 py-4 flex items-center justify-between rounded-xl hover:bg-fond transition-colors duration-180 focus-visible:outline-offset-[-2px]"
              >
                <div className="flex items-center gap-3">
                  <SlidersHorizontal className="w-5 h-5 text-bleu" aria-hidden="true" />
                  <span className="font-semibold text-noir">
                    Filtres avancés
                  </span>
                  {activeFiltersCount > 0 && (
                    <span className="min-w-[22px] px-2 py-0.5 bg-bleu text-white text-xs font-semibold rounded-full text-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </div>
                {filtersOpen ? (
                  <ChevronUp className="w-5 h-5 text-gris" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gris" aria-hidden="true" />
                )}
              </button>

              {filtersOpen && (
                <div className="px-5 md:px-6 pb-6 border-t border-bordure">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
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

                  {activeFiltersCount > 0 && (
                    <div className="mt-6 pt-6 border-t border-bordure">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-noir">
                          Filtres actifs
                        </span>
                        <button
                          onClick={clearAllFilters}
                          className="lien text-sm"
                        >
                          Tout effacer
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(filters).map(([key, value]) => {
                          if (value === undefined) return null;
                          return (
                            <button
                              key={key}
                              onClick={() => removeFilter(key as keyof VehicleFilters)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-fond hover:bg-bordure border border-champ rounded-full text-sm text-noir transition-colors duration-180 group"
                            >
                              <span>{getFilterLabel(key as keyof VehicleFilters, value)}</span>
                              <X className="w-3.5 h-3.5 text-gris group-hover:text-bleu" aria-hidden="true" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-base md:text-lg text-gris">Chargement des véhicules...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-lg text-red-600">Erreur lors du chargement des véhicules.</p>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-base md:text-lg text-gris">
                Aucun véhicule ne correspond à vos critères. Essayez de modifier les filtres.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-7">
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
