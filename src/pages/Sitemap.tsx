import { Link } from 'react-router-dom';
import { SEOHead } from '../components/layout/SEOHead';
import { pageSeo } from '../config/seo';
import { Section } from '../components/ui/Section';
import { Container } from '../components/ui/Container';
import { useEquipe } from '../lib/equipe';
import { useTexte } from '../lib/textes';

export function Sitemap() {
  const t = useTexte();
  const equipe = useEquipe();
  const siteStructure = [
    {
      title: t('plan.principales.titre'),
      links: [
        { href: '/', label: t('plan.principales.accueil') },
        { href: '/vehicules', label: t('plan.principales.vehicules') },
        { href: '/reprises', label: t('plan.principales.reprises') },
        { href: '/vendre-ma-moto', label: t('plan.principales.depot_vente') },
        { href: '/financement', label: t('plan.principales.financement') },
        { href: '/recherche-personnalisee', label: t('plan.principales.recherche') },
        ...(equipe?.affichee ? [{ href: '/equipe', label: t('plan.principales.equipe') }] : []),
        { href: '/contact', label: t('plan.principales.contact') },
      ],
    },
    {
      title: t('plan.legales.titre'),
      links: [
        { href: '/mentions-legales', label: t('plan.legales.mentions') },
        { href: '/politique-confidentialite', label: t('plan.legales.confidentialite') },
        { href: '/politique-cookies', label: t('plan.legales.cookies') },
        { href: '/plan-du-site', label: t('plan.legales.plan') },
      ],
    },
  ];

  return (
    <>
      <SEOHead meta={pageSeo['/plan-du-site']} />

      <Section background="gray" className="!pt-8 !pb-8 md:!pt-12 md:!pb-10">
        <Container>
          <h1 className="filet-apres">
            {t('plan.titre')}
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
                        className="text-lg text-lien hover:underline flex items-center gap-2"
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
