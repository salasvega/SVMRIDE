import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Container } from '../../components/ui/Container';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import type { Vehicle } from '../../types/vehicle';

export function VehiclesList() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) return;

    try {
      const { error } = await supabase.from('vehicles').delete().eq('id', id);

      if (error) throw error;

      setVehicles(vehicles.filter((v) => v.id !== id));
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      alert('Erreur lors de la suppression du véhicule');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Container>
          <div className="text-center py-12">
            <p className="text-[#666666]">Chargement...</p>
          </div>
        </Container>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Container>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#111111] mb-2">Véhicules</h1>
            <p className="text-[#666666]">{vehicles.length} véhicule(s) au total</p>
          </div>
          <Link to="/admin/vehicles/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un véhicule
            </Button>
          </Link>
        </div>

        {vehicles.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-[#666666] mb-4">Aucun véhicule pour le moment</p>
            <Link to="/admin/vehicles/new">
              <Button>Ajouter votre premier véhicule</Button>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F9F9F9] border-b border-[#E5E5E5]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#666666] uppercase tracking-wider">
                      Véhicule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#666666] uppercase tracking-wider">
                      Prix
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#666666] uppercase tracking-wider">
                      Km
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#666666] uppercase tracking-wider">
                      Année
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#666666] uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-[#666666] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E5]">
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-[#F9F9F9]">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {vehicle.images && vehicle.images[0] && (
                            <img
                              src={vehicle.images[0]}
                              alt={`${vehicle.brand} ${vehicle.model}`}
                              className="w-16 h-16 object-cover rounded mr-4"
                            />
                          )}
                          <div>
                            <p className="font-semibold text-[#111111]">
                              {vehicle.brand} {vehicle.model}
                            </p>
                            <p className="text-sm text-[#666666]">{vehicle.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#111111] font-semibold">
                        {vehicle.price.toLocaleString('fr-FR')} €
                      </td>
                      <td className="px-6 py-4 text-[#666666]">
                        {vehicle.mileage.toLocaleString('fr-FR')} km
                      </td>
                      <td className="px-6 py-4 text-[#666666]">{vehicle.year}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            vehicle.status === 'available'
                              ? 'bg-green-100 text-green-800'
                              : vehicle.status === 'sold'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {vehicle.status === 'available'
                            ? 'Disponible'
                            : vehicle.status === 'sold'
                            ? 'Vendu'
                            : 'Réservé'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/vehicules/${vehicle.slug}`}
                            target="_blank"
                            className="p-2 text-[#666666] hover:text-[#D10000] hover:bg-[#F9F9F9] rounded"
                            title="Voir"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/admin/vehicles/edit/${vehicle.id}`}
                            className="p-2 text-[#666666] hover:text-[#D10000] hover:bg-[#F9F9F9] rounded"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(vehicle.id)}
                            className="p-2 text-[#666666] hover:text-red-600 hover:bg-[#F9F9F9] rounded"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Container>
    </AdminLayout>
  );
}
