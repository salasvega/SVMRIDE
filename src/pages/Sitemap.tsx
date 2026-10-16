import { Link } from 'react-router-dom';
import { SEOHead } from '../components/layout/SEOHead';
import { pageSeo } from '../config/seo';
import { Section } from '../components/ui/Section';
import { Container } from '../components/ui/Container';

export function Sitemap() {
  const siteStructure = [
    {
      title: 'Pages principales',
      links: [
        { href: '/', label: 'Accueil' },
        { href: '/vehicules', label: 'Nos Véhicules' },
        { href: '/reprises', label: 'Reprise de véhicule' },
        { href: '/vendre-ma-moto', label: 'Vendre ma moto (dépôt-vente)' },
        { href: '/financement', label: 'Solutions de financement' },
        { href: '/recherche-personnalisee', label: 'Recherche personnalisée' },
        { href: '/contact', label: 'Contact' },
      ],
    },
    {
      title: 'Informations légales',
      links: [
        { href: '/mentions-legales', label: 'Mentions légales' },
        { href: '/politique-confidentialite', label: 'Politique de confidentialité' },
        { href: '/politique-cookies', label: 'Politique des cookies' },
        { href: '/plan-du-site', label: 'Plan du site' },
      ],
    },
  ];

  return (
    <>
      <SEOHead meta={pageSeo['/plan-du-site']} />

      <Section background="gray" className="!pt-8 !pb-8 md:!pt-12 md:!pb-10">
        <Container>
          <h1 className="filet-apres">
            Plan du Site
          </h1>
        </Container>
      </Section>

      <Section background="white">
        <Container size="md">
          <div className="space-y-12">
            {siteStructure.map((section, index) => (
              <div key={index}>
                <h2 className="text-[22px] md:text-2xl mb-6">{section.title}</h2>
                <ul className="space-y-3">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Link
                        to={link.href}
                        className="text-lg text-brand hover:underline flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 bg-or rounded-full" aria-hidden="true"></span>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
