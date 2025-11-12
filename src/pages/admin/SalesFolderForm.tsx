import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { ArrowLeft, Save } from 'lucide-react';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
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

export function SalesFolderForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
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
      .select('id, brand, model, year, price')
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
        const { error } = await supabase
          .from('sales_folders')
          .insert([dataToSave]);

        if (error) throw error;

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

      navigate('/admin/sales-folders');
    } catch (error) {
      console.error('Error saving folder:', error);
      alert('Erreur lors de la sauvegarde du dossier');
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
              {loading ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
