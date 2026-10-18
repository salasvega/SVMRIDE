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
import { pageSeo } from '../config/seo';
import { Section } from '../components/ui/Section';
import { Container } from '../components/ui/Container';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { FileUpload, UploadedDoc } from '../components/ui/FileUpload';
import { useFormSubmit } from '../hooks/useFormSubmit';
import { supabase } from '../lib/supabase';
import { compresserImage, extensionDe } from '../lib/compressionImage';
import { useEquipe } from '../lib/equipe';
import { MEMBRES } from '../config/equipe';
import { Portrait } from '../components/equipe/Portrait';
import { useCoordonnees } from '../lib/coordonnees';
import { adresseComplete, lienInstagram, lienMaps, lienTelephone, lignesHoraires } from '../config/coordonnees';
import { useTexte } from '../lib/textes';

export function Contact() {
  const t = useTexte();
  // Si on arrive depuis une fiche véhicule, on a passé `state={{ vehicle: "Yamaha MT-07 2021" }}`
  const location = useLocation();
  // Carte du responsable : fiche « responsable » de l'admin (onglet Équipe)
  const equipe = useEquipe();
  // Coordonnées modifiables dans l'admin, onglet « Édition du site »
  const c = useCoordonnees();
  const responsable = (equipe?.membres ?? MEMBRES).find((m) => m.responsable) ?? MEMBRES[0];
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
      const file = await compresserImage(doc.file);
      const fileExt = extensionDe(file);
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
      <SEOHead meta={pageSeo['/contact']} />

      <Section background="gray" className="!pt-8 !pb-8 md:!pt-12 md:!pb-10">
        <Container>
          <h1 className="filet-apres mb-4">
            {t('contact.titre')}
          </h1>
          <p className="text-base md:text-lg text-gris">
            {t('contact.intro')}
          </p>
        </Container>
      </Section>

      <Section background="white" className="!py-8">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Colonne gauche : infos de contact */}
            <div>
              <h2 className="text-[26px] md:text-[30px] filet-apres mb-6">
                Nos coordonnées
              </h2>

              {/* Carte de visite du responsable commercial */}
              <div className="sur-sombre relative overflow-hidden rounded-2xl bg-noir-profond text-inverse shadow-vehicule mb-6">
                <div className="liseret-or" aria-hidden="true" />
                <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-5 md:p-6">
                  <div className="flex items-center gap-4 sm:block flex-shrink-0">
                    <Portrait
                      membre={responsable}
                      taille={96}
                      classeTaille="h-20 w-20 md:h-24 md:w-24"
                      anneauOr
                      surSombre
                      decoratif={false}
                    />
                    <div className="sm:hidden">
                      <p className="titre-display text-2xl leading-none">{responsable.prenom}</p>
                      <p className="mt-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-or-clair">
                        {responsable.fonction}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 sm:border-l sm:border-inverse/15 sm:pl-5">
                    <div className="hidden sm:block mb-3">
                      <p className="titre-display text-[26px] leading-none">{responsable.prenom}</p>
                      <p className="mt-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-or-clair">
                        {responsable.fonction}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <a
                        href={lienTelephone(c.telephone)}
                        className="flex items-center gap-2.5 rounded-lg py-1.5 text-inverse-91 hover:text-inverse transition-colors duration-180"
                      >
                        <Phone className="w-[18px] h-[18px] text-or-clair flex-shrink-0" strokeWidth={1.8} aria-hidden="true" />
                        <span className="font-medium">{c.telephone}</span>
                      </a>
                      <a
                        href={`mailto:${c.email}`}
                        className="flex items-center gap-2.5 rounded-lg py-1.5 text-inverse-91 hover:text-inverse transition-colors duration-180 break-all"
                      >
                        <Mail className="w-[18px] h-[18px] text-or-clair flex-shrink-0" strokeWidth={1.8} aria-hidden="true" />
                        <span>{c.email}</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {c.instagram && <div className="space-y-6 mb-8">
                <a
                  href={lienInstagram(c.instagram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 p-4 bg-fond rounded-xl hover:bg-bordure transition-colors"
                >
                  <Instagram
                    className="w-6 h-6 text-or-texte flex-shrink-0 mt-1"
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className="font-semibold text-noir mb-1">
                      Instagram
                    </h3>
                    <p className="text-gris">
                      @{c.instagram}
                    </p>
                  </div>
                </a>
              </div>}

              <div className="bg-fond p-6 rounded-xl">
                <div className="flex items-start gap-3 mb-6">
                  <MapPin
                    className="w-6 h-6 text-or-texte flex-shrink-0"
                    aria-hidden="true"
                  />
                  <h3 className="font-semibold text-noir text-xl">
                    Notre showroom
                  </h3>
                </div>

                <div className="space-y-4 mb-6">
                  {[c.showroom].map((showroom, index) => (
                    <a
                      key={index}
                      href={lienMaps(c)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 p-4 bg-surface rounded-lg hover:shadow-md transition-all border border-bordure hover:border-lien group"
                    >
                      <MapPin
                        className="w-5 h-5 text-or-texte flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform"
                        aria-hidden="true"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-noir mb-1 group-hover:text-lien transition-colors duration-180">
                          {showroom.nom}
                        </div>
                        <div className="text-sm text-gris mb-1">
                          {adresseComplete(c)}
                        </div>
                        {showroom.note && (
                          <div className="text-xs text-doux-64 italic">
                            ({showroom.note})
                          </div>
                        )}
                        <div className="text-xs text-lien font-medium mt-2 flex items-center gap-1">
                          <span>Voir sur Google Maps</span>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>

                <div className="bg-surface p-4 rounded-lg border border-bordure">
                  <div className="flex items-start gap-3 mb-2">
                    <Clock
                      className="w-5 h-5 text-or-texte flex-shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <h4 className="font-semibold text-noir">Horaires</h4>
                  </div>
                  <div className="pl-8 text-sm text-gris space-y-1">
                    {lignesHoraires(c.horaires).map((l) => <div key={l}>{l}</div>)}
                  </div>
                  {c.horaires_note && (
                    <div className="pl-8 text-xs text-doux-64 mt-3 italic">
                      {c.horaires_note}
                    </div>
                  )}
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
                <form data-zone="formulaires"
                  onSubmit={handleSubmit}
                  className="space-y-6 bg-fond p-8 rounded-xl"
                >
                  <h2 className="text-[26px] md:text-[30px] filet-apres mb-4">
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
                      J'accepte que mes données soient
                      utilisées pour traiter ma demande
                      conformément à la{' '}
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

                  {/* Indicateur visuel pendant l'envoi des pièces jointes */}
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
