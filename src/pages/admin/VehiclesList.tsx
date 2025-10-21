import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Eye, EyeOff, Plus } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { Vehicle } from '../../types/vehicle';
import { formatPrice } from '../../utils/vehicle-filters';
import { siteConfig } from '../../config/site';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';

export function VehiclesList() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  async function fetchVehicles() {
    setLoading(true);
    const { data } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setVehicles(data as Vehicle[]);
    }
    setLoading(false);
  }

  async function toggleAvailability(id: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('vehicles')
      .update({ available: !currentStatus })
      .eq('id', id);

    if (!error) {
      fetchVehicles();
    }
  }

  async function deleteVehicle() {
    if (!vehicleToDelete) return;

    const { error } = await supabase.from('vehicles').delete().eq('id', vehicleToDelete);

    if (!error) {
      fetchVehicles();
      setVehicleToDelete(null);
    } else {
      alert('Erreur lors de la suppression du véhicule');
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-[#666666]">Chargement...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#111111]">Véhicules</h1>
            <p className="text-[#666666] mt-1">{vehicles.length} véhicules au total</p>
          </div>
          <Link to="/admin/vehicles/new">
            <Button className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Ajouter un véhicule</span>
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F9F9F9] border-b border-[#E5E5E5]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">
                    Photo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">
                    Véhicule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">
                    Prix
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">
                    Année
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">
                    Visibilité
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#666666] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-[#F9F9F9]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a
                        href={`${siteConfig.baseUrl}/vehicules/${vehicle.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={vehicle.images && vehicle.images.length > 0 ? vehicle.images[0] : '/placeholder-vehicle.jpg'}
                          alt={`${vehicle.brand} ${vehicle.model}`}
                          className="w-16 h-16 object-cover rounded-lg hover:opacity-80 transition-opacity"
                        />
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-[#111111]">
                            {vehicle.brand} {vehicle.model}
                          </div>
                          <div className="text-sm text-[#666666]">
                            {vehicle.displacement} cc
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                        {vehicle.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111111] font-medium">
                      {formatPrice(vehicle.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#666666]">
                      {vehicle.year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const status = (vehicle as any).status || 'available';
                        const statusConfig = {
                          available: { label: 'Disponible', color: 'bg-green-100 text-green-800' },
                          reserved: { label: 'Réservé', color: 'bg-orange-100 text-orange-800' },
                          sold: { label: 'Vendu', color: 'bg-red-100 text-red-800' }
                        };
                        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.available;
                        return (
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${config.color}`}>
                            {config.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleAvailability(vehicle.id, vehicle.available)}
                        className="flex items-center space-x-1"
                      >
                        {vehicle.available ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            <Eye className="w-3 h-3 mr-1" />
                            Visible
                          </span>
                        ) : (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            <EyeOff className="w-3 h-3 mr-1" />
                            Caché
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/admin/vehicles/edit/${vehicle.id}`}
                          className="text-[#C62E2E] hover:text-[#A02525] transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setVehicleToDelete(vehicle.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
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

        {vehicleToDelete && (
          <DeleteConfirmModal
            title="Confirmer la suppression"
            message="Êtes-vous sûr de vouloir supprimer ce véhicule ? Cette action est irréversible et supprimera toutes les données associées."
            onConfirm={deleteVehicle}
            onCancel={() => setVehicleToDelete(null)}
          />
        )}
      </div>
    </AdminLayout>
  );
}
