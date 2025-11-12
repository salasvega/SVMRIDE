import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Mail, FileText, Package, ShoppingCart, CheckCircle, TrendingUp } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import { useUnreadCount } from '../../hooks/useUnreadCount';
import { useFinancingProfilesUnreadCount } from '../../hooks/useFinancingProfilesUnreadCount';
import { Vehicle } from '../../types/vehicle';

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
    reserved: 0,
    sold: 0,
    motos: 0,
    scooters: 0,
    submissions: 0,
    financingProfiles: 0,
    stockValue: 0,
    totalMargin: 0,
    averageMargin: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('*');

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
        const typedVehicles = vehicles as Vehicle[];
        const availableVehicles = typedVehicles.filter((v) => v.status === 'available');
        const reservedVehicles = typedVehicles.filter((v) => v.status === 'reserved');
        const soldVehicles = typedVehicles.filter((v) => v.status === 'sold');

        const stockValue = availableVehicles.reduce((sum, v) => sum + (v.purchase_price || 0), 0);

        const soldWithMargin = soldVehicles.filter(v => v.sale_price && v.purchase_price);
        const totalMargin = soldWithMargin.reduce((sum, v) => sum + ((v.sale_price || 0) - (v.purchase_price || 0)), 0);
        const averageMargin = soldWithMargin.length > 0 ? totalMargin / soldWithMargin.length : 0;

        setStats({
          total: typedVehicles.length,
          available: availableVehicles.length,
          reserved: reservedVehicles.length,
          sold: soldVehicles.length,
          motos: typedVehicles.filter((v) => v.type === 'moto').length,
          scooters: typedVehicles.filter((v) => v.type === 'scooter').length,
          submissions: totalSubmissions,
          financingProfiles: financingProfilesCount || 0,
          stockValue,
          totalMargin,
          averageMargin,
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            to="/admin/vehicles"
            className="group relative bg-gradient-to-br from-white to-green-50/30 rounded-xl p-6 shadow-sm border border-[#E5E5E5] hover:border-green-400 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-green-500/0 group-hover:from-green-500/5 group-hover:to-green-600/10 transition-all duration-300" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm text-[#666666] mb-2 font-medium">Disponibles</p>
                <p className="text-4xl font-bold text-[#111111]">
                  <AnimatedCounter value={stats.available} />
                </p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                <Package className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </Link>

          <Link
            to="/admin/vehicles"
            className="group relative bg-gradient-to-br from-white to-yellow-50/30 rounded-xl p-6 shadow-sm border border-[#E5E5E5] hover:border-yellow-400 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/0 to-yellow-500/0 group-hover:from-yellow-500/5 group-hover:to-yellow-600/10 transition-all duration-300" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm text-[#666666] mb-2 font-medium">Réservés</p>
                <p className="text-4xl font-bold text-[#111111]">
                  <AnimatedCounter value={stats.reserved} />
                </p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                <ShoppingCart className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </Link>

          <Link
            to="/admin/vehicles"
            className="group relative bg-gradient-to-br from-white to-blue-50/30 rounded-xl p-6 shadow-sm border border-[#E5E5E5] hover:border-blue-400 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:to-blue-600/10 transition-all duration-300" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm text-[#666666] mb-2 font-medium">Vendus</p>
                <p className="text-4xl font-bold text-[#111111]">
                  <AnimatedCounter value={stats.sold} />
                </p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </Link>

          <div className="group relative bg-gradient-to-br from-white to-gray-50/30 rounded-xl p-6 shadow-sm border border-[#E5E5E5]">
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm text-[#666666] mb-2 font-medium">Total Stock</p>
                <p className="text-4xl font-bold text-[#111111]">
                  <AnimatedCounter value={stats.total} />
                </p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m18 14-1-3"/>
                  <path d="m3 9 6 2a2 2 0 0 1 2-2h2a2 2 0 0 1 1.99 1.81"/>
                  <path d="M8 17h3a1 1 0 0 0 1-1 6 6 0 0 1 6-6 1 1 0 0 0 1-1v-.75A5 5 0 0 0 17 5"/>
                  <circle cx="19" cy="17" r="3"/>
                  <circle cx="5" cy="17" r="3"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-white to-green-50/30 rounded-xl p-6 shadow-sm border border-[#E5E5E5]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center shadow-md">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#111111]">Valeur du Stock</h3>
                <p className="text-sm text-[#666666]">Prix d'achat des véhicules disponibles</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-green-600">
              {stats.stockValue.toLocaleString('fr-FR')} €
            </p>
          </div>

          <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-xl p-6 shadow-sm border border-[#E5E5E5]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center shadow-md">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#111111]">Marges Réalisées</h3>
                <p className="text-sm text-[#666666]">Sur les véhicules vendus</p>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-[#666666]">Marge totale</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.totalMargin.toLocaleString('fr-FR')} €
                </p>
              </div>
              <div>
                <p className="text-sm text-[#666666]">Marge moyenne</p>
                <p className="text-xl font-bold text-[#111111]">
                  {stats.averageMargin.toLocaleString('fr-FR')} €
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">

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
