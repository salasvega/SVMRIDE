import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import {
  ImageUpload,
  type UploadedImage,
} from '../../components/admin/ImageUpload';
import { supabase } from '../../lib/supabase';
import { Vehicle } from '../../types/vehicle';

export function VehicleForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // helper: normalisation images DB
  function normalizeImagesFromDB(rawImages: any): UploadedImage[] {
    if (!rawImages || !Array.isArray(rawImages)) return [];
    return rawImages.map((img: any) => {
      if (typeof img === 'string') {
        return { url: img, path: '' };
      }
      if (img && typeof img === 'object' && 'url' in img) {
        return { url: img.url, path: img.path || '' };
      }
      return { url: String(img), path: '' };
    });
  }

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
    images: [] as UploadedImage[],
    features: [] as string[],
    warranty: "Garantie 6 mois pièces et main d'œuvre",
    status: 'available' as 'available' | 'reserved' | 'sold',
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
        type: vehicle.type as 'moto' | 'scooter',
        displacement: vehicle.displacement,
        price: vehicle.price,
        mileage: vehicle.mileage,
        condition: vehicle.condition as
          | 'excellent'
          | 'bon'
          | 'correct'
          | 'a-reviser',
        description: vehicle.description || '',
        images: normalizeImagesFromDB(
          (vehicle as any).images_v2 ||
            (vehicle as any).images ||
            []
        ),
        features: vehicle.features || [],
        warranty:
          vehicle.warranty ||
          "Garantie 6 mois pièces et main d'œuvre",
        status: (vehicle as any).status || 'available',
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

    // en base, si tu utilises encore images:text[]
    // const vehicleData = {
    //   ...formData,
    //   features,
    //   images: formData.images.map((img) => img.url),
    //   available: formData.status === 'available' && formData.available,
    // };

    // en base, si tu es passé à images_v2: jsonb (recommandé)
    const vehicleData = {
      ...formData,
      features,
      images_v2: formData.images.map((img) => ({
        url: img.url,
        path: img.path || '',
      })),
      available:
        formData.status === 'available' && formData.available,
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
      setError("Erreur lors de l'enregistrement du véhicule");
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

  // ---------
  // APERÇU PUBLIC (carte vitrine)
  // ---------

  const mainPhotoUrl = formData.images[0]?.url || '';
  const title =
    [formData.brand, formData.model, formData.year]
      .filter(Boolean)
      .join(' ');
  const priceLabel =
    formData.price > 0
      ? new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
          maximumFractionDigits: 0,
        }).format(formData.price)
      : '';
  const kmLabel =
    formData.mileage > 0
      ? `${formData.mileage.toLocaleString('fr-FR')} km`
      : '';
  const statusLabel =
    formData.status === 'available'
      ? 'Disponible'
      : formData.status === 'reserved'
      ? 'Réservé'
      : 'Vendu';

  // Style badge statut
  const statusColor =
    formData.status === 'available'
      ? 'bg-green-600'
      : formData.status === 'reserved'
      ? 'bg-yellow-500'
      : 'bg-gray-500';

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/vehicles')}
            className="text-[#666666] hover:text-[#C62E2E]"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-[#111111]">
              {isEditing
                ? 'Modifier le véhicule'
                : 'Ajouter un véhicule'}
            </h1>
            <p className="text-[#666666] mt-1">
              Remplissez tous les champs pour créer ou modifier une
              fiche véhicule
            </p>
          </div>
        </div>

        {/* Erreur globale */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* FORMULAIRE PRINCIPAL */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bloc infos générales */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E5E5E5] space-y-6">
            <h2 className="text-xl font-bold text-[#111111]">
              Informations générales
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Marque"
                value={formData.brand}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    brand: e.target.value,
                  })
                }
                onBlur={generateSlug}
                required
                placeholder="ex: Yamaha"
              />

              <Input
                label="Modèle"
                value={formData.model}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    model: e.target.value,
                  })
                }
                onBlur={generateSlug}
                required
                placeholder="ex: MT-07"
              />

              <Select
                label="Type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target
                      .value as 'moto' | 'scooter',
                  })
                }
                required
              >
                <option value="moto">Moto</option>
                <option value="scooter">Scooter</option>
              </Select>

              <Input
                label="Année"
                type="number"
                value={formData.year}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    year: Number(e.target.value),
                  })
                }
                onBlur={generateSlug}
                required
                min="1900"
                max={new Date().getFullYear() + 1}
              />

              <Input
                label="Cylindrée (cc)"
                type="number"
                value={formData.displacement}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    displacement: Number(
                      e.target.value
                    ),
                  })
                }
                required
                min="50"
                placeholder="ex: 689"
              />

              <Input
                label="Prix (€)"
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: Number(
                      e.target.value
                    ),
                  })
                }
                required
                min="0"
                placeholder="ex: 6490"
              />

              <Input
                label="Kilométrage"
                type="number"
                value={formData.mileage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    mileage: Number(
                      e.target.value
                    ),
                  })
                }
                required
                min="0"
                placeholder="ex: 12500"
              />

              <Select
                label="État"
                value={formData.condition}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    condition: e.target.value as
                      | 'excellent'
                      | 'bon'
                      | 'correct'
                      | 'a-reviser',
                  })
                }
                required
              >
                <option value="excellent">
                  Excellent
                </option>
                <option value="bon">Bon</option>
                <option value="correct">
                  Correct
                </option>
                <option value="a-reviser">
                  À réviser
                </option>
              </Select>
            </div>

            <Input
              label="Slug (URL)"
              value={formData.slug}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  slug: e.target.value,
                })
              }
              required
              placeholder="yamaha-mt-07-2020"
              helperText="Généré automatiquement. Format: marque-modele-annee"
            />

            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  description: e.target.value,
                })
              }
              rows={4}
              placeholder="Décrivez l'état général, l'entretien effectué, les points forts..."
            />

            <Input
              label="Équipements (séparés par des virgules)"
              value={featuresInput}
              onChange={(e) =>
                setFeaturesInput(e.target.value)
              }
              placeholder="ex: ABS, LED, Quickshifter, TFT"
              helperText="Séparez chaque équipement par une virgule"
            />

            <Input
              label="Garantie"
              value={formData.warranty}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  warranty: e.target.value,
                })
              }
              placeholder="ex: Garantie 12 mois pièces et main d'œuvre"
            />

            <Select
              label="Statut"
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target
                    .value as
                    | 'available'
                    | 'reserved'
                    | 'sold',
                })
              }
              required
            >
              <option value="available">
                Disponible
              </option>
              <option value="reserved">
                Réservé
              </option>
              <option value="sold">
                Vendu
              </option>
            </Select>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.available}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    available:
                      e.target.checked,
                  })
                }
                className="w-4 h-4 text-[#C62E2E] border-gray-300 rounded focus:ring-[#C62E2E]"
              />
              <span className="text-sm font-medium text-[#111111]">
                Visible sur le site
              </span>
            </label>
          </div>

          {/* Bloc images + uploader */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E5E5E5] space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#111111] mb-4">
                Photos
              </h2>

              <ImageUpload
                images={formData.images}
                onChange={(images) =>
                  setFormData({
                    ...formData,
                    images,
                  })
                }
              />
            </div>

            {/* Aperçu "carte produit publique" */}
            <div className="border border-[#E5E5E5] rounded-xl shadow-sm overflow-hidden bg-white">
              {/* zone image */}
              <div className="relative w-full h-48 bg-[#F5F5F5] flex items-center justify-center overflow-hidden">
                {mainPhotoUrl ? (
                  <img
                    src={mainPhotoUrl}
                    alt={title || 'Aperçu véhicule'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-[#999999] text-sm flex flex-col items-center">
                    <div className="w-12 h-12 rounded-lg bg-[#E5E5E5] flex items-center justify-center text-[#666666] mb-2 text-xs">
                      IMG
                    </div>
                    <span>Aucune photo principale</span>
                  </div>
                )}

                {/* badge statut */}
                <div
                  className={`absolute top-2 left-2 text-[10px] font-semibold text-white px-2 py-1 rounded ${statusColor}`}
                >
                  {statusLabel}
                </div>

                {/* prix en bas à droite */}
                {priceLabel && (
                  <div className="absolute bottom-2 right-2 bg-black/75 text-white text-sm font-semibold px-3 py-1 rounded-lg shadow-lg">
                    {priceLabel}
                  </div>
                )}
              </div>

              {/* zone texte */}
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[#111111] font-semibold leading-tight text-base">
                      {title || 'Titre véhicule'}
                    </div>
                    <div className="text-[#666666] text-sm">
                      {formData.displacement
                        ? `${formData.displacement} cc`
                        : 'Cylindrée'}
                      {kmLabel ? ` • ${kmLabel}` : ''}
                    </div>
                  </div>

                  {/* garantie / confiance vendeur */}
                  <div className="text-[10px] text-right text-[#111111] bg-[#FFE9E9] border border-[#C62E2E]/30 rounded-md px-2 py-1 leading-tight max-w-[120px]">
                    {formData.warranty ||
                      'Garantie atelier'}
                  </div>
                </div>

                {/* extrait descriptif */}
                <div className="text-[12px] text-[#444444] line-clamp-2">
                  {formData.description || 'Description du véhicule...'}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate('/admin/vehicles')
              }
            >
              Annuler
            </Button>

            <Button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>
                {loading
                  ? 'Enregistrement...'
                  : 'Enregistrer'}
              </span>
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
