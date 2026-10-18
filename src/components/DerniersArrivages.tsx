/**
 * Accueil : les dernières motos mises en vente (3 maximum, hors vendues),
 * avec un lien vers tout le catalogue. La section disparaît s'il n'y a
 * aucune moto en vente.
 * Téléphone et tablette : carrousel sur une ligne (défilement automatique,
 * glisser au doigt, sans boutons) ; ordinateur : les 3 cartes côte à côte.
 */
import { Link } from 'react-router-dom';
import { useVehicles } from '../hooks/useVehicles';
import { VehicleCard } from './VehicleCard';
import { Section } from './ui/Section';
import { Container } from './ui/Container';
import { Button } from './ui/Button';
import { CarrouselCartes } from './ui/CarrouselCartes';
import { useTexte } from '../lib/textes';

const NOMBRE = 3;

export function DerniersArrivages() {
  const t = useTexte();
  const { vehicles, loading, error } = useVehicles();
  const enVente = vehicles.filter((v) => (v as { status?: string }).status !== 'sold');

  if (error || (!loading && enVente.length === 0)) return null;

  return (
    <Section background="white" className="!py-12 md:!py-16">
      <Container>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <h2 className="titre-section filet-apres">{t('accueil.arrivages.titre')}</h2>
          {!loading && (
            <Link to="/vehicules" className="lien self-start sm:self-auto whitespace-nowrap">
              {t('accueil.arrivages.lien')} ({enVente.length}) →
            </Link>
          )}
        </div>

        <CarrouselCartes libelle="Derniers arrivages" libelleCarte="moto">
          {loading
            ? Array.from({ length: NOMBRE }, (_, i) => (
                <div key={i} className="rounded-[18px] bg-fond border border-bordure aspect-[4/5] animate-pulse motion-reduce:animate-none" aria-hidden="true" />
              ))
            : enVente.slice(0, NOMBRE).map((v) => (
                <div key={v.id} className="h-full">
                  {/* Dans le carrousel, le glissement fait défiler les motos ; les flèches changent la photo */}
                  <VehicleCard vehicle={v} glissementPhotos={false} />
                </div>
              ))}
        </CarrouselCartes>

        {!loading && enVente.length > NOMBRE && (
          <div className="mt-8 text-center">
            <Link to="/vehicules" tabIndex={-1}>
              <Button variant="outline">{t('accueil.arrivages.lien')}</Button>
            </Link>
          </div>
        )}
      </Container>
    </Section>
  );
}
