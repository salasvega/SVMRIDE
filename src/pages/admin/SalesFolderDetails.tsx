import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import {
  ArrowLeft,
  Edit,
  Download,
  FileText,
  User,
  Calendar,
  DollarSign,
  Package,
  X,
} from 'lucide-react';

interface SalesFolder {
  id: string;
  folder_number: string;
  vehicle_id: string | null;
  status: 'en_cours' | 'complete' | 'archive';
  client_first_name: string;
  client_last_name: string;
  client_email: string | null;
  client_phone: string | null;
  client_address: string | null;
  sale_date: string;
  sale_price: number | null;
  deposit_amount: number | null;
  balance_amount: number | null;
  payment_method: string | null;
  documents: DocumentMetadata[];
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  vehicle?: {
    brand: string;
    model: string;
    year: number;
    type: string;
  };
}

interface DocumentMetadata {
  type: string;
  filename: string;
  path: string;
  upload_date: string;
}

function DocumentThumbnail({ doc, onClick }: { doc: DocumentMetadata; onClick: () => void }) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadThumbnail() {
      try {
        const { data, error } = await supabase.storage
          .from('sales-documents')
          .createSignedUrl(doc.path, 3600);

        if (error) throw error;
        if (data) {
          setThumbnailUrl(data.signedUrl);
        }
      } catch (error) {
        console.error('Error loading thumbnail:', error);
      }
    }

    const isImage = doc.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    if (isImage) {
      loadThumbnail();
    }
  }, [doc.path, doc.filename]);

  const isImage = doc.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  if (isImage && thumbnailUrl) {
    return (
      <button
        onClick={onClick}
        className="w-10 h-10 rounded-md overflow-hidden border border-[#E5E5E5] flex-shrink-0 focus:ring-2 focus:ring-[#D10000]"
        title="Aper\u00e7u"
      >
        <img
          src={thumbnailUrl}
          alt={doc.filename}
          className="w-full h-full object-cover"
        />
      </button>
    );
  }

  return (
    <div className="w-10 h-10 bg-[#F5F5F5] text-[#666666] rounded-md flex items-center justify-center flex-shrink-0">
      <FileText className="w-5 h-5" />
    </div>
  );
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

const documentTypes: Record<string, string> = {
  facture: 'Facture',
  carte_grise: 'Carte Grise',
  carte_identite: "Carte d'Identité",
  contrat: 'Contrat de Vente',
  autre: 'Autre Document',
};

