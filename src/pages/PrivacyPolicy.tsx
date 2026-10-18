import { SEOHead } from '../components/layout/SEOHead';
import { pageSeo } from '../config/seo';
import { Section } from '../components/ui/Section';
import { Container } from '../components/ui/Container';
import { siteConfig } from '../config/site';
import { useCoordonnees } from '../lib/coordonnees';

export function PrivacyPolicy() {
  const c = useCoordonnees(); // modifiables dans l'admin, onglet « Édition du site »
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
              <li>Informations et photos de votre véhicule (dans le cadre d'une reprise, d'un dépôt-vente ou d'une recherche)</li>
              <li>Messages et commentaires que vous nous envoyez</li>
              <li>
                Si vous nous confiez votre moto en dépôt-vente : adresse postale, type et numéro de pièce d'identité, documents
                du véhicule, état des lieux, et les éléments de preuve de la signature électronique du contrat (date et heure,
                adresse IP, navigateur, empreinte du document)
              </li>
            </ul>

            <h2 className="text-[22px] md:text-2xl mb-4 mt-8">Utilisation des données</h2>
            <p className="text-gris mb-4 leading-relaxed">
              Vos données personnelles sont utilisées pour:
            </p>
            <ul className="list-disc list-inside text-gris mb-6 space-y-2 ml-4">
              <li>Répondre à vos demandes d'information</li>
              <li>Traiter vos demandes de reprise de véhicule</li>
              <li>Étudier vos demandes de dépôt-vente et vous recontacter pour une estimation</li>
              <li>Exécuter le mandat de dépôt-vente (contrat, vente, paiement, démarches de carte grise, suivi en ligne de la vente) et tenir le registre légal des objets mobiliers</li>
              <li>Vous proposer des solutions de financement</li>
              <li>Effectuer des recherches personnalisées de véhicules</li>
              <li>Améliorer nos services</li>
            </ul>

            <h2 className="text-[22px] md:text-2xl mb-4 mt-8">Base légale du traitement</h2>
            <p className="text-gris mb-6 leading-relaxed">
              Le traitement de vos données repose sur votre consentement explicite que vous nous accordez lors de la soumission de nos formulaires. Vous pouvez retirer votre consentement à tout moment. Lorsque vous nous confiez votre moto en dépôt-vente, le traitement repose sur l'exécution du contrat et sur nos obligations légales (registre des objets mobiliers, comptabilité).
            </p>

            <h2 className="text-[22px] md:text-2xl mb-4 mt-8">Conservation des données</h2>
            <p className="text-gris mb-6 leading-relaxed">
              Vos données personnelles sont conservées pendant la durée nécessaire aux finalités pour lesquelles elles ont été collectées, puis supprimées ou archivées conformément aux obligations légales. Pour les demandes envoyées par nos formulaires (contact, reprise, recherche, demande de financement, dépôt-vente) :
            </p>
            <ul className="list-disc list-inside text-gris mb-6 space-y-2 ml-4">
              <li>les photos et pièces jointes sont supprimées 12 mois après votre demande ; pour une demande de dépôt-vente, de reprise ou de financement classée sans suite, elles sont supprimées 7 jours après ;</li>
              <li>la demande elle-même est supprimée 3 ans après son envoi, sauf si elle a donné lieu à un contrat (dépôt-vente, achat), qui suit alors ses propres durées légales ;</li>
              <li>un dossier de dépôt-vente (contrat signé, documents, preuves de signature) est conservé 5 ans après la fin du mandat, puis supprimé.</li>
            </ul>
            <p className="text-gris mb-6 leading-relaxed">
              Ces suppressions sont automatiques. Vos données sont hébergées dans l'Union européenne.
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
              Pour exercer ces droits, contactez-nous à: {c.email}
            </p>

            <h2 className="text-[22px] md:text-2xl mb-4 mt-8">Sécurité</h2>
            <p className="text-gris mb-6 leading-relaxed">
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles contre tout accès non autorisé, modification, divulgation ou destruction.
            </p>

            <h2 className="text-[22px] md:text-2xl mb-4 mt-8">Contact</h2>
            <p className="text-gris leading-relaxed">
              Pour toute question concernant cette politique de confidentialité, contactez-nous:<br />
              Email: {c.email}<br />
              Téléphone: {c.telephone}
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}
