import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { Home, Crown, Mail, FileText, FolderOpen, Handshake, LogOut, Menu, Palette, Store, Users, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { FondMenu } from '../layout/FondMenu';
import { useFermerAuDefilement } from '../../hooks/useFermerAuDefilement';
import { useUnreadCount } from '../../hooks/useUnreadCount';
import { useFinancingProfilesUnreadCount } from '../../hooks/useFinancingProfilesUnreadCount';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { count: unreadCount } = useUnreadCount();
  const { count: unreadFinancingProfiles } = useFinancingProfilesUnreadCount();

  const [depotNonLues, setDepotNonLues] = useState(0);
  // Menu « sandwich » (tablette et téléphone), comme celui du site
  const [menuOuvert, setMenuOuvert] = useState(false);
  useEffect(() => setMenuOuvert(false), [location.pathname]);
  useFermerAuDefilement(menuOuvert, useCallback(() => setMenuOuvert(false), []));
  useEffect(() => {
    if (!menuOuvert) return;
    const echap = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOuvert(false);
    window.addEventListener('keydown', echap);
    return () => window.removeEventListener('keydown', echap);
  }, [menuOuvert]);

  // Dépôt-vente : demandes d'estimation pas encore ouvertes + demandes des déposants à traiter
  useEffect(() => {
    Promise.all([
      supabase.from('depot_demandes').select('id', { count: 'exact', head: true }).eq('envoi_termine', true).is('lu_le', null),
      supabase.from('depot_demandes_proprietaire').select('id', { count: 'exact', head: true }).eq('statut', 'nouvelle'),
    ]).then(([a, b]: { count: number | null }[]) => setDepotNonLues((a.count ?? 0) + (b.count ?? 0)));
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname.startsWith(path);
  /** Total des pastilles, affiché sur le bouton du menu fermé */
  const aTraiter = unreadCount + unreadFinancingProfiles + depotNonLues;

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
    { to: '/admin/studio-design', libelle: 'Studio Design', icone: <Palette className="w-4 h-4" aria-hidden="true" /> },
  ];

  /** Lien du menu ; « surFond » : dans le groupe grisé du contenu du site */
  const lien = (l: Lien, surFond = false) => {
    const actif = isActive(l.to);
    return (
      <Link
        key={l.to}
        to={l.to}
        aria-current={actif ? 'page' : undefined}
        title={surFond ? l.libelle : undefined}
        className={`relative flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          actif
            ? surFond ? 'bg-white text-brand shadow-sm' : 'bg-[#F5F5F5] text-brand'
            : surFond ? 'text-[#444444] hover:bg-white hover:text-brand' : 'text-[#444444] hover:bg-[#F9F9F9] hover:text-brand'
        }`}
      >
        {l.icone}
        {/* Groupe « Contenu du site » : icônes seules sur les écrans moyens, pour que tout tienne sur une ligne */}
        {surFond ? <span className="sr-only 2xl:not-sr-only">{l.libelle}</span> : l.libelle}
        {!!l.badge && l.badge > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
            {l.badge > 99 ? '99+' : l.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="admin min-h-screen bg-[#F5F5F5]">
      <FondMenu ouvert={menuOuvert} onFermer={() => setMenuOuvert(false)} z="z-30" />
      {/* Figé en haut de l'écran, sur ordinateur comme sur téléphone (le menu ouvert se ferme si la page défile) */}
      <header className="sticky top-0 z-40 bg-white shadow-[0_1px_0_rgba(17,17,17,0.02),0_6px_18px_rgba(17,17,17,0.05)]">
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
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
              <Link to="/" className="hidden xl:block text-[#666666] hover:text-brand" title="Voir le site" aria-label="Voir le site">
                <Home className="w-5 h-5" />
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="hidden xl:block text-[#666666] hover:text-brand"
                title="Se déconnecter"
                aria-label="Se déconnecter"
              >
                <LogOut className="w-5 h-5" />
              </button>

              {/* Bouton « sandwich » (tablette et téléphone) */}
              <button
                type="button"
                className="relative xl:hidden -mr-2 p-2.5 text-noir hover:bg-fond rounded-xl transition-colors duration-180"
                onClick={() => setMenuOuvert(!menuOuvert)}
                aria-expanded={menuOuvert}
                aria-controls="menu-admin-mobile"
                aria-label={menuOuvert ? 'Fermer le menu de navigation' : 'Ouvrir le menu de navigation'}
              >
                {menuOuvert ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                {!menuOuvert && aTraiter > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white" aria-hidden="true">
                    {aTraiter > 99 ? '99+' : aTraiter}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Menu déroulant (tablette et téléphone) : mêmes effets que le menu du site */}
          <div
            id="menu-admin-mobile"
            aria-hidden={!menuOuvert}
            className={`xl:hidden absolute inset-x-0 top-full bg-white px-4 sm:px-6 lg:px-8 border-t border-bordure shadow-[0_12px_24px_rgba(17,17,17,0.08)] transition-all duration-300 ease-out motion-reduce:transition-none ${
              menuOuvert
                ? 'max-h-[calc(100dvh-4.25rem)] overflow-y-auto overscroll-contain opacity-100 translate-y-0 pointer-events-auto pt-3 pb-5'
                : 'max-h-0 overflow-hidden opacity-0 -translate-y-2 pointer-events-none py-0'
            }`}
          >
            {[
              { titre: 'Activité', liens: activite },
              { titre: 'Contenu du site', liens: contenuSite },
            ].map((groupe, g) => (
              <nav key={groupe.titre} aria-label={groupe.titre} className={g > 0 ? 'mt-3 border-t border-bordure pt-3' : ''}>
                <p className="mb-1.5 px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#888888]">{groupe.titre}</p>
                <div className="flex flex-col gap-1.5">
                  {groupe.liens.map((l) => {
                    const rang = g === 0 ? activite.indexOf(l) : activite.length + contenuSite.indexOf(l);
                    const actif = isActive(l.to);
                    return (
                      <Link
                        key={l.to}
                        to={l.to}
                        tabIndex={menuOuvert ? undefined : -1}
                        aria-current={actif ? 'page' : undefined}
                        onClick={() => setMenuOuvert(false)}
                        className={`flex items-center gap-3 px-4 py-3 text-base rounded-r-xl border-l-[3px] transition-all duration-300 ease-out motion-reduce:transition-none ${
                          actif ? 'bg-fond text-bleu font-bold border-or' : 'text-noir font-medium border-transparent hover:bg-fond'
                        } ${menuOuvert ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                        style={{ transitionDelay: menuOuvert ? `${rang * 50}ms` : '0ms' }}
                      >
                        <span className={actif ? 'text-bleu' : 'text-[#666666]'}>{l.icone}</span>
                        <span className="flex-1">{l.libelle}</span>
                        {!!l.badge && l.badge > 0 && (
                          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-bold text-white">
                            {l.badge > 99 ? '99+' : l.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </nav>
            ))}

            {/* Voir le site / Se déconnecter */}
            <div
              className={`mt-4 grid grid-cols-2 gap-2 border-t border-bordure pt-4 transition-all duration-300 ease-out motion-reduce:transition-none ${
                menuOuvert ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
              }`}
              style={{ transitionDelay: menuOuvert ? `${(activite.length + contenuSite.length) * 50}ms` : '0ms' }}
            >
              <Link
                to="/"
                tabIndex={menuOuvert ? undefined : -1}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-or bg-white px-4 py-2.5 text-sm font-semibold text-noir hover:bg-fond"
              >
                <Home className="w-4 h-4" aria-hidden="true" /> Voir le site
              </Link>
              <button
                type="button"
                tabIndex={menuOuvert ? undefined : -1}
                onClick={handleSignOut}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-[#D1D5DB] bg-white px-4 py-2.5 text-sm font-semibold text-[#444444] hover:border-[#111111]"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" /> Se déconnecter
              </button>
            </div>
          </div>
        </div>
        {/* Liseré or sous la barre, comme sur le site */}
        <div className="liseret-or" aria-hidden="true" />
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
