import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { SEOHead } from '../components/layout/SEOHead';
import { Section } from '../components/ui/Section';
import { Container } from '../components/ui/Container';
import { Button } from '../components/ui/Button';

export function NotFound() {
  return (
    <>
      <SEOHead
        title="Page non trouvée"
        description="La page que vous recherchez n'existe pas"
        path="/404"
      />

      <Section background="white" className="py-24">
        <Container className="text-center">
          <AlertCircle className="w-20 h-20 text-[#D10000] mx-auto mb-6" aria-hidden="true" />
          <h1 className="text-6xl font-bold text-[#111111] mb-4">404</h1>
          <h2 className="text-2xl md:text-3xl font-bold text-[#111111] mb-4">
            Page non trouvée
          </h2>
          <p className="text-lg text-[#444444] mb-8 max-w-2xl mx-auto">
            La page que vous recherchez n'existe pas ou a été déplacée. Vérifiez l'URL ou retournez à l'accueil.
          </p>
          <Link to="/">
            <Button size="lg">Retour à l'accueil</Button>
          </Link>
        </Container>
      </Section>
    </>
  );
}
