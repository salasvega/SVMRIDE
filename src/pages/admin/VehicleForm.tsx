import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Container } from '../../components/ui/Container';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { ImageUpload } from '../../components/admin/ImageUpload';
import { supabase } from '../../lib/supabase';
import type { Vehicle } from '../../types/vehicle';

export function VehicleForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    brand: '',
    model: '',
    type: 'moto',
    year: new Date().getFullYear(),
    mileage: 0,
    price: 0,
    description: '',
    status: 'available',
    images: [],
    features: [],
  });

  useEffect(() => {
    if (isEdit) {
      loadVehicle();
    }
  }, [id]);

  const loadVehicle = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) setFormData(data);
    } catch (error) {
      console.error('Error loading vehicle:', error);
      alert('Erreur lors du chargement du véhicule');
    }
  };

  const generateSlug = (brand: string, model: string) => {
    return `${brand}-${model}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const vehicleData = {
        ...formData,
        slug: generateSlug(formData.brand!, formData.model!),
      };

      if (isEdit) {
        const { error } = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('vehicles').insert([vehicleData]);

        if (error) throw error;
      }

      navigate('/admin/vehicles');
    } catch (error) {
      console.error('Error saving vehicle:', error);
      alert('Erreur lors de la sauvegarde du véhicule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <Container className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#111111] mb-2">
            {isEdit ? 'Modifier le véhicule' : 'Ajouter un véhicule'}
          </h1>
          <p className="text-[#666666]">
            Remplissez tous les champs pour {isEdit ? 'modifier' : 'ajouter'} un véhicule
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Marque"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                required
              />

              <Input
                label="Modèle"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Select
                label="Type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as Vehicle['type'] })}
                required
              >
                <option value="moto">Moto</option>
                <option value="scooter">Scooter</option>
              </Select>

              <Input
                type="number"
                label="Année"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                required
                min="1900"
                max={new Date().getFullYear() + 1}
              />

              <Input
                type="number"
                label="Kilométrage"
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value) })}
                required
                min="0"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                type="number"
                label="Prix (€)"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                required
                min="0"
              />

              <Select
                label="Statut"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as Vehicle['status'] })
                }
                required
              >
                <option value="available">Disponible</option>
                <option value="reserved">Réservé</option>
                <option value="sold">Vendu</option>
              </Select>
            </div>

            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              required
            />

            <div>
              <label className="block text-sm font-medium text-[#111111] mb-2">
                Caractéristiques (une par ligne)
              </label>
              <Textarea
                value={formData.features?.join('\n')}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    features: e.target.value.split('\n').filter((f) => f.trim()),
                  })
                }
                rows={6}
                placeholder="ABS&#10;Garantie 6 mois&#10;Révision complète..."
              />
            </div>

            <ImageUpload
              images={formData.images || []}
              onChange={(images) => setFormData({ ...formData, images })}
            />

            <div className="flex gap-4 pt-6 border-t border-[#E5E5E5]">
              <Button type="submit" disabled={loading}>
                {loading ? 'Enregistrement...' : isEdit ? 'Modifier' : 'Ajouter'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/vehicles')}
              >
                Annuler
              </Button>
            </div>
          </div>
        </form>
      </Container>
    </AdminLayout>
  );
}