export function SalesFolderDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [folder, setFolder] = useState<SalesFolder | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchFolder();
    }
  }, [id]);

  async function fetchFolder() {
    try {
      const { data, error } = await supabase
        .from('sales_folders')
        .select(
          `
          *,
          vehicle:vehicles(brand, model, year, type)
        `
        )
        .eq('id', id)
        .single();

      if (error) throw error;

      setFolder(data);
    } catch (error) {
      console.error('Error fetching folder:', error);
    } finally {
      setLoading(false);
    }
  }


  async function handleDownload(doc: DocumentMetadata) {
    try {
      const { data, error } = await supabase.storage
        .from('sales-documents')
        .download(doc.path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Erreur lors du téléchargement du fichier');
    }
  }

  async function handlePreviewDocument(doc: DocumentMetadata) {
    try {
      const { data, error } = await supabase.storage
        .from('sales-documents')
        .createSignedUrl(doc.path, 3600);

      if (error) throw error;
      if (data) {
        setPreviewUrl(data.signedUrl);
      }
    } catch (error) {
      console.error('Error creating preview URL:', error);
      alert('Erreur lors de la prévisualisation du document');
    }
  }


  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-[#666666]">Chargement...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!folder) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-[#666666]">Dossier introuvable</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/admin/sales-folders')}
              className="flex items-center gap-2 text-[#666666] hover:text-[#FF5C00] mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour aux dossiers
            </button>
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-[#111111]">{folder.folder_number}</h1>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  statusColors[folder.status]
                }`}
              >
                {statusLabels[folder.status]}
              </span>
            </div>
            <p className="text-[#666666] mt-1">
              Créé le {new Date(folder.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <Link to={`/admin/sales-folders/edit/${folder.id}`}>
            <Button className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Modifier
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 border-2 border-[#D1D5DB]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-[#111111]">Informations Client</h2>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-[#666666]">Nom complet</p>
                <p className="text-[#111111] font-semibold">
                  {folder.client_first_name} {folder.client_last_name}
                </p>
              </div>
              {folder.client_email && (
                <div>
                  <p className="text-sm text-[#666666]">Email</p>
                  <p className="text-[#111111]">{folder.client_email}</p>
                </div>
              )}
              {folder.client_phone && (
                <div>
                  <p className="text-sm text-[#666666]">Téléphone</p>
                  <p className="text-[#111111]">{folder.client_phone}</p>
                </div>
              )}
              {folder.client_address && (
                <div>
                  <p className="text-sm text-[#666666]">Adresse</p>
                  <p className="text-[#111111] whitespace-pre-line">{folder.client_address}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border-2 border-[#D1D5DB]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-xl font-bold text-[#111111]">Véhicule</h2>
            </div>
            {folder.vehicle ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-[#666666]">Modèle</p>
                  <p className="text-[#111111] font-semibold text-lg">
                    {folder.vehicle.brand} {folder.vehicle.model}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[#666666]">Année</p>
                    <p className="text-[#111111]">{folder.vehicle.year}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#666666]">Type</p>
                    <p className="text-[#111111] capitalize">{folder.vehicle.type}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[#666666]">Aucun véhicule associé</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border-2 border-[#D1D5DB]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-[#111111]">Informations Financières</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-[#666666] mb-1">Date de vente</p>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#666666]" />
                <p className="text-[#111111] font-semibold">
                  {new Date(folder.sale_date).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-[#666666] mb-1">Prix de vente</p>
              <p className="text-xl font-bold text-green-600">
                {folder.sale_price?.toLocaleString('fr-FR') || '0'} €
              </p>
            </div>
            <div>
              <p className="text-sm text-[#666666] mb-1">Acompte</p>
              <p className="text-xl font-bold text-blue-600">
                {folder.deposit_amount?.toLocaleString('fr-FR') || '0'} €
              </p>
            </div>
            <div>
              <p className="text-sm text-[#666666] mb-1">Solde restant</p>
              <p className="text-xl font-bold text-orange-600">
                {folder.balance_amount?.toLocaleString('fr-FR') || '0'} €
              </p>
            </div>
          </div>
          {folder.payment_method && (
            <div className="mt-4 pt-4 border-t border-[#E5E5E5]">
              <p className="text-sm text-[#666666]">Moyen de paiement</p>
              <p className="text-[#111111]">{folder.payment_method}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg p-6 border-2 border-[#D1D5DB]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-[#111111]">Documents</h2>
          </div>

          {folder.documents && folder.documents.length > 0 ? (
              <div className="space-y-2">
                {folder.documents.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <DocumentThumbnail
                        doc={doc}
                        onClick={() => handlePreviewDocument(doc)}
                      />
                      <div>
                        <p className="text-sm font-medium text-[#111111]">{doc.filename}</p>
                        <p className="text-xs text-[#666666]">
                          {documentTypes[doc.type] || doc.type} •{' '}
                          {new Date(doc.upload_date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownload(doc)}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Télécharger"
                      >
                        <Download className="w-4 h-4 text-blue-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
          ) : (
            <p className="text-center text-[#666666] py-8">Aucun document téléchargé</p>
          )}
        </div>

        {folder.admin_notes && (
          <div className="bg-yellow-50 rounded-lg p-6 border-2 border-yellow-200">
            <h2 className="text-lg font-bold text-[#111111] mb-2">Notes Internes</h2>
            <p className="text-[#666666] whitespace-pre-line">{folder.admin_notes}</p>
          </div>
        )}
      </div>

      {previewUrl && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="relative max-w-full max-h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute -top-4 -right-4 bg-white text-[#111111] rounded-full shadow-lg p-2 hover:bg-[#111111] hover:text-white transition-colors"
              onClick={() => setPreviewUrl(null)}
              aria-label="Fermer l'aperçu"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewUrl}
              alt="Aperçu du document"
              className="max-w-[90vw] max-h-[80vh] rounded-lg shadow-2xl object-contain bg-[#111111]"
            />
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
