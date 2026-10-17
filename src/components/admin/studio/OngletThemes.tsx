/**
 * Studio Design — bibliothèque des thèmes : cartes avec miniature, palette,
 * statut ; Prévisualiser, Utiliser ce thème et menu d'actions.
 */
import { useState } from 'react';
import { Archive, ArchiveRestore, Check, Copy, Eye, MoreHorizontal, Pencil, Plus, Rocket, Trash2, Wand2 } from 'lucide-react';
import type { ThemeLigne } from '../../../lib/studioDesign';
import { Miniature, Palette } from './Miniature';

type Filtre = 'tous' | 'brouillon' | 'enregistre' | 'archive';

export interface ActionsThemes {
  onPrevisualiser: (t: ThemeLigne) => void;
  onUtiliser: (t: ThemeLigne) => void;
  onPublier: (t: ThemeLigne) => void;
  onDupliquer: (t: ThemeLigne) => void;
  onRenommer: (t: ThemeLigne) => void;
  onStatut: (t: ThemeLigne, statut: ThemeLigne['statut']) => void;
  onSupprimer: (t: ThemeLigne) => void;
  onNouveau: () => void;
}

export function Statut({ actif, statut, predefini }: { actif: boolean; statut: ThemeLigne['statut']; predefini?: boolean }) {
  if (actif) return <span className="rounded-full bg-gradient-to-r from-[#8A6A1F] to-[#D9B965] px-2.5 py-0.5 text-xs font-bold text-white">Actif</span>;
  if (statut === 'brouillon') return <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">Brouillon</span>;
  if (statut === 'archive') return <span className="rounded-full bg-[#EEEEEE] px-2.5 py-0.5 text-xs font-semibold text-[#555555]">Archivé</span>;
  return <span className="rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-xs font-semibold text-[#334155]">{predefini ? 'Prédéfini' : 'Enregistré'}</span>;
}

function Menu({ t, actif, a }: { t: ThemeLigne; actif: boolean; a: ActionsThemes }) {
  const [ouvert, setOuvert] = useState(false);
  const item = 'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#111111] hover:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-40';
  const faire = (f: () => void) => () => { setOuvert(false); f(); };
  return (
    <div className="relative">
      <button type="button" onClick={() => setOuvert((o) => !o)} aria-expanded={ouvert} aria-label={`Autres actions pour ${t.nom}`}
        className="rounded-lg border border-[#D1D5DB] p-2 text-[#444444] hover:border-[#111111] hover:text-[#111111]">
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {ouvert && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOuvert(false)} aria-hidden="true" />
          <div className="absolute bottom-full right-0 z-40 mb-2 w-60 overflow-hidden rounded-xl border border-[#E5E5E5] bg-white py-1 shadow-xl" role="menu">
            {!actif && <button type="button" role="menuitem" className={item} onClick={faire(() => a.onPublier(t))}><Rocket className="h-4 w-4" /> Publier ce thème</button>}
            <button type="button" role="menuitem" className={item} onClick={faire(() => a.onDupliquer(t))}><Copy className="h-4 w-4" /> Dupliquer</button>
            {!t.predefini && <button type="button" role="menuitem" className={item} onClick={faire(() => a.onRenommer(t))}><Pencil className="h-4 w-4" /> Renommer et décrire</button>}
            {!t.predefini && t.statut === 'brouillon' && (
              <button type="button" role="menuitem" className={item} onClick={faire(() => a.onStatut(t, 'enregistre'))}><Check className="h-4 w-4" /> Ranger dans la bibliothèque</button>
            )}
            {!t.predefini && t.statut !== 'archive' && (
              <button type="button" role="menuitem" className={item} disabled={actif} onClick={faire(() => a.onStatut(t, 'archive'))}><Archive className="h-4 w-4" /> Archiver</button>
            )}
            {!t.predefini && t.statut === 'archive' && (
              <button type="button" role="menuitem" className={item} onClick={faire(() => a.onStatut(t, 'enregistre'))}><ArchiveRestore className="h-4 w-4" /> Sortir des archives</button>
            )}
            {!t.predefini && (
              <button type="button" role="menuitem" className={`${item} text-red-700`} disabled={actif} onClick={faire(() => a.onSupprimer(t))}>
                <Trash2 className="h-4 w-4" /> Supprimer{actif ? ' (thème actif)' : ''}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function OngletThemes({ themes, actifId, a }: { themes: ThemeLigne[]; actifId: string | null; a: ActionsThemes }) {
  const [filtre, setFiltre] = useState<Filtre>('tous');
  const visibles = themes
    .filter((t) => (filtre === 'tous' ? t.statut !== 'archive' : t.statut === filtre))
    .sort((x, y) => Number(y.id === actifId) - Number(x.id === actifId));
  const nb = (f: Filtre) => themes.filter((t) => (f === 'tous' ? t.statut !== 'archive' : t.statut === f)).length;
  const filtres: { f: Filtre; l: string }[] = [
    { f: 'tous', l: 'Tous' }, { f: 'brouillon', l: 'Brouillons' }, { f: 'enregistre', l: 'Enregistrés' }, { f: 'archive', l: 'Archivés' },
  ];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Filtrer les thèmes">
          {filtres.map(({ f, l }) => (
            <button key={f} type="button" onClick={() => setFiltre(f)} aria-pressed={filtre === f}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${filtre === f ? 'bg-[#111111] text-white' : 'text-[#444444] hover:bg-[#F5F5F5]'}`}>
              {l} <span className="opacity-60">{nb(f)}</span>
            </button>
          ))}
        </div>
        <button type="button" onClick={a.onNouveau} className="inline-flex items-center gap-2 rounded-xl bg-[#111111] px-4 py-2.5 text-sm font-semibold text-white">
          <Plus className="h-4 w-4" aria-hidden="true" /> Nouveau thème
        </button>
      </div>
      {visibles.length === 0 ? (
        <p className="rounded-xl border-2 border-dashed border-[#D1D5DB] px-4 py-8 text-center text-sm text-[#666666]">Aucun thème dans cette catégorie.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibles.map((t) => {
            const actif = t.id === actifId;
            return (
              <li key={t.id} className={`flex flex-col overflow-hidden rounded-2xl border-2 bg-white ${actif ? 'border-[#B8902F] shadow-[0_0_0_3px_rgba(184,144,47,0.15)]' : 'border-[#D1D5DB]'}`}>
                <button type="button" onClick={() => a.onPrevisualiser(t)} className="block text-left" tabIndex={-1} aria-hidden="true">
                  <Miniature config={t.config} petit />
                </button>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-[#111111]">{t.nom}</h3>
                    <Statut actif={actif} statut={t.statut} predefini={t.predefini} />
                  </div>
                  {t.description && <p className="text-sm text-[#666666]">{t.description}</p>}
                  <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <Palette config={t.config} />
                    <span className="text-xs text-[#888888]">
                      {t.predefini ? 'Prédéfini' : `Modifié le ${new Date(t.updated_at).toLocaleDateString('fr-FR')}`}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => a.onPrevisualiser(t)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#D1D5DB] px-3 py-2 text-sm font-semibold text-[#111111] hover:border-[#111111]">
                      <Eye className="h-4 w-4" aria-hidden="true" /> Prévisualiser
                    </button>
                    <button type="button" onClick={() => a.onUtiliser(t)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#111111] px-3 py-2 text-sm font-semibold text-white">
                      <Wand2 className="h-4 w-4" aria-hidden="true" /> Utiliser ce thème
                    </button>
                    <Menu t={t} actif={actif} a={a} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
