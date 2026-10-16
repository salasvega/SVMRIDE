import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Home, Crown, Mail, FileText, FolderOpen, Handshake, LogOut } from 'lucide-react';
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

  // Demandes de dépôt-vente pas encore ouvertes
  useEffect(() => {
    supabase
      .from('depot_demandes')
      .select('id', { count: 'exact', head: true })
      .eq('envoi_termine', true)
      .is('lu_le', null)
      .then(({ count }: { count: number | null }) => setDepotNonLues(count ?? 0));
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname.startsWith(path);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const liens = (
              <>
                <Link
                  to="/admin/vehicles"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    isActive('/admin/vehicles')
                      ? 'text-brand bg-[#F9F9F9]'
                      : 'text-[#444444] hover:bg-[#F9F9F9] hover:text-brand'
                  }`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m18 14-1-3"/>
                    <path d="m3 9 6 2a2 2 0 0 1 2-2h2a2 2 0 0 1 1.99 1.81"/>
                    <path d="M8 17h3a1 1 0 0 0 1-1 6 6 0 0 1 6-6 1 1 0 0 0 1-1v-.75A5 5 0 0 0 17 5"/>
                    <circle cx="19" cy="17" r="3"/>
                    <circle cx="5" cy="17" r="3"/>
                  </svg>
                  Véhicules
                </Link>
                <Link
                  to="/admin/submissions"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 relative ${
                    isActive('/admin/submissions')
                      ? 'text-brand bg-[#F9F9F9]'
                      : 'text-[#444444] hover:bg-[#F9F9F9] hover:text-brand'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  Messages
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-brand text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/admin/financing-profiles"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 relative ${
                    isActive('/admin/financing-profiles')
                      ? 'text-brand bg-[#F9F9F9]'
                      : 'text-[#444444] hover:bg-[#F9F9F9] hover:text-brand'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Dossiers Financement
                  {unreadFinancingProfiles > 0 && (
                    <span className="absolute -top-1 -right-1 bg-brand text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadFinancingProfiles > 99 ? '99+' : unreadFinancingProfiles}
                    </span>
                  )}
                </Link>
                <Link
                  to="/admin/sales-folders"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    isActive('/admin/sales-folders')
                      ? 'text-brand bg-[#F9F9F9]'
                      : 'text-[#444444] hover:bg-[#F9F9F9] hover:text-brand'
                  }`}
                >
                  <FolderOpen className="w-4 h-4" />
                  Dossiers Vente
                </Link>
                <Link
                  to="/admin/depot-vente"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 relative whitespace-nowrap ${
                    isActive('/admin/depot-vente')
                      ? 'text-brand bg-[#F9F9F9]'
                      : 'text-[#444444] hover:bg-[#F9F9F9] hover:text-brand'
                  }`}
                >
                  <Handshake className="w-4 h-4" />
                  Dépôt-vente
                  {depotNonLues > 0 && (
                    <span className="absolute -top-1 -right-1 bg-brand text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {depotNonLues > 99 ? '99+' : depotNonLues}
                    </span>
                  )}
                </Link>
              </>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <nav className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/admin/dashboard" className="flex items-center space-x-2">
                <Crown className="w-6 h-6 text-brand" />
                <span className="text-xl font-bold text-[#111111]">Admin</span>
              </Link>

              <div className="hidden md:flex space-x-4">
                {liens}
              </div>
            </div>

            <div className="flex items-center space-x-4">
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
          <div className="md:hidden flex gap-1 overflow-x-auto pb-2 -mx-1 px-1">
            {liens}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
