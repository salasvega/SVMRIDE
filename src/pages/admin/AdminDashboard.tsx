import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Car, FileText, BarChart3, TrendingUp } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Container } from '../../components/ui/Container';
import { supabase } from '../../lib/supabase';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    totalSubmissions: 0,
    newSubmissions: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [vehiclesRes, submissionsRes, newSubmissionsRes] = await Promise.all([
        supabase.from('vehicles').select('id', { count: 'exact', head: true }),
        supabase.from('contact_submissions').select('id', { count: 'exact', head: true }),
        supabase
          .from('contact_submissions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'new'),
      ]);

      setStats({
        totalVehicles: vehiclesRes.count || 0,
        totalSubmissions: submissionsRes.count || 0,
        newSubmissions: newSubmissionsRes.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const statCards = [
    {
      title: 'Véhicules',
      value: stats.totalVehicles,
      icon: Car,
      link: '/admin/vehicles',
      color: 'bg-blue-500',
    },
    {
      title: 'Demandes totales',
      value: stats.totalSubmissions,
      icon: FileText,
      link: '/admin/submissions',
      color: 'bg-green-500',
    },
    {
      title: 'Nouvelles demandes',
      value: stats.newSubmissions,
      icon: TrendingUp,
      link: '/admin/submissions',
      color: 'bg-[#D10000]',
    },
  ];

  return (
    <AdminLayout>
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#111111] mb-2">
            Tableau de bord
          </h1>
          <p className="text-[#666666]">
            Vue d'ensemble de votre activité
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat) => (
            <Link
              key={stat.title}
              to={stat.link}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-[#666666] text-sm mb-1">{stat.title}</p>
              <p className="text-3xl font-bold text-[#111111]">{stat.value}</p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <Car className="w-5 h-5 text-[#D10000] mr-2" />
              <h2 className="text-xl font-semibold text-[#111111]">
                Gestion des véhicules
              </h2>
            </div>
            <p className="text-[#666666] mb-4">
              Ajoutez, modifiez ou supprimez des véhicules de votre catalogue.
            </p>
            <Link
              to="/admin/vehicles"
              className="text-[#D10000] font-semibold hover:underline"
            >
              Voir tous les véhicules →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <FileText className="w-5 h-5 text-[#D10000] mr-2" />
              <h2 className="text-xl font-semibold text-[#111111]">
                Demandes clients
              </h2>
            </div>
            <p className="text-[#666666] mb-4">
              Consultez et gérez les demandes de contact, financement et reprise.
            </p>
            <Link
              to="/admin/submissions"
              className="text-[#D10000] font-semibold hover:underline"
            >
              Voir les demandes →
            </Link>
          </div>
        </div>
      </Container>
    </AdminLayout>
  );
}
