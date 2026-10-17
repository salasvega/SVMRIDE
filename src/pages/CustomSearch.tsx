import { useState } from 'react';
import { CheckCircle, Search } from 'lucide-react';
import { SEOHead } from '../components/layout/SEOHead';
import { pageSeo } from '../config/seo';
import { Section } from '../components/ui/Section';
import { Container } from '../components/ui/Container';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { FileUpload, UploadedDoc } from '../components/ui/FileUpload';
import { useFormSubmit } from '../hooks/useFormSubmit';
import { supabase } from '../lib/supabase';
import { compresserImage, extensionDe } from '../lib/compressionImage';

export function CustomSearch() {
  // Données du formulaire "je cherche un véhicule précis"
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

  // Indicateur de progression spécifique à l'upload des pièces jointes
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Hook de soumission (appelle ta function edge côté Supabase)
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

  // Soumission finale :
  // 1. Upload des pièces dans Supabase Storage
  // 2. Envoi du payload à la function edge "custom-search-form"
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setUploadingFiles(true);

    const attachments: Array<{
      filename: string;
      path: string;
      size: number;
      mime_type: string;
    }> = [];

    for (const doc of files) {
      const file = await compresserImage(doc.file);
      const fileExt = extensionDe(file);
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;
      const filePath = `custom-search/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('form-attachments')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        // on continue quand même les autres fichiers
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

    setUploadingFiles(false);
  };

  // Gestion des champs de formulaire
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
      <SEOHead meta={pageSeo['/recherche-personnalisee']} />

      <Section background="gray" className="!pt-8 !pb-8 md:!pt-12 md:!pb-10">
        <Container>
          <div className="flex items-center gap-3">
            <Search
              className="w-8 h-8 text-or-texte"
              aria-hidden="true"
            />
            <h1 className="filet-apres">
              Recherche Personnalisée
            </h1>
          </div>
          <p className="text-base md:text-lg text-gris mt-2">
            Nous trouvons le deux-roues de vos rêves
          </p>
        </Container>
      </Section>

      <Section background="white" className="!py-8 lg:!pt-16">
        <Container size="md">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Colonne gauche : explication du service. Sur grand écran assez haut, elle
                reste visible pendant qu'on remplit le formulaire (plus long qu'elle). */}
            <div className="lg:self-start [@media(min-width:1024px)_and_(min-height:900px)]:sticky [@media(min-width:1024px)_and_(min-height:900px)]:top-24">
              <h2 className="text-[26px] md:text-[30px] filet-apres mb-6">
                Un service sur-mesure
              </h2>

              <p className="text-gris leading-relaxed mb-6">
                Vous cherchez un modèle précis, une configuration
                particulière ou un véhicule rare ? Notre service de
                recherche personnalisée met notre expertise et notre
                réseau à votre disposition pour dénicher le deux-roues
                qui correspond exactement à vos critères.
              </p>

              <div className="space-y-4">
                <div className="bg-fond p-6 rounded-xl">
                  <h3 className="font-semibold text-noir mb-2 flex items-center gap-2">
                    <span className="pastille-etape w-8 h-8 text-sm">
                      1
                    </span>
                    Définissez vos critères
                  </h3>
                  <p className="text-sm text-gris ml-10">
                    Remplissez le formulaire avec vos souhaits : marque,
                    modèle, budget, délai...
                  </p>
                </div>

                <div className="bg-fond p-6 rounded-xl">
                  <h3 className="font-semibold text-noir mb-2 flex items-center gap-2">
                    <span className="pastille-etape w-8 h-8 text-sm">
                      2
                    </span>
                    Nous cherchons pour vous
                  </h3>
                  <p className="text-sm text-gris ml-10">
                    Notre équipe active son réseau et recherche
                    activement le véhicule correspondant.
                  </p>
                </div>

                <div className="bg-fond p-6 rounded-xl">
                  <h3 className="font-semibold text-noir mb-2 flex items-center gap-2">
                    <span className="pastille-etape w-8 h-8 text-sm">
                      3
                    </span>
                    Vous recevez des propositions
                  </h3>
                  <p className="text-sm text-gris ml-10">
                    Nous vous présentons les véhicules trouvés avec
                    photos, historique et prix.
                  </p>
                </div>

                <div className="bg-fond p-6 rounded-xl">
                  <h3 className="font-semibold text-noir mb-2 flex items-center gap-2">
                    <span className="pastille-etape w-8 h-8 text-sm">
                      4
                    </span>
                    Vous choisissez
                  </h3>
                  <p className="text-sm text-gris ml-10">
                    Pas de pression, vous décidez librement si une
                    proposition vous convient.
                  </p>
                </div>
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
                <form data-zone="formulaires"
                  onSubmit={handleSubmit}
                  className="space-y-6 bg-fond p-8 rounded-xl lg:-mt-8"
                >
                  <h2 className="text-[26px] md:text-[30px] filet-apres mb-4">
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
                    <option value="indifferent">
                      Indifférent
                    </option>
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
                    <option value="">
                      Indifférent
                    </option>
                    <option value="125">125 cc</option>
                    <option value="300">300 cc</option>
                    <option value="500">500 cc</option>
                    <option value="650">650 cc</option>
                    <option value="800+">
                      800 cc et plus
                    </option>
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
                    <option value="2-months">
                      2 mois
                    </option>
                    <option value="flexible">
                      Flexible
                    </option>
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
                    elements="fichiers"
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
                      className="mt-1 w-4 h-4 text-lien focus:ring-lien/30 rounded"
                    />
                    <label
                      htmlFor="consent"
                      className="text-sm text-gris"
                    >
                      J'accepte que mes données soient utilisées
                      pour traiter ma recherche conformément à
                      la{' '}
                      <a
                        href="/politique-confidentialite"
                        className="text-lien underline underline-offset-2 hover:decoration-2"
                      >
                        politique de confidentialité
                      </a>
                      .{' '}
                      <span className="text-lien">
                        *
                      </span>
                    </label>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  {/* Indicateur visuel pendant upload */}
                  {uploadingFiles && (
                    <div className="text-sm text-gris bg-surface/70 border border-bordure rounded-lg px-3 py-2 flex items-center justify-center">
                      Téléversement des documents...
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting || uploadingFiles}
                    fullWidth
                    size="lg"
                  >
                    {uploadingFiles
                      ? 'Téléversement des documents...'
                      : isSubmitting
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
