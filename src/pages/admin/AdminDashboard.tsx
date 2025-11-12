import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, FileText } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';

export function AdminDashboard() {
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
          <Link to="/admin/vehicles" className="bg-white rounded-xl p-6 shadow-sm border border-[#E5E5E5] hover:border-[#C62E2E] hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#666666] mb-1">Total véhicules</p>
                <p className="text-3xl font-bold text-[#111111]">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m18 14-1-3"/>
                  <path d="m3 9 6 2a2 2 0 0 1 2-2h2a2 2 0 0 1 1.99 1.81"/>
                  <path d="M8 17h3a1 1 0 0 0 1-1 6 6 0 0 1 6-6 1 1 0 0 0 1-1v-.75A5 5 0 0 0 17 5"/>
                  <circle cx="19" cy="17" r="3"/>
                  <circle cx="5" cy="17" r="3"/>
                </svg>
              </div>
            </div>
          </Link>

          <Link to="/admin/submissions" className="bg-white rounded-xl p-6 shadow-sm border border-[#E5E5E5] hover:border-[#C62E2E] hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#666666] mb-1">Messages reçus</p>
                <p className="text-3xl font-bold text-[#111111]">{stats.submissions}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Mail className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Link>

          <Link to="/admin/financing-profiles" className="bg-white rounded-xl p-6 shadow-sm border border-[#E5E5E5] hover:border-[#C62E2E] hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#666666] mb-1">Dossiers financement</p>
                <p className="text-3xl font-bold text-[#111111]">{stats.financingProfiles}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
