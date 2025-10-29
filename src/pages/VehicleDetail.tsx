import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Gauge, MapPin, Shield, ArrowLeft, MessageCircle, Euro } from 'lucide-react';
import { SEOHead } from '../components/layout/SEOHead';
import { Section } from '../components/ui/Section';
import { Container } from '../components/ui/Container';
import { Button } from '../components/ui/Button';
import { formatPrice, formatMileage } from '../utils/vehicle-filters';
import { useVehicle } from '../hooks/useVehicles';
import { siteConfig } from '../config/site';

export function VehicleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { vehicle, loading, error } = useVehicle(slug || '');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (loading) {
    return (
      <Section>
        <Container className="text-center py-12">
          <p className="text-lg text-[#444444]">Chargement...</p>
        </Container>
      </Section>
    );
  }

  if (error || !vehicle) {
    return (
      <Section>
        <Container className="text-center py-12">
          <h1 className="text-3xl font-bold text-[#111111] mb-4">Véhicule non trouvé</h1>
          <Link to="/vehicules">
            <Button>Retour aux véhicules</Button>
          </Link>
        </Container>
      </Section>
    );
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
    description: vehicle.description,
    image: vehicle.images.map((img) => `${siteConfig.baseUrl}${img}`),
    brand: {
      '@type': 'Brand',
      name: vehicle.brand,
    },
    offers: {
      '@type': 'Offer',
      price: vehicle.price,
      priceCurrency: 'EUR',
      itemCondition: 'https://schema.org/UsedCondition',
      availability: vehicle.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: siteConfig.name,
      },
    },
  };

  const vehicleLabel = `${vehicle.brand} ${vehicle.model} ${vehicle.year}`;
  const financingLink = `/financement?vehicle=${encodeURIComponent(
    vehicleLabel
  )}&price=${encodeURIComponent(String(vehicle.price))}`;

  return (
    <>
      <SEOHead
        title={`${vehicle.brand} ${vehicle.model} ${vehicle.year}`}
        description={vehicle.description}
        path={`/vehicules/${vehicle.slug}`}
        image={vehicle.images[0]}
        schema={schema}
      />

      <Section background="gray" className="!py-6">
        <Container>
          <Link
            to="/vehicules"
            className="inline-flex items-center gap-2 text-[#D10000] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux véhicules
          </Link>
        </Container>
      </Section>

      <Section background="white" className="!py-8">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12">
            {/* --- Colonne gauche : galerie photos --- */}
            <div>
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#F9F9F9] mb-4">
                <img
                  src={vehicle.images[currentImageIndex]}
                  alt={`${vehicle.brand} ${vehicle.model} - Image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {vehicle.images.length > 1 && (
                <div className="grid grid-cols-3 gap-4">
                  {vehicle.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all ${
                        currentImageIndex === index
                          ? 'border-[#D10000]'
                          : 'border-transparent'
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
              <h1 className="text-3xl md:text-4xl font-bold text-[#111111] mb-2">
                {vehicle.brand} {vehicle.model}
              </h1>

              <p className="text-3xl font-bold text-[#D10000] mb-6">
                {formatPrice(vehicle.price)}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8 p-6 bg-[#F9F9F9] rounded-xl">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#D10000]" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-[#444444]">Année</p>
                    <p className="font-semibold text-[#111111]">{vehicle.year}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-[#D10000]" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-[#444444]">Cylindrée</p>
                    <p className="font-semibold text-[#111111]">
                      {vehicle.displacement} cc
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#D10000]" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-[#444444]">Kilométrage</p>
                    <p className="font-semibold text-[#111111]">
                      {formatMileage(vehicle.mileage)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#D10000]" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-[#444444]">Type</p>
                    <p className="font-semibold text-[#111111] capitalize">
                      {vehicle.type}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-[#111111] mb-3">Description</h2>
                <p className="text-[#444444] leading-relaxed">{vehicle.description}</p>
              </div>

              {/* Équipements */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-[#111111] mb-3">Équipements</h2>
                <ul className="grid grid-cols-2 gap-2">
                  {vehicle.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-[#444444]">
                      <span className="w-2 h-2 bg-[#D10000] rounded-full"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Garantie */}
              <div className="p-4 bg-[#F9F9F9] rounded-xl mb-8">
                <div className="flex items-center gap-2 text-[#D10000] mb-1">
                  <Shield className="w-5 h-5" aria-hidden="true" />
                  <span className="font-semibold">Garantie</span>
                </div>
                <p className="text-[#444444]">{vehicle.warranty}</p>
              </div>
{/* CTA contact + CTA financement */}
<div
  className="
    w-full
    flex
    flex-col
    gap-4
    sm:flex-row
    sm:gap-6
  "
>
  {/* Bouton primaire : rouge plein */}
  <Link
    to="/contact"
    state={{
      vehicle: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
    }}
    className="w-full sm:flex-1"
  >
    <Button
      size="lg"
      fullWidth
      className="
        w-full
        bg-[#D10000]
        text-white
        font-semibold
        tracking-wide
        rounded-xl
        shadow-md
        hover:bg-[#b30000]
        hover:shadow-xl
        hover:scale-105
        active:scale-100
        transition
        duration-200
        border-0
        py-4
        text-base
        flex
        items-center
        justify-center
        gap-3
        transform
      "
    >
      <MessageCircle className="w-6 h-6" />
      <span className="whitespace-nowrap">
        Demander des informations
      </span>
    </Button>
  </Link>

  {/* Bouton secondaire : contour rouge, fond blanc */}
  <Link
    to={financingLink}
    className="w-full sm:flex-1"
  >
    <Button
      size="lg"
      fullWidth
      variant="outline"
      className="
        w-full
        border-2
        border-[#D10000]
        text-[#D10000]
        font-semibold
        tracking-wide
        rounded-xl
        bg-white
        hover:bg-[#ffeaea]
        hover:text-[#b30000]
        hover:border-[#b30000]
        hover:shadow-md
        hover:scale-105
        active:scale-100
        transition
        duration-200
        py-4
        text-base
        flex
        items-center
        justify-center
        gap-3
        transform
      "
    >
      <Euro className="w-6 h-6" />
      <span className="whitespace-nowrap">
        Demander un financement
      </span>
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
