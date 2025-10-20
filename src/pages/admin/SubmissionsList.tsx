import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Mail, Phone, Calendar, FileText, Car, Search, CreditCard, Inbox, Circle, CheckCircle2, Archive, Filter } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Button } from '../../components/ui/Button';
import { useUnreadCount } from '../../hooks/useUnreadCount';

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  submitted_at: string;
  status: 'new' | 'read' | 'processed';
  read_at?: string;
  processed_at?: string;
}

interface TradeInSubmission {
  id: string;
  name: string;
  email: string;
  phone: string;
  brand: string;
  model: string;
  year: string;
  mileage: string;
  condition: string;
  comments: string;
  submitted_at: string;
  status: 'new' | 'read' | 'processed';
  read_at?: string;
  processed_at?: string;
}

interface CustomSearchSubmission {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: string;
  brand: string;
  displacement: string;
  year_min: string;
  budget_max: string;
  deadline: string;
  comments: string;
  submitted_at: string;
  status: 'new' | 'read' | 'processed';
  read_at?: string;
  processed_at?: string;
}

interface FinancingSubmission {
  id: string;
  name: string;
  email: string;
  phone: string;
  amount: string;
  duration: string;
  submitted_at: string;
  status: 'new' | 'read' | 'processed';
  read_at?: string;
  processed_at?: string;
}

type SubmissionType = 'contact' | 'trade-in' | 'custom-search' | 'financing';

