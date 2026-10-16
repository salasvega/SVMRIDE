import { Link } from 'react-router-dom';
import { CheckCircle, Shield, Clock, Award, Star, Users } from 'lucide-react';
import { SEOHead } from '../components/layout/SEOHead';
import { Section } from '../components/ui/Section';
import { Container } from '../components/ui/Container';
import { Button } from '../components/ui/Button';
import { IconeOr } from '../components/ui/IconeOr';
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

      <Section background="dark" className="relative !py-0 overflow-hidden">
        {/* Mobile et tablette : cadrage sur les motos. Ordinateur : photo large
            avec le panneau SVM RIDE, rognée sous les roues et calée en bas à gauche. */}
        <div
          className="absolute inset-0 bg-cover bg-[url('/accueil-showroom.webp')] bg-[position:50%_40%] lg:bg-[url('/accueil-showroom-logo.webp')] lg:bg-[position:0%_100%]"
          aria-hidden="true"
        />
        {/* Voile sombre pour la lisibilité du titre ; sur ordinateur, allégé en
            haut pour laisser ressortir le panneau SVM RIDE (bas inchangé). */}
        <div
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,14,16,.35),rgba(14,14,16,.88))] lg:bg-[linear-gradient(180deg,rgba(14,14,16,.08)_0%,rgba(14,14,16,.30)_38%,rgba(14,14,16,.88)_100%)]"
          aria-hidden="true"
        />
        <Container className="relative z-10 flex flex-col justify-end min-h-[440px] md:min-h-[520px] lg:min-h-[clamp(420px,26vw,540px)] py-14 md:py-20 lg:py-12">
          <div className="max-w-3xl">
            <span className="filet-or mb-5" aria-hidden="true" />
            <h1 className="titre-hero mb-4 md:mb-5 drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
              Bienvenue chez SVM Ride
            </h1>
            <p className="text-[17px] md:text-xl text-[#E8E8E8] mb-8 leading-relaxed">
              Votre spécialiste du deux-roues basé en Île-de-France.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/vehicules" tabIndex={-1}>
                <Button size="lg" fullWidth className="sm:w-auto">Voir nos véhicules</Button>
              </Link>
              <Link to="/contact" tabIndex={-1}>
                <Button size="lg" variant="secondary" fullWidth className="sm:w-auto">Nous contacter</Button>
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      <Section background="gray">
        <Container>
          <div className="text-center mb-10 md:mb-12">
            <h2 className="titre-section filet-apres mb-5">
              Vente de véhicules d'occasion
            </h2>
            <p className="text-base md:text-lg text-gris max-w-2xl mx-auto">
              Découvrez notre sélection de motos et scooters d'occasion de qualité
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
              <div
                key={index}
                className="carte p-6 md:p-7 flex gap-4 sm:flex-col sm:gap-0 transition-[box-shadow,transform] duration-180 hover:-translate-y-0.5 hover:shadow-vehicule"
              >
                <div className="flex-shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-fond border border-bordure sm:mb-5">
                  <IconeOr icon={feature.icon} />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-noir mb-1.5">{feature.title}</h3>
                  <p className="text-sm text-gris leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section background="dark">
        <Container>
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            <div>
              <h2 className="titre-section filet-avant mb-5">
                Reprise de votre véhicule
              </h2>
              <p className="text-base md:text-lg text-[#D6D6D6] mb-8 leading-relaxed">
                Faites reprendre votre deux-roues rapidement et au meilleur prix. Notre équipe vous propose une expertise rapide, une offre attractive, un virement immédiat et des démarches simplifiées.
              </p>
              <Link to="/reprises" tabIndex={-1}>
                <Button>Demande de reprise</Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:p-6">
                <IconeOr icon={Clock} className="w-7 h-7 mb-3" />
                <h3 className="font-semibold text-white mb-1.5 text-[15px] md:text-base">Expertise rapide</h3>
                <p className="text-sm text-[#BDBDBD]">Évaluation en moins de 24h</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:p-6">
                <IconeOr icon={Award} className="w-7 h-7 mb-3" />
                <h3 className="font-semibold text-white mb-1.5 text-[15px] md:text-base">Offre attractive</h3>
                <p className="text-sm text-[#BDBDBD]">Prix juste et compétitif</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:p-6">
                <IconeOr icon={CheckCircle} className="w-7 h-7 mb-3" />
                <h3 className="font-semibold text-white mb-1.5 text-[15px] md:text-base">Virement immédiat</h3>
                <p className="text-sm text-[#BDBDBD]">Paiement sécurisé rapide</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:p-6">
                <IconeOr icon={Shield} className="w-7 h-7 mb-3" />
                <h3 className="font-semibold text-white mb-1.5 text-[15px] md:text-base">Sans contrainte</h3>
                <p className="text-sm text-[#BDBDBD]">Démarches simplifiées</p>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section background="white">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="flex flex-col bg-fond border border-bordure rounded-2xl p-6 md:p-8 transition-[box-shadow,transform] duration-180 hover:-translate-y-0.5 hover:shadow-vehicule">
              <h3 className="titre-display text-[22px] md:text-2xl mb-3">Personnalisation</h3>
              <p className="text-gris mb-6 leading-relaxed flex-1">
                Transformez votre deux-roues selon vos envies. Échappements, kits esthétiques, selles confort et bien plus encore.
              </p>
              <Link to="/contact" className="lien self-start">
                En savoir plus →
              </Link>
            </div>

            <div className="flex flex-col bg-fond border border-bordure rounded-2xl p-6 md:p-8 transition-[box-shadow,transform] duration-180 hover:-translate-y-0.5 hover:shadow-vehicule">
              <h3 className="titre-display text-[22px] md:text-2xl mb-3">Accessoires</h3>
              <p className="text-gris mb-6 leading-relaxed flex-1">
                Large gamme d'accessoires et d'équipements pour votre sécurité et votre confort. Casques, gants, bagagerie et plus.
              </p>
              <Link to="/contact" className="lien self-start">
                En savoir plus →
              </Link>
            </div>

            <div className="flex flex-col bg-fond border border-bordure rounded-2xl p-6 md:p-8 transition-[box-shadow,transform] duration-180 hover:-translate-y-0.5 hover:shadow-vehicule">
              <h3 className="titre-display text-[22px] md:text-2xl mb-3">Entretien & Réparation</h3>
              <p className="text-gris mb-6 leading-relaxed flex-1">
                Service d'entretien et de réparation pour tous types de deux-roues. Prenez rendez-vous en ligne facilement.
              </p>
              <Link to="/contact" className="lien self-start">
                Prendre rendez-vous →
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      <Section background="gray">
        <Container>
          <div className="text-center mb-10 md:mb-12">
            <h2 className="titre-section filet-apres">
              Pourquoi nous choisir ?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-[72px] h-[72px] bg-white rounded-full mb-5 border border-or/50 shadow-carte">
                <IconeOr icon={Star} className="w-8 h-8" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-noir mb-2">Expertise & Passion</h3>
              <p className="text-gris leading-relaxed max-w-xs mx-auto">
                Une équipe de passionnés à votre service, avec des années d'expérience dans le deux-roues.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-[72px] h-[72px] bg-white rounded-full mb-5 border border-or/50 shadow-carte">
                <IconeOr icon={Shield} className="w-8 h-8" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-noir mb-2">Qualité & Fiabilité</h3>
              <p className="text-gris leading-relaxed max-w-xs mx-auto">
                Des véhicules soigneusement sélectionnés et vérifiés pour votre tranquillité d'esprit.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-[72px] h-[72px] bg-white rounded-full mb-5 border border-or/50 shadow-carte">
                <IconeOr icon={Users} className="w-8 h-8" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-noir mb-2">Satisfaction Client</h3>
              <p className="text-gris leading-relaxed max-w-xs mx-auto">
                Votre satisfaction est notre priorité. Service personnalisé et suivi après-vente.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <Section background="dark">
        <Container className="text-center">
          <h2 className="titre-section filet-avant mb-5">Prêt à trouver votre deux-roues ?</h2>
          <p className="text-base md:text-xl text-[#D6D6D6] mb-8 max-w-2xl mx-auto">
            Contactez-nous dès maintenant pour discuter de votre projet ou visiter notre showroom.
          </p>
          <Link to="/contact" tabIndex={-1}>
            <Button size="lg">Nous contacter</Button>
          </Link>
        </Container>
      </Section>
    </>
  );
}
