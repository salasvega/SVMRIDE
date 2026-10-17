/**
 * Studio Design — historique des publications : version, thème, date,
 * administrateur ; prévisualiser ou restaurer une version.
 */
import { Eye, History, RotateCcw } from 'lucide-react';
import type { Publication } from '../../../lib/studioDesign';
import { Palette } from './Miniature';

const date = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export function OngletHistorique({ publications, versionEnLigne, onPrevisualiser, onRestaurer }: {
  publications: Publication[];
  versionEnLigne: number | null;
  onPrevisualiser: (p: Publication) => void;
  onRestaurer: (p: Publication) => void;
}) {
  if (!publications.length) return <p className="text-sm text-[#666666]">Aucune publication pour l'instant.</p>;
  return (
    <div className="space-y-3">
      <p className="flex items-start gap-2 text-sm text-[#666666]">
        <History className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        Chaque publication crée une version. Restaurer une version la republie telle qu'elle était, et cette restauration est elle-même gardée ici.
      </p>
      <ol className="divide-y divide-[#EEEEEE] overflow-hidden rounded-xl border-2 border-[#D1D5DB] bg-white">
        {publications.map((p) => {
          const enLigne = p.version === versionEnLigne;
          return (
            <li key={p.version} className={`flex flex-wrap items-center gap-3 px-4 py-3 ${enLigne ? 'bg-[#FBF7EE]' : ''}`}>
              <span className="w-12 shrink-0 font-mono text-sm font-bold text-[#111111]">V{p.version}</span>
              <Palette config={p.config} taille="h-3.5 w-3.5" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#111111]">
                  {p.theme_nom}{' '}
                  {enLigne && <span className="ml-1 rounded-full bg-gradient-to-r from-[#8A6A1F] to-[#D9B965] px-2 py-0.5 text-xs font-bold text-white">En ligne</span>}
                </p>
                <p className="text-xs text-[#666666]">
                  {p.type === 'installation' ? 'Installation du Studio Design' : p.type === 'restauration' ? `Restauration de la V${p.restaure_version}` : 'Publication'}
                  {' · '}{date(p.publie_le)}
                  {p.publie_par && p.publie_par !== 'installation' ? ` · ${p.publie_par}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => onPrevisualiser(p)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#D1D5DB] px-3 py-1.5 text-sm font-semibold text-[#111111] hover:border-[#111111]">
                  <Eye className="h-4 w-4" aria-hidden="true" /> Prévisualiser
                </button>
                <button type="button" onClick={() => onRestaurer(p)} disabled={enLigne}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#111111] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-30">
                  <RotateCcw className="h-4 w-4" aria-hidden="true" /> Restaurer cette version
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
