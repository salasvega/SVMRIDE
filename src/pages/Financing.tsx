import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, Calculator } from 'lucide-react';
import { SEOHead } from '../components/layout/SEOHead';
import { Section } from '../components/ui/Section';
import { Container } from '../components/ui/Container';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { FileUpload, UploadedDoc } from '../components/ui/FileUpload';
import { useFormSubmit } from '../hooks/useFormSubmit';
import { supabase } from '../lib/supabase';

export function Financing() {
  // Lecture des paramètres passés depuis la fiche véhicule
  // ex: /financement?vehicle=Yamaha%20MT-07%202021&price=6500&slug=yamaha-mt07-2021
  const [searchParams] = useSearchParams();
  const vehicleFromURL = searchParams.get('vehicle') || '';
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const priceFromURL = searchParams.get('price');
  const slugFromURL = searchParams.get('slug') || '';
  const parsedPrice = priceFromURL ? Number(priceFromURL) : null;

  // Simulateur de crédit -> initialisé avec le prix du véhicule si dispo
  const [simulatorData, setSimulatorData] = useState({
    amount: parsedPrice && !Number.isNaN(parsedPrice) ? parsedPrice : 5000,
    duration: 24,
    rate: 7,
  });

  // Formulaire envoyé côté serveur
  // On rajoute vehicleSlug dans formData pour lier la demande au stock
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    amount: (parsedPrice && !Number.isNaN(parsedPrice) ? parsedPrice : 5000).toString(),
    duration: '36',
    comments: vehicleFromURL
      ? `Je souhaite financer ${vehicleFromURL}${parsedPrice ? ` affiché à ${parsedPrice} €` : ''}.`
      : '',
    consent: false,
    vehicleSlug: slugFromURL, // 👈 nouveau champ
  });

  // Fichiers enrichis (preview, qualité, etc.)
  const [files, setFiles] = useState<UploadedDoc[]>([]);

  // Hook qui gère l'envoi à Supabase
  const { submit, isSubmitting, success, error } = useFormSubmit({
    onSuccess: () => {
      // Après envoi, on laisse les infos véhicule pré-remplies pour la lisibilité si la page reste affichée
      setFormData({
        name: '',
        email: '',
        phone: '',
        amount: simulatorData.amount.toString(),
        duration: simulatorData.duration.toString(),
        comments: vehicleFromURL
          ? `Je souhaite financer ${vehicleFromURL}${parsedPrice ? ` affiché à ${parsedPrice} €` : ''}.`
          : '',
        consent: false,
        vehicleSlug: slugFromURL,
      });
      setFiles([]);
    },
  });

  // Calcul mensualité estimée (crédit amortissable)
  const calculateMonthlyPayment = () => {
    const { amount, duration, rate } = simulatorData;
    const monthlyRate = rate / 100 / 12;

    if (duration <= 0 || monthlyRate <= 0) {
      return '0.00';
    }

    const top = amount * monthlyRate * Math.pow(1 + monthlyRate, duration);
    const bottom = Math.pow(1 + monthlyRate, duration) - 1;
    const payment = top / bottom;
    return payment.toFixed(2);
  };

  // Quand on bouge le slider montant, on sync simulateur + formulaire
  const handleSimulatorAmountChange = (newAmount: number) => {
    setSimulatorData((prev) => ({
      ...prev,
      amount: newAmount,
    }));
    setFormData((prev) => ({
      ...prev,
      amount: newAmount.toString(),
    }));
  };

  // Pareil pour la durée
  const handleSimulatorDurationChange = (newDuration: number) => {
    setSimulatorData((prev) => ({
      ...prev,
      duration: newDuration,
    }));
    setFormData((prev) => ({
      ...prev,
      duration: newDuration.toString(),
    }));
  };

  // Gestion des champs du formulaire manuel
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

  // Envoi du formulaire :
  // 1. upload fichiers vers Supabase Storage
  // 2. appel fonction edge financing-form avec toutes les infos (dont vehicleSlug)
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
    const filePath = `financing/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('form-attachments')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
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
  await submit(`${supabaseUrl}/functions/v1/financing-form`, {
    ...formData,
    attachments,
  });

  setUploadingFiles(false);
};


  return (
    <>
      <SEOHead
        title="Solutions de Financement"
        description="Financez votre moto ou scooter avec nos solutions adaptées. Simulation gratuite et réponse rapide."
        path="/financement"
      />

      {/* Bandeau titre */}
      <Section background="gray" className="!py-8">
        <Container>
          <h1 className="text-3xl md:text-4xl font-bold text-[#111111] mb-2">
            Solutions de Financement
          </h1>
          <p className="text-lg text-[#444444]">
            Financez votre deux-roues en toute simplicité
          </p>
        </Container>
      </Section>

      {/* Contenu principal */}
      <Section background="white" className="!py-8">
        <Container size="md">
          {/* Bloc simulateur */}
          <div className="relative bg-gradient-to-br from-[#2C2C2C] to-[#1A1A1A] text-white p-8 md:p-12 rounded-xl mb-12 overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <img
                src="/image copy copy.png"
                alt=""
                className="w-full h-full object-cover"
                aria-hidden="true"
              />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <Calculator className="w-8 h-8" aria-hidden="true" />
                <h2 className="text-2xl md:text-3xl font-bold">
                  Simulateur de crédit
                </h2>
              </div>

              <div className="space-y-6">
                {/* Montant */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Montant du financement:{' '}
                    {simulatorData.amount.toLocaleString('fr-FR')} €
                  </label>
                  <input
                    type="range"
                    min="1000"
                    max="20000"
                    step="500"
                    value={simulatorData.amount}
                    onChange={(e) =>
                      handleSimulatorAmountChange(Number(e.target.value))
                    }
                    className="w-full h-2 bg-white rounded-lg appearance-none cursor-pointer range-slider"
                  />
                </div>

                {/* Durée */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Durée: {simulatorData.duration} mois
                  </label>
                  <input
                    type="range"
                    min="12"
                    max="72"
                    step="6"
                    value={simulatorData.duration}
                    onChange={(e) =>
                      handleSimulatorDurationChange(Number(e.target.value))
                    }
                    className="w-full h-2 bg-white rounded-lg appearance-none cursor-pointer range-slider"
                  />
                </div>
  <div></div>
<label className="block text-sm font-medium mb-2">
                    Taux (TAEG): {simulatorData.rate} %
                  </label>
                {/* Taux *
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Taux (TAEG): {simulatorData.rate} %
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    step="0.5"
                    value={simulatorData.rate}
                    onChange={(e) =>
                      setSimulatorData((prev) => ({
                        ...prev,
                        rate: Number(e.target.value),
                      }))
                    }
                    className="w-full h-2 bg-white rounded-lg appearance-none cursor-pointer range-slider"
                  />
                </div>*/}

                {/* Estimation */}
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg mt-8 border border-white/20">
                  <p className="text-sm mb-2">Mensualité estimée</p>
                  <p className="text-4xl font-bold">{calculateMonthlyPayment()} €</p>
                  <p className="text-sm mt-2 opacity-90">
                    par mois sur {simulatorData.duration} mois
                  </p>

                  {vehicleFromURL && (
                    <p className="text-xs opacity-90 mt-4">
                      Véhicule sélectionné : {vehicleFromURL}
                      {parsedPrice ? ` (${parsedPrice} €)` : '' }
                    </p>
                  )}
                </div>

                <p className="text-xs opacity-80">
                  Cette simulation est indicative et ne constitue pas une offre de crédit.
                </p>
              </div>
            </div>
          </div>

          {/* Deux colonnes */}
          <div className="grid lg:grid-cols-2 gap-12 lg:items-start">
            {/* Avantages commerciaux */}
          <div>
  <h2 className="text-2xl font-bold text-[#111111] mb-6">
    Pourquoi financer avec nous ?
  </h2>

  <div className="space-y-4">
    <div className="flex gap-4 p-4 bg-[#F9F9F9] rounded-lg">
      <CheckCircle className="w-6 h-6 text-[#D10000] flex-shrink-0" aria-hidden="true" />
      <div>
        <h3 className="font-semibold text-[#111111] mb-1">Réponse rapide</h3>
        <p className="text-sm text-[#444444]">
          Obtenez une réponse de principe en quelques heures
        </p>
      </div>
    </div>

    <div className="flex gap-4 p-4 bg-[#F9F9F9] rounded-lg">
      <CheckCircle className="w-6 h-6 text-[#D10000] flex-shrink-0" aria-hidden="true" />
      <div>
        <h3 className="font-semibold text-[#111111] mb-1">Taux compétitifs</h3>
        <p className="text-sm text-[#444444]">
          Nous négocions les meilleurs taux pour vous
        </p>
      </div>
    </div>

    {/* Paiement en plusieurs fois via Alma */}
<div className="flex gap-4 p-4 bg-[#F9F9F9] rounded-lg">
  <CheckCircle
    className="w-6 h-6 text-[#D10000] flex-shrink-0"
    aria-hidden="true"
  />
  <div>
    <h3 className="font-semibold text-[#111111] mb-1">
      Paiement en 3x, 4x ou 10x par carte
    </h3>
    <p className="text-sm text-[#444444] leading-snug">
      Réglez votre moto ou scooter en plusieurs fois par carte bancaire
      grâce à notre partenaire&nbsp;
      <a
        href="https://almapay.com/fr-FR"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#D10000] font-medium hover:underline"
      >
        Alma
      </a>
      . Simple, rapide et 100&nbsp;% en ligne.
    </p>

    {/* Logo Alma (tu peux placer le fichier dans /public/alma-logo_frame.png) */}
    <a
      href="https://almapay.com/fr-FR"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block mt-3"
    >
      <img
        src="public/alma-logo_frame.png"
        alt="Paiement en plusieurs fois avec Alma"
        className="h-6 opacity-90 hover:opacity-100 transition-opacity"
      />
    </a>

    <p className="text-[11px] text-[#777777] mt-2">
      Offre de financement soumise à conditions, proposée par Alma.
    </p>
  </div>
</div>


    <div className="flex gap-4 p-4 bg-[#F9F9F9] rounded-lg">
      <CheckCircle className="w-6 h-6 text-[#D10000] flex-shrink-0" aria-hidden="true" />
      <div>
        <h3 className="font-semibold text-[#111111] mb-1">Sans frais de dossier</h3>
        <p className="text-sm text-[#444444]">
          Aucun frais caché, tout est transparent
        </p>
      </div>
    </div>

    <div className="flex gap-4 p-4 bg-[#F9F9F9] rounded-lg">
      <CheckCircle className="w-6 h-6 text-[#D10000] flex-shrink-0" aria-hidden="true" />
      <div>
        <h3 className="font-semibold text-[#111111] mb-1">Accompagnement personnalisé</h3>
        <p className="text-sm text-[#444444]">
          Un conseiller dédié pour vous guider
        </p>
      </div>
    </div>
  </div>
</div>


            {/* Formulaire */}
            <div>
              {success ? (
                <div className="bg-green-50 border-2 border-green-500 rounded-xl p-8 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-green-900 mb-2">
                    Demande envoyée !
                  </h3>
                  <p className="text-green-800">
                    Nous avons bien reçu votre demande de financement.
                    Un conseiller vous contactera rapidement.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="space-y-6 bg-[#F9F9F9] p-8 rounded-xl"
                >
                  <h2 className="text-2xl font-bold text-[#111111] mb-4">
                    Demande de financement
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
                    label="Montant souhaité (€)"
                    name="amount"
                    type="number"
                    required
                    min="1000"
                    value={formData.amount}
                    onChange={handleChange}
                  />

                  <Input
                    label="Durée souhaitée (mois)"
                    name="duration"
                    type="number"
                    required
                    min="12"
                    max="60"
                    value={formData.duration}
                    onChange={handleChange}
                  />

                  <Textarea
                    label="Commentaires"
                    name="comments"
                    rows={4}
                    placeholder="Posez vos questions ou ajoutez des informations complémentaires..."
                    value={formData.comments}
                    onChange={handleChange}
                  />

                  {/* Champ caché côté UI, mais envoyé quand même */}
                  {/* Tu peux le rendre visible si tu veux debugger / l'exposer au client */}
                  <input
                    type="hidden"
                    name="vehicleSlug"
                    value={formData.vehicleSlug}
                    readOnly
                  />

                  <FileUpload
                    label="Documents justificatifs (optionnel)"
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
                      J'accepte que mes données soient utilisées pour
                      traiter ma demande de financement conformément à
                      la{' '}
                      <a
                        href="/politique-confidentialite"
                        className="text-[#D10000] hover:underline"
                      >
                        politique de confidentialité
                      </a>
                      . <span className="text-[#D10000]">*</span>
                    </label>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                      {error}
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
    : 'Demander un devis'}
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
