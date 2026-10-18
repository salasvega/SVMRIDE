import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { SEOHead } from '../components/layout/SEOHead';
import { notFoundSeo } from '../config/seo';
import { Section } from '../components/ui/Section';
import { Container } from '../components/ui/Container';
import { Button } from '../components/ui/Button';
import { IconeOr } from '../components/ui/IconeOr';
import { useTexte } from '../lib/textes';

export function NotFound() {
  const t = useTexte();
  return (
    <>
      <SEOHead meta={notFoundSeo} />

      <Section background="white" className="py-24">
        <Container className="text-center">
          <IconeOr icon={AlertCircle} className="w-16 h-16 mx-auto mb-6" />
          <h1 className="!text-[88px] md:!text-[120px] !leading-none mb-4 bg-degrade-or bg-clip-text !text-transparent">404</h1>
          <h2 className="text-[26px] md:text-3xl filet-apres mb-6">
            {t('introuvable.titre')}
          </h2>
          <p className="text-lg text-gris mb-8 max-w-2xl mx-auto">
            {t('introuvable.texte')}
          </p>
          <Link to="/">
            <Button size="lg">{t('introuvable.bouton')}</Button>
          </Link>
        </Container>
      </Section>
    </>
  );
}
