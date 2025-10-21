import { useEffect, useState } from 'react';
import { Eye, Trash2, Filter } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Container } from '../../components/ui/Container';
import { Select } from '../../components/ui/Select';
import { supabase } from '../../lib/supabase';
import { SubmissionDetailsModal } from '../../components/admin/SubmissionDetailsModal';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';

type Submission = {
  id: string;
  type: 'contact' | 'financing' | 'trade_in' | 'custom_search';
  status: 'new' | 'in_progress' | 'completed';
  name: string;
  email: string;
  phone: string;
  message?: string;
  subject?: string;
  created_at: string;
  data?: Record<string, any>;
};

export default function SubmissionsList() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [submissionToDelete, setSubmissionToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('contact_submissions')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setSubmissions(
        submissions.map((sub) => (sub.id === id ? { ...sub, status: newStatus as any } : sub))
      );
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const handleDelete = async () => {
    if (!submissionToDelete) return;

    try {
      const { error } = await supabase.from('contact_submissions').delete().eq('id', submissionToDelete);

      if (error) throw error;

      setSubmissions(submissions.filter((sub) => sub.id !== submissionToDelete));
      setSubmissionToDelete(null);
    } catch (error) {
      console.error('Error deleting submission:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    if (filter !== 'all' && sub.type !== filter) return false;
    if (statusFilter !== 'all' && sub.status !== statusFilter) return false;
    return true;
  });

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      contact: 'Contact',
      financing: 'Financement',
      trade_in: 'Reprise',
      custom_search: 'Recherche personnalisée',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
    };
    const labels: Record<string, string> = {
      new: 'Nouvelle',
      in_progress: 'En cours',
      completed: 'Terminée',
    };
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#111111] mb-2">Demandes clients</h1>
          <p className="text-[#666666]">{filteredSubmissions.length} demande(s)</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-[#666666]" />
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="flex-1"
            >
              <option value="all">Tous les types</option>
              <option value="contact">Contact</option>
              <option value="financing">Financement</option>
              <option value="trade_in">Reprise</option>
              <option value="custom_search">Recherche personnalisée</option>
            </Select>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1"
            >
              <option value="all">Tous les statuts</option>
              <option value="new">Nouvelles</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Terminées</option>
            </Select>
          </div>
        </div>

        {filteredSubmissions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-[#666666]">Aucune demande pour le moment</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F9F9F9] border-b border-[#E5E5E5]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#666666] uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#666666] uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#666666] uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#666666] uppercase tracking-wider">
                      Contact
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
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-[#F9F9F9]">
                      <td className="px-6 py-4 text-sm text-[#666666]">
                        {new Date(submission.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-[#111111]">
                          {getTypeLabel(submission.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-[#111111]">{submission.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-[#666666]">{submission.email}</p>
                        <p className="text-sm text-[#666666]">{submission.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Select
                          value={submission.status}
                          onChange={(e) => handleStatusChange(submission.id, e.target.value)}
                          className="text-sm"
                        >
                          <option value="new">Nouvelle</option>
                          <option value="in_progress">En cours</option>
                          <option value="completed">Terminée</option>
                        </Select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedSubmission(submission)}
                            className="p-2 text-[#666666] hover:text-[#D10000] hover:bg-[#F9F9F9] rounded transition-colors"
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSubmissionToDelete(submission.id)}
                            className="p-2 text-[#666666] hover:text-red-600 hover:bg-[#F9F9F9] rounded transition-colors"
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

        {selectedSubmission && (
          <SubmissionDetailsModal
            submission={selectedSubmission}
            onClose={() => setSelectedSubmission(null)}
          />
        )}

        {submissionToDelete && (
          <DeleteConfirmModal
            title="Confirmer la suppression"
            message="Êtes-vous sûr de vouloir supprimer cette demande ? Cette action est irréversible."
            onConfirm={handleDelete}
            onCancel={() => setSubmissionToDelete(null)}
          />
        )}
      </Container>
    </AdminLayout>
  );
}
