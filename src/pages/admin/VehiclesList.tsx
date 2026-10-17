import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Trash2, Eye, EyeOff, Plus, Search, Bike, Package, ShoppingCart, CheckCircle } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { Vehicle } from '../../types/vehicle';
import { formatPrice } from '../../utils/vehicle-filters';
import { siteConfig } from '../../config/site';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';

export function VehiclesList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setStatusFilter(statusParam);
    }
  }, [searchParams]);

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

  function handleRowDoubleClick(vehicleId: string) {
    navigate(`/admin/vehicles/edit/${vehicleId}`);
  }

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'all' || vehicle.type === typeFilter;

    const vehicleStatus = (vehicle as any).status || 'available';
    const matchesStatus = statusFilter === 'all' || vehicleStatus === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: vehicles.length,
    available: vehicles.filter(v => ((v as any).status || 'available') === 'available').length,
    reserved: vehicles.filter(v => ((v as any).status || 'available') === 'reserved').length,
    sold: vehicles.filter(v => ((v as any).status || 'available') === 'sold').length,
  };

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
        <div>
          <h1 className="text-3xl font-bold text-[#111111]">Véhicules</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => setStatusFilter('all')}
            className={`bg-white rounded-lg p-4 border-2 text-left transition-all hover:shadow-md ${
              statusFilter === 'all' ? 'border-bleu ring-2 ring-bleu ring-opacity-20' : 'border-[#D1D5DB]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#666666]">Total Véhicules</p>
                <p className="text-2xl font-bold text-[#111111]">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Bike className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </button>

          <button
            onClick={() => setStatusFilter('available')}
            className={`bg-white rounded-lg p-4 border-2 text-left transition-all hover:shadow-md ${
              statusFilter === 'available' ? 'border-green-600 ring-2 ring-green-600 ring-opacity-20' : 'border-[#D1D5DB]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#666666]">Disponibles</p>
                <p className="text-2xl font-bold text-green-600">{stats.available}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </button>

          <button
            onClick={() => setStatusFilter('reserved')}
            className={`bg-white rounded-lg p-4 border-2 text-left transition-all hover:shadow-md ${
              statusFilter === 'reserved' ? 'border-yellow-600 ring-2 ring-yellow-600 ring-opacity-20' : 'border-[#D1D5DB]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#666666]">Réservés</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.reserved}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </button>

          <button
            onClick={() => setStatusFilter('sold')}
            className={`bg-white rounded-lg p-4 border-2 text-left transition-all hover:shadow-md ${
              statusFilter === 'sold' ? 'border-blue-600 ring-2 ring-blue-600 ring-opacity-20' : 'border-[#D1D5DB]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#666666]">Vendus</p>
                <p className="text-2xl font-bold text-blue-600">{stats.sold}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] overflow-hidden">
          <div className="p-6 border-b border-[#E5E5E5]">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#666666] w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher par marque, modèle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-[#E5E5E5] rounded-lg focus:ring-2 focus:ring-bleu/40 focus:border-transparent"
                />
              </div>

              <div className="flex gap-4">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="min-w-[120px] px-4 py-2 border border-[#E5E5E5] rounded-lg focus:ring-2 focus:ring-bleu/40 focus:border-transparent bg-white text-[#111111]"
                >
                  <option value="all">Tous types</option>
                  <option value="moto">Moto</option>
                  <option value="scooter">Scooter</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="min-w-[150px] px-4 py-2 border border-[#E5E5E5] rounded-lg focus:ring-2 focus:ring-bleu/40 focus:border-transparent bg-white text-[#111111]"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="available">Disponible</option>
                  <option value="reserved">Réservé</option>
                  <option value="sold">Vendu</option>
                </select>
              </div>
            </div>
          </div>
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
                    Prix vente
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
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-[#666666]">
                      Aucun véhicule trouvé
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((vehicle) => (
                  <tr
                    key={vehicle.id}
                    className="hover:bg-[#F9F9F9] cursor-pointer"
                    onDoubleClick={() => handleRowDoubleClick(vehicle.id)}
                  >
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
                        <button
                          onClick={() => setVehicleToDelete(vehicle.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end">
          <Link to="/admin/vehicles/new">
            <Button className="flex items-center justify-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Ajouter un véhicule</span>
            </Button>
          </Link>
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
