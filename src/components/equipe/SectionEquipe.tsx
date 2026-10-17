/**
 * Accueil : « Des passionnés à votre service ».
 * Mattia (fiche « responsable ») mis en avant dans la carte noir et or, puis les
 * portraits individuels des autres membres affichés (6 au plus), dans l'ordre
 * choisi dans l'admin (onglet Équipe) ; lien vers /equipe, qui présente chacun
 * en détail. Masquable depuis l'admin (réglage « equipe_affichee »).
 * Les portraits remplacent depuis le 17/10/2026 la photo de groupe,
 * pour rester justes quand l'équipe change.
 */
import { Link } from 'react-router-dom';
import { useEquipe } from '../../lib/equipe';
import { Section } from '../ui/Section';
import { Container } from '../ui/Container';
import { Button } from '../ui/Button';
import { Portrait } from './Portrait';

const MAX_APERCU = 6;

export function SectionEquipe() {
  const equipe = useEquipe();
  if (equipe === null) return <div className="min-h-[560px] bg-surface" aria-hidden="true" />;
  // Masquée depuis l'admin (onglet Équipe, « Afficher l'équipe sur le site » = Non)
  if (!equipe.affichee) return null;
  const membres = equipe.membres;
  const responsable = membres.find((m) => m.responsable);
  const apercu = membres.filter((m) => !m.responsable).slice(0, MAX_APERCU);
  if (!responsable && apercu.length === 0) return null;

  // 1 à 3 personnes : une ligne ; 4 : deux par ligne ; 5 ou 6 : trois par ligne
  const colonnes = apercu.length === 1 ? 'grid-cols-1' : apercu.length === 2 || apercu.length === 4 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <Section zone="equipe" background="white">
      <Container>
        <div className="text-center mb-10 md:mb-12">
          <h2 className="titre-section filet-apres mb-5">Des passionnés à votre service</h2>
          <p className="text-base md:text-lg text-gris max-w-2xl mx-auto leading-relaxed">
            Derrière chaque moto, il y a une équipe de passionnés à votre écoute pour vous conseiller et vous
            accompagner dans votre projet.
          </p>
        </div>

        <div className={`grid gap-5 md:gap-6 lg:items-stretch ${responsable && apercu.length > 0 ? 'lg:grid-cols-12' : 'max-w-3xl mx-auto'}`}>
          {responsable && (
            <article className="sur-sombre relative overflow-hidden rounded-2xl bg-noir-profond text-inverse shadow-vehicule lg:col-span-5">
              <div className="liseret-or" aria-hidden="true" />
              <div className="flex h-full flex-col items-center p-6 text-center sm:flex-row sm:items-start sm:gap-6 sm:text-left md:p-8 lg:flex-col lg:items-center lg:text-center">
                <Portrait membre={responsable} taille={132} anneauOr surSombre />
                <div className="mt-5 sm:mt-1 lg:mt-6">
                  <h3 className="titre-display text-[30px] leading-none">{responsable.prenom}</h3>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-or-clair">
                    {responsable.fonction}
                  </p>
                  {responsable.presentation?.[0] && (
                    <p className="mt-4 text-[15px] leading-relaxed text-inverse-84">{responsable.presentation[0]}</p>
                  )}
                </div>
              </div>
            </article>
          )}

          {apercu.length > 0 && (
            <div className="relative flex items-center overflow-hidden rounded-2xl bg-fond px-4 py-8 sm:px-8 md:py-10 lg:col-span-7">
              <ul className={`grid w-full gap-x-3 gap-y-8 sm:gap-x-6 ${colonnes}`}>
                {apercu.map((m) => (
                  <li key={m.id} className="flex min-w-0 flex-col items-center text-center">
                    <Portrait membre={m} taille={112} classeTaille="h-[76px] w-[76px] sm:h-28 sm:w-28" className="shadow-vehicule" />
                    <h3 className="mt-4 text-[15px] font-semibold leading-tight text-noir sm:text-lg">{m.prenom}</h3>
                    <p className="mt-1 text-[11px] leading-snug text-gris sm:text-sm">{m.fonction}</p>
                    <span className="mt-2.5 block h-0.5 w-6 bg-or sm:w-8" aria-hidden="true" />
                  </li>
                ))}
              </ul>
            </div>
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
