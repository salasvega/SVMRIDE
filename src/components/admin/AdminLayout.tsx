import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Home, Crown, Mail, FileText, FolderOpen, Handshake, LogOut, Store, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useUnreadCount } from '../../hooks/useUnreadCount';
import { useFinancingProfilesUnreadCount } from '../../hooks/useFinancingProfilesUnreadCount';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { count: unreadCount } = useUnreadCount();
  const { count: unreadFinancingProfiles } = useFinancingProfilesUnreadCount();

  const [depotNonLues, setDepotNonLues] = useState(0);

  // Dépôt-vente : demandes d'estimation pas encore ouvertes + demandes des déposants à traiter
  useEffect(() => {
    Promise.all([
      supabase.from('depot_demandes').select('id', { count: 'exact', head: true }).eq('envoi_termine', true).is('lu_le', null),
      supabase.from('depot_demandes_proprietaire').select('id', { count: 'exact', head: true }).eq('statut', 'nouvelle'),
    ]).then(([a, b]: { count: number | null }[]) => setDepotNonLues((a.count ?? 0) + (b.count ?? 0)));
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname.startsWith(path);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Deux familles de liens : l'activité (au quotidien) et le contenu du site (réglages occasionnels)
  type Lien = { to: string; libelle: string; icone: React.ReactNode; badge?: number; actif?: string };
  const VEHICULE = (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m18 14-1-3"/>
      <path d="m3 9 6 2a2 2 0 0 1 2-2h2a2 2 0 0 1 1.99 1.81"/>
      <path d="M8 17h3a1 1 0 0 0 1-1 6 6 0 0 1 6-6 1 1 0 0 0 1-1v-.75A5 5 0 0 0 17 5"/>
      <circle cx="19" cy="17" r="3"/>
      <circle cx="5" cy="17" r="3"/>
    </svg>
  );
  const activite: Lien[] = [
    { to: '/admin/vehicles', libelle: 'Véhicules', icone: VEHICULE },
    { to: '/admin/submissions', libelle: 'Messages', icone: <Mail className="w-4 h-4" aria-hidden="true" />, badge: unreadCount },
    { to: '/admin/financing-profiles', libelle: 'Dossiers Financement', icone: <FileText className="w-4 h-4" aria-hidden="true" />, badge: unreadFinancingProfiles },
    { to: '/admin/sales-folders', libelle: 'Dossiers Vente', icone: <FolderOpen className="w-4 h-4" aria-hidden="true" /> },
    { to: '/admin/depot-vente', libelle: 'Dépôt-vente', icone: <Handshake className="w-4 h-4" aria-hidden="true" />, badge: depotNonLues },
  ];
  const contenuSite: Lien[] = [
    { to: '/admin/equipe', libelle: 'Équipe', icone: <Users className="w-4 h-4" aria-hidden="true" /> },
    { to: '/admin/infos-site', libelle: 'Infos du site', icone: <Store className="w-4 h-4" aria-hidden="true" /> },
  ];

  /** Lien du menu ; « surFond » : dans le groupe grisé du contenu du site */
  const lien = (l: Lien, surFond = false) => {
    const actif = isActive(l.to);
    return (
      <Link
        key={l.to}
        to={l.to}
        aria-current={actif ? 'page' : undefined}
        className={`relative flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          actif
            ? surFond ? 'bg-white text-brand shadow-sm' : 'bg-[#F5F5F5] text-brand'
            : surFond ? 'text-[#444444] hover:bg-white hover:text-brand' : 'text-[#444444] hover:bg-[#F9F9F9] hover:text-brand'
        }`}
      >
        {l.icone}
        {l.libelle}
        {!!l.badge && l.badge > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
            {l.badge > 99 ? '99+' : l.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <header className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-6">
              <Link to="/admin/dashboard" className="flex shrink-0 items-center space-x-2">
                <Crown className="w-6 h-6 text-brand" />
                <span className="text-xl font-bold text-[#111111]">Admin</span>
              </Link>
              {/* Ordinateur : l'activité à gauche… */}
              <nav aria-label="Activité" className="hidden xl:flex items-center gap-1">
                {activite.map((l) => lien(l))}
              </nav>
            </div>

            <div className="flex shrink-0 items-center gap-4">
              {/* … le contenu du site à droite, groupé, près de « Voir le site » */}
              <nav aria-label="Contenu du site" className="hidden xl:flex items-center gap-0.5 rounded-xl bg-[#F5F5F5] p-1">
                {contenuSite.map((l) => lien(l, true))}
              </nav>
              <span className="hidden xl:block h-6 w-px bg-[#E5E5E5]" aria-hidden="true" />
              <Link to="/" className="text-[#666666] hover:text-brand" title="Voir le site" aria-label="Voir le site">
                <Home className="w-5 h-5" />
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-[#666666] hover:text-brand"
                title="Se déconnecter"
                aria-label="Se déconnecter"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tablette et téléphone : deux lignes, chacune défilable si besoin */}
          <div className="xl:hidden space-y-1 pb-2">
            <nav aria-label="Activité" className="flex items-center gap-2">
              <span className="w-[3.25rem] shrink-0 text-[10px] font-semibold uppercase tracking-wider text-[#888888]">Activité</span>
              <div className="-my-1 flex min-w-0 gap-1 overflow-x-auto py-1 pr-1">
                {activite.map((l) => lien(l))}
              </div>
            </nav>
            <nav aria-label="Contenu du site" className="flex items-center gap-2 border-t border-[#F0F0F0] pt-1">
              <span className="w-[3.25rem] shrink-0 text-[10px] font-semibold uppercase tracking-wider text-[#888888]">Site</span>
              <div className="-my-1 flex min-w-0 gap-1 overflow-x-auto py-1 pr-1">
                {contenuSite.map((l) => lien(l))}
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
