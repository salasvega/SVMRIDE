import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { FileText, Search, Filter, Trash2, Plus } from 'lucide-react';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';

interface DocumentMetadata {
  type: string;
  filename: string;
  path: string;
  upload_date: string;
}

interface SalesFolder {
  id: string;
  folder_number: string;
  vehicle_id: string | null;
  status: 'en_cours' | 'complete' | 'archive';
  client_first_name: string;
  client_last_name: string;
  client_email: string | null;
  client_phone: string | null;
  sale_date: string;
  sale_price: number | null;
  deposit_amount: number | null;
  balance_amount: number | null;
  documents: DocumentMetadata[];
  created_at: string;
  vehicle?: {
    brand: string;
    model: string;
    year: number;
  };
}

const statusLabels: Record<string, string> = {
  en_cours: 'En cours',
  complete: 'Complété',
  archive: 'Archivé',
};

const statusColors: Record<string, string> = {
  en_cours: 'bg-yellow-100 text-yellow-800',
  complete: 'bg-green-100 text-green-800',
  archive: 'bg-gray-100 text-gray-800',
};

export function SalesFoldersList() {
  const [folders, setFolders] = useState<SalesFolder[]>([]);
  const [filteredFolders, setFilteredFolders] = useState<SalesFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<SalesFolder | null>(null);

  useEffect(() => {
    fetchFolders();
  }, []);

  useEffect(() => {
    filterFolders();
  }, [folders, searchTerm, statusFilter]);

  async function fetchFolders() {
    try {
      const { data: foldersData, error } = await supabase
        .from('sales_folders')
        .select(`
          *,
          vehicle:vehicles(brand, model, year)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFolders(foldersData || []);
    } catch (error) {
      console.error('Error fetching sales folders:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterFolders() {
    let filtered = [...folders];

    if (statusFilter !== 'all') {
      filtered = filtered.filter((f) => f.status === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.folder_number.toLowerCase().includes(term) ||
          f.client_first_name.toLowerCase().includes(term) ||
          f.client_last_name.toLowerCase().includes(term) ||
          f.client_email?.toLowerCase().includes(term) ||
          f.vehicle?.brand.toLowerCase().includes(term) ||
          f.vehicle?.model.toLowerCase().includes(term)
      );
    }

    setFilteredFolders(filtered);
  }

  async function handleDelete(folder: SalesFolder) {
    try {
      if (folder.documents && folder.documents.length > 0) {
        const filePaths = folder.documents.map(doc => doc.path);

        const { error: storageError } = await supabase.storage
          .from('sales-documents')
          .remove(filePaths);

        if (storageError) {
          console.error('Error deleting files from storage:', storageError);
        }
      }

      const { error } = await supabase
        .from('sales_folders')
        .delete()
        .eq('id', folder.id);

      if (error) throw error;

      setFolders(folders.filter((f) => f.id !== folder.id));
      setDeleteModalOpen(false);
      setFolderToDelete(null);
    } catch (error) {
      console.error('Error deleting sales folder:', error);
      alert('Erreur lors de la suppression du dossier');
    }
  }

  const stats = {
    total: folders.length,
    en_cours: folders.filter((f) => f.status === 'en_cours').length,
    complete: folders.filter((f) => f.status === 'complete').length,
    archive: folders.filter((f) => f.status === 'archive').length,
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-[#666666]">Chargement...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#111111]">Dossiers de Vente</h1>
           
          </div>
          <Link to="/admin/sales-folders/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Nouveau Dossier
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => setStatusFilter('all')}
            className={`bg-white rounded-lg p-4 border-2 text-left transition-all hover:shadow-md ${
              statusFilter === 'all' ? 'border-[#FF5C00] ring-2 ring-[#FF5C00] ring-opacity-20' : 'border-[#D1D5DB]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#666666]">Total</p>
                <p className="text-2xl font-bold text-[#111111]">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-[#FF5C00]" />
            </div>
          </button>
          <button
            onClick={() => setStatusFilter('en_cours')}
            className={`bg-white rounded-lg p-4 border-2 text-left transition-all hover:shadow-md ${
              statusFilter === 'en_cours' ? 'border-yellow-600 ring-2 ring-yellow-600 ring-opacity-20' : 'border-[#D1D5DB]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#666666]">En cours</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.en_cours}</p>
              </div>
              <FileText className="w-8 h-8 text-yellow-600" />
            </div>
          </button>
          <button
            onClick={() => setStatusFilter('complete')}
            className={`bg-white rounded-lg p-4 border-2 text-left transition-all hover:shadow-md ${
              statusFilter === 'complete' ? 'border-green-600 ring-2 ring-green-600 ring-opacity-20' : 'border-[#D1D5DB]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#666666]">Complétés</p>
                <p className="text-2xl font-bold text-green-600">{stats.complete}</p>
              </div>
              <FileText className="w-8 h-8 text-green-600" />
            </div>
          </button>
          <button
            onClick={() => setStatusFilter('archive')}
            className={`bg-white rounded-lg p-4 border-2 text-left transition-all hover:shadow-md ${
              statusFilter === 'archive' ? 'border-gray-600 ring-2 ring-gray-600 ring-opacity-20' : 'border-[#D1D5DB]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#666666]">Archivés</p>
                <p className="text-2xl font-bold text-gray-600">{stats.archive}</p>
              </div>
              <FileText className="w-8 h-8 text-gray-600" />
            </div>
          </button>
        </div>

        <div className="bg-white rounded-lg p-6 border-2 border-[#D1D5DB]">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#666666] w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par numéro, client, véhicule..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#D1D5DB] rounded-lg focus:ring-2 focus:ring-[#FF5C00] focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-[#666666]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-[#D1D5DB] rounded-lg focus:ring-2 focus:ring-[#FF5C00] focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="en_cours">En cours</option>
                <option value="complete">Complétés</option>
                <option value="archive">Archivés</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5E5E5]">
                   <th className="text-left py-3 px-4 text-sm font-semibold text-[#111111]">
                    STATUT
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#111111]">
                    N° DOSSIER
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#111111]">
                    CLIENT
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#111111]">
                    VEHICULE
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#111111]">
                    DATE
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#111111]">
                    PRIX
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#111111]">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredFolders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-[#666666]">
                      Aucun dossier trouvé
                    </td>
                  </tr>
                ) : (
                  filteredFolders.map((folder) => (
                    <tr
                      key={folder.id}
                      className="border-b border-[#E5E5E5] hover:bg-gray-50 cursor-pointer"
                      onDoubleClick={() => window.location.href = `/admin/sales-folders/${folder.id}`}
                    >
                       <td className="py-3 px-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            statusColors[folder.status]
                          }`}
                        >
                          {statusLabels[folder.status]}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm text-[#FF5C00] font-semibold">
                          {folder.folder_number}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <div className="font-medium text-[#111111]">
                            {folder.client_first_name} {folder.client_last_name}
                          </div>
                          {folder.client_email && (
                            <div className="text-[#666666] text-xs">
                              {folder.client_email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {folder.vehicle ? (
                          <div className="text-sm text-[#111111]">
                            {folder.vehicle.brand} {folder.vehicle.model}
                            <span className="text-[#666666] ml-1">
                              ({folder.vehicle.year})
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#666666] text-sm">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-[#666666]">
                        {new Date(folder.sale_date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3 px-4">
                        {folder.sale_price ? (
                          <span className="text-sm font-semibold text-[#111111]">
                            {folder.sale_price.toLocaleString('fr-FR')} €
                          </span>
                        ) : (
                          <span className="text-[#666666] text-sm">-</span>
                        )}
                      </td>
                     
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFolderToDelete(folder);
                              setDeleteModalOpen(true);
                            }}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
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
      </div>

      {deleteModalOpen && folderToDelete && (
        <DeleteConfirmModal
          title="Supprimer le dossier"
          message={`Êtes-vous sûr de vouloir supprimer le dossier ${folderToDelete.folder_number} de ${folderToDelete.client_first_name} ${folderToDelete.client_last_name} ?`}
          onConfirm={() => handleDelete(folderToDelete)}
          onCancel={() => {
            setDeleteModalOpen(false);
            setFolderToDelete(null);
          }}
        />
      )}
    </AdminLayout>
  );
}
