import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, Calculator } from 'lucide-react';
import { SEOHead } from '../components/layout/SEOHead';
import { Section } from '../components/ui/Section';
import { Container } from '../components/ui/Container';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';

type Housing = 'locataire' | 'proprietaire' | 'heberge';
type Contract = 'cdi' | 'cdd' | 'interim' | 'independant' | 'autre';
type Marital = 'celibataire' | 'marie' | 'pacs' | 'divorce' | 'veuf';

const REQUIRED_DOCS = [
  'id_card_recto',
  'id_card_verso',
  'license_recto',
  'license_verso',
  'proof_address',
  'payslip_1',
  'payslip_2',
  'payslip_3',
  'tax_notice',
  'rib',
] as const;
type DocKey = typeof REQUIRED_DOCS[number];

const DOC_LABEL: Record<DocKey, string> = {
  id_card_recto: "Pièce d’identité — recto",
  id_card_verso: "Pièce d’identité — verso",
  license_recto: 'Permis de conduire — recto',
  license_verso: 'Permis de conduire — verso',
  proof_address: 'Justificatif de domicile (-3 mois)',
  payslip_1: 'Bulletin de salaire — M-1',
  payslip_2: 'Bulletin de salaire — M-2',
  payslip_3: 'Bulletin de salaire — M-3',
  tax_notice: "Dernier avis d’imposition",
  rib: 'RIB',
};

