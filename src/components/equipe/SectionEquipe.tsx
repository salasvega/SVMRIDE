/**
 * Accueil : « Des passionnés à votre service ».
 * Mattia mis en avant (carte noir et or, comme sur la page Contact) + aperçu de
 * trois collaborateurs + lien vers /equipe. Données : src/config/equipe.ts.
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
            <ul className="grid gap-4 sm:grid-cols-3 md:gap-5 lg:col-span-7" aria-label="Une partie de l'équipe">
              {apercu.map((m) => (
                <li key={m.id}>
                  <div className="carte flex h-full items-center gap-4 p-4 transition-[box-shadow,transform] duration-180 hover:-translate-y-0.5 hover:shadow-vehicule motion-reduce:hover:translate-y-0 sm:flex-col sm:justify-center sm:gap-0 sm:p-6 sm:text-center">
                    <Portrait membre={m} taille={112} className="sm:mb-4 max-sm:!h-16 max-sm:!w-16" />
                    <div>
                      <p className="text-lg font-semibold text-noir">{m.prenom}</p>
                      <p className="mt-0.5 text-sm text-gris sm:min-h-[2.5rem]">{m.fonction}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
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
