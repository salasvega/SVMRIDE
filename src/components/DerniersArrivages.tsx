/**
 * Accueil : les dernières motos mises en vente (3 maximum, hors vendues),
 * avec un lien vers tout le catalogue. La section disparaît s'il n'y a
 * aucune moto en vente.
 */
import { Link } from 'react-router-dom';
import { useVehicles } from '../hooks/useVehicles';
import { VehicleCard } from './VehicleCard';
import { Section } from './ui/Section';
import { Container } from './ui/Container';
import { Button } from './ui/Button';

const NOMBRE = 3;

export function DerniersArrivages() {
  const { vehicles, loading, error } = useVehicles();
  const enVente = vehicles.filter((v) => (v as { status?: string }).status !== 'sold');

  if (error || (!loading && enVente.length === 0)) return null;

  return (
    <Section background="white" className="!py-12 md:!py-16">
      <Container>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <h2 className="titre-section filet-apres">Derniers arrivages</h2>
          {!loading && (
            <Link to="/vehicules" className="lien self-start sm:self-auto whitespace-nowrap">
              Voir toutes nos motos ({enVente.length}) →
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {loading
            ? Array.from({ length: NOMBRE }, (_, i) => (
                <div key={i} className="rounded-[18px] bg-fond border border-bordure aspect-[4/5] animate-pulse motion-reduce:animate-none" aria-hidden="true" />
              ))
            : enVente.slice(0, NOMBRE).map((v, i) => (
                // Sur tablette (2 colonnes), la 3e carte est masquée pour ne pas rester seule
                <div key={v.id} className={i === 2 ? 'sm:hidden lg:block' : ''}>
                  <VehicleCard vehicle={v} />
                </div>
              ))}
        </div>

        {!loading && enVente.length > NOMBRE && (
          <div className="mt-8 text-center">
            <Link to="/vehicules" tabIndex={-1}>
              <Button variant="outline">Voir toutes nos motos</Button>
            </Link>
          </div>
        )}
      </Container>
    </Section>
  );
}
