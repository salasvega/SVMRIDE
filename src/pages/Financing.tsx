import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Calculator, FileText, HelpCircle } from 'lucide-react';
import { SEOHead } from '../components/layout/SEOHead';
import { pageSeo } from '../config/seo';
import { Section } from '../components/ui/Section';
import { Container } from '../components/ui/Container';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { IconeOr } from '../components/ui/IconeOr';
import { useFormSubmit } from '../hooks/useFormSubmit';
import { useTexte } from '../lib/textes';
import { useListe } from '../lib/listes';

export function Financing() {
  const t = useTexte();
  const avantages = useListe('financement.avantages');
  // Lecture des paramètres passés depuis la fiche véhicule
  // ex: /financement?vehicle=Yamaha%20MT-07%202021&price=6500&slug=yamaha-mt07-2021
  const [searchParams] = useSearchParams();
  const vehicleFromURL = searchParams.get('vehicle') || '';
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
    duration: '24',
    comments: vehicleFromURL
      ? `Je souhaite financer ${vehicleFromURL}${parsedPrice ? ` affiché à ${parsedPrice} €` : ''}.`
      : '',
    vehicleSlug: slugFromURL, // 👈 nouveau champ
  });

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
        vehicleSlug: slugFromURL,
      });
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

  // Envoi du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    await submit(`${supabaseUrl}/functions/v1/financing-form`, formData);
  };


  return (
    <>
      <SEOHead meta={pageSeo['/financement']} />

      {/* Bandeau titre */}
      <Section background="gray" className="!pt-8 !pb-8 md:!pt-12 md:!pb-10">
        <Container>
          <div>
            <h1 className="filet-apres mb-4">
              {t('financement.titre')}
            </h1>
            <p className="text-base md:text-lg text-gris">
              {t('financement.intro')}
            </p>
          </div>
        </Container>
      </Section>

      {/* Contenu principal */}
      <Section background="white" className="!py-8">
        <Container size="md">
          {/* Bloc simulateur */}
          <div className="sur-sombre relative bg-noir-profond text-inverse p-6 md:p-12 rounded-2xl mb-12 overflow-hidden border border-or/30 shadow-vehicule">
            <div className="absolute inset-0 opacity-20">
              <img
                src="/simulateur-fond.webp"
                loading="lazy"
                alt=""
                className="w-full h-full object-cover"
                aria-hidden="true"
              />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <Calculator className="w-8 h-8 text-or-clair" strokeWidth={1.6} aria-hidden="true" />
                <h2 className="text-[26px] md:text-[30px]">
                  {t('financement.simulateur.titre')}
                </h2>
              </div>

              <div className="space-y-6">
                {/* Montant */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('financement.simulateur.montant', { montant: simulatorData.amount.toLocaleString('fr-FR') })}
                  </label>
                  <input
                    type="range"
                    aria-label="Montant du financement"
                    min="1000"
                    max="20000"
                    step="500"
                    value={simulatorData.amount}
                    onChange={(e) =>
                      handleSimulatorAmountChange(Number(e.target.value))
                    }
                    className="w-full h-2 bg-inverse rounded-lg appearance-none cursor-pointer range-slider"
                  />
                </div>

                {/* Durée */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('financement.simulateur.duree', { duree: simulatorData.duration })}
                  </label>
                  <input
                    type="range"
                    aria-label="Durée du financement"
                    min="12"
                    max="72"
                    step="6"
                    value={simulatorData.duration}
                    onChange={(e) =>
                      handleSimulatorDurationChange(Number(e.target.value))
                    }
                    className="w-full h-2 bg-inverse rounded-lg appearance-none cursor-pointer range-slider"
                  />
                  
                </div>
                <div></div>
<label className="block text-sm font-medium mb-2">
                    {t('financement.simulateur.taux', { taux: simulatorData.rate })}
                  </label>
                {/* Taux *
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Taux (TAEG): {simulatorData.rate} %
                  </label>
                  <input
                    type="range"
                    aria-label="Taux (TAEG)"
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
                    className="w-full h-2 bg-inverse rounded-lg appearance-none cursor-pointer range-slider"
                  />
                </div>*/}

                {/* Estimation */}
                <div className="bg-inverse/[0.06] backdrop-blur-sm p-6 rounded-xl mt-8 border border-inverse/15">
                  <p className="text-sm mb-2">{t('financement.simulateur.mensualite')}</p>
                  <p className="font-display font-semibold text-[40px] leading-tight">{calculateMonthlyPayment()} €</p>
                  <p className="text-sm mt-2 opacity-90">
                    {t('financement.simulateur.par_mois', { duree: simulatorData.duration })}
                  </p>

                  {vehicleFromURL && (
                    <p className="text-xs opacity-90 mt-4">
                      {t('financement.simulateur.vehicule', { vehicule: vehicleFromURL })}
                      {parsedPrice ? ` ${t('financement.simulateur.vehicule_prix', { prix: parsedPrice })}` : '' }
                    </p>
                  )}
                </div>

                <p className="text-xs opacity-80">
                  {t('financement.simulateur.mention')}
                </p>
              </div>
            </div>
          </div>

          {/* Deux colonnes */}
          <div className="grid lg:grid-cols-2 gap-12 lg:items-start">
            {/* Avantages commerciaux */}
          <div>
  <h2 className="text-[26px] md:text-[30px] filet-apres mb-6">
    {t('financement.avantages.titre')}
  </h2>

  <div className="space-y-4">
    {avantages.ids.map((id) => avantages.special(id) ? (
      /* Paiement en plusieurs fois via Alma */
<div key={id} {...avantages.attrs(id)} className="flex gap-4 p-4 bg-fond rounded-lg">
  <CheckCircle
    className="w-6 h-6 text-lien flex-shrink-0"
    aria-hidden="true"
  />
  <div>
    <h3 className="font-semibold text-noir mb-1">
      {t('financement.avantages.3.titre')}
    </h3>
    <p className="text-sm text-gris leading-snug">
      {t('financement.avantages.3.texte_avant')}&nbsp;
      <a
        href="https://almapay.com/fr-FR"
        target="_blank"
        rel="noopener noreferrer"
        className="text-lien font-medium underline underline-offset-2 hover:decoration-2"
      >
        {t('financement.avantages.3.lien')}
      </a>
      {t('financement.avantages.3.texte_apres')}
    </p>

    {/* Logo Alma (tu peux placer le fichier dans /public/alma-logo_frame.png) */}
    <a
      href="https://almapay.com/fr-FR"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block mt-3"
    >
      <img
        src="/alma-logo_frame.png"
        alt="Paiement en plusieurs fois avec Alma"
        className="h-6 opacity-90 hover:opacity-100 transition-opacity"
      />
    </a>

    <p className="text-[11px] text-doux-68 mt-2">
      {t('financement.avantages.3.mention')}
    </p>
  </div>
</div>
    ) : (
      <div key={id} {...avantages.attrs(id)} className="flex gap-4 p-4 bg-fond rounded-lg">
        <IconeOr icon={avantages.icone(id)} className="w-6 h-6 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-noir mb-1">{t(avantages.cle(id, 'titre'))}</h3>
          <p className="text-sm text-gris">
            {t(avantages.cle(id, 'texte'))}
          </p>
        </div>
      </div>
    ))}
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
                <>
                  <form data-zone="formulaires"
                    onSubmit={handleSubmit}
                    className="space-y-6 bg-fond p-8 rounded-xl"
                    style={{ display: 'none' }}
                  >
                    <h2 className="text-[26px] md:text-[30px] filet-apres mb-4">
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
                      <HelpCircle className="w-5 h-5" />
                      {isSubmitting ? 'Envoi en cours...' : 'Envoyer ma demande'}
                    </Button>
                  </form>

                  <div className="space-y-6 bg-fond p-8 rounded-xl">
                    <h2 className="text-[26px] md:text-[30px] filet-apres mb-4">
                      {t('financement.demande.titre')}
                    </h2>

                    <p className="text-gris leading-relaxed">
                    {t('financement.demande.texte')}
                    </p>

                    <Link
                      to={`/financement/dossier?vehicle=${encodeURIComponent(vehicleFromURL)}&price=${priceFromURL || ''}&duration=${formData.duration}`}
                      className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-brand hover:bg-bleu-hover text-sur-bouton font-semibold rounded-lg transition-colors"
                    >
                      <FileText className="w-5 h-5" />
                      {t('financement.demande.bouton')}
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
