import { useEffect, useState } from 'react';
import { Eye, Trash2, Filter, Search } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Container } from '../../components/ui/Container';
import { Select } from '../../components/ui/Select';
import { supabase } from '../../lib/supabase';
import { SubmissionDetailsModal } from '../../components/admin/SubmissionDetailsModal';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';

type Attachment = {
  filename: string;
  path: string;
  size: number;
  mime_type: string;
};

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
  attachments?: Attachment[];
};

export default function SubmissionsList() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [submissionToDelete, setSubmissionToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      const [contactRes, financingRes, tradeInRes, customSearchRes] = await Promise.all([
        supabase.from('contact_submissions').select('*'),
        supabase.from('financing_submissions').select('*'),
        supabase.from('trade_in_submissions').select('*'),
        supabase.from('custom_search_submissions').select('*'),
      ]);

      const allSubmissions: Submission[] = [];

      if (contactRes.data) {
        allSubmissions.push(
          ...contactRes.data.map((item) => ({
            id: item.id,
            type: 'contact' as const,
            status: item.status,
            name: item.name,
            email: item.email,
            phone: '',
            subject: item.subject,
            message: item.message,
            created_at: item.created_at,
            attachments: item.attachments || [],
          }))
        );
      }

      if (financingRes.data) {
        allSubmissions.push(
          ...financingRes.data.map((item) => ({
            id: item.id,
            type: 'financing' as const,
            status: item.status,
            name: item.name,
            email: item.email,
            phone: item.phone,
            created_at: item.created_at,
            message: item.comments,
            data: {
              montant: item.amount,
              durée: item.duration,
            },
            attachments: item.attachments || [],
          }))
        );
      }

      if (tradeInRes.data) {
        allSubmissions.push(
          ...tradeInRes.data.map((item) => ({
            id: item.id,
            type: 'trade_in' as const,
            status: item.status,
            name: item.name,
            email: item.email,
            phone: item.phone,
            created_at: item.created_at,
            data: {
              marque: item.brand,
              modèle: item.model,
              année: item.year,
              kilométrage: item.mileage,
              état: item.condition,
              commentaires: item.comments,
            },
            attachments: item.attachments || [],
          }))
        );
      }

      if (customSearchRes.data) {
        allSubmissions.push(
          ...customSearchRes.data.map((item) => ({
            id: item.id,
            type: 'custom_search' as const,
            status: item.status,
            name: item.name,
            email: item.email,
            phone: item.phone,
            created_at: item.created_at,
            data: {
              type_véhicule: item.type,
              marque: item.brand,
              cylindrée: item.displacement,
              année_min: item.year_min,
              budget_max: item.budget_max,
              délai: item.deadline,
              commentaires: item.comments,
            },
            attachments: item.attachments || [],
          }))
        );
      }

      allSubmissions.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setSubmissions(allSubmissions);
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const submission = submissions.find((s) => s.id === id);
    if (!submission) return;

    try {
      const tableNames: Record<string, string> = {
        contact: 'contact_submissions',
        financing: 'financing_submissions',
        trade_in: 'trade_in_submissions',
        custom_search: 'custom_search_submissions',
      };

      const tableName = tableNames[submission.type];
      const { error } = await supabase
        .from(tableName)
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      const updatedSubmissions = submissions.map((sub) =>
        sub.id === id ? { ...sub, status: newStatus as any } : sub
      );
      setSubmissions(updatedSubmissions);

      if (selectedSubmission && selectedSubmission.id === id) {
        setSelectedSubmission({ ...selectedSubmission, status: newStatus as any });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const handleDelete = async () => {
    if (!submissionToDelete) return;

    const submission = submissions.find((s) => s.id === submissionToDelete);
    if (!submission) return;

    try {
      const tableNames: Record<string, string> = {
        contact: 'contact_submissions',
        financing: 'financing_submissions',
        trade_in: 'trade_in_submissions',
        custom_search: 'custom_search_submissions',
      };

      const tableName = tableNames[submission.type];
      const { error } = await supabase.from(tableName).delete().eq('id', submissionToDelete);

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

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const searchableText = [
        sub.name,
        sub.email,
        sub.phone,
        sub.message,
        sub.subject,
        JSON.stringify(sub.data)
      ].join(' ').toLowerCase();

      if (!searchableText.includes(query)) return false;
    }

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

  const getSelectBackgroundColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-50 border-blue-200',
      in_progress: 'bg-yellow-50 border-yellow-200',
      completed: 'bg-green-50 border-green-200',
    };
    return colors[status] || 'bg-white';
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
          <div className="flex flex-col gap-4">
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
            <div className="flex items-center gap-4">
              <Search className="w-5 h-5 text-[#666666]" />
              <input
                type="text"
                placeholder="Rechercher par nom, email, téléphone, message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D10000] focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-sm text-[#666666] hover:text-[#D10000] transition-colors"
                >
                  Effacer
                </button>
              )}
            </div>
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
                    <tr
                      key={submission.id}
                      className="hover:bg-[#F9F9F9] cursor-pointer"
                      onDoubleClick={() => setSelectedSubmission(submission)}
                    >
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
                          className={`text-sm ${getSelectBackgroundColor(submission.status)}`}
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
                            className="p-2 text-[#D10000] hover:bg-[#F9F9F9] rounded transition-colors"
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSubmissionToDelete(submission.id)}
                            className="p-2 text-[#D10000] hover:bg-[#F9F9F9] rounded transition-colors"
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
            onStatusChange={handleStatusChange}
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
