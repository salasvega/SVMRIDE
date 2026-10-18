/**
 * Page /equipe : « Rencontrez l'équipe SVM Ride ».
 * Fiches gérées dans l'admin (onglet Équipe), lues par src/lib/equipe.ts. Sur
 * svmride.com, la page n'existe pas (404) si EQUIPE_EN_LIGNE vaut false.
 */
import { Link } from 'react-router-dom';
import { Quote } from 'lucide-react';
import { SEOHead } from '../components/layout/SEOHead';
import { pageSeo } from '../config/seo';
import { equipeAffichee, nomAffiche } from '../config/equipe';
import { EyeOff } from 'lucide-react';
import { useEquipe, useEstAdmin } from '../lib/equipe';
import { CONTEXTE_SITE } from '../lib/contexte';
import { Section } from '../components/ui/Section';
import { Container } from '../components/ui/Container';
import { Button } from '../components/ui/Button';
import { Portrait } from '../components/equipe/Portrait';
import { NotFound } from './NotFound';
import { useTexte } from '../lib/textes';
import { Masquable } from '../components/ui/Masquable';

export function Equipe() {
  const t = useTexte();
  const equipe = useEquipe();
  const masquee = equipe !== null && !equipe.affichee;
  // Page masquée depuis l'admin : 404 pour le public, aperçu pour les administrateurs
  const admin = useEstAdmin(masquee);
  if (!equipeAffichee(CONTEXTE_SITE)) return <NotFound />;
  if (masquee && admin === false) return <NotFound />;
  const membres = masquee && admin === null ? null : equipe?.membres ?? null;

  const responsable = membres?.find((m) => m.responsable);
  const collaborateurs = membres?.filter((m) => !m.responsable) ?? [];

  return (
    <>
      <SEOHead meta={pageSeo['/equipe']} />

      <Section background="gray" className="!pt-8 md:!pt-12 !pb-10 md:!pb-14">
        <Container>
          {masquee && admin && (
            <p className="mb-6 flex items-start gap-2.5 rounded-xl border border-or/50 bg-or-voile px-4 py-3 text-sm text-noir" role="note">
              <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-or-texte" aria-hidden="true" />
              <span>
                <strong className="font-semibold">Aperçu administrateur :</strong> l'équipe est masquée sur le site (onglet Équipe de
                l'admin). Les visiteurs ne voient ni cette page, ni la section de l'accueil.
              </span>
            </p>
          )}
          <h1 className="filet-apres mb-5">{t('equipe.titre')}</h1>
          <p className="max-w-3xl text-base md:text-lg text-gris leading-relaxed">
            {t('equipe.intro')}
          </p>
        </Container>
      </Section>

      {membres === null && (
        <Section zone="equipe" background="white" className="!py-10 md:!py-14">
          <Container>
            <div className="h-[380px] animate-pulse rounded-2xl bg-fond motion-reduce:animate-none" aria-label="Chargement de l'équipe" role="status" />
          </Container>
        </Section>
      )}

      {responsable && (
        <Section zone="equipe" background="white" className="!py-10 md:!py-14">
          <Container>
            <article
              className="sur-sombre relative overflow-hidden rounded-2xl bg-noir-profond text-inverse shadow-vehicule"
              aria-labelledby="equipe-responsable"
            >
              <div className="liseret-or" aria-hidden="true" />
              <div className="grid gap-8 p-6 md:grid-cols-[auto,1fr] md:gap-10 md:p-10 lg:p-12">
                <div className="flex flex-col items-center text-center md:w-[220px]">
                  <Portrait membre={responsable} taille={180} anneauOr surSombre decoratif={false} chargement="eager" />
                  <h2 id="equipe-responsable" className="titre-display mt-6 text-[34px] leading-none">
                    {nomAffiche(responsable)}
                  </h2>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-or-clair">
                    {responsable.fonction}
                  </p>
                </div>

                <div className="flex flex-col justify-center md:border-l md:border-inverse/15 md:pl-10">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-inverse-74">
                    {t('equipe.responsable.surtitre')}
                  </p>
                  <div className="space-y-4 text-base md:text-[17px] leading-relaxed text-inverse-88">
                    {responsable.presentation?.map((p, i) => <p key={i}>{p}</p>)}
                  </div>
                  {responsable.citation && (
                    <blockquote className="mt-8 flex gap-3 border-t border-inverse/10 pt-6">
                      <Quote className="h-6 w-6 shrink-0 text-or-clair" aria-hidden="true" />
                      <p className="titre-display text-[20px] md:text-[22px] leading-snug tracking-[0.02em] text-inverse">
                        « {responsable.citation} »
                      </p>
                    </blockquote>
                  )}
                </div>
              </div>
            </article>
          </Container>
        </Section>
      )}

      {collaborateurs.length > 0 && (
        <Masquable id="equipe.collaborateurs">
          <Section zone="equipe" background="white" className="!pt-0 !pb-12 md:!pb-16">
            <Container>
              <h2 className="titre-section filet-apres mb-8">{t('equipe.collaborateurs.titre')}</h2>
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
                {collaborateurs.map((m) => (
                  <li key={m.id}>
                    <article className="carte flex h-full flex-col items-center px-6 pb-7 pt-8 text-center transition-[box-shadow,transform] duration-180 hover:-translate-y-1 hover:shadow-vehicule motion-reduce:hover:translate-y-0">
                      <Portrait membre={m} taille={128} decoratif={false} />
                      <h3 className="mt-5 text-xl font-semibold text-noir">
                        {nomAffiche(m)}
                      </h3>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-or-texte">{m.fonction}</p>
                      {m.citation && (
                        <p className="mt-4 border-t border-bordure pt-4 text-[15px] italic leading-relaxed text-gris">
                          « {m.citation} »
                        </p>
                      )}
                    </article>
                  </li>
                ))}
              </ul>
            </Container>
          </Section>
        </Masquable>
      )}

      <Masquable id="equipe.final">
        <Section background="dark" className="!py-12 md:!py-16">
          <Container className="text-center">
            <h2 className="titre-section filet-avant mb-5">{t('equipe.final.titre')}</h2>
            <p className="mx-auto mb-8 max-w-2xl text-base md:text-lg text-inverse-84">
              {t('equipe.final.texte')}
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/contact" tabIndex={-1}>
                <Button size="lg" fullWidth className="sm:w-auto">{t('equipe.final.bouton1')}</Button>
              </Link>
              <Link to="/vehicules" tabIndex={-1}>
                <Button size="lg" variant="secondary" fullWidth className="sm:w-auto">{t('equipe.final.bouton2')}</Button>
              </Link>
            </div>
          </Container>
        </Section>
      </Masquable>
    </>
  );
}
