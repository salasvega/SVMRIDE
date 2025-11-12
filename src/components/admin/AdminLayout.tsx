import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Home, Crown, Mail, FileText, FolderOpen } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { useUnreadCount } from '../../hooks/useUnreadCount';
import { useFinancingProfilesUnreadCount } from '../../hooks/useFinancingProfilesUnreadCount';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { count: unreadCount } = useUnreadCount();
  const { count: unreadFinancingProfiles } = useFinancingProfilesUnreadCount();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <nav className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/admin/dashboard" className="flex items-center space-x-2">
                <Crown className="w-6 h-6 text-[#C62E2E]" />
                <span className="text-xl font-bold text-[#111111]">Admin</span>
              </Link>

              <div className="hidden md:flex space-x-4">
                <Link
                  to="/admin/vehicles"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-[#444444] hover:bg-[#F9F9F9] hover:text-[#C62E2E] transition-colors flex items-center gap-2"
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
                  className="px-3 py-2 rounded-lg text-sm font-medium text-[#444444] hover:bg-[#F9F9F9] hover:text-[#C62E2E] transition-colors flex items-center gap-2 relative"
                >
                  <Mail className="w-4 h-4" />
                  Messages
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#C62E2E] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/admin/financing-profiles"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-[#444444] hover:bg-[#F9F9F9] hover:text-[#C62E2E] transition-colors flex items-center gap-2 relative"
                >
                  <FileText className="w-4 h-4" />
                  Dossiers Financement
                  {unreadFinancingProfiles > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#C62E2E] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadFinancingProfiles > 99 ? '99+' : unreadFinancingProfiles}
                    </span>
                  )}
                </Link>
                <Link
                  to="/admin/sales-folders"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-[#444444] hover:bg-[#F9F9F9] hover:text-[#C62E2E] transition-colors flex items-center gap-2"
                >
                  <FolderOpen className="w-4 h-4" />
                  Dossiers Vente
                </Link>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Link to="/" className="text-[#666666] hover:text-[#C62E2E]" title="Voir le site">
                <Home className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
