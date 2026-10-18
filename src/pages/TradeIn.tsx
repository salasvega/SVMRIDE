import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
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
import { useListe, useMasquee } from '../lib/listes';
import { Masquable } from '../components/ui/Masquable';

export function TradeIn() {
  const t = useTexte();
  const etapes = useListe('reprises.etapes');
  const etapesMasquees = useMasquee('reprises.etapes');
  // Données du formulaire de reprise
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    brand: '',
    model: '',
    year: '',
    mileage: '',
    condition: '',
    comments: '',
    consent: false,
  });

  // Photos / documents fournis par l'utilisateur (nouveau format enrichi)
  const [files, setFiles] = useState<UploadedDoc[]>([]);

  // Indicateur d'activité pendant l'upload des pièces jointes
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Hook d'envoi global (envoie vers ta Edge Function trade-in-form)
  const { submit, isSubmitting, success, error } = useFormSubmit({
    onSuccess: () => {
      setFormData({
        name: '',
        email: '',
        phone: '',
        brand: '',
        model: '',
        year: '',
        mileage: '',
        condition: '',
        comments: '',
        consent: false,
      });
      setFiles([]);
    },
  });

  // Soumission :
  // 1. upload des photos dans Supabase Storage
  // 2. envoi du payload final à la fonction edge "trade-in-form"
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
      const filePath = `trade-in/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('form-attachments')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        // On continue quand même les autres fichiers
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
    await submit(`${supabaseUrl}/functions/v1/trade-in-form`, {
      ...formData,
      attachments,
    });

    setUploadingFiles(false);
  };

  // Gestion champs contrôlés (text, select, textarea, checkbox)
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
      <SEOHead meta={pageSeo['/reprises']} />

      <Section background="gray" className="!pt-8 !pb-8 md:!pt-12 md:!pb-10">
        <Container>
          <h1 className="filet-apres mb-4">
            {t('reprises.titre')}
          </h1>
          <p className="text-base md:text-lg text-gris">
            {t('reprises.intro')}
          </p>
        </Container>
      </Section>

      <Section background="white" className="!py-8">
        <Container size="md">
          <div className={etapesMasquees ? 'grid gap-12 max-w-2xl mx-auto' : 'grid lg:grid-cols-2 gap-12'}>
            {/* Colonne gauche : explication du process (masquable dans l'admin) */}
<Masquable id="reprises.etapes">
              <div>
                <h2 className="text-[26px] md:text-[30px] filet-apres mb-6">
                  {t('reprises.etapes.titre')}
                </h2>

                <div className="space-y-6">
                  {etapes.ids.map((id, i) => (
                    <div key={id} {...etapes.attrs(id)} className="flex gap-4">
                      <div className="flex-shrink-0 pastille-etape w-12 h-12 text-lg">
                        {i + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-noir mb-2">
                          {t(etapes.cle(id, 'titre'))}
                        </h3>
                        <p className="text-gris leading-relaxed">
                          {t(etapes.cle(id, 'texte'))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
</Masquable>

            {/* Colonne droite : formulaire de reprise */}
            <div>
              {success ? (
                <div className="bg-green-50 border-2 border-green-500 rounded-xl p-8 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-green-900 mb-2">
                    {t('reprises.succes.titre')}
                  </h3>
                  <p className="text-green-800">
                    {t('reprises.succes.texte')}
                  </p>
                </div>
              ) : (
                <form data-zone="formulaires"
                  onSubmit={handleSubmit}
                  className="space-y-6 bg-fond p-8 rounded-xl"
                >
                  <h2 className="text-[26px] md:text-[30px] filet-apres mb-4">
                    {t('reprises.formulaire.titre')}
                  </h2>

                  <Input
                    label={t('reprises.formulaire.nom')}
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                  />

                  <Input
                    label={t('reprises.formulaire.email')}
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                  />

                  <Input
                    label={t('reprises.formulaire.telephone')}
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                  />

                  <Input
                    label={t('reprises.formulaire.marque')}
                    name="brand"
                    type="text"
                    required
                    value={formData.brand}
                    onChange={handleChange}
                  />

                  <Input
                    label={t('reprises.formulaire.modele')}
                    name="model"
                    type="text"
                    required
                    value={formData.model}
                    onChange={handleChange}
                  />

                  <Input
                    label={t('reprises.formulaire.annee')}
                    name="year"
                    type="number"
                    required
                    min="1980"
                    max={new Date().getFullYear()}
                    value={formData.year}
                    onChange={handleChange}
                  />

                  <Input
                    label={t('reprises.formulaire.kilometrage')}
                    name="mileage"
                    type="number"
                    required
                    value={formData.mileage}
                    onChange={handleChange}
                  />

                  <Select
                    label={t('reprises.formulaire.etat.intitule')}
                    name="condition"
                    required
                    value={formData.condition}
                    onChange={handleChange}
                  >
                    <option value="">{t('reprises.formulaire.etat.vide')}</option>
                    <option value="excellent">{t('reprises.formulaire.etat.excellent')}</option>
                    <option value="bon">{t('reprises.formulaire.etat.bon')}</option>
                    <option value="correct">{t('reprises.formulaire.etat.correct')}</option>
                    <option value="a-reviser">{t('reprises.formulaire.etat.a_reviser')}</option>
                  </Select>

                  <Textarea
                    label={t('reprises.formulaire.commentaires.intitule')}
                    name="comments"
                    rows={4}
                    placeholder={t('reprises.formulaire.commentaires.exemple')}
                    value={formData.comments}
                    onChange={handleChange}
                  />

                  <FileUpload
                    elements={t('reprises.formulaire.photos.elements')}
                    label={t('reprises.formulaire.photos.intitule')}
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
                      {t('reprises.formulaire.consentement.avant')}{' '}
                      <a
                        href="/politique-confidentialite"
                        className="text-lien underline underline-offset-2 hover:decoration-2"
                      >
                        {t('reprises.formulaire.consentement.lien')}
                      </a>
                      {t('reprises.formulaire.consentement.apres')}{' '}
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
                      {t('reprises.formulaire.televersement')}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting || uploadingFiles}
                    fullWidth
                    size="lg"
                  >
                    {uploadingFiles
                      ? t('reprises.formulaire.bouton.televersement')
                      : isSubmitting
                      ? t('reprises.formulaire.bouton.envoi')
                      : t('reprises.formulaire.bouton.texte')}
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
