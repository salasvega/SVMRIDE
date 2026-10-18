/**
 * Admin — Édition du site › Contact : choix du contact principal parmi les
 * fiches de l'équipe (carte « Nos coordonnées » de la page Contact).
 * « Automatique » : le membre mis en avant (onglet Équipe), qui suit ses
 * changements. Aperçu de la carte telle qu'affichée sur le site.
 */
import { Link } from 'react-router-dom';
import { Check, EyeOff, Sparkles, Users } from 'lucide-react';
import { versMembre, type LigneEquipe } from '../../lib/equipe';
import { nomAffiche } from '../../config/equipe';
import { membreContact } from '../../config/coordonnees';
import { Portrait } from '../equipe/Portrait';
import { CarteContact } from '../equipe/CarteContact';

export function SelecteurContact({ valeur, onChange, lignes, telephone, email, instagram }: {
  valeur: string | null;
  onChange: (id: string | null) => void;
  /** Fiches de l'équipe (toutes, masquées comprises), dans l'ordre */
  lignes: LigneEquipe[];
  telephone: string;
  email: string;
  instagram: string;
}) {
  const visibles = lignes.filter((l) => l.visible);
  const masquees = lignes.filter((l) => !l.visible);
  const enAvant = visibles.find((l) => l.responsable);
  const choisieAbsente = !!valeur && !visibles.some((l) => l.id === valeur);
  const effectif = membreContact({ contact_membre: valeur }, visibles.map(versMembre));

  const carte = (actif: boolean, desactive = false) =>
    `relative flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors ${
      desactive ? 'cursor-not-allowed border-dashed border-[#E5E5E5] opacity-60'
        : actif ? 'border-[#111111] bg-[#FAFAFA]' : 'border-[#E5E5E5] bg-white hover:border-[#9CA3AF]'}`;
  const coche = (actif: boolean) => actif && (
    <span className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#111111] text-white" aria-hidden="true">
      <Check className="h-3.5 w-3.5" strokeWidth={3} />
    </span>
  );

  return (
    <div className="mb-6 border-b border-[#E5E5E5] pb-6">
      <h3 className="font-semibold text-[#111111]">Contact principal</h3>
      <p className="mb-4 text-sm text-[#666666]">
        La carte affichée dans « Nos coordonnées » sur la page Contact, avec le téléphone, l'e-mail et l'Instagram ci-dessous.
      </p>

      {lignes.length === 0 ? (
        <p className="text-sm text-[#666666]">Aucune fiche dans l'équipe pour l'instant.</p>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
          <div>
            <div role="radiogroup" aria-label="Contact principal" className="grid gap-2 sm:grid-cols-2">
              <button type="button" role="radio" aria-checked={valeur === null} onClick={() => onChange(null)} className={carte(valeur === null)}>
                {enAvant ? <Portrait membre={versMembre(enAvant)} taille={48} anneauOr /> : (
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#F5F5F5]"><Sparkles className="h-5 w-5" aria-hidden="true" /></span>
                )}
                <span className="min-w-0 pr-6">
                  <span className="block font-semibold text-[#111111]">Automatique</span>
                  <span className="block text-xs text-[#666666]">
                    Le membre mis en avant{enAvant ? ` (aujourd'hui : ${enAvant.prenom})` : ''}
                  </span>
                </span>
                {coche(valeur === null)}
              </button>
              {visibles.map((l) => (
                <button key={l.id} type="button" role="radio" aria-checked={valeur === l.id} onClick={() => onChange(l.id)} className={carte(valeur === l.id)}>
                  <Portrait membre={versMembre(l)} taille={48} anneauOr={l.responsable} />
                  <span className="min-w-0 pr-6">
                    <span className="block truncate font-semibold text-[#111111]">{nomAffiche(versMembre(l))}</span>
                    <span className="block truncate text-xs text-[#666666]">{l.fonction}</span>
                    {l.responsable && <span className="mt-0.5 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">Mis en avant</span>}
                  </span>
                  {coche(valeur === l.id)}
                </button>
              ))}
              {masquees.map((l) => (
                <div key={l.id} className={carte(false, true)} title="Fiche masquée sur le site : affichez-la dans l'onglet Équipe pour pouvoir la choisir.">
                  <Portrait membre={versMembre(l)} taille={48} />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-[#111111]">{nomAffiche(versMembre(l))}</span>
                    <span className="flex items-center gap-1 text-xs text-[#666666]"><EyeOff className="h-3 w-3" aria-hidden="true" /> Masqué sur le site</span>
                  </span>
                </div>
              ))}
            </div>
            {choisieAbsente && (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                La fiche choisie n'est plus affichée sur le site : c'est le membre mis en avant qui apparaît. Choisissez un autre contact.
              </p>
            )}
            <Link to="/admin/equipe" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#111111] underline underline-offset-2">
              <Users className="h-4 w-4" aria-hidden="true" /> Gérer les fiches de l'équipe
            </Link>
          </div>

          {effectif && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#666666]">Aperçu sur la page Contact</p>
              <div className="site pointer-events-none max-w-md select-none" style={{ background: "transparent" }} aria-hidden="true">
                <CarteContact membre={effectif} telephone={telephone} email={email} instagram={instagram} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
