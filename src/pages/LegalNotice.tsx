import { SEOHead } from '../components/layout/SEOHead';
import { pageSeo } from '../config/seo';
import { Section } from '../components/ui/Section';
import { Container } from '../components/ui/Container';
import { siteConfig } from '../config/site';

export function LegalNotice() {
  return (
    <>
      <SEOHead meta={pageSeo['/mentions-legales']} />

      <Section background="gray" className="!pt-8 !pb-8 md:!pt-12 md:!pb-10">
        <Container>
          <h1 className="filet-apres">
            Mentions Légales
          </h1>
        </Container>
      </Section>

      <Section background="white" className="pt-8">
        <Container size="md">
          <div className="prose max-w-none">
            <h2 className="text-[22px] md:text-2xl mb-4">Éditeur du site</h2>
            <p className="text-gris mb-6">
              <strong>{siteConfig.name}</strong><br />
              SIREN: 988004719<br />
              Siège social : {siteConfig.siegeSocial}<br />
              Showroom : {siteConfig.showrooms[0].fullAddress}<br />
              Email: {siteConfig.contact.email}<br />
              Téléphone: {siteConfig.contact.phone}
            </p>

            <h2 className="text-[22px] md:text-2xl mb-4 mt-8">Directeur de la publication</h2>
            <p className="text-gris mb-6">
              M. Mattia SARAVIA
            </p>
 
            <h2 className="text-[22px] md:text-2xl mb-4 mt-8">Conception du site</h2>
            <p className="text-gris mb-6">
              Salas Vega (AXSDESIGN) : salasvega@gmail.com
            </p>

            <h2 className="text-[22px] md:text-2xl mb-4 mt-8">Hébergement</h2>
            <p className="text-gris mb-6 leading-relaxed">
              <strong>Site web :</strong> Netlify, Inc., 101 2nd Street, Suite 575, San Francisco, CA 94105, États-Unis
              (netlify.com).
              <br />
              <strong>Base de données et fichiers :</strong> Supabase Pte. Ltd., 65 Chulia Street #38-02/03, OCBC Centre,
              Singapour 049513 (supabase.com). Données hébergées dans l'Union européenne (centre de données de Paris).
              <br />
              <strong>Nom de domaine et messagerie :</strong> OVH SAS, 2 rue Kellermann, 59100 Roubaix, France (ovhcloud.com).
            </p>

            <h2 className="text-[22px] md:text-2xl mb-4 mt-8">Propriété intellectuelle</h2>
            <p className="text-gris mb-6 leading-relaxed">
              L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.
            </p>

            <h2 className="text-[22px] md:text-2xl mb-4 mt-8">Données personnelles</h2>
            <p className="text-gris mb-6 leading-relaxed">
              Conformément à la loi « Informatique et Libertés » du 6 janvier 1978 modifiée et au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition aux données personnelles vous concernant. Pour exercer ce droit, veuillez nous contacter à l'adresse {siteConfig.contact.email}.
            </p>

            <h2 className="text-[22px] md:text-2xl mb-4 mt-8">Cookies</h2>
            <p className="text-gris mb-6 leading-relaxed">
              Le site utilise des cookies pour améliorer l'expérience utilisateur. Pour plus d'informations, consultez notre{' '}
              <a href="/politique-cookies" className="text-bleu underline underline-offset-2 hover:decoration-2">
                politique des cookies
              </a>
              .
            </p>

            <h2 className="text-[22px] md:text-2xl mb-4 mt-8">Limitation de responsabilité</h2>
            <p className="text-gris leading-relaxed">
              Les informations contenues sur ce site sont aussi précises que possibles et le site est périodiquement remis à jour, mais peut toutefois contenir des inexactitudes, des omissions ou des lacunes. Si vous constatez une lacune, erreur ou ce qui semble être un dysfonctionnement, merci de bien vouloir le signaler par email à {siteConfig.contact.email}.
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}
