import { useState } from 'react';
import { CheckCircle, Calculator } from 'lucide-react';
import { SEOHead } from '../components/layout/SEOHead';
import { Section } from '../components/ui/Section';
import { Container } from '../components/ui/Container';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { useFormSubmit } from '../hooks/useFormSubmit';

export function Financing() {
  const [simulatorData, setSimulatorData] = useState({
    amount: 5000,
    duration: 36,
    rate: 3.5,
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    amount: '',
    duration: '',
    comments: '',
    consent: false,
  });

  const { submit, isSubmitting, success, error } = useFormSubmit({
    onSuccess: () => {
      setFormData({
        name: '',
        email: '',
        phone: '',
        amount: '',
        duration: '',
        comments: '',
        consent: false,
      });
    },
  });

  const calculateMonthlyPayment = () => {
    const { amount, duration, rate } = simulatorData;
    const monthlyRate = rate / 100 / 12;
    const payment = (amount * monthlyRate * Math.pow(1 + monthlyRate, duration)) / (Math.pow(1 + monthlyRate, duration) - 1);
    return payment.toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    await submit(`${supabaseUrl}/functions/v1/financing-form`, formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <>
      <SEOHead
        title="Solutions de Financement"
        description="Financez votre moto ou scooter avec nos solutions adaptées. Simulation gratuite et réponse rapide."
        path="/financement"
      />

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

      <Section background="white" className="!py-8">
        <Container size="md">
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
              <h2 className="text-2xl md:text-3xl font-bold">Simulateur de crédit</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Montant du financement: {simulatorData.amount.toLocaleString('fr-FR')} €
                </label>
                <input
                  type="range"
                  min="1000"
                  max="20000"
                  step="500"
                  value={simulatorData.amount}
                  onChange={(e) => setSimulatorData({ ...simulatorData, amount: Number(e.target.value) })}
                  className="w-full h-2 bg-white rounded-lg appearance-none cursor-pointer range-slider"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Durée: {simulatorData.duration} mois
                </label>
                <input
                  type="range"
                  min="12"
                  max="60"
                  step="6"
                  value={simulatorData.duration}
                  onChange={(e) => setSimulatorData({ ...simulatorData, duration: Number(e.target.value) })}
                  className="w-full h-2 bg-white rounded-lg appearance-none cursor-pointer range-slider"
                />
              </div>

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
                  onChange={(e) => setSimulatorData({ ...simulatorData, rate: Number(e.target.value) })}
                  className="w-full h-2 bg-white rounded-lg appearance-none cursor-pointer range-slider"
                />
              </div>

              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg mt-8 border border-white/20">
                <p className="text-sm mb-2">Mensualité estimée</p>
                <p className="text-4xl font-bold">{calculateMonthlyPayment()} €</p>
                <p className="text-sm mt-2 opacity-90">par mois sur {simulatorData.duration} mois</p>
              </div>

              <p className="text-xs opacity-80">
                Cette simulation est indicative et ne constitue pas une offre de crédit.
              </p>
            </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:items-start">
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

            <div>
              {success ? (
                <div className="bg-green-50 border-2 border-green-500 rounded-xl p-8 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-green-900 mb-2">Demande envoyée !</h3>
                  <p className="text-green-800">
                    Nous avons bien reçu votre demande de financement. Un conseiller vous contactera rapidement.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6 bg-[#F9F9F9] p-8 rounded-xl">
                  <h2 className="text-2xl font-bold text-[#111111] mb-4">Demande de financement</h2>

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
                    <label htmlFor="consent" className="text-sm text-[#444444]">
                      J'accepte que mes données soient utilisées pour traiter ma demande de financement conformément à la{' '}
                      <a href="/politique-confidentialite" className="text-[#D10000] hover:underline">
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

                  <Button type="submit" disabled={isSubmitting} fullWidth size="lg">
                    {isSubmitting ? 'Envoi en cours...' : 'Demander un devis'}
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
