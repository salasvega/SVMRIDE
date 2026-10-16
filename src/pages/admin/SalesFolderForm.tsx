import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { FileUpload, UploadedDoc } from '../../components/ui/FileUpload';
import Toast from '../../components/ui/Toast';
import { ArrowLeft, Save, FileText, Download, Trash2, X } from 'lucide-react';
import { compresserImage, extensionDe } from '../../lib/compressionImage';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  images?: string[];
}

interface FormData {
  vehicle_id: string;
  status: 'en_cours' | 'complete' | 'archive';
  client_first_name: string;
  client_last_name: string;
  client_email: string;
  client_phone: string;
  client_address: string;
  sale_date: string;
  sale_price: string;
  deposit_amount: string;
  balance_amount: string;
  payment_method: string;
  admin_notes: string;
}

interface DocumentMetadata {
  type: string;
  filename: string;
  path: string;
  upload_date: string;
}

const documentTypes: Record<string, string> = {
  facture: 'Facture',
  carte_grise: 'Carte grise',
  piece_identite: 'Pièce d\'identité',
  controle_technique: 'Contrôle technique',
  contrat: 'Contrat de vente',
  autre: 'Autre document',
};

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
        type="button"
        onClick={onClick}
        className="w-10 h-10 rounded-md overflow-hidden border border-[#E5E5E5] flex-shrink-0 focus:ring-2 focus:ring-brand"
        title="Aperçu"
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

