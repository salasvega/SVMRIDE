import { X, Mail, Phone, Calendar, MessageSquare, Tag, User, Paperclip, Download, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { supabase } from '../../lib/supabase';

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

interface SubmissionDetailsModalProps {
  submission: Submission;
  onClose: () => void;
  onStatusChange?: (id: string, newStatus: string) => void;
}

export function SubmissionDetailsModal({ submission, onClose, onStatusChange }: SubmissionDetailsModalProps) {
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      contact: 'Contact',
      financing: 'Financement',
      trade_in: 'Reprise',
      custom_search: 'Recherche personnalisée',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      contact: 'bg-blue-100 text-blue-800',
      financing: 'bg-green-100 text-green-800',
      trade_in: 'bg-orange-100 text-orange-800',
      custom_search: 'bg-purple-100 text-purple-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getSelectBackgroundColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-red-50 border-red-200',
      in_progress: 'bg-yellow-50 border-yellow-200',
      completed: 'bg-green-50 border-green-200',
    };
    return colors[status] || 'bg-white';
  };

  const handleStatusChange = (newStatus: string) => {
    if (onStatusChange) {
      onStatusChange(submission.id, newStatus);
    }
  };

  const handleDownloadAttachment = async (attachment: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('form-attachments')
        .download(attachment.path);

      if (error) {
        console.error('Error downloading file:', error);
        return;
      }

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="sticky top-0 bg-gradient-to-r from-[#C62E2E] to-[#D10000] text-white px-6 py-5 flex items-center justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/fond_carbonne_nid_abeilles.png')] bg-center bg-cover opacity-80"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold">{getTypeLabel(submission.type)}</h2>
            <p className="text-sm text-white/80 mt-1">
              {new Date(submission.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors relative z-10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            <div className="flex items-center gap-3 justify-between">
              <div className="flex-shrink-0">
                <Select
                  value={submission.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className={`text-sm ${getSelectBackgroundColor(submission.status)}`}
                >
                  <option value="new">Nouvelle</option>
                  <option value="in_progress">En cours</option>
                  <option value="completed">Terminée</option>
                </Select>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getTypeColor(submission.type)}`}>
                {getTypeLabel(submission.type)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#F9F9F9] rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg">
                    <User className="w-5 h-5 text-[#C62E2E]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-[#666666] font-medium uppercase tracking-wide mb-1">Nom</p>
                    <p className="text-[#111111] font-semibold">{submission.name}</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#F9F9F9] rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg">
                    <Mail className="w-5 h-5 text-[#C62E2E]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-[#666666] font-medium uppercase tracking-wide mb-1">Email</p>
                    <a
                      href={`mailto:${submission.email}`}
                      className="text-[#C62E2E] hover:underline break-all"
                    >
                      {submission.email}
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-[#F9F9F9] rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg">
                    <Phone className="w-5 h-5 text-[#C62E2E]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-[#666666] font-medium uppercase tracking-wide mb-1">Téléphone</p>
                    <a
                      href={`tel:${submission.phone}`}
                      className="text-[#C62E2E] hover:underline"
                    >
                      {submission.phone}
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-[#F9F9F9] rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg">
                    <Calendar className="w-5 h-5 text-[#C62E2E]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-[#666666] font-medium uppercase tracking-wide mb-1">Date</p>
                    <p className="text-[#111111] font-semibold">
                      {new Date(submission.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {submission.subject && (
              <div className="bg-[#F9F9F9] rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg">
                    <Tag className="w-5 h-5 text-[#C62E2E]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-[#666666] font-medium uppercase tracking-wide mb-1">Sujet</p>
                    <p className="text-[#111111] font-semibold">{submission.subject}</p>
                  </div>
                </div>
              </div>
            )}

            {submission.message && (
              <div className="bg-[#F9F9F9] rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg">
                    <MessageSquare className="w-5 h-5 text-[#C62E2E]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-[#666666] font-medium uppercase tracking-wide mb-2">Message</p>
                    <div className="bg-white rounded-lg p-4 border border-[#E5E5E5]">
                      <p className="text-[#111111] whitespace-pre-wrap leading-relaxed">{submission.message}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {submission.data && Object.keys(submission.data).length > 0 && (
              <div className="bg-[#F9F9F9] rounded-xl p-4">
                <p className="text-xs text-[#666666] font-medium uppercase tracking-wide mb-3">Informations complémentaires</p>
                <div className="bg-white rounded-lg p-4 border border-[#E5E5E5] space-y-2">
                  {Object.entries(submission.data).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-start py-2 border-b border-[#E5E5E5] last:border-0">
                      <span className="text-sm font-medium text-[#666666] capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="text-sm text-[#111111] text-right ml-4">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {submission.attachments && submission.attachments.length > 0 && (
              <div className="bg-[#F9F9F9] rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg">
                    <Paperclip className="w-5 h-5 text-[#C62E2E]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-[#666666] font-medium uppercase tracking-wide mb-3">
                      Pièces jointes ({submission.attachments.length})
                    </p>
                    <div className="bg-white rounded-lg border border-[#E5E5E5] divide-y divide-[#E5E5E5]">
                      {submission.attachments.map((attachment, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 hover:bg-[#F9F9F9] transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <FileText className="w-5 h-5 text-[#666666] flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-[#111111] truncate">
                                {attachment.filename}
                              </p>
                              <p className="text-xs text-[#666666]">
                                {formatFileSize(attachment.size)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDownloadAttachment(attachment)}
                            className="ml-3 p-2 hover:bg-[#C62E2E]/10 rounded-lg transition-colors flex-shrink-0 group"
                            title="Télécharger"
                          >
                            <Download className="w-5 h-5 text-[#C62E2E] group-hover:text-[#A02525]" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-[#E5E5E5] px-6 py-4">
          <Button
            onClick={onClose}
            className="w-full bg-[#C62E2E] hover:bg-[#A02525] text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
}
