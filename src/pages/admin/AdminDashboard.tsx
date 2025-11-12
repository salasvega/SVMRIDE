import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Mail, FileText } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import { useUnreadCount } from '../../hooks/useUnreadCount';
import { useFinancingProfilesUnreadCount } from '../../hooks/useFinancingProfilesUnreadCount';

function AnimatedCounter({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = null;
    countRef.current = 0;
    setCount(0);

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = timestamp - startTimeRef.current;
      const percentage = Math.min(progress / duration, 1);

      const easeOutQuart = 1 - Math.pow(1 - percentage, 4);
      const current = Math.floor(easeOutQuart * value);

      setCount(current);

      if (percentage < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    if (value > 0) {
      requestAnimationFrame(animate);
    }
  }, [value, duration]);

  return <span>{count}</span>;
}

export function AdminDashboard() {
  const { count: unreadCount } = useUnreadCount();
  const { count: unreadFinancingProfiles } = useFinancingProfilesUnreadCount();
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    motos: 0,
    scooters: 0,
    submissions: 0,
    financingProfiles: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('type, available');

      const { count: contactCount } = await supabase
        .from('contact_submissions')
        .select('*', { count: 'exact', head: true });

      const { count: tradeInCount } = await supabase
        .from('trade_in_submissions')
        .select('*', { count: 'exact', head: true });

      const { count: customSearchCount } = await supabase
        .from('custom_search_submissions')
        .select('*', { count: 'exact', head: true });

      const { count: financingCount } = await supabase
        .from('financing_submissions')
        .select('*', { count: 'exact', head: true });

      const { count: financingProfilesCount } = await supabase
        .from('user_financing_profiles')
        .select('*', { count: 'exact', head: true });

      const totalSubmissions = (contactCount || 0) + (tradeInCount || 0) + (customSearchCount || 0) + (financingCount || 0);

      if (vehicles) {
        setStats({
          total: vehicles.length,
          available: vehicles.filter((v) => v.available).length,
          motos: vehicles.filter((v) => v.type === 'moto').length,
          scooters: vehicles.filter((v) => v.type === 'scooter').length,
          submissions: totalSubmissions,
          financingProfiles: financingProfilesCount || 0,
        });
      }
    }

    fetchStats();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-[#111111]">Dashboard</h1>
          <p className="text-[#666666] mt-1">
            Bienvenue dans l'interface d'administration
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            to="/admin/vehicles"
            className="group relative bg-gradient-to-br from-white to-blue-50/30 rounded-xl p-6 shadow-sm border border-[#E5E5E5] hover:border-blue-400 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:to-blue-600/10 transition-all duration-300" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm text-[#666666] mb-2 font-medium">Total véhicules</p>
                <p className="text-4xl font-bold text-[#111111]">
                  <AnimatedCounter value={stats.total} />
                </p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m18 14-1-3"/>
                  <path d="m3 9 6 2a2 2 0 0 1 2-2h2a2 2 0 0 1 1.99 1.81"/>
                  <path d="M8 17h3a1 1 0 0 0 1-1 6 6 0 0 1 6-6 1 1 0 0 0 1-1v-.75A5 5 0 0 0 17 5"/>
                  <circle cx="19" cy="17" r="3"/>
                  <circle cx="5" cy="17" r="3"/>
                </svg>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/submissions"
            className="group relative bg-gradient-to-br from-white to-orange-50/30 rounded-xl p-6 shadow-sm border border-[#E5E5E5] hover:border-orange-400 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-orange-500/0 group-hover:from-orange-500/5 group-hover:to-orange-600/10 transition-all duration-300" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm text-[#666666] mb-2 font-medium">Messages reçus</p>
                <p className="text-4xl font-bold text-[#111111]">
                  <AnimatedCounter value={stats.submissions} />
                </p>
              </div>
              <div className="relative w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                <Mail className="w-8 h-8 text-orange-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
            </div>
          </Link>

          <Link
            to="/admin/financing-profiles"
            className="group relative bg-gradient-to-br from-white to-purple-50/30 rounded-xl p-6 shadow-sm border border-[#E5E5E5] hover:border-purple-400 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/0 group-hover:from-purple-500/5 group-hover:to-purple-600/10 transition-all duration-300" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm text-[#666666] mb-2 font-medium">Dossiers financement</p>
                <p className="text-4xl font-bold text-[#111111]">
                  <AnimatedCounter value={stats.financingProfiles} />
                </p>
              </div>
              <div className="relative w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                <FileText className="w-8 h-8 text-purple-600" />
                {unreadFinancingProfiles > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-pulse">
                    {unreadFinancingProfiles > 99 ? '99+' : unreadFinancingProfiles}
                  </span>
                )}
              </div>
            </div>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
