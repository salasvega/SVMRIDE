import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle, Mail, Phone, Instagram, MapPin, Clock } from 'lucide-react';
import { SEOHead } from '../components/layout/SEOHead';
import { Section } from '../components/ui/Section';
import { Container } from '../components/ui/Container';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { useFormSubmit } from '../hooks/useFormSubmit';
import { siteConfig } from '../config/site';

export function Contact() {
  const location = useLocation();
  const vehicleRef = location.state?.vehicle || '';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: vehicleRef ? `Demande d'information - ${vehicleRef}` : '',
    message: '',
    consent: false,
  });

  const { submit, isSubmitting, success, error } = useFormSubmit({
    onSuccess: () => {
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        consent: false,
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    await submit(`${supabaseUrl}/functions/v1/contact-form`, formData);
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
            <div>
              <h2 className="text-2xl font-bold text-[#111111] mb-6">Nos coordonnées</h2>

              <div className="space-y-6 mb-8">
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="flex items-start gap-4 p-4 bg-[#F9F9F9] rounded-xl hover:bg-[#EEEEEE] transition-colors"
                >
                  <Mail className="w-6 h-6 text-[#D10000] flex-shrink-0 mt-1" aria-hidden="true" />
                  <div>
                    <h3 className="font-semibold text-[#111111] mb-1">Email</h3>
                    <p className="text-[#444444]">{siteConfig.contact.email}</p>
                  </div>
                </a>

                <a
                  href={`tel:${siteConfig.contact.phone.replace(/\s/g, '')}`}
                  className="flex items-start gap-4 p-4 bg-[#F9F9F9] rounded-xl hover:bg-[#EEEEEE] transition-colors"
                >
                  <Phone className="w-6 h-6 text-[#D10000] flex-shrink-0 mt-1" aria-hidden="true" />
                  <div>
                    <h3 className="font-semibold text-[#111111] mb-1">Téléphone</h3>
                    <p className="text-[#444444]">{siteConfig.contact.phone}</p>
                  </div>
                </a>

                <a
                  href={siteConfig.contact.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 p-4 bg-[#F9F9F9] rounded-xl hover:bg-[#EEEEEE] transition-colors"
                >
                  <Instagram className="w-6 h-6 text-[#D10000] flex-shrink-0 mt-1" aria-hidden="true" />
                  <div>
                    <h3 className="font-semibold text-[#111111] mb-1">Instagram</h3>
                    <p className="text-[#444444]">{siteConfig.contact.instagram}</p>
                  </div>
                </a>
              </div>

              <div className="bg-[#F9F9F9] p-6 rounded-xl mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="w-6 h-6 text-[#D10000]" aria-hidden="true" />
                  <h3 className="font-semibold text-[#111111]">Adresse</h3>
                </div>
                <p className="text-[#444444]">
                  Île-de-France<br />
                  Sur rendez-vous uniquement
                </p>
              </div>

              <div className="bg-[#F9F9F9] p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-6 h-6 text-[#D10000]" aria-hidden="true" />
                  <h3 className="font-semibold text-[#111111]">Horaires</h3>
                </div>
                <div className="space-y-2 text-[#444444]">
                  <div className="flex justify-between">
                    <span>Lundi - Vendredi:</span>
                    <span className="font-medium">9h00 - 19h00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Samedi:</span>
                    <span className="font-medium">10h00 - 18h00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dimanche:</span>
                    <span className="font-medium">Sur rendez-vous</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              {success ? (
                <div className="bg-green-50 border-2 border-green-500 rounded-xl p-8 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-green-900 mb-2">Message envoyé !</h3>
                  <p className="text-green-800">
                    Nous avons bien reçu votre message. Notre équipe vous répondra dans les plus brefs délais.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6 bg-[#F9F9F9] p-8 rounded-xl">
                  <h2 className="text-2xl font-bold text-[#111111] mb-4">Envoyez-nous un message</h2>

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
                      J'accepte que mes données soient utilisées pour traiter ma demande conformément à la{' '}
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
                    {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
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
