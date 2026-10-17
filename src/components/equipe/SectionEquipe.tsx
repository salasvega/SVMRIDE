/**
 * Accueil : « Des passionnés à votre service ».
 * Mattia mis en avant (carte noir et or, comme sur la page Contact) + photo de
 * groupe d'Amanda, Pedro et Valentin au showroom (17/10/2026), leurs prénoms et
 * fonctions posés en texte sur la photo (lisibles, traduisibles, corrigeables dans
 * src/config/equipe.ts) + lien vers /equipe, qui présente chacun en détail.
 * Rien ne s'affiche sur svmride.com tant que EQUIPE_EN_LIGNE vaut false.
 */
import { Link } from 'react-router-dom';
import { contenuProvisoire, membresAffiches } from '../../config/equipe';
import { CONTEXTE_SITE } from '../../lib/contexte';
import { Section } from '../ui/Section';
import { Container } from '../ui/Container';
import { Button } from '../ui/Button';
import { Portrait } from './Portrait';
import { BandeauApercu } from './BandeauApercu';

export function SectionEquipe() {
  const membres = membresAffiches(CONTEXTE_SITE);
  const responsable = membres.find((m) => m.responsable);
  const apercu = membres.filter((m) => !m.responsable).slice(0, 3);
  if (!responsable && apercu.length === 0) return null;

  return (
    <Section background="white">
      <Container>
        {contenuProvisoire(membres) && <BandeauApercu className="mb-8" />}

        <div className="text-center mb-10 md:mb-12">
          <h2 className="titre-section filet-apres mb-5">Des passionnés à votre service</h2>
          <p className="text-base md:text-lg text-gris max-w-2xl mx-auto leading-relaxed">
            Derrière chaque moto, il y a une équipe de passionnés à votre écoute pour vous conseiller et vous
            accompagner dans votre projet.
          </p>
        </div>

        <div className="grid gap-5 md:gap-6 lg:grid-cols-12 lg:items-stretch">
          {responsable && (
            <article className="sur-sombre relative overflow-hidden rounded-2xl bg-noir-profond text-white shadow-vehicule lg:col-span-5">
              <div className="liseret-or" aria-hidden="true" />
              <div className="flex h-full flex-col items-center p-6 text-center sm:flex-row sm:items-start sm:gap-6 sm:text-left md:p-8 lg:flex-col lg:items-center lg:text-center">
                <Portrait membre={responsable} taille={132} anneauOr surSombre />
                <div className="mt-5 sm:mt-1 lg:mt-6">
                  <h3 className="titre-display text-[30px] leading-none">{responsable.prenom}</h3>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-or-clair">
                    {responsable.fonction}
                  </p>
                  {responsable.presentation?.[0] && (
                    <p className="mt-4 text-[15px] leading-relaxed text-[#D6D6D6]">{responsable.presentation[0]}</p>
                  )}
                </div>
              </div>
            </article>
          )}

          {apercu.length > 0 && (
            <figure className="relative overflow-hidden rounded-2xl bg-noir-profond shadow-vehicule lg:col-span-7">
              <picture>
                <source type="image/avif" srcSet="/equipe/equipe-accueil-960.avif 960w, /equipe/equipe-accueil.avif 1536w" sizes="(min-width: 1024px) 58vw, 100vw" />
                <source type="image/webp" srcSet="/equipe/equipe-accueil-960.webp 960w, /equipe/equipe-accueil.webp 1536w" sizes="(min-width: 1024px) 58vw, 100vw" />
                <img
                  src="/equipe/equipe-accueil-960.jpg"
                  srcSet="/equipe/equipe-accueil-960.jpg 960w, /equipe/equipe-accueil.jpg 1536w"
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  width={1536}
                  height={826}
                  loading="lazy"
                  decoding="async"
                  alt={`${apercu.map((m) => m.prenom).join(', ').replace(/, ([^,]*)$/, ' et $1')}, de l'équipe SVM Ride, au showroom de Chaville`}
                  className="block h-auto w-full lg:h-full lg:object-cover lg:object-[50%_35%]"
                />
              </picture>
              {/* Prénoms et fonctions sous chaque personne, sur un dégradé pour rester lisibles */}
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-3 pb-3 pt-14 sm:px-6 sm:pb-5 sm:pt-20">
                <ul className="grid grid-cols-3 gap-2 sm:gap-4">
                  {apercu.map((m) => (
                    <li key={m.id} className="min-w-0">
                      <p className="font-semibold leading-tight text-white text-[15px] sm:text-xl">{m.prenom}</p>
                      <p className="mt-0.5 text-[11px] leading-snug text-[#E0E0E0] sm:mt-1 sm:text-sm">{m.fonction}</p>
                      <span className="mt-2 block h-0.5 w-6 bg-or sm:w-8" aria-hidden="true" />
                    </li>
                  ))}
                </ul>
              </figcaption>
            </figure>
          )}
        </div>

        <div className="mt-10 text-center">
          <Link to="/equipe" tabIndex={-1}>
            <Button size="lg">Découvrir notre équipe</Button>
          </Link>
        </div>
      </Container>
    </Section>
  );
}
