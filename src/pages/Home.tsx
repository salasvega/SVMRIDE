import { Link } from 'react-router-dom';
import { CheckCircle, Shield, Clock, Award, Star, Users } from 'lucide-react';
import { SEOHead } from '../components/layout/SEOHead';
import { Section } from '../components/ui/Section';
import { Container } from '../components/ui/Container';
import { Button } from '../components/ui/Button';
import { siteConfig } from '../config/site';

export function Home() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.baseUrl,
    logo: `${siteConfig.baseUrl}/logo.png`,
    description: siteConfig.description,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: siteConfig.contact.phone,
      contactType: 'Customer Service',
      email: siteConfig.contact.email,
    },
    sameAs: [siteConfig.contact.instagramUrl],
  };

  return (
    <>
      <SEOHead
        title={siteConfig.name}
        description={siteConfig.description}
        path="/"
        schema={schema}
      />

      <Section className="relative bg-gradient-to-br from-[#111111] via-[#1a1a1a] to-[#111111] text-white py-24 md:py-32 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-[position:50%_40%] opacity-90"
          style={{ backgroundImage: 'url(/accueil-showroom.webp)' }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#111111]/50 via-[#111111]/30 to-[#111111]/70" aria-hidden="true" />
        <Container className="relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight drop-shadow-lg">
              Bienvenue chez SVM Ride
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed drop-shadow-md">
              Votre spécialiste du deux-roues basé en Île-de-France.
            </p>
            <Link to="/vehicules">
              <Button size="lg" variant="light">Voir nos véhicules</Button>
            </Link>
          </div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#111111] mb-4">
              Vente de véhicules d'occasion
            </h2>
            <p className="text-lg text-[#444444] max-w-2xl mx-auto">
              Découvrez notre sélection de motos et scooters d'occasion de qualité
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Shield,
                title: 'Sélection vérifiée',
                description: 'Chaque véhicule est rigoureusement contrôlé et garanti',
              },
              {
                icon: Users,
                title: 'Accompagnement',
                description: 'Conseils personnalisés pour trouver le deux-roues idéal',
              },
              {
                icon: Award,
                title: 'Financement',
                description: 'Solutions de financement adaptées à votre budget',
              },
              {
                icon: CheckCircle,
                title: 'Démarches simplifiées',
                description: 'Nous gérons toute la paperasse pour vous',
              },
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#F9F9F9] rounded-xl mb-4">
                  <feature.icon className="w-8 h-8 text-brand" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-[#111111] mb-2">{feature.title}</h3>
                <p className="text-sm text-[#444444] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section background="gray">
        <Container>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#111111] mb-6">
                Reprise de votre véhicule
              </h2>
              <p className="text-lg text-[#444444] mb-6 leading-relaxed">
                Faites reprendre votre deux-roues rapidement et au meilleur prix. Notre équipe vous propose une expertise rapide, une offre attractive, un virement immédiat et des démarches simplifiées.
              </p>
              <Link to="/reprises">
                <Button variant="outline">Demande de reprise</Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <Clock className="w-8 h-8 text-brand mb-3" aria-hidden="true" />
                <h3 className="font-semibold text-[#111111] mb-2">Expertise rapide</h3>
                <p className="text-sm text-[#444444]">Évaluation en moins de 24h</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <Award className="w-8 h-8 text-brand mb-3" aria-hidden="true" />
                <h3 className="font-semibold text-[#111111] mb-2">Offre attractive</h3>
                <p className="text-sm text-[#444444]">Prix juste et compétitif</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <CheckCircle className="w-8 h-8 text-brand mb-3" aria-hidden="true" />
                <h3 className="font-semibold text-[#111111] mb-2">Virement immédiat</h3>
                <p className="text-sm text-[#444444]">Paiement sécurisé rapide</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <Shield className="w-8 h-8 text-brand mb-3" aria-hidden="true" />
                <h3 className="font-semibold text-[#111111] mb-2">Sans contrainte</h3>
                <p className="text-sm text-[#444444]">Démarches simplifiées</p>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#F9F9F9] p-8 rounded-xl hover:shadow-lg transition-shadow">
              <h3 className="text-2xl font-bold text-[#111111] mb-4">Personnalisation</h3>
              <p className="text-[#444444] mb-6 leading-relaxed">
                Transformez votre deux-roues selon vos envies. Échappements, kits esthétiques, selles confort et bien plus encore.
              </p>
              <Link to="/contact" className="text-brand font-semibold hover:underline">
                En savoir plus →
              </Link>
            </div>

            <div className="bg-[#F9F9F9] p-8 rounded-xl hover:shadow-lg transition-shadow">
              <h3 className="text-2xl font-bold text-[#111111] mb-4">Accessoires</h3>
              <p className="text-[#444444] mb-6 leading-relaxed">
                Large gamme d'accessoires et d'équipements pour votre sécurité et votre confort. Casques, gants, bagagerie et plus.
              </p>
              <Link to="/contact" className="text-brand font-semibold hover:underline">
                En savoir plus →
              </Link>
            </div>

            <div className="bg-[#F9F9F9] p-8 rounded-xl hover:shadow-lg transition-shadow">
              <h3 className="text-2xl font-bold text-[#111111] mb-4">Entretien & Réparation</h3>
              <p className="text-[#444444] mb-6 leading-relaxed">
                Service d'entretien et de réparation pour tous types de deux-roues. Prenez rendez-vous en ligne facilement.
              </p>
              <Link to="/contact" className="text-brand font-semibold hover:underline">
                Prendre rendez-vous →
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      <Section background="gray">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#111111] mb-4">
              Pourquoi nous choisir ?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-6 shadow-md">
                <Star className="w-10 h-10 text-brand" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold text-[#111111] mb-3">Expertise & Passion</h3>
              <p className="text-[#444444] leading-relaxed">
                Une équipe de passionnés à votre service, avec des années d'expérience dans le deux-roues.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-6 shadow-md">
                <Shield className="w-10 h-10 text-brand" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold text-[#111111] mb-3">Qualité & Fiabilité</h3>
              <p className="text-[#444444] leading-relaxed">
                Des véhicules soigneusement sélectionnés et vérifiés pour votre tranquillité d'esprit.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-6 shadow-md">
                <Users className="w-10 h-10 text-brand" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold text-[#111111] mb-3">Satisfaction Client</h3>
              <p className="text-[#444444] leading-relaxed">
                Votre satisfaction est notre priorité. Service personnalisé et suivi après-vente.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <Section background="dark">
        <Container className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Prêt à trouver votre deux-roues ?</h2>
          <p className="text-xl text-[#AAAAAA] mb-8 max-w-2xl mx-auto">
            Contactez-nous dès maintenant pour discuter de votre projet ou visiter notre showroom.
          </p>
          <Link to="/contact">
            <Button size="lg" variant="light">Nous contacter</Button>
          </Link>
        </Container>
      </Section>
    </>
  );
}
