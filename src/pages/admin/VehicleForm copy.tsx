import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { ImageUpload } from '../../components/admin/ImageUpload';
import { supabase } from '../../lib/supabase';
import { Vehicle } from '../../types/vehicle';

export function VehicleForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    slug: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    type: 'moto' as 'moto' | 'scooter',
    displacement: 0,
    price: 0,
    mileage: 0,
    condition: 'excellent' as 'excellent' | 'bon' | 'correct' | 'a-reviser',
    description: '',
    images: [] as string[],
    features: [] as string[],
    warranty: 'Garantie 6 mois pièces et main d\'œuvre',
    available: true,
  });

  const [featuresInput, setFeaturesInput] = useState('');

  useEffect(() => {
    if (isEditing && id) {
      fetchVehicle(id);
    }
  }, [id, isEditing]);

  async function fetchVehicle(vehicleId: string) {
    setLoading(true);
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .single();

    if (error) {
      setError('Véhicule non trouvé');
      setLoading(false);
      return;
    }

    if (data) {
      const vehicle = data as Vehicle;
      setFormData({
        slug: vehicle.slug,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        type: vehicle.type,
        displacement: vehicle.displacement,
        price: vehicle.price,
        mileage: vehicle.mileage,
        condition: vehicle.condition,
        description: vehicle.description || '',
        images: vehicle.images || [],
        features: vehicle.features || [],
        warranty: vehicle.warranty || 'Garantie 6 mois pièces et main d\'œuvre',
        available: vehicle.available,
      });
      setFeaturesInput(vehicle.features?.join(', ') || '');
    }
    setLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const features = featuresInput
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    const vehicleData = {
      ...formData,
      features,
    };

    try {
      if (isEditing && id) {
        const { error: updateError } = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('vehicles')
          .insert([vehicleData]);

        if (insertError) throw insertError;
      }

      navigate('/admin/vehicles');
    } catch (err) {
      console.error('Error saving vehicle:', err);
      setError('Erreur lors de l\'enregistrement du véhicule');
      setLoading(false);
    }
  };

  const generateSlug = () => {
    const slug = `${formData.brand}-${formData.model}-${formData.year}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setFormData({ ...formData, slug });
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/vehicles')}
            className="text-[#666666] hover:text-[#C62E2E]"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-[#111111]">
              {isEditing ? 'Modifier le véhicule' : 'Ajouter un véhicule'}
            </h1>
            <p className="text-[#666666] mt-1">
              Remplissez tous les champs pour créer ou modifier une fiche véhicule
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E5E5E5] space-y-6">
            <h2 className="text-xl font-bold text-[#111111]">Informations générales</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Marque"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                onBlur={generateSlug}
                required
                placeholder="ex: Yamaha"
              />

              <Input
                label="Modèle"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                onBlur={generateSlug}
                required
                placeholder="ex: MT-07"
              />

              <Select
                label="Type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'moto' | 'scooter' })}
                required
              >
                <option value="moto">Moto</option>
                <option value="scooter">Scooter</option>
              </Select>

              <Input
                label="Année"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                onBlur={generateSlug}
                required
                min="1900"
                max={new Date().getFullYear() + 1}
              />

              <Input
                label="Cylindrée (cc)"
                type="number"
                value={formData.displacement}
                onChange={(e) => setFormData({ ...formData, displacement: Number(e.target.value) })}
                required
                min="50"
                placeholder="ex: 689"
              />

              <Input
                label="Prix (€)"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                required
                min="0"
                placeholder="ex: 6490"
              />

              <Input
                label="Kilométrage"
                type="number"
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: Number(e.target.value) })}
                required
                min="0"
                placeholder="ex: 12500"
              />

              <Select
                label="État"
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value as any })}
                required
              >
                <option value="excellent">Excellent</option>
                <option value="bon">Bon</option>
                <option value="correct">Correct</option>
                <option value="a-reviser">À réviser</option>
              </Select>
            </div>

            <Input
              label="Slug (URL)"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
              placeholder="yamaha-mt-07-2020"
              helperText="Généré automatiquement. Format: marque-modele-annee"
            />

            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              placeholder="Décrivez l'état général, l'entretien effectué, les points forts..."
            />

            <Input
              label="Garantie"
              value={formData.warranty}
              onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
              placeholder="ex: Garantie 12 mois pièces et main d'œuvre"
            />

            <Input
              label="Équipements (séparés par des virgules)"
              value={featuresInput}
              onChange={(e) => setFeaturesInput(e.target.value)}
              placeholder="ex: ABS, LED, Quickshifter, TFT"
              helperText="Séparez chaque équipement par une virgule"
            />

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.available}
                onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                className="w-4 h-4 text-[#C62E2E] border-gray-300 rounded focus:ring-[#C62E2E]"
              />
              <span className="text-sm font-medium text-[#111111]">
                Visible sur le site
              </span>
            </label>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E5E5E5]">
            <h2 className="text-xl font-bold text-[#111111] mb-4">Photos</h2>
            <ImageUpload
              images={formData.images}
              onChange={(images) => setFormData({ ...formData, images })}
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/vehicles')}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="flex items-center space-x-2">
              <Save className="w-4 h-4" />
              <span>{loading ? 'Enregistrement...' : 'Enregistrer'}</span>
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
