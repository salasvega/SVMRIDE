import { SEOHead } from '../components/layout/SEOHead';
import { pageSeo } from '../config/seo';
import { Section } from '../components/ui/Section';
import { Container } from '../components/ui/Container';

export function CookiePolicy() {
  return (
    <>
      <SEOHead meta={pageSeo['/politique-cookies']} />

      <Section background="gray" className="!pt-8 !pb-8 md:!pt-12 md:!pb-10">
        <Container>
          <h1 className="filet-apres">
            Politique des Cookies
          </h1>
        </Container>
      </Section>

      <Section background="white">
        <Container size="md">
          <div className="prose max-w-none">
            <p className="text-gris mb-8 leading-relaxed">
              Dernière mise à jour: {new Date().toLocaleDateString('fr-FR')}
            </p>

            <h2 className="text-[22px] md:text-2xl mb-4">Qu'est-ce qu'un cookie ?</h2>
            <p className="text-gris mb-6 leading-relaxed">
              Un cookie est un petit fichier texte déposé sur votre ordinateur ou appareil mobile lors de votre visite sur notre site web. Les cookies permettent au site de fonctionner plus efficacement et de vous offrir une meilleure expérience utilisateur.
            </p>

            <h2 className="text-[22px] md:text-2xl mb-4 mt-8">Types de cookies utilisés</h2>

            <h3 className="text-lg md:text-xl font-semibold text-noir mb-3 mt-6">1. Cookies essentiels</h3>
            <p className="text-gris mb-6 leading-relaxed">
              Ces cookies sont nécessaires au fonctionnement du site et ne peuvent pas être désactivés. Ils incluent:
            </p>
            <ul className="list-disc list-inside text-gris mb-6 space-y-2 ml-4">
              <li>Cookies de consentement (enregistrent vos choix concernant les cookies)</li>
              <li>Cookies de session (maintiennent votre session active)</li>
              <li>Cookies de sécurité (protègent contre les activités frauduleuses)</li>
            </ul>

            <h3 className="text-lg md:text-xl font-semibold text-noir mb-3 mt-6">2. Cookies analytiques</h3>
            <p className="text-gris mb-6 leading-relaxed">
              Ces cookies nous aident à comprendre comment les visiteurs interagissent avec notre site en collectant et rapportant des informations de manière anonyme. Nous utilisons ces données pour améliorer le fonctionnement de notre site.
            </p>
            <ul className="list-disc list-inside text-gris mb-6 space-y-2 ml-4">
              <li>Pages visitées</li>
              <li>Temps passé sur le site</li>
              <li>Source du trafic</li>
              <li>Interactions avec le contenu</li>
            </ul>

            <h2 className="text-[22px] md:text-2xl mb-4 mt-8">Durée de conservation</h2>
            <p className="text-gris mb-4 leading-relaxed">
              La durée de conservation des cookies varie selon leur type:
            </p>
            <ul className="list-disc list-inside text-gris mb-6 space-y-2 ml-4">
              <li><strong>Cookies de session:</strong> supprimés à la fermeture du navigateur</li>
              <li><strong>Cookies de consentement:</strong> conservés 13 mois</li>
              <li><strong>Cookies analytiques:</strong> conservés 13 mois</li>
            </ul>

            <h2 className="text-[22px] md:text-2xl mb-4 mt-8">Gérer vos préférences</h2>
            <p className="text-gris mb-6 leading-relaxed">
              Vous pouvez à tout moment modifier vos préférences de cookies en cliquant sur le bandeau de cookies qui apparaît lors de votre première visite, ou en modifiant les paramètres de votre navigateur.
            </p>

            <h3 className="text-lg md:text-xl font-semibold text-noir mb-3 mt-6">Paramètres du navigateur</h3>
            <p className="text-gris mb-4 leading-relaxed">
              La plupart des navigateurs vous permettent de:
            </p>
            <ul className="list-disc list-inside text-gris mb-6 space-y-2 ml-4">
              <li>Voir les cookies stockés et les supprimer individuellement</li>
              <li>Bloquer les cookies tiers</li>
              <li>Bloquer tous les cookies</li>
              <li>Supprimer tous les cookies lors de la fermeture du navigateur</li>
            </ul>

            <p className="text-gris mb-6 leading-relaxed">
              Veuillez noter que si vous choisissez de bloquer tous les cookies, certaines fonctionnalités de notre site pourraient ne pas fonctionner correctement.
            </p>

            <h2 className="text-[22px] md:text-2xl mb-4 mt-8">Cookies tiers</h2>
            <p className="text-gris mb-6 leading-relaxed">
              Nous pouvons utiliser des services tiers (comme Google Analytics) qui placent leurs propres cookies sur votre appareil. Ces cookies sont régis par les politiques de confidentialité respectives de ces tiers.
            </p>

            <h2 className="text-[22px] md:text-2xl mb-4 mt-8">Modifications de cette politique</h2>
            <p className="text-gris mb-6 leading-relaxed">
              Nous pouvons mettre à jour cette politique de cookies périodiquement. Nous vous encourageons à consulter cette page régulièrement pour rester informé de la manière dont nous utilisons les cookies.
            </p>

            <h2 className="text-[22px] md:text-2xl mb-4 mt-8">Contact</h2>
            <p className="text-gris leading-relaxed">
              Pour toute question concernant notre utilisation des cookies, contactez-nous à l'adresse: contact@svmride.com
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}
