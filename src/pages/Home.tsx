import { Link } from 'react-router-dom';
import { SEOHead } from '../components/layout/SEOHead';
import { pageSeo } from '../config/seo';
import { Section } from '../components/ui/Section';
import { Container } from '../components/ui/Container';
import { Button } from '../components/ui/Button';
import { IconeOr } from '../components/ui/IconeOr';
import { colonnes, useListe } from '../lib/listes';
import { Masquable } from '../components/ui/Masquable';
import { DerniersArrivages } from '../components/DerniersArrivages';
import { ExplorezLesMarques } from '../components/ExplorezLesMarques';
import { SectionEquipe } from '../components/equipe/SectionEquipe';
import { SectionAvisGoogle } from '../components/avis/SectionAvisGoogle';
import { useTexte } from '../lib/textes';
import { useFondAccueil } from '../lib/medias';
import { FOND_ACCUEIL_ORIGINE } from '../config/medias';
import type { CSSProperties } from 'react';

export function Home() {
  const t = useTexte();
  const fond = useFondAccueil();
  // Listes modulables (admin, « Textes du site ») : éléments et ordre
  const vente = useListe('accueil.vente');
  const reprise = useListe('accueil.reprise');
  const services = useListe('accueil.services');
  const pourquoi = useListe('accueil.pourquoi');
  const styleFond = {
    '--fond-mobile': `url('${fond?.mobile ?? FOND_ACCUEIL_ORIGINE.mobile}')`,
    '--fond-ordinateur': `url('${fond?.ordinateur ?? FOND_ACCUEIL_ORIGINE.ordinateur}')`,
    '--position-mobile': fond ? '50% 50%' : '50% 40%',
    '--position-ordinateur': fond ? '50% 50%' : '0% 100%',
  } as CSSProperties;
  return (
    <>
      <SEOHead meta={pageSeo['/']} />

      <Section zone="hero" background="dark" className="relative !py-0 overflow-hidden">
        {/* Mobile et tablette : cadrage sur les motos. Ordinateur : photo large
            avec le panneau SVM RIDE, rognée sous les roues et calée en bas à gauche.
            Image choisie dans l'admin (Édition du site) : cadrée pour chaque format, centrée. */}
        <div
          className="absolute inset-0 bg-cover bg-[image:var(--fond-mobile)] bg-[position:var(--position-mobile)] lg:bg-[image:var(--fond-ordinateur)] lg:bg-[position:var(--position-ordinateur)]"
          style={styleFond}
          aria-hidden="true"
        />
        {/* Voile sombre pour la lisibilité du titre ; sur ordinateur, allégé en
            haut pour laisser ressortir le panneau SVM RIDE (bas inchangé). */}
        <div
          className="absolute inset-0 bg-[linear-gradient(180deg,rgb(var(--noir-profond-rgb)/.35),rgb(var(--noir-profond-rgb)/.88))] lg:bg-[linear-gradient(180deg,rgb(var(--noir-profond-rgb)/.08)_0%,rgb(var(--noir-profond-rgb)/.30)_38%,rgb(var(--noir-profond-rgb)/.88)_100%)]"
          aria-hidden="true"
        />
        <Container className="relative z-10 flex flex-col justify-end min-h-[440px] md:min-h-[520px] lg:min-h-[clamp(420px,26vw,540px)] py-14 md:py-20 lg:py-12">
          <div className="max-w-3xl">
            <span className="filet-or mb-5" aria-hidden="true" />
            <h1 className="titre-hero mb-4 md:mb-5 drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
              {t('accueil.hero.titre')}
            </h1>
            <p className="text-[17px] md:text-xl text-inverse-91 mb-8 leading-relaxed">
              {t('site.accroche')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/vehicules" tabIndex={-1}>
                <Button size="lg" fullWidth className="sm:w-auto">{t('accueil.hero.bouton1')}</Button>
              </Link>
              <Link to="/contact" tabIndex={-1}>
                <Button size="lg" variant="secondary" fullWidth className="sm:w-auto">{t('accueil.hero.bouton2')}</Button>
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      <Masquable id="accueil.vente">
        <Section background="gray">
          <Container>
            <div className="text-center mb-10 md:mb-12">
              <h2 className="titre-section filet-apres mb-5">
                {t('accueil.vente.titre')}
              </h2>
              <p className="text-base md:text-lg text-gris max-w-2xl mx-auto">
                {t('accueil.vente.texte')}
              </p>
            </div>

            <div className={colonnes(vente.ids.length, { n: 4, classes: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6' }, {
              1: 'grid grid-cols-1 gap-4 md:gap-6 max-w-md mx-auto',
              2: 'grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 max-w-3xl mx-auto',
              0: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6',
              7: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6',
              8: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6',
            })}>
              {vente.ids.map((id) => (
                <div
                  key={id}
                  {...vente.attrs(id)}
                  className="carte p-6 md:p-7 flex gap-4 sm:flex-col sm:gap-0 transition-[box-shadow,transform] duration-180 hover:-translate-y-0.5 hover:shadow-vehicule"
                >
                  <div className="flex-shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-fond border border-bordure sm:mb-5">
                    <IconeOr icon={vente.icone(id)} />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-noir mb-1.5">{t(vente.cle(id, 'titre'))}</h3>
                    <p className="text-sm text-gris leading-relaxed">{t(vente.cle(id, 'texte'))}</p>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </Section>
      </Masquable>

      <Masquable id="accueil.arrivages">
        <DerniersArrivages />
      </Masquable>

      <Masquable id="accueil.marques">
        <ExplorezLesMarques />
      </Masquable>

      <Masquable id="accueil.reprise">
        <Section background="dark">
          <Container>
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
              <div>
                <h2 className="titre-section filet-avant mb-5">
                  {t('accueil.reprise.titre')}
                </h2>
                <p className="text-base md:text-lg text-inverse-84 mb-8 leading-relaxed">
                  {t('accueil.reprise.texte')}
                </p>
                <Link to="/reprises" tabIndex={-1}>
                  <Button>{t('accueil.reprise.bouton')}</Button>
                </Link>
                <p className="mt-6 text-sm text-inverse-84">
                  {t('accueil.reprise.depot')}{' '}
                  <Link to="/vendre-ma-moto" className="text-or-clair underline underline-offset-4 hover:decoration-2">
                    {t('accueil.reprise.depot_lien')}
                  </Link>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                {reprise.ids.map((id) => (
                  <div key={id} {...reprise.attrs(id)} className="rounded-2xl border border-inverse/10 bg-inverse/[0.04] p-4 md:p-6">
                    <IconeOr icon={reprise.icone(id)} className="w-7 h-7 mb-3" />
                    <h3 className="font-semibold text-inverse mb-1.5 text-[15px] md:text-base">{t(reprise.cle(id, 'titre'))}</h3>
                    <p className="text-sm text-inverse-74">{t(reprise.cle(id, 'texte'))}</p>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </Section>
      </Masquable>

      <Masquable id="accueil.services">
        <Section background="white">
          <Container>
            <div className={colonnes(services.ids.length, { n: 3, classes: 'grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6' }, {
              1: 'grid grid-cols-1 gap-4 md:gap-6 max-w-2xl mx-auto',
              2: 'grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6',
              0: 'grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6',
              4: 'grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6',
            })}>
              {services.ids.map((id) => {
                const adresse = t(services.cle(id, 'adresse')).trim() || '/contact';
                const classeLien = 'lien self-start';
                return (
                  <div key={id} {...services.attrs(id)} className="flex flex-col bg-fond border border-bordure rounded-2xl p-6 md:p-8 transition-[box-shadow,transform] duration-180 hover:-translate-y-0.5 hover:shadow-vehicule">
                    <h3 className="titre-display text-[22px] md:text-2xl mb-3">{t(services.cle(id, 'titre'))}</h3>
                    <p className="text-gris mb-6 leading-relaxed flex-1">
                      {t(services.cle(id, 'texte'))}
                    </p>
                    {adresse.startsWith('/') ? (
                      <Link to={adresse} className={classeLien}>
                        {t(services.cle(id, 'lien'))}
                      </Link>
                    ) : (
                      <a href={adresse} target="_blank" rel="noopener noreferrer" className={classeLien}>
                        {t(services.cle(id, 'lien'))}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </Container>
        </Section>
      </Masquable>

      <Masquable id="accueil.pourquoi">
        <Section background="gray">
          <Container>
            <div className="text-center mb-10 md:mb-12">
              <h2 className="titre-section filet-apres">
                {t('accueil.pourquoi.titre')}
              </h2>
            </div>

            <div className={colonnes(pourquoi.ids.length, { n: 3, classes: 'grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12' }, {
              1: 'grid grid-cols-1 gap-10 md:gap-12',
              2: 'grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 max-w-3xl mx-auto',
              0: 'grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12',
              4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12',
            })}>
              {pourquoi.ids.map((id) => (
                <div key={id} {...pourquoi.attrs(id)} className="text-center">
                  <div className="inline-flex items-center justify-center w-[72px] h-[72px] bg-surface rounded-full mb-5 border border-or/50 shadow-carte">
                    <IconeOr icon={pourquoi.icone(id)} className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-noir mb-2">{t(pourquoi.cle(id, 'titre'))}</h3>
                  <p className="text-gris leading-relaxed max-w-xs mx-auto">
                    {t(pourquoi.cle(id, 'texte'))}
                  </p>
                </div>
              ))}
            </div>
          </Container>
        </Section>
      </Masquable>

      <Masquable id="accueil.avis">
        <SectionAvisGoogle />
      </Masquable>

      <Masquable id="accueil.equipe">
        <SectionEquipe />
      </Masquable>

      <Masquable id="accueil.final">
        <Section background="dark">
          <Container className="text-center">
            <h2 className="titre-section filet-avant mb-5">{t('accueil.final.titre')}</h2>
            <p className="text-base md:text-xl text-inverse-84 mb-8 max-w-2xl mx-auto">
              {t('accueil.final.texte')}
            </p>
            <Link to="/contact" tabIndex={-1}>
              <Button size="lg">{t('accueil.final.bouton')}</Button>
            </Link>
          </Container>
        </Section>
      </Masquable>
    </>
  );
}
