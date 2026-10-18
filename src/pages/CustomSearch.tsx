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
import { useTexte } from '../lib/textes';
import { useListe } from '../lib/listes';

export function CustomSearch() {
  const t = useTexte();
  const etapes = useListe('recherche.etapes');
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
              {t('recherche.titre')}
            </h1>
          </div>
          <p className="text-base md:text-lg text-gris mt-2">
            {t('recherche.intro')}
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
                {t('recherche.service.titre')}
              </h2>

              <p className="text-gris leading-relaxed mb-6">
                {t('recherche.service.texte')}
              </p>

              <div className="space-y-4">
                {etapes.ids.map((id, i) => (
                  <div key={id} {...etapes.attrs(id)} className="bg-fond p-6 rounded-xl">
                    <h3 className="font-semibold text-noir mb-2 flex items-center gap-2">
                      <span className="pastille-etape w-8 h-8 text-sm">
                        {i + 1}
                      </span>
                      {t(etapes.cle(id, 'titre'))}
                    </h3>
                    <p className="text-sm text-gris ml-10">
                      {t(etapes.cle(id, 'texte'))}
                    </p>
                  </div>
                ))}
              </div>

            </div>

            {/* Colonne droite : formulaire */}
            <div>
              {success ? (
                <div className="bg-green-50 border-2 border-green-500 rounded-xl p-8 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-green-900 mb-2">
                    {t('recherche.succes.titre')}
                  </h3>
                  <p className="text-green-800">
                    {t('recherche.succes.texte')}
                  </p>
                </div>
              ) : (
                <form data-zone="formulaires"
                  onSubmit={handleSubmit}
                  className="space-y-6 bg-fond p-8 rounded-xl lg:-mt-8"
                >
                  <h2 className="text-[26px] md:text-[30px] filet-apres mb-4">
                    {t('recherche.formulaire.titre')}
                  </h2>

                  <Input
                    label={t('recherche.formulaire.nom')}
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                  />

                  <Input
                    label={t('recherche.formulaire.email')}
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                  />

                  <Input
                    label={t('recherche.formulaire.telephone')}
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                  />

                  <Select
                    label={t('recherche.formulaire.type.intitule')}
                    name="type"
                    required
                    value={formData.type}
                    onChange={handleChange}
                  >
                    <option value="">{t('recherche.formulaire.type.vide')}</option>
                    <option value="moto">{t('recherche.formulaire.type.moto')}</option>
                    <option value="scooter">{t('recherche.formulaire.type.scooter')}</option>
                    <option value="indifferent">
                      {t('recherche.formulaire.type.indifferent')}
                    </option>
                  </Select>

                  <Input
                    label={t('recherche.formulaire.marque.intitule')}
                    name="brand"
                    type="text"
                    placeholder={t('recherche.formulaire.marque.exemple')}
                    value={formData.brand}
                    onChange={handleChange}
                  />

                  <Select
                    label={t('recherche.formulaire.cylindree.intitule')}
                    name="displacement"
                    value={formData.displacement}
                    onChange={handleChange}
                  >
                    <option value="">
                      {t('recherche.formulaire.cylindree.indifferent')}
                    </option>
                    <option value="125">{t('recherche.formulaire.cylindree.125')}</option>
                    <option value="300">{t('recherche.formulaire.cylindree.300')}</option>
                    <option value="500">{t('recherche.formulaire.cylindree.500')}</option>
                    <option value="650">{t('recherche.formulaire.cylindree.650')}</option>
                    <option value="800+">
                      {t('recherche.formulaire.cylindree.800')}
                    </option>
                  </Select>

                  <Input
                    label={t('recherche.formulaire.annee.intitule')}
                    name="yearMin"
                    type="number"
                    min="2000"
                    max={new Date().getFullYear()}
                    placeholder={t('recherche.formulaire.annee.exemple')}
                    value={formData.yearMin}
                    onChange={handleChange}
                  />

                  <Input
                    label={t('recherche.formulaire.budget')}
                    name="budgetMax"
                    type="number"
                    required
                    min="1000"
                    value={formData.budgetMax}
                    onChange={handleChange}
                  />

                  <Select
                    label={t('recherche.formulaire.delai.intitule')}
                    name="deadline"
                    required
                    value={formData.deadline}
                    onChange={handleChange}
                  >
                    <option value="">{t('recherche.formulaire.delai.vide')}</option>
                    <option value="urgent">
                      {t('recherche.formulaire.delai.urgent')}
                    </option>
                    <option value="1-month">{t('recherche.formulaire.delai.1_mois')}</option>
                    <option value="2-months">
                      {t('recherche.formulaire.delai.2_mois')}
                    </option>
                    <option value="flexible">
                      {t('recherche.formulaire.delai.flexible')}
                    </option>
                  </Select>

                  <Textarea
                    label={t('recherche.formulaire.details.intitule')}
                    name="comments"
                    rows={3}
                    placeholder={t('recherche.formulaire.details.exemple')}
                    value={formData.comments}
                    onChange={handleChange}
                  />

                  <FileUpload
                    elements={t('recherche.formulaire.pieces.elements')}
                    label={t('recherche.formulaire.pieces.intitule')}
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
                      {t('recherche.formulaire.consentement.avant')}{' '}
                      <a
                        href="/politique-confidentialite"
                        className="text-lien underline underline-offset-2 hover:decoration-2"
                      >
                        {t('recherche.formulaire.consentement.lien')}
                      </a>
                      {t('recherche.formulaire.consentement.apres')}{' '}
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
                      {t('recherche.formulaire.televersement')}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting || uploadingFiles}
                    fullWidth
                    size="lg"
                  >
                    {uploadingFiles
                      ? t('recherche.formulaire.bouton.televersement')
                      : isSubmitting
                      ? t('recherche.formulaire.bouton.envoi')
                      : t('recherche.formulaire.bouton.texte')}
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
