import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
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

export function TradeIn() {
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
      const file = doc.file;
      const fileExt = file.name.split('.').pop();
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
      <SEOHead
        title="Reprise de votre véhicule"
        description="Faites reprendre votre moto ou scooter rapidement et au meilleur prix. Expertise gratuite, offre attractive et virement immédiat."
        path="/reprises"
      />

      <Section background="gray" className="!py-8">
        <Container>
          <h1 className="text-3xl md:text-4xl font-bold text-[#111111] mb-2">
            Reprise de votre véhicule
          </h1>
          <p className="text-lg text-[#444444]">
            Obtenez une estimation rapide et au meilleur prix
          </p>
        </Container>
      </Section>

      <Section background="white" className="!py-8">
        <Container size="md">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Colonne gauche : explication du process */}
            <div>
              <h2 className="text-2xl font-bold text-[#111111] mb-6">
                Comment ça marche ?
              </h2>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#D10000] text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#111111] mb-2">
                      Remplissez le formulaire
                    </h3>
                    <p className="text-[#444444] leading-relaxed">
                      Décrivez votre véhicule et son état en quelques
                      clics. Plus vous êtes précis, plus notre
                      estimation sera juste.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#D10000] text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#111111] mb-2">
                      Recevez une estimation
                    </h3>
                    <p className="text-[#444444] leading-relaxed">
                      Notre équipe étudie votre demande et vous
                      contacte sous 24h avec une première estimation.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#D10000] text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#111111] mb-2">
                      Expertise sur place
                    </h3>
                    <p className="text-[#444444] leading-relaxed">
                      Un rendez-vous est organisé pour examiner le
                      véhicule et finaliser l'offre.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#D10000] text-white rounded-full flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#111111] mb-2">
                      Virement immédiat
                    </h3>
                    <p className="text-[#444444] leading-relaxed">
                      Si vous acceptez l'offre, le paiement est
                      effectué immédiatement et nous gérons toutes les
                      démarches.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne droite : formulaire de reprise */}
            <div>
              {success ? (
                <div className="bg-green-50 border-2 border-green-500 rounded-xl p-8 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-green-900 mb-2">
                    Demande envoyée !
                  </h3>
                  <p className="text-green-800">
                    Nous avons bien reçu votre demande de reprise.
                    Notre équipe vous contactera sous 24h.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="space-y-6 bg-[#F9F9F9] p-8 rounded-xl"
                >
                  <h2 className="text-2xl font-bold text-[#111111] mb-4">
                    Demande de reprise
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

                  <Input
                    label="Marque"
                    name="brand"
                    type="text"
                    required
                    value={formData.brand}
                    onChange={handleChange}
                  />

                  <Input
                    label="Modèle"
                    name="model"
                    type="text"
                    required
                    value={formData.model}
                    onChange={handleChange}
                  />

                  <Input
                    label="Année"
                    name="year"
                    type="number"
                    required
                    min="1980"
                    max={new Date().getFullYear()}
                    value={formData.year}
                    onChange={handleChange}
                  />

                  <Input
                    label="Kilométrage"
                    name="mileage"
                    type="number"
                    required
                    value={formData.mileage}
                    onChange={handleChange}
                  />

                  <Select
                    label="État général"
                    name="condition"
                    required
                    value={formData.condition}
                    onChange={handleChange}
                  >
                    <option value="">Sélectionnez...</option>
                    <option value="excellent">Excellent</option>
                    <option value="bon">Bon</option>
                    <option value="correct">Correct</option>
                    <option value="a-reviser">À réviser</option>
                  </Select>

                  <Textarea
                    label="Commentaires additionnels"
                    name="comments"
                    rows={4}
                    placeholder="Historique, modifications, points à signaler..."
                    value={formData.comments}
                    onChange={handleChange}
                  />

                  <FileUpload
                    label="Photos du véhicule (fortement recommandé)"
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
                      J'accepte que mes données soient
                      utilisées pour traiter ma demande de
                      reprise conformément à la{' '}
                      <a
                        href="/politique-confidentialite"
                        className="text-[#D10000] hover:underline"
                      >
                        politique de confidentialité
                      </a>
                      .{' '}
                      <span className="text-[#D10000]">
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
                    <div className="text-sm text-[#444444] bg-white/70 border border-[#E5E5E5] rounded-lg px-3 py-2 flex items-center justify-center">
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
                      : 'Envoyer ma demande'}
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