export function SalesFolderForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [existingDocuments, setExistingDocuments] = useState<DocumentMetadata[]>([]);
  const [filesToUpload, setFilesToUpload] = useState<UploadedDoc[]>([]);
  const [uploadType, setUploadType] = useState('facture');
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [vehicleThumbnail, setVehicleThumbnail] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    vehicle_id: '',
    status: 'en_cours',
    client_first_name: '',
    client_last_name: '',
    client_email: '',
    client_phone: '',
    client_address: '',
    sale_date: new Date().toISOString().split('T')[0],
    sale_price: '',
    deposit_amount: '0',
    balance_amount: '0',
    payment_method: '',
    admin_notes: '',
  });

  useEffect(() => {
    fetchVehicles();
    if (isEditing) {
      fetchFolder();
    }
  }, [id]);

  useEffect(() => {
    calculateBalance();
  }, [formData.sale_price, formData.deposit_amount]);

  async function fetchVehicles() {
    const { data } = await supabase
      .from('vehicles')
      .select('id, brand, model, year, price, images')
      .in('status', ['available', 'reserved'])
      .order('brand');

    if (data) {
      setVehicles(data);
    }
  }

  async function fetchFolder() {
    try {
      const { data, error } = await supabase
        .from('sales_folders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          vehicle_id: data.vehicle_id || '',
          status: data.status,
          client_first_name: data.client_first_name,
          client_last_name: data.client_last_name,
          client_email: data.client_email || '',
          client_phone: data.client_phone || '',
          client_address: data.client_address || '',
          sale_date: data.sale_date,
          sale_price: data.sale_price?.toString() || '',
          deposit_amount: data.deposit_amount?.toString() || '0',
          balance_amount: data.balance_amount?.toString() || '0',
          payment_method: data.payment_method || '',
          admin_notes: data.admin_notes || '',
        });
        setExistingDocuments(data.documents || []);

        if (data.vehicle_id) {
          const selectedVehicle = vehicles.find(v => v.id === data.vehicle_id);
          if (selectedVehicle?.images && selectedVehicle.images.length > 0) {
            setVehicleThumbnail(selectedVehicle.images[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching folder:', error);
    }
  }

  function calculateBalance() {
    const salePrice = parseFloat(formData.sale_price) || 0;
    const deposit = parseFloat(formData.deposit_amount) || 0;
    const balance = Math.max(0, salePrice - deposit);

    if (balance !== parseFloat(formData.balance_amount)) {
      setFormData(prev => ({
        ...prev,
        balance_amount: balance.toString(),
      }));
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'vehicle_id' && value) {
      const selectedVehicle = vehicles.find(v => v.id === value);
      if (selectedVehicle?.images && selectedVehicle.images.length > 0) {
        setVehicleThumbnail(selectedVehicle.images[0]);
      } else {
        setVehicleThumbnail(null);
      }
    }
  }

  async function handleUploadDocuments() {
    if (filesToUpload.length === 0 || !id) return;

    setUploading(true);

    try {
      const newDocuments: DocumentMetadata[] = [];

      for (const doc of filesToUpload) {
        const file = await compresserImage(doc.file, { cote: 2400, qualite: 0.85 });
        const fileExt = extensionDe(file);
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${id}/${uploadType}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('sales-documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        newDocuments.push({
          type: uploadType,
          filename: file.name,
          path: filePath,
          upload_date: new Date().toISOString(),
        });
      }

      const updatedDocuments = [...existingDocuments, ...newDocuments];

      const { error: updateError } = await supabase
        .from('sales_folders')
        .update({ documents: updatedDocuments })
        .eq('id', id);

      if (updateError) throw updateError;

      setExistingDocuments(updatedDocuments);
      setFilesToUpload([]);
      setToast({ type: 'success', message: 'Documents uploadés avec succès' });
    } catch (error) {
      console.error('Error uploading files:', error);
      setToast({ type: 'error', message: 'Erreur lors du téléchargement des fichiers' });
    } finally {
      setUploading(false);
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
      setToast({ type: 'error', message: 'Erreur lors de la prévisualisation du document' });
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
      setToast({ type: 'error', message: 'Erreur lors du téléchargement du fichier' });
    }
  }

  async function handleDeleteDocument(doc: DocumentMetadata) {
    if (!confirm(`Supprimer le document "${doc.filename}" ?`)) return;

    try {
      const { error: storageError } = await supabase.storage
        .from('sales-documents')
        .remove([doc.path]);

      if (storageError) throw storageError;

      const updatedDocuments = existingDocuments.filter((d) => d.path !== doc.path);

      const { error: updateError } = await supabase
        .from('sales_folders')
        .update({ documents: updatedDocuments })
        .eq('id', id);

      if (updateError) throw updateError;

      setExistingDocuments(updatedDocuments);
      setToast({ type: 'success', message: 'Document supprimé avec succès' });
    } catch (error) {
      console.error('Error deleting document:', error);
      setToast({ type: 'error', message: 'Erreur lors de la suppression du document' });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSave = {
        vehicle_id: formData.vehicle_id || null,
        status: formData.status,
        client_first_name: formData.client_first_name,
        client_last_name: formData.client_last_name,
        client_email: formData.client_email || null,
        client_phone: formData.client_phone || null,
        client_address: formData.client_address || null,
        sale_date: formData.sale_date,
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
        deposit_amount: formData.deposit_amount ? parseFloat(formData.deposit_amount) : 0,
        balance_amount: formData.balance_amount ? parseFloat(formData.balance_amount) : 0,
        payment_method: formData.payment_method || null,
        admin_notes: formData.admin_notes || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('sales_folders')
          .update(dataToSave)
          .eq('id', id);

        if (error) throw error;
      } else {
        const { data: newFolder, error } = await supabase
          .from('sales_folders')
          .insert([dataToSave])
          .select()
          .single();

        if (error) throw error;

        if (newFolder && filesToUpload.length > 0) {
          const newDocuments: DocumentMetadata[] = [];

          for (const doc of filesToUpload) {
            const file = await compresserImage(doc.file, { cote: 2400, qualite: 0.85 });
            const fileExt = extensionDe(file);
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${newFolder.id}/${uploadType}/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('sales-documents')
              .upload(filePath, file);

            if (uploadError) throw uploadError;

            newDocuments.push({
              type: uploadType,
              filename: file.name,
              path: filePath,
              upload_date: new Date().toISOString(),
            });
          }

          if (newDocuments.length > 0) {
            const { error: updateError } = await supabase
              .from('sales_folders')
              .update({ documents: newDocuments })
              .eq('id', newFolder.id);

            if (updateError) throw updateError;
          }
        }

        if (formData.vehicle_id && formData.status === 'complete') {
          await supabase
            .from('vehicles')
            .update({ status: 'sold' })
            .eq('id', formData.vehicle_id);
        } else if (formData.vehicle_id && formData.status === 'en_cours') {
          await supabase
            .from('vehicles')
            .update({ status: 'reserved' })
            .eq('id', formData.vehicle_id);
        }
      }

      setToast({
        type: 'success',
        message: isEditing ? 'Dossier modifié avec succès' : 'Dossier créé avec succès',
      });

      setTimeout(() => {
        navigate('/admin/sales-folders');
      }, 1500);
    } catch (error) {
      console.error('Error saving folder:', error);
      setToast({
        type: 'error',
        message: 'Erreur lors de la sauvegarde du dossier',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/sales-folders')}
            className="flex items-center gap-2 text-[#666666] hover:text-[#FF5C00] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour aux dossiers
          </button>
          <h1 className="text-3xl font-bold text-[#111111]">
            {isEditing ? 'Modifier le dossier' : 'Nouveau dossier de vente'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg p-6 border-2 border-[#D1D5DB]">
            <h2 className="text-xl font-bold text-[#111111] mb-4">Véhicule</h2>
            <div className="space-y-4">
              <Select
                label="Véhicule concerné"
                name="vehicle_id"
                value={formData.vehicle_id}
                onChange={handleChange}
              >
                <option value="">Sélectionner un véhicule</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.brand} {vehicle.model} ({vehicle.year}) - {vehicle.price.toLocaleString('fr-FR')} €
                  </option>
                ))}
              </Select>
              {vehicleThumbnail && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-[#666666] mb-2">
                    Aperçu du véhicule
                  </label>
                  <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-[#E5E5E5]">
                    <img
                      src={vehicleThumbnail}
                      alt="Véhicule sélectionné"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border-2 border-[#D1D5DB]">
            <h2 className="text-xl font-bold text-[#111111] mb-4">Informations Client</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Prénom *"
                name="client_first_name"
                value={formData.client_first_name}
                onChange={handleChange}
                required
              />
              <Input
                label="Nom *"
                name="client_last_name"
                value={formData.client_last_name}
                onChange={handleChange}
                required
              />
              <Input
                label="Email"
                type="email"
                name="client_email"
                value={formData.client_email}
                onChange={handleChange}
              />
              <Input
                label="Téléphone"
                type="tel"
                name="client_phone"
                value={formData.client_phone}
                onChange={handleChange}
              />
            </div>
            <div className="mt-4">
              <Textarea
                label="Adresse complète"
                name="client_address"
                value={formData.client_address}
                onChange={handleChange}
                rows={3}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border-2 border-[#D1D5DB]">
            <h2 className="text-xl font-bold text-[#111111] mb-4">Informations de Vente</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Date de vente *"
                type="date"
                name="sale_date"
                value={formData.sale_date}
                onChange={handleChange}
                required
              />
              <Select
                label="Statut *"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="en_cours">En cours</option>
                <option value="complete">Complété</option>
                <option value="archive">Archivé</option>
              </Select>
              <Input
                label="Prix de vente (€)"
                type="number"
                step="0.01"
                name="sale_price"
                value={formData.sale_price}
                onChange={handleChange}
              />
              <Input
                label="Acompte versé (€)"
                type="number"
                step="0.01"
                name="deposit_amount"
                value={formData.deposit_amount}
                onChange={handleChange}
              />
              <Input
                label="Solde restant (€)"
                type="number"
                step="0.01"
                name="balance_amount"
                value={formData.balance_amount}
                onChange={handleChange}
                disabled
              />
              <Input
                label="Moyen de paiement"
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                placeholder="Ex: Virement, Espèces, Carte..."
              />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border-2 border-[#D1D5DB]">
            <h2 className="text-xl font-bold text-[#111111] mb-4">Notes Internes</h2>
            <Textarea
              label="Notes administratives"
              name="admin_notes"
              value={formData.admin_notes}
              onChange={handleChange}
              rows={5}
              placeholder="Notes privées pour l'équipe administrative..."
            />
          </div>

          <div className="bg-white rounded-lg p-6 border-2 border-[#D1D5DB]">
            <h2 className="text-xl font-bold text-[#111111] mb-4">Documents</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#111111] mb-2">
                  Type de document
                </label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm"
                >
                  {Object.entries(documentTypes).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <FileUpload
                label="Ajouter des documents"
                maxFiles={10}
                maxSizeMB={10}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,application/pdf,image/*"
                value={filesToUpload}
                onChange={setFilesToUpload}
              />

              {!isEditing && filesToUpload.length > 0 && (
                <p className="text-sm text-[#666666] italic">
                  {filesToUpload.length} document(s) sera uploadé lors de la création du dossier
                </p>
              )}

              {isEditing && filesToUpload.length > 0 && (
                <Button
                  type="button"
                  onClick={handleUploadDocuments}
                  disabled={uploading}
                  className="w-full"
                >
                  {uploading ? 'Upload en cours...' : `Uploader ${filesToUpload.length} document(s)`}
                </Button>
              )}
            </div>

            {isEditing && existingDocuments.length > 0 && (
                <div className="mt-6 pt-6 border-t border-[#E5E5E5]">
                  <h3 className="text-sm font-semibold text-[#111111] mb-3">Documents téléchargés</h3>
                  <div className="space-y-2">
                    {existingDocuments.map((doc, index) => (
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
                            type="button"
                            onClick={() => handleDownload(doc)}
                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Télécharger"
                          >
                            <Download className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(doc)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/admin/sales-folders')}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="flex items-center gap-2">
              <Save className="w-5 h-5" />
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>

        {toast && (
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        )}

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
      </div>
    </AdminLayout>
  );
}
