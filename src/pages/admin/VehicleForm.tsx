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
import Toast from '../../components/ui/Toast';

export function VehicleForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Helper: on normalise les images qui viennent de la base
  // - si c'est déjà {url, path}, on garde
  // - si c'est juste une string (ancienne version), on la transforme en {url: string, path: ''}
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
    purchase_price: 0,
    sale_price: undefined as number | undefined,
    sale_date: undefined as string | undefined,
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
        purchase_price: vehicle.purchase_price || 0,
        sale_price: vehicle.sale_price,
        sale_date: vehicle.sale_date ? vehicle.sale_date.split('T')[0] : undefined,
        mileage: vehicle.mileage,
        condition: vehicle.condition as
          | 'excellent'
          | 'bon'
          | 'correct'
          | 'a-reviser',
        description: vehicle.description || '',
        images: normalizeImagesFromDB((vehicle as any).images || []),
        features: vehicle.features || [],
        warranty:
          vehicle.warranty ||
          "Garantie 6 mois pièces et main d'œuvre",
        status: vehicle.status || 'available',
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

    // transforme "ABS, led, ..." en tableau propre
    const features = featuresInput
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    // point important :
    // on enregistre seulement les URL (string[])
    // car on suppose que ta colonne "images" dans Supabase est text[]
    // et pas encore un jsonb complexe
    const vehicleData: any = {
      ...formData,
      features,
      images: formData.images.map((img) => img.url),
      available: formData.status === 'available' && formData.available,
      sale_date: formData.status === 'sold' && formData.sale_date ? formData.sale_date : null,
    };

    if (formData.status !== 'sold') {
      delete vehicleData.sale_price;
      delete vehicleData.sale_date;
    }

    try {
      if (isEditing && id) {
        const { error: updateError } = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', id);

        if (updateError) throw updateError;

        setToast({ type: 'success', message: 'Véhicule modifié avec succès' });
      } else {
        const { error: insertError } = await supabase
          .from('vehicles')
          .insert([vehicleData]);

        if (insertError) throw insertError;

        setToast({ type: 'success', message: 'Véhicule ajouté avec succès' });
      }

      setTimeout(() => {
        navigate('/admin/vehicles');
      }, 1500);
    } catch (err) {
      console.error('Error saving vehicle:', err);
      setError("Erreur lors de l'enregistrement du véhicule");
      setToast({ type: 'error', message: "Erreur lors de l'enregistrement du véhicule" });
      setLoading(false);
    }
  };

  const generateSlug = () => {
    const slug = `${formData.brand}-${formData.model}-${formData.year}`
      .toLowerCase()
      .normalize('NFD') // enlève les accents
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    setFormData({ ...formData, slug });
  };

  return (
    <>
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
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

        {/* Error global */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Form */}
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

            {formData.status !== 'sold' && (
              <>
                <Input
                  label="Prix de revient (€)"
                  type="number"
                  value={formData.purchase_price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      purchase_price: Number(
                        e.target.value
                      ),
                    })
                  }
                  required
                  min="0"
                  placeholder="ex: 5000"
                  helperText="Prix auquel vous avez acheté le véhicule"
                />

                <Input
                  label="Prix de mise en vente (€)"
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
                  helperText="Prix affiché sur le site"
                />
              </>
            )}

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

            {formData.status === 'sold' && (
              <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="space-y-4">
                  <Input
                    label="Prix de revient (€)"
                    type="number"
                    value={formData.purchase_price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        purchase_price: Number(
                          e.target.value
                        ),
                      })
                    }
                    required
                    min="0"
                    placeholder="ex: 5000"
                    helperText="Somme des couts d'achat du véhicule + des frais engagés pour sa mise en vente"
                  />
                  <Input
                    label="Prix de vente final (€)"
                    type="number"
                    value={formData.sale_price || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sale_price: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    min="0"
                    placeholder="ex: 6200"
                    helperText="Prix réel de la vente"
                  />
                  <Input
                    label="Date de vente"
                    type="date"
                    value={formData.sale_date || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sale_date: e.target.value,
                      })
                    }
                    helperText="Date de finalisation de la vente"
                  />
                </div>
                {formData.sale_price && formData.purchase_price && (
                  <div className="p-3 bg-white rounded border border-green-300">
                    <p className="text-sm text-[#666666]">Marge réalisée</p>
                    <p className="text-2xl font-bold text-green-600">
                      {(formData.sale_price - formData.purchase_price).toLocaleString('fr-FR')} €
                    </p>
                    <p className="text-xs text-[#666666] mt-1">
                      {(((formData.sale_price - formData.purchase_price) / formData.purchase_price) * 100).toFixed(1)}% de marge
                    </p>
                  </div>
                )}
              </div>
            )}

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

          {/* Bloc images */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E5E5E5]">
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
    </>
  );
}
