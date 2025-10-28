import { useState } from 'react';
import { CheckCircle, Search } from 'lucide-react';
import { SEOHead } from '../components/layout/SEOHead';
import { Section } from '../components/ui/Section';
import { Container } from '../components/ui/Container';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { FileUpload, UploadedDoc } from '../components/ui/FileUpload';
import { useFormSubmit } from '../hooks/useFormSubmit';
import { supabase } from '../lib/supabase';

export function CustomSearch() {
  // Données du formulaire "je cherche une moto précise"
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    type: '',
    brand: '',
    displacement: '',
    yearMin: '',
    budgetMax: '',
    deadline: '',
    comments: '',
    consent: false,
  });

  // Fichiers uploadés (nouveau format enrichi UploadedDoc[])
  const [files, setFiles] = useState<UploadedDoc[]>([]);

  // Hook de soumission
  const { submit, isSubmitting, success, error } = useFormSubmit({
    onSuccess: () => {
      setFormData({
        name: '',
        email: '',
        phone: '',
        type: '',
        brand: '',
        displacement: '',
        yearMin: '',
        budgetMax: '',
        deadline: '',
        comments: '',
        consent: false,
      });
      setFiles([]);
    },
  });

  // Envoi du formulaire :
  // 1. upload des fichiers vers Supabase Storage
  // 2. envoi du payload + metadata à la function edge custom-search-form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const attachments: Array<{
      filename: string;
      path: string;
      size: number;
      mime_type: string;
    }> = [];

    for (const doc of files) {
      const file = doc.file;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;
      const filePath = `custom-search/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('form-attachments')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        // On continue avec les autres pour ne pas bloquer tout le formulaire
        continue;
      }

      attachments.push({
        filename: file.name,
        path: filePath,
        size: file.size,
        mime_type: file.type,
      });
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    await submit(`${supabaseUrl}/functions/v1/custom-search-form`, {
      ...formData,
      attachments,
    });
  };

  // Mise à jour contrôlée des champs
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  };

  return (
    <>
      <SEOHead
        title="Recherche Personnalisée"
        description="Vous cherchez un deux-roues spécifique ? Confiez-nous votre recherche et nous trouvons le véhicule qui vous correspond."
        path="/recherche-personnalisee"
      />

      <Section background="gray" className="!py-8">
        <Container>
          <div className="flex items-center gap-3">
            <Search
              className="w-8 h-8 text-[#D10000]"
              aria-hidden="true"
            />
            <h1 className="text-3xl md:text-4xl font-bold text-[#111111]">
              Recherche Personnalisée
            </h1>
          </div>
          <p className="text-lg text-[#444444] mt-2">
            Nous trouvons le deux-roues de vos rêves
          </p>
        </Container>
      </Section>

      <Section background="white" className="!py-8">
        <Container size="md">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Colonne gauche : texte marketing / étapes */}
            <div>
              <h2 className="text-2xl font-bold text-[#111111] mb-6">
                Un service sur-mesure
              </h2>

              <p className="text-[#444444] leading-relaxed mb-6">
                Vous cherchez un modèle précis, une configuration
                particulière ou un véhicule rare ? Notre service de
                recherche personnalisée met notre expertise et notre
                réseau à votre disposition pour dénicher le deux-roues
                qui correspond exactement à vos critères.
              </p>

              <div className="space-y-4">
                <div className="bg-[#F9F9F9] p-6 rounded-xl">
                  <h3 className="font-semibold text-[#111111] mb-2 flex items-center gap-2">
                    <span className="w-8 h-8 bg-[#D10000] text-white rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </span>
                    Définissez vos critères
                  </h3>
                  <p className="text-sm text-[#444444] ml-10">
                    Remplissez le formulaire avec vos souhaits : marque,
                    modèle, budget, délai...
                  </p>
                </div>

                <div className="bg-[#F9F9F9] p-6 rounded-xl">
                  <h3 className="font-semibold text-[#111111] mb-2 flex items-center gap-2">
                    <span className="w-8 h-8 bg-[#D10000] text-white rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </span>
                    Nous cherchons pour vous
                  </h3>
                  <p className="text-sm text-[#444444] ml-10">
                    Notre équipe active son réseau et recherche
                    activement le véhicule correspondant.
                  </p>
                </div>

                <div className="bg-[#F9F9F9] p-6 rounded-xl">
                  <h3 className="font-semibold text-[#111111] mb-2 flex items-center gap-2">
                    <span className="w-8 h-8 bg-[#D10000] text-white rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </span>
                    Vous recevez des propositions
                  </h3>
                  <p className="text-sm text-[#444444] ml-10">
                    Nous vous présentons les véhicules trouvés avec
                    photos, historique et prix.
                  </p>
                </div>

                <div className="bg-[#F9F9F9] p-6 rounded-xl">
                  <h3 className="font-semibold text-[#111111] mb-2 flex items-center gap-2">
                    <span className="w-8 h-8 bg-[#D10000] text-white rounded-full flex items-center justify-center text-sm font-bold">
                      4
                    </span>
                    Vous choisissez
                  </h3>
                  <p className="text-sm text-[#444444] ml-10">
                    Pas de pression, vous décidez librement si une
                    proposition vous convient.
                  </p>
                </div>
              </div>

              <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm text-blue-900">
                  <strong>
                    Service gratuit et sans engagement.
                  </strong>{' '}
                  Vous ne payez que si vous achetez le véhicule trouvé.
                </p>
              </div>
            </div>

            {/* Colonne droite : formulaire */}
            <div>
              {success ? (
                <div className="bg-green-50 border-2 border-green-500 rounded-xl p-8 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-green-900 mb-2">
                    Recherche lancée !
                  </h3>
                  <p className="text-green-800">
                    Nous avons bien reçu votre demande. Notre équipe
                    commence immédiatement la recherche et vous tiendra
                    informé.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="space-y-6 bg-[#F9F9F9] p-8 rounded-xl sticky top-24"
                >
                  <h2 className="text-2xl font-bold text-[#111111] mb-4">
                    Votre recherche
                  </h2>

                  <Input
                    label="Nom complet"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                  />

                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                  />

                  <Input
                    label="Téléphone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                  />

                  <Select
                    label="Type de véhicule"
                    name="type"
                    required
                    value={formData.type}
                    onChange={handleChange}
                  >
                    <option value="">Sélectionnez...</option>
                    <option value="moto">Moto</option>
                    <option value="scooter">Scooter</option>
                    <option value="indifferent">Indifférent</option>
                  </Select>

                  <Input
                    label="Marque souhaitée (optionnel)"
                    name="brand"
                    type="text"
                    placeholder="Ex: Yamaha, Honda..."
                    value={formData.brand}
                    onChange={handleChange}
                  />

                  <Select
                    label="Cylindrée souhaitée"
                    name="displacement"
                    value={formData.displacement}
                    onChange={handleChange}
                  >
                    <option value="">Indifférent</option>
                    <option value="125">125 cc</option>
                    <option value="300">300 cc</option>
                    <option value="500">500 cc</option>
                    <option value="650">650 cc</option>
                    <option value="800+">800 cc et plus</option>
                  </Select>

                  <Input
                    label="Année minimale"
                    name="yearMin"
                    type="number"
                    min="2000"
                    max={new Date().getFullYear()}
                    placeholder="Ex: 2018"
                    value={formData.yearMin}
                    onChange={handleChange}
                  />

                  <Input
                    label="Budget maximum (€)"
                    name="budgetMax"
                    type="number"
                    required
                    min="1000"
                    value={formData.budgetMax}
                    onChange={handleChange}
                  />

                  <Select
                    label="Délai souhaité"
                    name="deadline"
                    required
                    value={formData.deadline}
                    onChange={handleChange}
                  >
                    <option value="">Sélectionnez...</option>
                    <option value="urgent">
                      Urgent (moins de 2 semaines)
                    </option>
                    <option value="1-month">1 mois</option>
                    <option value="2-months">2 mois</option>
                    <option value="flexible">Flexible</option>
                  </Select>

                  <Textarea
                    label="Détails supplémentaires"
                    name="comments"
                    rows={3}
                    placeholder="Modèle précis, couleur, équipements souhaités..."
                    value={formData.comments}
                    onChange={handleChange}
                  />

                  <FileUpload
                    label="Pièces jointes (optionnel)"
                    maxFiles={10}
                    maxSizeMB={10}
                    accept="image/*,application/pdf"
                    value={files}
                    onChange={setFiles}
                  />

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="consent"
                      name="consent"
                      required
                      checked={formData.consent}
                      onChange={handleChange}
                      className="mt-1 w-4 h-4 text-[#D10000] focus:ring-[#D10000] rounded"
                    />
                    <label
                      htmlFor="consent"
                      className="text-sm text-[#444444]"
                    >
                      J'accepte que mes données soient utilisées
                      pour traiter ma recherche conformément à la{' '}
                      <a
                        href="/politique-confidentialite"
                        className="text-[#D10000] hover:underline"
                      >
                        politique de confidentialité
                      </a>
                      .{' '}
                      <span className="text-[#D10000]">*</span>
                    </label>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    fullWidth
                    size="lg"
                  >
                    {isSubmitting
                      ? 'Envoi en cours...'
                      : 'Lancer la recherche'}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
