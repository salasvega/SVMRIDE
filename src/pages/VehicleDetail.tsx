import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Gauge, Route, Shield, ArrowLeft, MessageCircle, Euro, ChevronLeft, ChevronRight } from 'lucide-react';
import { IconeOr } from '../components/ui/IconeOr';
import { SEOHead } from '../components/layout/SEOHead';
import { Section } from '../components/ui/Section';
import { Container } from '../components/ui/Container';
import { Button } from '../components/ui/Button';
import { formatPrice, formatMileage } from '../utils/vehicle-filters';
import { useVehicle } from '../hooks/useVehicles';
import { vehicleSeo, vehicleNotFoundSeo } from '../config/seo';
import { PistePhotos } from '../components/PhotosGlissantes';
import { useGlissementPhotos } from '../hooks/useGlissementPhotos';

export function VehicleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { vehicle, loading, error } = useVehicle(slug || '');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const glisse = useGlissementPhotos(vehicle?.images.length ?? 0, currentImageIndex, setCurrentImageIndex);

  const handlePrevImage = () => {
    if (!vehicle) return;
    setCurrentImageIndex((prev) =>
      prev === 0 ? vehicle.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    if (!vehicle) return;
    setCurrentImageIndex((prev) =>
      prev === vehicle.images.length - 1 ? 0 : prev + 1
    );
  };

  if (loading) {
    return (
      <Section>
        <Container className="text-center py-12">
          <p className="text-lg text-gris">Chargement...</p>
        </Container>
      </Section>
    );
  }

  if (error || !vehicle) {
    return (
      <Section>
        <SEOHead meta={vehicleNotFoundSeo} />
        <Container className="text-center py-12">
          <h1 className="filet-apres text-center mb-8">Véhicule non trouvé</h1>
          <Link to="/vehicules">
            <Button>Retour aux véhicules</Button>
          </Link>
        </Container>
      </Section>
    );
  }


  const vehicleLabel = `${vehicle.brand} ${vehicle.model} ${vehicle.year}`;
  const financingLink = `/financement?vehicle=${encodeURIComponent(
    vehicleLabel
  )}&price=${encodeURIComponent(String(vehicle.price))}&duration=24`;

  return (
    <>
      <SEOHead meta={vehicleSeo(vehicle)} />

      <Section background="gray" className="!py-5">
        <Container>
          <Link
            to="/vehicules"
            className="lien inline-flex items-center gap-2 text-sm md:text-base"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux véhicules
          </Link>
        </Container>
      </Section>

      <Section background="white" className="!pt-2 !pb-12 md:!py-10">
        <Container>
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* --- Colonne gauche : galerie photos --- */}
            <div>
              {/* Photo principale : glisser au doigt (ou à la souris) en plus des flèches */}
              <div
                ref={glisse.zoneRef}
                {...glisse.ecouteurs}
                className={`relative aspect-[4/3] rounded-[18px] overflow-hidden bg-fond mb-3 md:mb-4 group shadow-vehicule ${vehicle.images.length > 1 ? 'touch-pan-y cursor-grab active:cursor-grabbing' : ''}`}
              >
                <PistePhotos
                  images={vehicle.images}
                  index={currentImageIndex}
                  alt={(i) => `${vehicle.brand} ${vehicle.model} - Image ${i + 1}`}
                  dx={glisse.dx}
                  anime={glisse.anime}
                  voisinsCharges={glisse.voisinsCharges}
                  chargement="eager"
                />

                {vehicle.images.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 bg-noir-profond/55 hover:bg-noir-profond/80 backdrop-blur-sm text-white p-2.5 md:p-3 rounded-full transition-[opacity,background-color] duration-180 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 z-10"
                      aria-label="Image précédente"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>

                    <button
                      onClick={handleNextImage}
                      className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 bg-noir-profond/55 hover:bg-noir-profond/80 backdrop-blur-sm text-white p-2.5 md:p-3 rounded-full transition-[opacity,background-color] duration-180 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 z-10"
                      aria-label="Image suivante"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>

                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                      {vehicle.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`h-2 rounded-full transition-all ${
                            index === currentImageIndex
                              ? 'bg-white w-8'
                              : 'bg-white/50 hover:bg-white/75 w-2'
                          }`}
                          aria-label={`Aller à l'image ${index + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {vehicle.images.length > 1 && (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 md:gap-3">
                  {vehicle.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      aria-label={`Afficher l'image ${index + 1}`}
                      aria-current={currentImageIndex === index ? 'true' : undefined}
                      className={`aspect-[4/3] rounded-xl overflow-hidden border-2 transition-[border-color,opacity] duration-180 ${
                        currentImageIndex === index
                          ? 'border-bleu'
                          : 'border-transparent opacity-75 hover:opacity-100 hover:border-or'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${vehicle.brand} ${vehicle.model} - Miniature ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* --- Colonne droite : infos véhicule + actions --- */}
            <div>
              <h1 className="!text-[32px] md:!text-[40px] mb-4">
                {vehicle.brand} {vehicle.model}
              </h1>

              <p className="inline-flex items-center bg-white border-[1.5px] border-or rounded-full px-5 py-1.5 font-display font-semibold text-[26px] md:text-[28px] leading-tight text-noir mb-6">
                {formatPrice(vehicle.price)}
              </p>

              <div className="grid grid-cols-2 gap-x-4 gap-y-5 mb-8 p-5 md:p-6 bg-fond border border-bordure rounded-2xl">
                <div className="flex items-center gap-3">
                  <IconeOr icon={Calendar} className="w-6 h-6 flex-shrink-0" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#5E5E5E]">Année</p>
                    <p className="font-semibold text-noir">{vehicle.year}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <IconeOr icon={Gauge} className="w-6 h-6 flex-shrink-0" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#5E5E5E]">Cylindrée</p>
                    <p className="font-semibold text-noir">
                      {vehicle.displacement} cc
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <IconeOr icon={Route} className="w-6 h-6 flex-shrink-0" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#5E5E5E]">Kilométrage</p>
                    <p className="font-semibold text-noir">
                      {formatMileage(vehicle.mileage)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <IconeOr icon={Shield} className="w-6 h-6 flex-shrink-0" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#5E5E5E]">Type</p>
                    <p className="font-semibold text-noir capitalize">
                      {vehicle.type}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-xl md:text-[22px] filet-apres mb-4">Description</h2>
                <p className="text-gris leading-relaxed">{vehicle.description}</p>
              </div>

              {/* Équipements */}
              <div className="mb-8">
                <h2 className="text-xl md:text-[22px] filet-apres mb-4">Équipements</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                  {vehicle.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2.5 text-gris">
                      <span className="mt-[9px] w-1.5 h-1.5 flex-shrink-0 bg-or rounded-full" aria-hidden="true"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Garantie */}
              <div className="p-4 md:p-5 bg-white border border-bordure border-l-[3px] border-l-or rounded-xl mb-8">
                <div className="flex items-center gap-2 text-noir mb-1">
                  <IconeOr icon={Shield} className="w-5 h-5" />
                  <span className="font-semibold">Garantie</span>
                </div>
                <p className="text-gris">{vehicle.warranty}</p>
              </div>
{/* CTA contact (principal) + CTA financement (secondaire) */}
              <div className="w-full flex flex-col gap-3">
                <Link
                  to="/contact"
                  state={{
                    vehicle: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
                  }}
                  className="w-full"
                  tabIndex={-1}
                >
                  <Button size="lg" fullWidth>
                    <MessageCircle className="w-5 h-5" aria-hidden="true" />
                    <span>Demander des informations</span>
                  </Button>
                </Link>

                <Link to={financingLink} className="w-full" tabIndex={-1}>
                  <Button size="lg" variant="secondary" fullWidth>
                    <Euro className="w-5 h-5" aria-hidden="true" />
                    <span>Demander un financement</span>
                  </Button>
                </Link>
              </div>


              
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
