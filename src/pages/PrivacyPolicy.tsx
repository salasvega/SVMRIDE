import { SEOHead } from '../components/layout/SEOHead';
import { pageSeo } from '../config/seo';
import { Section } from '../components/ui/Section';
import { Container } from '../components/ui/Container';
import { siteConfig } from '../config/site';

export function PrivacyPolicy() {
  return (
    <>
      <SEOHead meta={pageSeo['/politique-confidentialite']} />

      <Section background="gray" className="!pt-8 !pb-8 md:!pt-12 md:!pb-10">
        <Container>
          <h1 className="filet-apres">
            Politique de Confidentialité
          </h1>
        </Container>
      </Section>

      <Section background="white">
        <Container size="md">
          <div className="prose max-w-none">
            <p className="text-gris mb-8 leading-relaxed">
              Dernière mise à jour: {new Date().toLocaleDateString('fr-FR')}
            </p>

            <h2 className="text-[22px] md:text-2xl mb-4">Introduction</h2>
            <p className="text-gris mb-6 leading-relaxed">
              {siteConfig.name} s'engage à protéger la confidentialité de vos données personnelles. Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos informations personnelles conformément au Règlement Général sur la Protection des Données (RGPD).
            </p>

            <h2 className="text-[22px] md:text-2xl mb-4 mt-8">Données collectées</h2>
            <p className="text-gris mb-4 leading-relaxed">
              Nous collectons les données suivantes lorsque vous utilisez nos formulaires:
            </p>
            <ul className="list-disc list-inside text-gris mb-6 space-y-2 ml-4">
              <li>Nom et prénom</li>
              <li>Adresse email</li>
              <li>Numéro de téléphone</li>
              <li>Informations sur les véhicules (dans le cadre d'une reprise ou recherche)</li>
              <li>Messages et commentaires que vous nous envoyez</li>
            </ul>

            <h2 className="text-[22px] md:text-2xl mb-4 mt-8">Utilisation des données</h2>
            <p className="text-gris mb-4 leading-relaxed">
              Vos données personnelles sont utilisées pour:
            </p>
            <ul className="list-disc list-inside text-gris mb-6 space-y-2 ml-4">
              <li>Répondre à vos demandes d'information</li>
              <li>Traiter vos demandes de reprise de véhicule</li>
              <li>Vous proposer des solutions de financement</li>
              <li>Effectuer des recherches personnalisées de véhicules</li>
              <li>Améliorer nos services</li>
            </ul>

            <h2 className="text-[22px] md:text-2xl mb-4 mt-8">Base légale du traitement</h2>
            <p className="text-gris mb-6 leading-relaxed">
              Le traitement de vos données repose sur votre consentement explicite que vous nous accordez lors de la soumission de nos formulaires. Vous pouvez retirer votre consentement à tout moment.
            </p>

            <h2 className="text-[22px] md:text-2xl mb-4 mt-8">Conservation des données</h2>
            <p className="text-gris mb-6 leading-relaxed">
              Vos données personnelles sont conservées pendant la durée nécessaire aux finalités pour lesquelles elles ont été collectées, puis archivées conformément aux obligations légales.
            </p>

            <h2 className="text-[22px] md:text-2xl mb-4 mt-8">Partage des données</h2>
            <p className="text-gris mb-6 leading-relaxed">
              Nous ne vendons ni ne louons vos données personnelles à des tiers. Vos données peuvent être partagées avec nos partenaires de financement uniquement dans le cadre d'une demande explicite de votre part.
            </p>

            <h2 className="text-[22px] md:text-2xl mb-4 mt-8">Vos droits</h2>
            <p className="text-gris mb-4 leading-relaxed">
              Conformément au RGPD, vous disposez des droits suivants:
            </p>
            <ul className="list-disc list-inside text-gris mb-6 space-y-2 ml-4">
              <li><strong>Droit d'accès:</strong> vous pouvez demander une copie de vos données</li>
              <li><strong>Droit de rectification:</strong> vous pouvez corriger vos données inexactes</li>
              <li><strong>Droit à l'effacement:</strong> vous pouvez demander la suppression de vos données</li>
              <li><strong>Droit d'opposition:</strong> vous pouvez vous opposer au traitement de vos données</li>
              <li><strong>Droit à la portabilité:</strong> vous pouvez récupérer vos données dans un format structuré</li>
            </ul>

            <p className="text-gris mb-6 leading-relaxed">
              Pour exercer ces droits, contactez-nous à: {siteConfig.contact.email}
            </p>

            <h2 className="text-[22px] md:text-2xl mb-4 mt-8">Sécurité</h2>
            <p className="text-gris mb-6 leading-relaxed">
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles contre tout accès non autorisé, modification, divulgation ou destruction.
            </p>

            <h2 className="text-[22px] md:text-2xl mb-4 mt-8">Contact</h2>
            <p className="text-gris leading-relaxed">
              Pour toute question concernant cette politique de confidentialité, contactez-nous:<br />
              Email: {siteConfig.contact.email}<br />
              Téléphone: {siteConfig.contact.phone}
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}
