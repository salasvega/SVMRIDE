import { Link } from 'react-router-dom';
import { SEOHead } from '../components/layout/SEOHead';
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
      <SEOHead
        title="Plan du Site"
        description="Plan du site SVM Ride - Toutes les pages du site"
        path="/plan-du-site"
      />

      <Section background="gray" className="py-8">
        <Container>
          <h1 className="text-3xl md:text-4xl font-bold text-[#111111]">
            Plan du Site
          </h1>
        </Container>
      </Section>

      <Section background="white">
        <Container size="md">
          <div className="space-y-12">
            {siteStructure.map((section, index) => (
              <div key={index}>
                <h2 className="text-2xl font-bold text-[#111111] mb-6">{section.title}</h2>
                <ul className="space-y-3">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Link
                        to={link.href}
                        className="text-lg text-brand hover:underline flex items-center gap-2"
                      >
                        <span className="w-2 h-2 bg-brand rounded-full"></span>
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
