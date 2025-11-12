import { useEffect, useState } from 'react';
import { Trash2, Filter, Search, Circle, Clock, CheckCircle2, Download, FileText } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Container } from '../../components/ui/Container';
import { Select } from '../../components/ui/Select';
import { supabase } from '../../lib/supabase';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';
import Toast from '../../components/ui/Toast';

type FinancingProfile = {
  id: string;
  user_email: string;
  last_name: string;
  first_name: string;
  birth_postal_code: string;
  birth_date: string;
  current_address: string;
  phone_number: string;
  email: string;
  housing_entry_date: string;
  housing_status: string;
  rent_or_credit_amount: number;
  job_title: string;
  employment_start_date: string;
  contract_type: string;
  monthly_net_salary: number;
  other_charges_or_credits: string;
  other_income_sources: string;
  marital_status: string;
  dependents_count: number;
  vehicle_to_finance: string;
  financing_amount: number;
  desired_duration: number;
  id_card_front: string;
  id_card_back: string;
  driver_license_front: string;
  driver_license_back: string;
  proof_of_residence: string;
  payslip_1: string;
  payslip_2: string;
  payslip_3: string;
  tax_notice: string;
  rib: string;
  hosting_certificate: string;
  host_id_card: string;
  status: string;
  is_complete: boolean;
  submitted_at: string;
  created_at: string;
  admin_notes?: string;
  comments?: string;
};