export function Financing() {
  const [searchParams] = useSearchParams();
  const vehicleFromURL = searchParams.get('vehicle') || '';
  const priceFromURL = searchParams.get('price');
  const slugFromURL = searchParams.get('slug') || '';
  const parsedPrice = priceFromURL ? Number(priceFromURL) : null;

  // Simulateur de crédit (initialisé avec le prix si fourni)
  const [simulatorData, setSimulatorData] = useState({
    amount: parsedPrice && !Number.isNaN(parsedPrice) ? parsedPrice : 5000,
    duration: 24,
    rate: 7,
  });

  // Nouveau formulaire complet (pro & RGPD)
  const [form, setForm] = useState({
    // Identité & contact
    last_name: '',
    first_name: '',
    birth_zip: '',
    birth_date: '',
    address: '',
    phone: '',
    email: '',
    // Logement
    move_in_date: '',
    housing: '' as Housing | '',
    rent_or_mortgage: '',
    hosted_attestation: false,
    // Emploi & revenus
    job_title: '',
    job_start_date: '',
    contract: '' as Contract | '',
    net_salary_monthly: '',
    other_charges: '',
    other_income: '',
    // Famille & projet
    marital: '' as Marital | '',
    dependents: '',
    vehicle: vehicleFromURL || '',
    desired_duration_months: '',
    // Anciennes infos commerciales (compat)
    amount: (parsedPrice && !Number.isNaN(parsedPrice) ? parsedPrice : 5000).toString(),
    duration: '24',
    comments: vehicleFromURL
      ? `Je souhaite financer ${vehicleFromURL}${parsedPrice ? ` affiché à ${parsedPrice} €` : ''}.`
      : '',
    vehicleSlug: slugFromURL,
    // Consentement
    consent: false,
  });

  // Dossier côté serveur
  const [requestId, setRequestId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState<Record<DocKey, boolean>>(
    () => Object.fromEntries(REQUIRED_DOCS.map(d => [d, false])) as Record<DocKey, boolean>
  );
  const [docDone, setDocDone] = useState<Record<DocKey, boolean>>(
    () => Object.fromEntries(REQUIRED_DOCS.map(d => [d, false])) as Record<DocKey, boolean>
  );
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = import.meta.env.VITE_SUPABASE_URL; // https://xxxx.supabase.co

  // Helpers
  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, type } = e.target;
    const value = type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm(p => ({ ...p, [name]: value }));
  };

  const handleSimulatorAmountChange = (newAmount: number) => {
    setSimulatorData(prev => ({ ...prev, amount: newAmount }));
    setForm(prev => ({ ...prev, amount: String(newAmount) }));
  };
  const handleSimulatorDurationChange = (newDuration: number) => {
    setSimulatorData(prev => ({ ...prev, duration: newDuration }));
    setForm(prev => ({ ...prev, duration: String(newDuration) }));
  };

  const calculateMonthlyPayment = () => {
    const { amount, duration, rate } = simulatorData;
    const monthlyRate = rate / 100 / 12;
    if (duration <= 0 || monthlyRate <= 0) return '0.00';
    const top = amount * monthlyRate * Math.pow(1 + monthlyRate, duration);
    const bottom = Math.pow(1 + monthlyRate, duration) - 1;
    return (top / bottom).toFixed(2);
  };

  // 1) Création du dossier (draft) si besoin
  const ensureRequest = async () => {
    if (requestId) return requestId;
    const requiredSimple =
      form.last_name && form.first_name && form.birth_zip && form.birth_date &&
      form.address && form.phone && form.email && form.housing;
    if (!requiredSimple) {
      throw new Error('Merci de compléter d’abord Nom, Prénom, CP/Date de naissance, Adresse, Téléphone, Email et Statut de logement.');
    }
    const res = await fetch(`${API_BASE}/functions/v1/financing-start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        last_name: form.last_name,
        first_name: form.first_name,
        birth_zip: form.birth_zip,
        birth_date: form.birth_date,
        email: form.email,
        phone: form.phone,
        address: form.address,
        housing: form.housing,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur création du dossier.');
    setRequestId(data.request_id);
    return data.request_id as string;
  };

  // 2) Upload d’un document via URL signée (PUT direct Storage privé)
  const uploadDoc = async (doc: DocKey, file: File) => {
    setError(null);
    setUploading(prev => ({ ...prev, [doc]: true }));
    try {
      const rid = await ensureRequest();
      // Appel function pour obtenir l’URL signée + référencer la pièce
      const r = await fetch(`${API_BASE}/functions/v1/financing-upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: rid, doc, filename: file.name }),
      });
      const j = await r.json();
      if (!r.ok || !j.signedUrl) throw new Error(j.error || 'URL signée indisponible');

      // PUT du fichier vers l’URL signée
      const put = await fetch(j.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });
      if (!put.ok) throw new Error('Échec de l’upload');

      setDocDone(prev => ({ ...prev, [doc]: true }));
    } catch (e: any) {
      setError(e.message || 'Upload impossible');
      setDocDone(prev => ({ ...prev, [doc]: false }));
    } finally {
      setUploading(prev => ({ ...prev, [doc]: false }));
    }
  };

  const allDocsOk = useMemo(() => REQUIRED_DOCS.every(d => !!docDone[d]), [docDone]);

  // 3) Soumission finale du dossier
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.consent) {
      setError('Merci de cocher la case de consentement RGPD.');
      return;
    }
    if (form.housing === 'heberge' && !form.hosted_attestation) {
      setError("Vous avez indiqué être hébergé : l'attestation d’hébergement est obligatoire.");
      return;
    }
    if (!allDocsOk) {
      setError('Merci de déposer tous les documents obligatoires.');
      return;
    }

    try {
      const rid = await ensureRequest();
      setSubmitting(true);

      const res = await fetch(`${API_BASE}/functions/v1/financing-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: rid,
          // Adresse & logement
          address: form.address,
          move_in_date: form.move_in_date || null,
          housing: form.housing || null,
          rent_or_mortgage: form.rent_or_mortgage ? Number(form.rent_or_mortgage) : null,
          hosted_attestation: !!form.hosted_attestation,
          // Emploi & revenus
          job_title: form.job_title || null,
          job_start_date: form.job_start_date || null,
          contract: form.contract || null,
          net_salary_monthly: form.net_salary_monthly ? Number(form.net_salary_monthly) : null,
          other_charges: form.other_charges ? Number(form.other_charges) : 0,
          other_income: form.other_income ? Number(form.other_income) : 0,
          // Famille & projet
          marital: form.marital || null,
          dependents: form.dependents ? Number(form.dependents) : 0,
          vehicle: form.vehicle || null,
          desired_duration_months: form.desired_duration_months ? Number(form.desired_duration_months) : null,
          // Compat champs existants
          amount: form.amount ? Number(form.amount) : null,
          duration: form.duration ? Number(form.duration) : null,
          comments: form.comments || null,
          vehicle_slug: form.vehicleSlug || null,
          // Trace
          ip: '', // (optionnel) peut être injecté côté serveur
          user_agent: navigator.userAgent,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur envoi');

      setSuccess(true);
      // Reset (on conserve les infos véhicule pour lisibilité)
      setForm(prev => ({
        ...prev,
        // on garde les infos liées au simulateur et au véhicule
        last_name: '',
        first_name: '',
        birth_zip: '',
        birth_date: '',
        address: '',
        phone: '',
        email: '',
        move_in_date: '',
        housing: '' as Housing | '',
        rent_or_mortgage: '',
        hosted_attestation: false,
        job_title: '',
        job_start_date: '',
        contract: '' as Contract | '',
        net_salary_monthly: '',
        other_charges: '',
        other_income: '',
        marital: '' as Marital | '',
        dependents: '',
        vehicle: vehicleFromURL || '',
        desired_duration_months: '',
        amount: simulatorData.amount.toString(),
        duration: simulatorData.duration.toString(),
        comments: vehicleFromURL
          ? `Je souhaite financer ${vehicleFromURL}${parsedPrice ? ` affiché à ${parsedPrice} €` : ''}.`
          : '',
        vehicleSlug: slugFromURL,
        consent: false,
      }));
      setRequestId(null);
      setDocDone(Object.fromEntries(REQUIRED_DOCS.map(d => [d, false])) as Record<DocKey, boolean>);
    } catch (e: any) {
      setError(e.message || 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  // UI pour un champ fichier lié à un doc requis
  const DocInput: React.FC<{ doc: DocKey }> = ({ doc }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[#111]">
        {DOC_LABEL[doc]} <span className="text-[#D10000]">*</span>
      </label>
      <input
        type="file"
        accept="image/*,application/pdf"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          await uploadDoc(doc, f);
        }}
        className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#111] file:text-white hover:file:bg-[#333]"
        required
      />
      {uploading[doc] && <p className="text-sm text-[#666]">Téléversement en cours…</p>}
      {docDone[doc] ? (
        <p className="text-green-600 text-sm">Fichier chargé ✅</p>
      ) : (
        !uploading[doc] && <p className="text-xs text-[#666]">PDF/JPG/PNG – 20 Mo max</p>
      )}
    </div>
  );

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

                {/* Taux (affiché, non éditable ici) */}
                <label className="block text-sm font-medium mb-2">
                  Taux (TAEG): {simulatorData.rate} %
                </label>

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
                {[
                  { t: 'Réponse rapide', d: 'Obtenez une réponse de principe en quelques heures' },
                  { t: 'Taux compétitifs', d: 'Nous négocions les meilleurs taux pour vous' },
                  { t: 'Sans frais de dossier', d: 'Aucun frais caché, tout est transparent' },
                  { t: 'Accompagnement personnalisé', d: 'Un conseiller dédié pour vous guider' },
                ].map((x, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-[#F9F9F9] rounded-lg">
                    <CheckCircle className="w-6 h-6 text-[#D10000] flex-shrink-0" aria-hidden="true" />
                    <div>
                      <h3 className="font-semibold text-[#111111] mb-1">{x.t}</h3>
                      <p className="text-sm text-[#444444]">{x.d}</p>
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
                <form onSubmit={handleSubmit} className="space-y-6 bg-[#F9F9F9] p-8 rounded-xl">
                  <h2 className="text-2xl font-bold text-[#111111] mb-4">
                    Demande de financement
                  </h2>

                  {/* Identité */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input label="Nom" name="last_name" required value={form.last_name} onChange={onChange} />
                    <Input label="Prénom" name="first_name" required value={form.first_name} onChange={onChange} />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input label="Code postal de naissance" name="birth_zip" required value={form.birth_zip} onChange={onChange} />
                    <Input label="Date de naissance" name="birth_date" type="date" required value={form.birth_date} onChange={onChange} />
                  </div>

                  {/* Contact & adresse */}
                  <Input label="Adresse actuelle" name="address" required value={form.address} onChange={onChange} />
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input label="Téléphone" name="phone" type="tel" required value={form.phone} onChange={onChange} />
                    <Input label="Email" name="email" type="email" required value={form.email} onChange={onChange} />
                  </div>

                  {/* Logement */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Occupation (logement) <span className="text-[#D10000]">*</span></label>
                      <select name="housing" required value={form.housing} onChange={onChange} className="w-full border rounded-lg px-3 py-2">
                        <option value="">—</option>
                        <option value="locataire">Locataire</option>
                        <option value="proprietaire">Propriétaire</option>
                        <option value="heberge">Hébergé</option>
                      </select>
                    </div>
                    <Input label="Date d’entrée dans le logement" name="move_in_date" type="date" value={form.move_in_date} onChange={onChange} />
                    <Input label="Montant du loyer/crédit (€)" name="rent_or_mortgage" type="number" value={form.rent_or_mortgage} onChange={onChange} />
                  </div>
                  {form.housing === 'heberge' && (
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="hosted_attestation" name="hosted_attestation" checked={form.hosted_attestation} onChange={onChange} className="w-4 h-4" />
                      <label htmlFor="hosted_attestation" className="text-sm">
                        Je fournis une attestation d’hébergement et la pièce d’identité de l’hébergeur
                      </label>
                    </div>
                  )}

                  {/* Emploi & revenus */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input label="Emploi / poste occupé" name="job_title" value={form.job_title} onChange={onChange} />
                    <Input label="Date d’entrée (emploi)" name="job_start_date" type="date" value={form.job_start_date} onChange={onChange} />
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Type de contrat</label>
                      <select name="contract" value={form.contract} onChange={onChange} className="w-full border rounded-lg px-3 py-2">
                        <option value="">—</option>
                        <option value="cdi">CDI</option>
                        <option value="cdd">CDD</option>
                        <option value="interim">Intérim</option>
                        <option value="independant">Indépendant</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>
                    <Input label="Salaire net mensuel (€)" name="net_salary_monthly" type="number" value={form.net_salary_monthly} onChange={onChange} />
                    <Input label="Autres charges / crédits (€)" name="other_charges" type="number" value={form.other_charges} onChange={onChange} />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input label="Autres sources de revenus (€)" name="other_income" type="number" value={form.other_income} onChange={onChange} />
                    <div>
                      <label className="block text-sm font-medium mb-2">Situation maritale</label>
                      <select name="marital" value={form.marital} onChange={onChange} className="w-full border rounded-lg px-3 py-2">
                        <option value="">—</option>
                        <option value="celibataire">Célibataire</option>
                        <option value="marie">Marié(e)</option>
                        <option value="pacs">Pacsé(e)</option>
                        <option value="divorce">Divorcé(e)</option>
                        <option value="veuf">Veuf/Veuve</option>
                      </select>
                    </div>
                  </div>
                  <Input label="Nombre de personnes à charge" name="dependents" type="number" value={form.dependents} onChange={onChange} />

                  {/* Projet */}
                  <Input label="Véhicule à financer" name="vehicle" value={form.vehicle} onChange={onChange} />
                  <Input label="Durée souhaitée (mois)" name="desired_duration_months" type="number" value={form.desired_duration_months} onChange={onChange} />

                  {/* Champs “compat” (ton historique prod) */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input label="Montant souhaité (€)" name="amount" type="number" min="1000" value={form.amount} onChange={onChange} />
                    <Input label="Durée souhaitée (mois / compat)" name="duration" type="number" min="12" max="72" value={form.duration} onChange={onChange} />
                  </div>
                  <Textarea label="Commentaires" name="comments" rows={4} placeholder="Infos complémentaires…" value={form.comments} onChange={onChange} />
                  <input type="hidden" name="vehicleSlug" value={form.vehicleSlug} readOnly />

                  {/* Documents obligatoires */}
                  <div className="grid md:grid-cols-2 gap-6 bg-white p-4 rounded-xl border">
                    <h3 className="md:col-span-2 text-lg font-semibold">Documents obligatoires</h3>
                    {REQUIRED_DOCS.map((d) => (
                      <DocInput key={d} doc={d} />
                    ))}
                  </div>

                  {/* Consentement */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="consent"
                      name="consent"
                      required
                      checked={form.consent}
                      onChange={onChange}
                      className="mt-1 w-4 h-4 text-[#D10000] focus:ring-[#D10000] rounded"
                    />
                    <label htmlFor="consent" className="text-sm text-[#444444]">
                      J’accepte que mes données soient utilisées pour traiter ma demande de financement conformément à la{' '}
                      <a href="/politique-confidentialite" className="text-[#D10000] hover:underline">politique de confidentialité</a>. <span className="text-[#D10000]">*</span>
                    </label>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <Button type="submit" disabled={submitting} fullWidth size="lg">
                    {submitting ? 'Envoi en cours...' : 'Demander un devis'}
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
