import { NavLink } from 'react-router-dom';

/** Onglets de l'espace dépôt-vente : demandes d'estimation / dossiers */
export function DepotOnglets({ demandes, dossiers }: { demandes?: number; dossiers?: number }) {
  const classe = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap ${
      isActive ? 'border-[#111111] text-[#111111]' : 'border-transparent text-[#666666] hover:text-[#111111]'
    }`;
  const pastille = (n?: number) =>
    n ? <span className="ml-1.5 inline-flex min-w-5 h-5 px-1.5 items-center justify-center rounded-full bg-brand text-white text-xs">{n}</span> : null;
  return (
    <nav aria-label="Dépôt-vente" className="flex gap-1 border-b border-[#D1D5DB] overflow-x-auto">
      <NavLink to="/admin/depot-vente" end className={classe}>
        Demandes d'estimation{pastille(demandes)}
      </NavLink>
      <NavLink to="/admin/depot-vente/dossiers" className={classe}>
        Dossiers{pastille(dossiers)}
      </NavLink>
    </nav>
  );
}
