import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, ChevronDown, ChevronUp, X, SlidersHorizontal } from 'lucide-react';
import { SEOHead } from '../components/layout/SEOHead';
import { pageSeo } from '../config/seo';
import { Section } from '../components/ui/Section';
import { Container } from '../components/ui/Container';
import { Select } from '../components/ui/Select';
import { VehicleCard } from '../components/VehicleCard';
import { STATUTS, statutDe, trierParStatut } from '../utils/vehicle-filters';
import { cleMarque, nomMarque } from '../config/marques';
import { Button } from '../components/ui/Button';
import { VehicleFilters, VehicleStatus } from '../types/vehicle';
import { useVehicles } from '../hooks/useVehicles';
import { useTexte } from '../lib/textes';

/** Fin des clés de texte de chaque statut (page « Nos véhicules » des Textes du site) */
const CLE_STATUT: Record<VehicleStatus, string> = { available: 'disponible', reserved: 'reserve', sold: 'vendu' };

export function Vehicles() {
  const t = useTexte();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<VehicleFilters>({
    brand: searchParams.get('brand') || undefined,
    status: STATUTS.some((st) => st.valeur === searchParams.get('status'))
      ? (searchParams.get('status') as VehicleStatus)
      : undefined,
    type: (searchParams.get('type') as 'moto' | 'scooter') || undefined,
    displacementMin: searchParams.get('displacementMin') ? Number(searchParams.get('displacementMin')) : undefined,
    displacementMax: searchParams.get('displacementMax') ? Number(searchParams.get('displacementMax')) : undefined,
    yearMin: searchParams.get('yearMin') ? Number(searchParams.get('yearMin')) : undefined,
    priceMax: searchParams.get('priceMax') ? Number(searchParams.get('priceMax')) : undefined,
  });

  // La marque est filtrée ici (et non dans la requête) pour garder la liste
  // complète des marques dans le menu déroulant.
  const { vehicles: tousVehicules, loading, error } = useVehicles({ ...filters, brand: undefined, status: undefined });
  const cleActive = filters.brand ? cleMarque(filters.brand) : '';
  const nomActif = filters.brand ? nomMarque(filters.brand) : '';

  // Menu « Marque » : une entrée par marque, quelle que soit l'écriture dans le catalogue
  const brands = useMemo(() => {
    const parCle = new Map<string, string>();
    tousVehicules.forEach((v) => {
      const cle = cleMarque(v.brand);
      if (cle && !parCle.has(cle)) parCle.set(cle, nomMarque(v.brand));
    });
    if (cleActive && !parCle.has(cleActive)) parCle.set(cleActive, nomActif);
    return [...parCle].map(([cle, nom]) => ({ cle, nom })).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  }, [tousVehicules, cleActive, nomActif]);

  const allVehicles = useMemo(
    () => (cleActive ? tousVehicules.filter((v) => cleMarque(v.brand) === cleActive) : tousVehicules),
    [tousVehicules, cleActive]
  );

  // Recherche texte, puis tri : disponibles, réservés, vendus (les plus récents d'abord)
  const trouves = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const liste = !query
      ? allVehicles
      : allVehicles.filter(vehicle =>
          vehicle.brand.toLowerCase().includes(query) ||
          vehicle.model.toLowerCase().includes(query) ||
          `${vehicle.brand} ${vehicle.model}`.toLowerCase().includes(query)
        );
    return trierParStatut(liste);
  }, [allVehicles, searchQuery]);

  // Nombre de véhicules par statut (avant le filtre de statut), pour le compteur et le filtre
  const parStatut = useMemo(() => {
    const n: Record<VehicleStatus, number> = { available: 0, reserved: 0, sold: 0 };
    trouves.forEach((v) => { n[statutDe(v)] += 1; });
    return n;
  }, [trouves]);

  const vehicles = useMemo(
    () => (filters.status ? trouves.filter((v) => statutDe(v) === filters.status) : trouves),
    [trouves, filters.status]
  );

  const compteur = (() => {
    const total = vehicles.length;
    const vehicule = nomActif
      ? t(total > 1 ? 'vehicules.compteur.plusieurs_marque' : 'vehicules.compteur.un_marque', { n: total, marque: nomActif })
      : t(total > 1 ? 'vehicules.compteur.plusieurs' : 'vehicules.compteur.un', { n: total });
    const mot = (st: (typeof STATUTS)[number], n: number) => t(`vehicules.compteur.${CLE_STATUT[st.valeur]}${n > 1 ? 's' : ''}`);
    if (total === 0) return nomActif ? t('vehicules.compteur.aucun_marque', { marque: nomActif }) : t('vehicules.compteur.aucun');
    if (filters.status) {
      const st = STATUTS.find((x) => x.valeur === filters.status)!;
      return `${vehicule} ${mot(st, total)}`;
    }
    const presents = STATUTS.filter((st) => parStatut[st.valeur] > 0);
    if (presents.length === 1) return `${vehicule} ${mot(presents[0], total)}`;
    if (presents.length === 0) return vehicule;
    return `${vehicule} : ${presents.map((st) => `${parStatut[st.valeur]} ${mot(st, parStatut[st.valeur])}`).join(', ')}`;
  })();

  // Marque choisie (depuis l'accueil par exemple) sans aucune moto en vente
  const marqueSansStock = !!cleActive && !loading && !error && parStatut.available === 0;

  const updateFilter = (key: keyof VehicleFilters, value: string) => {
    const newFilters = { ...filters };

    if (value === '') {
      delete newFilters[key];
    } else {
      if (key === 'brand' || key === 'type' || key === 'status') {
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
    const statut = STATUTS.find((st) => st.valeur === value);
    const labels: Record<string, string> = {
      brand: nomMarque(String(value)),
      status: statut ? t(`vehicules.filtres.statut.${CLE_STATUT[statut.valeur]}`) : String(value),
      type: value === 'moto' ? t('vehicules.filtres.type.moto') : t('vehicules.filtres.type.scooter'),
      displacementMin: t('vehicules.filtres_actifs.cylindree_min', { n: value }),
      displacementMax: t('vehicules.filtres_actifs.cylindree_max', { n: value }),
      yearMin: t('vehicules.filtres_actifs.annee_min', { n: value }),
      priceMax: t('vehicules.filtres_actifs.prix_max', { prix: value.toLocaleString('fr-FR') }),
    };
    return labels[key] || String(value);
  };

  return (
    <>
      <SEOHead meta={pageSeo['/vehicules']} />

      <Section zone="catalogue" background="gray" className="!pt-8 md:!pt-12">
        <Container>
          <h1 className="filet-apres mb-4">
            {t('vehicules.titre')}
          </h1>
          <p className="text-base md:text-lg text-gris mb-6" aria-live="polite">
            {loading ? t('vehicules.compteur.chargement') : compteur}
          </p>

          <div className="space-y-4 mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gris pointer-events-none" aria-hidden="true" />
              <input
                type="text"
                placeholder={t('vehicules.recherche.placeholder')}
                aria-label="Rechercher une marque ou un modèle"
                value={searchQuery}
                onChange={(e) => updateSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-[15px] bg-surface border-[1.5px] border-champ rounded-xl text-noir placeholder:text-doux-58 focus:border-lien focus:outline-none focus:ring-4 focus:ring-lien/15 transition-[border-color,box-shadow] duration-150"
              />
            </div>

            <div className="bg-surface border-[1.5px] border-champ rounded-xl overflow-hidden">
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                aria-expanded={filtersOpen}
                className="w-full px-5 md:px-6 py-4 flex items-center justify-between rounded-xl hover:bg-fond transition-colors duration-180 focus-visible:outline-offset-[-2px]"
              >
                <div className="flex items-center gap-3">
                  <SlidersHorizontal className="w-5 h-5 text-lien" aria-hidden="true" />
                  <span className="font-semibold text-noir">
                    {t('vehicules.filtres.titre')}
                  </span>
                  {activeFiltersCount > 0 && (
                    <span className="min-w-[22px] px-2 py-0.5 bg-bleu text-sur-bouton text-xs font-semibold rounded-full text-center">
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
                      label={t('vehicules.filtres.marque')}
                      value={cleActive}
                      onChange={(e) => updateFilter('brand', e.target.value)}
                    >
                      <option value="">{t('vehicules.filtres.marque_toutes')}</option>
                      {brands.map(({ cle, nom }) => (
                        <option key={cle} value={cle}>
                          {nom}
                        </option>
                      ))}
                    </Select>

                    <Select
                      label={t('vehicules.filtres.statut')}
                      value={filters.status || ''}
                      onChange={(e) => updateFilter('status', e.target.value)}
                    >
                      <option value="">{t('vehicules.filtres.statut_tous')}</option>
                      {STATUTS.map((st) => (
                        <option key={st.valeur} value={st.valeur}>
                          {t(`vehicules.filtres.statut.${CLE_STATUT[st.valeur]}`)} ({parStatut[st.valeur]})
                        </option>
                      ))}
                    </Select>

                    <Select
                      label={t('vehicules.filtres.type')}
                      value={filters.type || ''}
                      onChange={(e) => updateFilter('type', e.target.value)}
                    >
                      <option value="">{t('vehicules.filtres.type_tous')}</option>
                      <option value="moto">{t('vehicules.filtres.type.moto')}</option>
                      <option value="scooter">{t('vehicules.filtres.type.scooter')}</option>
                    </Select>

                    <Select
                      label={t('vehicules.filtres.cylindree')}
                      value={filters.displacementMin || ''}
                      onChange={(e) => updateFilter('displacementMin', e.target.value)}
                    >
                      <option value="">{t('vehicules.filtres.cylindree_aucune')}</option>
                      <option value="125">{t('vehicules.filtres.cylindree_option', { n: 125 })}</option>
                      <option value="300">{t('vehicules.filtres.cylindree_option', { n: 300 })}</option>
                      <option value="500">{t('vehicules.filtres.cylindree_option', { n: 500 })}</option>
                      <option value="650">{t('vehicules.filtres.cylindree_option', { n: 650 })}</option>
                    </Select>

                    <Select
                      label={t('vehicules.filtres.annee')}
                      value={filters.yearMin || ''}
                      onChange={(e) => updateFilter('yearMin', e.target.value)}
                    >
                      <option value="">{t('vehicules.filtres.annee_toutes')}</option>
                      <option value="2018">2018</option>
                      <option value="2019">2019</option>
                      <option value="2020">2020</option>
                      <option value="2021">2021</option>
                      <option value="2022">2022</option>
                    </Select>

                    <Select
                      label={t('vehicules.filtres.prix')}
                      value={filters.priceMax || ''}
                      onChange={(e) => updateFilter('priceMax', e.target.value)}
                    >
                      <option value="">{t('vehicules.filtres.prix_aucun')}</option>
                      <option value="3000">{t('vehicules.filtres.prix_option', { prix: '3 000' })}</option>
                      <option value="5000">{t('vehicules.filtres.prix_option', { prix: '5 000' })}</option>
                      <option value="7000">{t('vehicules.filtres.prix_option', { prix: '7 000' })}</option>
                      <option value="10000">{t('vehicules.filtres.prix_option', { prix: '10 000' })}</option>
                    </Select>
                  </div>

                </div>
              )}
            </div>

            {/* Filtres actifs, toujours visibles (même panneau replié) */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-2" aria-label="Filtres actifs" role="group">
                <span className="text-sm font-semibold text-noir mr-1">{t('vehicules.filtres_actifs.titre')}</span>
                {Object.entries(filters).map(([key, value]) => {
                  if (value === undefined) return null;
                  const libelle = getFilterLabel(key as keyof VehicleFilters, value);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => removeFilter(key as keyof VehicleFilters)}
                      aria-label={`Retirer le filtre ${libelle}`}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors duration-180 group ${
                        key === 'brand'
                          ? 'bg-noir-profond text-inverse border border-or hover:bg-noir font-semibold'
                          : 'bg-surface hover:bg-bordure border border-champ text-noir'
                      }`}
                    >
                      <span>{libelle}</span>
                      <X className={`w-3.5 h-3.5 ${key === 'brand' ? 'text-or-clair' : 'text-gris group-hover:text-lien'}`} aria-hidden="true" />
                    </button>
                  );
                })}
                <button type="button" onClick={clearAllFilters} className="lien text-sm ml-1">
                  {t('vehicules.filtres_actifs.effacer')}
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-base md:text-lg text-gris">{t('vehicules.liste.chargement')}</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-lg text-red-600">Erreur lors du chargement des véhicules.</p>
            </div>
          ) : marqueSansStock ? (
            <>
              <div className="carte text-center px-6 py-10 md:py-12 mb-8">
                <p className="titre-display text-[22px] md:text-2xl mb-2">{nomActif}</p>
                <p className="text-base md:text-lg text-gris mb-6">
                  {t('vehicules.liste.marque_sans_stock')}
                </p>
                <Button type="button" onClick={clearAllFilters}>{t('vehicules.liste.marque_sans_stock_bouton')}</Button>
              </div>
              {vehicles.length > 0 && (
                <>
                  <h2 className="text-base font-semibold text-noir mb-4">{t('vehicules.liste.deja_vendues')}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-7">
                    {vehicles.map((vehicle) => (
                      <VehicleCard key={vehicle.id} vehicle={vehicle} />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-base md:text-lg text-gris">
                {t('vehicules.liste.aucun_resultat')}
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
