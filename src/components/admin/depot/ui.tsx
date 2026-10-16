/** Petits éléments d'interface communs à la fiche dossier de dépôt-vente */
import { ReactNode, useId } from 'react';

export const champClasse =
  'w-full px-3 py-2.5 rounded-xl border border-[#D1D5DB] bg-white text-[#111111] focus:outline-none focus:border-bleu focus:ring-4 focus:ring-bleu/15 disabled:bg-[#F5F5F5] disabled:text-[#666666]';
export const boutonPrincipal =
  'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-bleu text-white text-sm font-semibold disabled:opacity-50';
export const boutonSecondaire =
  'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-[#D1D5DB] bg-white text-[#111111] text-sm font-semibold hover:border-[#111111] disabled:opacity-50';
export const boutonDanger =
  'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-red-200 bg-white text-red-700 text-sm font-semibold hover:border-red-600 disabled:opacity-50';

export function Carte({ titre, id, action, children, className = '' }: { titre: string; id: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={`bg-white rounded-2xl border border-[#E5E5E5] p-5 md:p-6 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 id={id} className="text-lg font-bold text-[#111111]">{titre}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Champ({ libelle, aide, children }: { libelle: string; aide?: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[#111111] mb-1">{libelle}</label>
      {children(id)}
      {aide && <p className="mt-1 text-xs text-[#666666]">{aide}</p>}
    </div>
  );
}

export function Message({ texte, erreur }: { texte: string; erreur?: boolean }) {
  if (!texte) return null;
  return (
    <p role={erreur ? 'alert' : 'status'} className={`text-sm ${erreur ? 'text-red-700' : 'text-green-800'}`}>
      {texte}
    </p>
  );
}