export function SubmissionsList() {
  const [activeTab, setActiveTab] = useState<SubmissionType>('contact');
  const [contactSubmissions, setContactSubmissions] = useState<ContactSubmission[]>([]);
  const [tradeInSubmissions, setTradeInSubmissions] = useState<TradeInSubmission[]>([]);
  const [customSearchSubmissions, setCustomSearchSubmissions] = useState<CustomSearchSubmission[]>([]);
  const [financingSubmissions, setFinancingSubmissions] = useState<FinancingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'read' | 'processed'>('all');
  const { refresh: refreshUnreadCount } = useUnreadCount();

  useEffect(() => {
    loadSubmissions();
  }, [activeTab, statusFilter]);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const baseQuery = (table: string) => {
        let query = supabase.from(table).select('*');
        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }
        return query.order('submitted_at', { ascending: false });
      };

      switch (activeTab) {
        case 'contact':
          const { data: contactData } = await baseQuery('contact_submissions');
          setContactSubmissions(contactData || []);
          break;
        case 'trade-in':
          const { data: tradeInData } = await baseQuery('trade_in_submissions');
          setTradeInSubmissions(tradeInData || []);
          break;
        case 'custom-search':
          const { data: customSearchData } = await baseQuery('custom_search_submissions');
          setCustomSearchSubmissions(customSearchData || []);
          break;
        case 'financing':
          const { data: financingData } = await baseQuery('financing_submissions');
          setFinancingSubmissions(financingData || []);
          break;
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, table: string, status: 'new' | 'read' | 'processed') => {
    try {
      const updateData: any = { status };

      if (status === 'read') {
        updateData.read_at = new Date().toISOString();
      } else if (status === 'processed') {
        updateData.processed_at = new Date().toISOString();
      }

      await supabase
        .from(table)
        .update(updateData)
        .eq('id', id);

      await loadSubmissions();
      refreshUnreadCount();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleCardClick = async (submission: any, type: SubmissionType) => {
    setSelectedSubmission({ type, data: submission });

    if (submission.status === 'new') {
      const tableMap = {
        'contact': 'contact_submissions',
        'trade-in': 'trade_in_submissions',
        'custom-search': 'custom_search_submissions',
        'financing': 'financing_submissions'
      };
      await updateStatus(submission.id, tableMap[type], 'read');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSubmissionCount = () => {
    switch (activeTab) {
      case 'contact':
        return contactSubmissions.length;
      case 'trade-in':
        return tradeInSubmissions.length;
      case 'custom-search':
        return customSearchSubmissions.length;
      case 'financing':
        return financingSubmissions.length;
      default:
        return 0;
    }
  };

  const getStatusBadge = (status: 'new' | 'read' | 'processed') => {
    const configs = {
      new: { icon: Circle, text: 'Nouveau', bgColor: 'bg-red-100', textColor: 'text-red-700', iconColor: 'text-red-600' },
      read: { icon: CheckCircle2, text: 'Lu', bgColor: 'bg-blue-100', textColor: 'text-blue-700', iconColor: 'text-blue-600' },
      processed: { icon: Archive, text: 'Traité', bgColor: 'bg-green-100', textColor: 'text-green-700', iconColor: 'text-green-600' }
    };

    const config = configs[status];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
        <Icon className={`w-3 h-3 ${config.iconColor}`} />
        {config.text}
      </span>
    );
  };

  const renderContactCard = (submission: ContactSubmission) => (
    <div
      key={submission.id}
      onClick={() => handleCardClick(submission, 'contact')}
      className={`bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-all cursor-pointer border-l-4 border-blue-500 ${
        submission.status === 'new' ? 'ring-2 ring-red-200' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-900">{submission.name}</h3>
            <p className="text-sm text-gray-600">{submission.email}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {getStatusBadge(submission.status)}
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(submission.submitted_at)}
          </span>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Sujet: {submission.subject}</p>
        <p className="text-sm text-gray-600 line-clamp-2">{submission.message}</p>
      </div>
    </div>
  );

  const renderTradeInCard = (submission: TradeInSubmission) => (
    <div
      key={submission.id}
      onClick={() => handleCardClick(submission, 'trade-in')}
      className={`bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-all cursor-pointer border-l-4 border-green-500 ${
        submission.status === 'new' ? 'ring-2 ring-red-200' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Car className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-900">{submission.name}</h3>
            <p className="text-sm text-gray-600">{submission.email}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {getStatusBadge(submission.status)}
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(submission.submitted_at)}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <p className="text-gray-700"><span className="font-medium">Véhicule:</span> {submission.brand} {submission.model}</p>
        <p className="text-gray-700"><span className="font-medium">Année:</span> {submission.year}</p>
        <p className="text-gray-700"><span className="font-medium">Kilométrage:</span> {submission.mileage} km</p>
        <p className="text-gray-700"><span className="font-medium">État:</span> {submission.condition}</p>
      </div>
    </div>
  );

  const renderCustomSearchCard = (submission: CustomSearchSubmission) => (
    <div
      key={submission.id}
      onClick={() => handleCardClick(submission, 'custom-search')}
      className={`bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-all cursor-pointer border-l-4 border-purple-500 ${
        submission.status === 'new' ? 'ring-2 ring-red-200' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <Search className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-900">{submission.name}</h3>
            <p className="text-sm text-gray-600">{submission.email}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {getStatusBadge(submission.status)}
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(submission.submitted_at)}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <p className="text-gray-700"><span className="font-medium">Type:</span> {submission.type}</p>
        <p className="text-gray-700"><span className="font-medium">Budget max:</span> {submission.budget_max}</p>
        <p className="text-gray-700"><span className="font-medium">Marque:</span> {submission.brand || 'Non spécifié'}</p>
        <p className="text-gray-700"><span className="font-medium">Délai:</span> {submission.deadline}</p>
      </div>
    </div>
  );

  const renderFinancingCard = (submission: FinancingSubmission) => (
    <div
      key={submission.id}
      onClick={() => handleCardClick(submission, 'financing')}
      className={`bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-all cursor-pointer border-l-4 border-orange-500 ${
        submission.status === 'new' ? 'ring-2 ring-red-200' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-900">{submission.name}</h3>
            <p className="text-sm text-gray-600">{submission.email}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {getStatusBadge(submission.status)}
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(submission.submitted_at)}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <p className="text-gray-700"><span className="font-medium">Montant:</span> {submission.amount} €</p>
        <p className="text-gray-700"><span className="font-medium">Durée:</span> {submission.duration}</p>
        <p className="text-gray-700"><span className="font-medium">Téléphone:</span> {submission.phone}</p>
      </div>
    </div>
  );

  const renderDetailModal = () => {
    if (!selectedSubmission) return null;

    const { type, data } = selectedSubmission;

    const tableMap = {
      'contact': 'contact_submissions',
      'trade-in': 'trade_in_submissions',
      'custom-search': 'custom_search_submissions',
      'financing': 'financing_submissions'
    };

    const handleStatusChange = async (newStatus: 'new' | 'read' | 'processed') => {
      await updateStatus(data.id, tableMap[type], newStatus);
      setSelectedSubmission({ type, data: { ...data, status: newStatus } });
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedSubmission(null)}>
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Détails de la soumission</h2>
              <Button variant="secondary" onClick={() => setSelectedSubmission(null)}>Fermer</Button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Statut:</span>
              {getStatusBadge(data.status)}
              <div className="flex gap-2 ml-auto">
                {data.status !== 'new' && (
                  <Button variant="outline" size="sm" onClick={() => handleStatusChange('new')}>
                    Marquer comme nouveau
                  </Button>
                )}
                {data.status !== 'read' && (
                  <Button variant="outline" size="sm" onClick={() => handleStatusChange('read')}>
                    Marquer comme lu
                  </Button>
                )}
                {data.status !== 'processed' && (
                  <Button variant="primary" size="sm" onClick={() => handleStatusChange('processed')}>
                    Marquer comme traité
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="p-6 space-y-6">
            {type === 'contact' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Nom</label>
                    <p className="text-gray-900 mt-1">{data.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900 mt-1">{data.email}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Sujet</label>
                  <p className="text-gray-900 mt-1">{data.subject}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Message</label>
                  <p className="text-gray-900 mt-1 whitespace-pre-wrap">{data.message}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Date de soumission</label>
                  <p className="text-gray-900 mt-1">{formatDate(data.submitted_at)}</p>
                </div>
              </>
            )}

            {type === 'trade-in' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Nom</label>
                    <p className="text-gray-900 mt-1">{data.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900 mt-1">{data.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Téléphone</label>
                    <p className="text-gray-900 mt-1">{data.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Marque</label>
                    <p className="text-gray-900 mt-1">{data.brand}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Modèle</label>
                    <p className="text-gray-900 mt-1">{data.model}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Année</label>
                    <p className="text-gray-900 mt-1">{data.year}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Kilométrage</label>
                    <p className="text-gray-900 mt-1">{data.mileage} km</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">État</label>
                    <p className="text-gray-900 mt-1">{data.condition}</p>
                  </div>
                </div>
                {data.comments && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Commentaires</label>
                    <p className="text-gray-900 mt-1 whitespace-pre-wrap">{data.comments}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-700">Date de soumission</label>
                  <p className="text-gray-900 mt-1">{formatDate(data.submitted_at)}</p>
                </div>
              </>
            )}

            {type === 'custom-search' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Nom</label>
                    <p className="text-gray-900 mt-1">{data.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900 mt-1">{data.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Téléphone</label>
                    <p className="text-gray-900 mt-1">{data.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Type de véhicule</label>
                    <p className="text-gray-900 mt-1">{data.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Marque</label>
                    <p className="text-gray-900 mt-1">{data.brand || 'Non spécifié'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Cylindrée</label>
                    <p className="text-gray-900 mt-1">{data.displacement || 'Non spécifié'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Année minimale</label>
                    <p className="text-gray-900 mt-1">{data.year_min || 'Non spécifié'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Budget maximum</label>
                    <p className="text-gray-900 mt-1">{data.budget_max} €</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Délai</label>
                    <p className="text-gray-900 mt-1">{data.deadline}</p>
                  </div>
                </div>
                {data.comments && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Commentaires</label>
                    <p className="text-gray-900 mt-1 whitespace-pre-wrap">{data.comments}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-700">Date de soumission</label>
                  <p className="text-gray-900 mt-1">{formatDate(data.submitted_at)}</p>
                </div>
              </>
            )}

            {type === 'financing' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Nom</label>
                    <p className="text-gray-900 mt-1">{data.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900 mt-1">{data.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Téléphone</label>
                    <p className="text-gray-900 mt-1">{data.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Montant</label>
                    <p className="text-gray-900 mt-1">{data.amount} €</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Durée</label>
                    <p className="text-gray-900 mt-1">{data.duration}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Date de soumission</label>
                  <p className="text-gray-900 mt-1">{formatDate(data.submitted_at)}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages & Soumissions</h1>
        <p className="text-gray-600">Consultez tous les messages et demandes reçus via les formulaires</p>
      </div>

      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Filtrer par statut:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                statusFilter === 'all'
                  ? 'bg-[#C62E2E] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setStatusFilter('new')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                statusFilter === 'new'
                  ? 'bg-[#C62E2E] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Nouveaux
            </button>
            <button
              onClick={() => setStatusFilter('read')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                statusFilter === 'read'
                  ? 'bg-[#C62E2E] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Lus
            </button>
            <button
              onClick={() => setStatusFilter('processed')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                statusFilter === 'processed'
                  ? 'bg-[#C62E2E] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Traités
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('contact')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'contact'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Mail className="w-5 h-5" />
            Contact
            <span className="ml-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-600">
              {contactSubmissions.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('trade-in')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'trade-in'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Car className="w-5 h-5" />
            Reprises
            <span className="ml-2 px-2 py-1 text-xs rounded-full bg-green-100 text-green-600">
              {tradeInSubmissions.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('custom-search')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'custom-search'
                ? 'border-b-2 border-purple-600 text-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Search className="w-5 h-5" />
            Recherches
            <span className="ml-2 px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-600">
              {customSearchSubmissions.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('financing')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'financing'
                ? 'border-b-2 border-orange-600 text-orange-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            Financement
            <span className="ml-2 px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-600">
              {financingSubmissions.length}
            </span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      ) : getSubmissionCount() === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <Inbox className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune soumission</h3>
          <p className="text-gray-600">Vous n'avez pas encore reçu de messages pour cette catégorie.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {activeTab === 'contact' && contactSubmissions.map(renderContactCard)}
          {activeTab === 'trade-in' && tradeInSubmissions.map(renderTradeInCard)}
          {activeTab === 'custom-search' && customSearchSubmissions.map(renderCustomSearchCard)}
          {activeTab === 'financing' && financingSubmissions.map(renderFinancingCard)}
        </div>
      )}

      {renderDetailModal()}
    </AdminLayout>
  );
}

export default SubmissionsList;
