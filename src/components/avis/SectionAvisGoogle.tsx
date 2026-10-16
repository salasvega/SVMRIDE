/**
 * Accueil : « Votre confiance, notre plus belle récompense » (avis Google).
 *
 * Règles (voir src/config/avisGoogle.ts) :
 * - note, nombre d'avis et cartes seulement si des avis vérifiés sont disponibles
 *   (ou des avis de démonstration, hors production uniquement, signalés par un bandeau) ;
 * - sinon, seulement les boutons vers Google si leurs liens ont été vérifiés ;
 * - sinon, rien.
 * Chargement non bloquant : l'espace est réservé pendant la lecture pour éviter les sauts.
 */
import { useEffect, useState } from 'react';
import { ExternalLink, PenLine } from 'lucide-react';
import { AVIS_GOOGLE, liensGoogle } from '../../config/avisGoogle';
import { chargerAvis, modeDemo } from '../../lib/avis/source';
import type { ResumeAvis } from '../../lib/avis/types';
import { Section } from '../ui/Section';
import { Container } from '../ui/Container';
import { CarrouselAvis } from './CarrouselAvis';
import { Etoiles } from './Etoiles';
import { LogoGoogle } from './LogoGoogle';

export function SectionAvisGoogle() {
  const demo = modeDemo();
  const sourceAttendue = demo || AVIS_GOOGLE.actif;
  const [resume, setResume] = useState<ResumeAvis | null>(null);
  const [charge, setCharge] = useState(!sourceAttendue);

  useEffect(() => {
    if (!sourceAttendue) return;
    let actif = true;
    chargerAvis().then((r) => {
      if (!actif) return;
      setResume(r);
      setCharge(true);
    });
    return () => { actif = false; };
  }, [sourceAttendue]);

  const liens = liensGoogle();
  const liensAffiches = !!liens && (AVIS_GOOGLE.liensVerifies || demo);
  const avecAvis = !!resume && resume.avis.length > 0;
  // Pas encore d'avis Google à afficher : titre et boutons centrés, section plus compacte
  const compact = !sourceAttendue && !avecAvis;

  // Rien de vérifié à montrer : la section n'apparaît pas
  if (charge && !avecAvis && !liensAffiches && !demo) return null;

  const bouton =
    'inline-flex items-center justify-center gap-2 rounded-xl border-2 px-[22px] py-[13px] text-[15px] md:text-base font-semibold transition-[background-color,border-color,box-shadow,color] duration-180 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bleu-vif';

  return (
    <Section background="gray" className={compact ? '!py-12 md:!py-16' : ''}>
      <Container>
        {demo && (
          <p className="mb-8 rounded-xl border border-or/50 bg-[#FBF6E9] px-4 py-3 text-sm text-noir">
            <strong className="font-semibold">Démonstration :</strong> avis fictifs affichés uniquement en aperçu, en
            attendant la connexion à Google. Sur svmride.com, aucun avis fictif n'est publié.
          </p>
        )}

        <div
          className={
            compact
              ? 'text-center'
              : 'mb-10 flex flex-col gap-6 md:mb-12 lg:flex-row lg:items-end lg:justify-between'
          }
        >
          <div className={compact ? 'mx-auto max-w-2xl' : 'max-w-2xl'}>
            <h2 className="titre-section filet-apres mb-5">Votre confiance, notre plus belle récompense</h2>
            <p className="text-base md:text-lg text-gris leading-relaxed">
              Découvrez ce que nos clients pensent de leur expérience chez SVM Ride.
            </p>
          </div>

          {/* Note globale : place réservée pendant le chargement (pas de saut de mise en page) */}
          {(sourceAttendue || avecAvis) && (
            <div
              className={`carte inline-flex min-h-[92px] items-center gap-4 self-start px-5 py-4 lg:self-auto ${avecAvis ? '' : 'invisible'}`}
              aria-hidden={!avecAvis || undefined}
            >
              <LogoGoogle taille={30} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gris">Avis Google</p>
                {avecAvis && (
                  <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span className="titre-display text-[30px] leading-none">
                      {resume!.noteMoyenne.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    </span>
                    <Etoiles note={resume!.noteMoyenne} taille={18} />
                    <span className="text-sm text-gris">
                      sur 5 · {resume!.nombreAvis.toLocaleString('fr-FR')} avis
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {avecAvis ? (
          <CarrouselAvis avis={resume!.avis} demo={resume!.source === 'demo'} />
        ) : (
          sourceAttendue && !charge && <div className="h-[300px]" aria-hidden="true" />
        )}

        {(liensAffiches || demo) && (
          <div className={`${compact ? 'mt-8' : 'mt-10'} flex flex-col justify-center gap-3 sm:flex-row`}>
            {liensAffiches ? (
              <>
                <a href={liens!.voirTous} target="_blank" rel="noopener noreferrer" className={`${bouton} border-transparent bg-bleu text-white shadow-bleu hover:bg-bleu-hover hover:shadow-bleu-fort`}>
                  Voir tous les avis sur Google
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">(nouvel onglet)</span>
                </a>
                <a href={liens!.donnerAvis} target="_blank" rel="noopener noreferrer" className={`${bouton} border-or bg-white text-noir hover:bg-fond hover:border-or-clair`}>
                  <PenLine className="h-4 w-4" aria-hidden="true" />
                  Donner mon avis
                  <span className="sr-only">(nouvel onglet)</span>
                </a>
              </>
            ) : (
              <p className="text-center text-sm text-gris">
                Boutons « Voir tous les avis sur Google » et « Donner mon avis » : en attente de l'identifiant de la fiche Google
                (placeId dans src/config/avisGoogle.ts).
              </p>
            )}
          </div>
        )}
      </Container>
    </Section>
  );
}
