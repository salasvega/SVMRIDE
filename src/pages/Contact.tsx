import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  CheckCircle,
  Mail,
  Phone,
  Instagram,
  MapPin,
  Clock,
} from 'lucide-react';
import { SEOHead } from '../components/layout/SEOHead';
import { Section } from '../components/ui/Section';
import { Container } from '../components/ui/Container';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { FileUpload, UploadedDoc } from '../components/ui/FileUpload';
import { useFormSubmit } from '../hooks/useFormSubmit';
import { siteConfig } from '../config/site';
import { supabase } from '../lib/supabase';

export function Contact() {
  // Si on arrive depuis une fiche véhicule, on a passé `state={{ vehicle: "Yamaha MT-07 2021" }}`
  const location = useLocation();
  const vehicleRef =
    (location.state as { vehicle?: string } | undefined)?.vehicle || '';

  // Données du formulaire (côté client)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: vehicleRef
      ? `Demande d'information - ${vehicleRef}`
      : '',
    message: '',
    consent: false,
  });

  // Fichiers uploadés (nouveau format enrichi UploadedDoc[])
  const [files, setFiles] = useState<UploadedDoc[]>([]);

  // Indicateur de progression spécifique à l'upload des pièces jointes
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Hook de soumission vers Supabase (envoi du lead après upload)
  const { submit, isSubmitting, success, error } = useFormSubmit({
    onSuccess: () => {
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        consent: false,
      });
      setFiles([]);
    },
  });

  // Envoi du formulaire :
  // 1. on uploade chaque fichier dans Supabase Storage (bucket "form-attachments")
  // 2. on envoie le payload complet (avec attachments) à la fonction edge contact-form
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
      const filePath = `contact/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('form-attachments')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        // On ne bloque pas tout le formulaire si un seul fichier échoue
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
    await submit(`${supabaseUrl}/functions/v1/contact-form`, {
      ...formData,
      attachments,
    });

    setUploadingFiles(false);
  };

  // Mise à jour des champs texte / checkbox
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
        title="Contact"
        description="Contactez SVM Ride pour toute question sur nos véhicules, nos services ou pour prendre rendez-vous."
        path="/contact"
      />

      <Section background="gray" className="!py-8">
        <Container>
          <h1 className="text-3xl md:text-4xl font-bold text-[#111111] mb-2">
            Contactez-nous
          </h1>
          <p className="text-lg text-[#444444]">
            Nous sommes à votre écoute
          </p>
        </Container>
      </Section>

      <Section background="white" className="!py-8">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Colonne gauche : infos de contact */}
            <div>
              <h2 className="text-2xl font-bold text-[#111111] mb-6">
                Nos coordonnées
              </h2>

              <div className="space-y-6 mb-8">
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="flex items-start gap-4 p-4 bg-[#F9F9F9] rounded-xl hover:bg-[#EEEEEE] transition-colors"
                >
                  <Mail
                    className="w-6 h-6 text-[#D10000] flex-shrink-0 mt-1"
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className="font-semibold text-[#111111] mb-1">
                      Email
                    </h3>
                    <p className="text-[#444444]">
                      {siteConfig.contact.email}
                    </p>
                  </div>
                </a>

                <a
                  href={`tel:${siteConfig.contact.phone.replace(
                    /\s/g,
                    ''
                  )}`}
                  className="flex items-start gap-4 p-4 bg-[#F9F9F9] rounded-xl hover:bg-[#EEEEEE] transition-colors"
                >
                  <Phone
                    className="w-6 h-6 text-[#D10000] flex-shrink-0 mt-1"
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className="font-semibold text-[#111111] mb-1">
                      Téléphone
                    </h3>
                    <p className="text-[#444444]">
                      {siteConfig.contact.phone}
                    </p>
                  </div>
                </a>

                <a
                  href={siteConfig.contact.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 p-4 bg-[#F9F9F9] rounded-xl hover:bg-[#EEEEEE] transition-colors"
                >
                  <Instagram
                    className="w-6 h-6 text-[#D10000] flex-shrink-0 mt-1"
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className="font-semibold text-[#111111] mb-1">
                      Instagram
                    </h3>
                    <p className="text-[#444444]">
                      {siteConfig.contact.instagram}
                    </p>
                  </div>
                </a>
              </div>

              <div className="bg-[#F9F9F9] p-6 rounded-xl mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin
                    className="w-6 h-6 text-[#D10000]"
                    aria-hidden="true"
                  />
                  <h3 className="font-semibold text-[#111111]">
                    Adresse
                  </h3>
                </div>
                <p className="text-[#444444]">
                  Île-de-France
                  <br />
                  Sur rendez-vous uniquement
                </p>
              </div>

              <div className="bg-[#F9F9F9] p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Clock
                    className="w-6 h-6 text-[#D10000]"
                    aria-hidden="true"
                  />
                  <h3 className="font-semibold text-[#111111]">
                    Horaires
                  </h3>
                </div>

                <div className="space-y-2 text-[#444444]">
                  <div className="flex justify-between">
                    <span>Lundi - Vendredi:</span>
                    <span className="font-medium">
                      9h00 - 19h00
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Samedi:</span>
                    <span className="font-medium">
                      10h00 - 18h00
                    </span>
                  </div>
                 
                </div>
              </div>
            </div>

            {/* Colonne droite : formulaire de contact */}
            <div>
              {success ? (
                <div className="bg-green-50 border-2 border-green-500 rounded-xl p-8 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-green-900 mb-2">
                    Message envoyé !
                  </h3>
                  <p className="text-green-800">
                    Nous avons bien reçu votre message. Notre
                    équipe vous répondra dans les plus brefs
                    délais.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="space-y-6 bg-[#F9F9F9] p-8 rounded-xl"
                >
                  <h2 className="text-2xl font-bold text-[#111111] mb-4">
                    Envoyez-nous un message
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
                    label="Sujet"
                    name="subject"
                    type="text"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                  />

                  <Textarea
                    label="Message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
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
                      J'accepte que mes données soient
                      utilisées pour traiter ma demande
                      conformément à la{' '}
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

                  {/* Indicateur visuel pendant l'envoi des pièces jointes */}
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
                      : 'Envoyer le message'}
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