export default function FinancingProfilesList() {
  const [profiles, setProfiles] = useState<FinancingProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProfile, setSelectedProfile] = useState<FinancingProfile | null>(null);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_financing_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des dossiers' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!profileToDelete) return;

    try {
      const { error } = await supabase
        .from('user_financing_profiles')
        .delete()
        .eq('id', profileToDelete);

      if (error) throw error;

      setProfiles(profiles.filter((p) => p.id !== profileToDelete));
      setProfileToDelete(null);
      setMessage({ type: 'success', text: 'Dossier supprimé avec succès' });
    } catch (error) {
      console.error('Error deleting profile:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la suppression du dossier' });
    }
  };

  const handleStatusChange = async (profileId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('user_financing_profiles')
        .update({ status: newStatus })
        .eq('id', profileId);

      if (error) throw error;

      setProfiles(
        profiles.map((p) => (p.id === profileId ? { ...p, status: newStatus } : p))
      );

      if (selectedProfile?.id === profileId) {
        setSelectedProfile({ ...selectedProfile, status: newStatus });
      }
      setMessage({ type: 'success', text: 'Statut mis à jour avec succès' });
    } catch (error) {
      console.error('Error updating status:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour du statut' });
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedProfile) return;

    setSavingNotes(true);
    try {
      const { error } = await supabase
        .from('user_financing_profiles')
        .update({ admin_notes: adminNotes })
        .eq('id', selectedProfile.id);

      if (error) throw error;

      setProfiles(
        profiles.map((p) =>
          p.id === selectedProfile.id ? { ...p, admin_notes: adminNotes } : p
        )
      );
      setSelectedProfile({ ...selectedProfile, admin_notes: adminNotes });
      setMessage({ type: 'success', text: 'Notes enregistrées avec succès' });
      setSelectedProfile(null);
    } catch (error) {
      console.error('Error saving notes:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde des notes' });
    } finally {
      setSavingNotes(false);
    }
  };

  const downloadDocument = async (path: string, filename: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('financing-documents')
        .download(path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Document téléchargé avec succès' });
    } catch (error) {
      console.error('Error downloading document:', error);
      setMessage({ type: 'error', text: 'Erreur lors du téléchargement du document' });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { icon: Circle, color: 'text-gray-500 bg-gray-100', label: 'Brouillon' },
      new: { icon: Circle, color: 'text-blue-500 bg-blue-100', label: 'Nouveau' },
      in_progress: { icon: Clock, color: 'text-yellow-500 bg-yellow-100', label: 'En cours' },
      completed: { icon: CheckCircle2, color: 'text-green-500 bg-green-100', label: 'Traité' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const filteredProfiles = profiles.filter((profile) => {
    const matchesStatus = statusFilter === 'all' || profile.status === statusFilter;
    const matchesSearch =
      profile.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.vehicle_to_finance.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const documents = selectedProfile ? [
    { label: 'Pièce d\'identité (Recto)', path: selectedProfile.id_card_front },
    { label: 'Pièce d\'identité (Verso)', path: selectedProfile.id_card_back },
    { label: 'Permis de conduire (Recto)', path: selectedProfile.driver_license_front },
    { label: 'Permis de conduire (Verso)', path: selectedProfile.driver_license_back },
    { label: 'Justificatif de domicile', path: selectedProfile.proof_of_residence },
    { label: 'Bulletin de salaire 1', path: selectedProfile.payslip_1 },
    { label: 'Bulletin de salaire 2', path: selectedProfile.payslip_2 },
    { label: 'Bulletin de salaire 3', path: selectedProfile.payslip_3 },
    { label: 'Avis d\'imposition', path: selectedProfile.tax_notice },
    { label: 'RIB', path: selectedProfile.rib },
    { label: 'Attestation d\'hébergement', path: selectedProfile.hosting_certificate },
    { label: 'Pièce d\'identité de l\'hébergeur', path: selectedProfile.host_id_card },
  ].filter(doc => doc.path) : [];

  return (
    <AdminLayout>
      {message && (
        <Toast
          type={message.type}
          message={message.text}
          onClose={() => setMessage(null)}
        />
      )}
      <Container> 
<div className="mb-8">

          <div>
            <h1 className="text-3xl font-bold text-[#111111]">Dossiers de Financement</h1>
            <p className="text-[#666666]">{filteredProfiles.length} dossier{filteredProfiles.length > 1 ? 's' : ''}
           </p>
          </div>


        <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] mb-6">
          <div className="p-6 border-b border-[#E5E5E5]">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#666666] w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, email, véhicule..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-[#E5E5E5] rounded-lg focus:ring-2 focus:ring-[#E31837] focus:border-transparent"
                />
              </div>

              <div className="flex gap-4">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="min-w-[150px]"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="draft">Brouillon</option>
                  <option value="new">Nouveau</option>
                  <option value="in_progress">En cours</option>
                  <option value="completed">Traité</option>
                </Select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-[#666666]">
                Chargement des dossiers...
              </div>
            ) : filteredProfiles.length === 0 ? (
              <div className="p-8 text-center text-[#666666]">
                Aucun dossier trouvé
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-[#F9F9F9]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">
                      Véhicule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">
                      Durée
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[#666666] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#E5E5E5]">
                  {filteredProfiles.map((profile) => (
                    <tr
                      key={profile.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onDoubleClick={() => {
                        setSelectedProfile(profile);
                        setAdminNotes(profile.admin_notes || '');
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(profile.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#666666]">
                        {profile.submitted_at ? formatDate(profile.submitted_at) : formatDate(profile.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-[#111111]">
                          {profile.first_name} {profile.last_name}
                        </div>
                        <div className="text-sm text-[#666666]">{profile.email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#111111]">
                        {profile.vehicle_to_finance || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-[#111111]">
                        {formatCurrency(profile.financing_amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#666666]">
                        {profile.desired_duration} mois
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setProfileToDelete(profile.id);
                            }}
                            className="text-red-600 hover:text-red-800"
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
            )}
          </div>
        </div>

        {selectedProfile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-[#E5E5E5] px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-[#111111]">
                  Dossier de Financement
                </h2>
                <button
                  onClick={() => setSelectedProfile(null)}
                  className="text-[#666666] hover:text-[#111111]"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#666666]">Date de soumission</p>
                    <p className="text-sm font-medium text-[#111111] mt-1">
                      {selectedProfile.submitted_at ? formatDate(selectedProfile.submitted_at) : formatDate(selectedProfile.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#666666]">Statut du dossier</p>
                    <Select
                      value={selectedProfile.status}
                      onChange={(e) => handleStatusChange(selectedProfile.id, e.target.value)}
                      className="mt-2"
                    >
                      <option value="draft">Brouillon</option>
                      <option value="new">Nouveau</option>
                      <option value="in_progress">En cours</option>
                      <option value="completed">Traité</option>
                    </Select>
                  </div>
                </div>

                <div className="border-t border-[#E5E5E5] pt-6">
                  <h3 className="text-lg font-semibold text-[#111111] mb-4">Informations Personnelles</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-[#666666]">Nom</p>
                      <p className="text-sm font-medium text-[#111111]">{selectedProfile.last_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#666666]">Prénom</p>
                      <p className="text-sm font-medium text-[#111111]">{selectedProfile.first_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#666666]">Date de naissance</p>
                      <p className="text-sm font-medium text-[#111111]">{selectedProfile.birth_date}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#666666]">Code postal de naissance</p>
                      <p className="text-sm font-medium text-[#111111]">{selectedProfile.birth_postal_code}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#666666]">Email</p>
                      <p className="text-sm font-medium text-[#111111]">{selectedProfile.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#666666]">Téléphone</p>
                      <p className="text-sm font-medium text-[#111111]">{selectedProfile.phone_number}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-[#666666]">Adresse actuelle</p>
                      <p className="text-sm font-medium text-[#111111]">{selectedProfile.current_address}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#E5E5E5] pt-6">
                  <h3 className="text-lg font-semibold text-[#111111] mb-4">Logement</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-[#666666]">Statut</p>
                      <p className="text-sm font-medium text-[#111111]">{selectedProfile.housing_status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#666666]">Date d'entrée</p>
                      <p className="text-sm font-medium text-[#111111]">{selectedProfile.housing_entry_date}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#666666]">Loyer/Crédit mensuel</p>
                      <p className="text-sm font-medium text-[#111111]">{formatCurrency(selectedProfile.rent_or_credit_amount)}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#E5E5E5] pt-6">
                  <h3 className="text-lg font-semibold text-[#111111] mb-4">Situation Professionnelle</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-[#666666]">Poste</p>
                      <p className="text-sm font-medium text-[#111111]">{selectedProfile.job_title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#666666]">Type de contrat</p>
                      <p className="text-sm font-medium text-[#111111]">{selectedProfile.contract_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#666666]">Date de début</p>
                      <p className="text-sm font-medium text-[#111111]">{selectedProfile.employment_start_date}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#666666]">Salaire net mensuel</p>
                      <p className="text-sm font-medium text-[#111111]">{formatCurrency(selectedProfile.monthly_net_salary)}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#E5E5E5] pt-6">
                  <h3 className="text-lg font-semibold text-[#111111] mb-4">Situation Financière</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-[#666666]">Autres charges ou crédits</p>
                      <p className="text-sm font-medium text-[#111111]">{selectedProfile.other_charges_or_credits || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#666666]">Autres sources de revenus</p>
                      <p className="text-sm font-medium text-[#111111]">{selectedProfile.other_income_sources || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#E5E5E5] pt-6">
                  <h3 className="text-lg font-semibold text-[#111111] mb-4">Situation Personnelle</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-[#666666]">Situation maritale</p>
                      <p className="text-sm font-medium text-[#111111]">{selectedProfile.marital_status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#666666]">Personnes à charge</p>
                      <p className="text-sm font-medium text-[#111111]">{selectedProfile.dependents_count}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#E5E5E5] pt-6">
                  <h3 className="text-lg font-semibold text-[#111111] mb-4">Détails du Financement</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-[#666666]">Véhicule</p>
                      <p className="text-sm font-medium text-[#111111]">{selectedProfile.vehicle_to_finance}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#666666]">Montant</p>
                      <p className="text-sm font-medium text-[#111111]">{formatCurrency(selectedProfile.financing_amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#666666]">Durée</p>
                      <p className="text-sm font-medium text-[#111111]">{selectedProfile.desired_duration} mois</p>
                    </div>
                    {selectedProfile.comments && (
                      <div className="col-span-2">
                        <p className="text-sm text-[#666666]">Commentaires</p>
                        <p className="text-sm font-medium text-[#111111] whitespace-pre-wrap">{selectedProfile.comments}</p>
                      </div>
                    )}
                  </div>
                </div>

                {documents.length > 0 && (
                  <div className="border-t border-[#E5E5E5] pt-6">
                    <h3 className="text-lg font-semibold text-[#111111] mb-4">Documents</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {documents.map((doc, index) => (
                        <button
                          key={index}
                          onClick={() => downloadDocument(doc.path, doc.label)}
                          className="flex items-center gap-2 p-3 border border-[#E5E5E5] rounded-lg hover:bg-gray-50 transition-colors text-left"
                        >
                          <FileText className="w-5 h-5 text-[#E31837] flex-shrink-0" />
                          <span className="text-sm text-[#111111] flex-1">{doc.label}</span>
                          <Download className="w-4 h-4 text-[#666666]" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-[#E5E5E5] pt-6">
                  <h3 className="text-lg font-semibold text-[#111111] mb-4">Notes administrateur</h3>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg focus:ring-2 focus:ring-[#E31837] focus:border-transparent resize-none"
                    rows={4}
                    placeholder="Ajoutez des notes internes sur ce dossier..."
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={handleSaveNotes}
                      disabled={savingNotes}
                      className="px-4 py-2 bg-[#E31837] text-white rounded-lg hover:bg-[#C1132E] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingNotes ? 'Enregistrement...' : 'Enregistrer les notes'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {profileToDelete && (
          <DeleteConfirmModal
            isOpen={true}
            onClose={() => setProfileToDelete(null)}
            onConfirm={handleDelete}
            title="Supprimer le dossier"
            message="Êtes-vous sûr de vouloir supprimer ce dossier de financement ? Cette action est irréversible."
          />
        )}
      </Container>
    </AdminLayout>
  );
}
