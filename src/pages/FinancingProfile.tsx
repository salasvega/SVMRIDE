import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container } from '../components/ui/Container';
import { Section } from '../components/ui/Section';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { SingleFileUpload } from '../components/ui/SingleFileUpload';
import Toast from '../components/ui/Toast';
import { appelDossier, envoyerPiece, ErreurDossier } from '../lib/financingDossier';
import { SEOHead } from '../components/layout/SEOHead';
import { pageSeo } from '../config/seo';
import { DeleteConfirmModal } from '../components/admin/DeleteConfirmModal';
import { Save, Send, Trash2, CheckCircle, Edit, KeyRound, Copy } from 'lucide-react';
import { useCoordonnees } from '../lib/coordonnees';
import { lienTelephone } from '../config/coordonnees';
import { useTexte } from '../lib/textes';
import { demo } from '../lib/apercuDemo';

interface FinancingProfile {
  id?: string;
  user_email: string;
  last_name: string;
  first_name: string;
  birth_postal_code: string;
  birth_date: string;
  current_address: string;
  phone_number: string;
  email: string;
  housing_entry_date: string;
  housing_status: string;
  rent_or_credit_amount: number;
  job_title: string;
  employment_start_date: string;
  contract_type: string;
  monthly_net_salary: number;
  other_charges_or_credits: string;
  other_income_sources: string;
  marital_status: string;
  comments?: string;
  dependents_count: number;
  vehicle_to_finance: string;
  financing_amount: number;
  desired_duration: number;
  id_card_front: string;
  id_card_back: string;
  driver_license_front: string;
  driver_license_back: string;
  proof_of_residence: string;
  payslip_1: string;
  payslip_2: string;
  payslip_3: string;
  tax_notice: string;
  rib: string;
  hosting_certificate: string;
  host_id_card: string;
  status: string;
  is_complete: boolean;
  submitted_at?: string;
}

export function FinancingProfile() {
  const c = useCoordonnees(); // modifiables dans l'admin, onglet « Édition du site »
  const t = useTexte();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const vehicleFromURL = searchParams.get('vehicle') || '';
  const priceFromURL = searchParams.get('price');
  const durationFromURL = searchParams.get('duration');

  const parsedPrice = priceFromURL ? Number(priceFromURL) : 0;
  const parsedDuration = durationFromURL ? Number(durationFromURL) : 0;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  // Accès sécurisé : e-mail + code personnel, puis jeton de session (2 h)
  // Aperçu de l'admin : dossier d'exemple déjà ouvert (?demo=ouvert, ?demo=envoye)
  const [session, setSession] = useState(() => (demo() ? 'apercu' : ''));
  const [showEmailModal, setShowEmailModal] = useState(() => !demo());
  const [modeAcces, setModeAcces] = useState<'code' | 'creation'>('code');
  const [emailInput, setEmailInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [erreurAcces, setErreurAcces] = useState('');
  const [codeCree, setCodeCree] = useState(() => (demo() === 'ouvert' ? 'K7P2QX' : ''));
  const [codeCopie, setCodeCopie] = useState(false);
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profile, setProfile] = useState<FinancingProfile>({
    user_email: '',
    last_name: '',
    first_name: '',
    birth_postal_code: '',
    birth_date: '',
    current_address: '',
    phone_number: '',
    email: '',
    housing_entry_date: '',
    housing_status: '',
    rent_or_credit_amount: 0,
    job_title: '',
    employment_start_date: '',
    contract_type: '',
    monthly_net_salary: 0,
    other_charges_or_credits: '',
    other_income_sources: '',
    marital_status: '',
    comments: '',
    dependents_count: 0,
    vehicle_to_finance: vehicleFromURL || '',
    financing_amount: parsedPrice || 0,
    desired_duration: parsedDuration || 0,
    id_card_front: '',
    id_card_back: '',
    driver_license_front: '',
    driver_license_back: '',
    proof_of_residence: '',
    payslip_1: '',
    payslip_2: '',
    payslip_3: '',
    tax_notice: '',
    rib: '',
    hosting_certificate: '',
    host_id_card: '',
    status: demo() === 'envoye' ? 'submitted' : 'draft',
    is_complete: false,
  });

  // Données reçues du serveur → état du formulaire
  const appliquerDossier = useCallback((data: Record<string, unknown>) => {
    setProfile(prev => ({
      ...prev,
      ...(data as Partial<FinancingProfile>),
      birth_date: (data.birth_date as string) || '',
      housing_entry_date: (data.housing_entry_date as string) || '',
      employment_start_date: (data.employment_start_date as string) || '',
      rent_or_credit_amount: Number(data.rent_or_credit_amount) || 0,
      monthly_net_salary: Number(data.monthly_net_salary) || 0,
    }));
  }, []);

  // Liens temporaires d'aperçu de toutes les pièces, en un seul appel
  const chargerLiens = useCallback(async (jeton: string) => {
    try {
      const { urls } = await appelDossier<{ urls: Record<string, string> }>('file-urls', { session: jeton });
      setFileUrls(urls);
    } catch {
      setFileUrls({});
    }
  }, []);

  useEffect(() => {
    if (session) chargerLiens(session);
  }, [session, chargerLiens]);

  // Session expirée ou erreur : message clair, retour à l'écran d'accès si besoin
  const gererErreur = (error: unknown, texteParDefaut: string) => {
    if (error instanceof ErreurDossier && error.code === 'session') {
      setSession('');
      setCodeCree('');
      setShowEmailModal(true);
      setModeAcces('code');
      setErreurAcces(error.message);
      return;
    }
    const texte = error instanceof ErreurDossier ? error.message : texteParDefaut;
    setMessage({ type: 'error', text: texte });
  };

  // Champs envoyés au serveur (les pièces et le statut sont gérés à part ;
  // le serveur n'accepte de toute façon que les champs saisissables)
  const CHAMPS_EXCLUS = new Set([
    'id', 'user_email', 'status', 'is_complete', 'submitted_at',
    'id_card_front', 'id_card_back', 'driver_license_front', 'driver_license_back',
    'proof_of_residence', 'payslip_1', 'payslip_2', 'payslip_3', 'tax_notice', 'rib',
    'hosting_certificate', 'host_id_card',
  ]);
  const champsSaisis = () =>
    Object.fromEntries(Object.entries(profile).filter(([cle]) => !CHAMPS_EXCLUS.has(cle)));

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailInput.trim();
    if (!email) return;
    setErreurAcces('');
    setLoading(true);

    try {
      if (modeAcces === 'creation') {
        const r = await appelDossier<{ code: string; session: string; profile: Record<string, unknown> }>('create', {
          email,
          profile: {
            vehicle_to_finance: vehicleFromURL || '',
            financing_amount: parsedPrice || 0,
            desired_duration: parsedDuration || 0,
          },
        });
        appliquerDossier(r.profile);
        setSession(r.session);
        setCodeCree(r.code);
      } else {
        const r = await appelDossier<{ session: string; profile: Record<string, unknown> }>('open', {
          email,
          code: codeInput,
        });
        appliquerDossier(r.profile);
        setSession(r.session);
        setCodeCree('');
      }
      setShowEmailModal(false);
      setCodeInput('');
    } catch (error) {
      if (error instanceof ErreurDossier && error.code === 'existe') {
        setModeAcces('code');
      }
      setErreurAcces(error instanceof ErreurDossier ? error.message : 'Une erreur est survenue. Réessayez dans un instant.');
    } finally {
      setLoading(false);
    }
  };

  const copierCode = async () => {
    try {
      await navigator.clipboard.writeText(codeCree);
      setCodeCopie(true);
      setTimeout(() => setCodeCopie(false), 2500);
    } catch {
      setCodeCopie(false);
    }
  };

  const handleInputChange = (field: keyof FinancingProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSingleFileUpload = async (field: keyof FinancingProfile, file: File) => {
    if (!session) return;
    try {
      const data = await envoyerPiece<Record<string, unknown>>(session, field as string, file);
      setProfile(prev => ({ ...prev, [field]: data[field as string] as string }));
      await chargerLiens(session);
      setMessage({ type: 'success', text: t('dossier.messages.document_envoye') });
    } catch (error) {
      gererErreur(error, "Erreur lors de l'envoi du document");
    }
  };

  const handleDeleteFile = async (field: keyof FinancingProfile) => {
    if (!profile[field]) return;
    try {
      await appelDossier('delete-file', { session, field });
      handleInputChange(field, '');
      setFileUrls(prev => {
        const copie = { ...prev };
        delete copie[field as string];
        return copie;
      });
      setMessage({ type: 'success', text: t('dossier.messages.document_supprime') });
    } catch (error) {
      gererErreur(error, 'Erreur lors de la suppression du document');
    }
  };

  const validateProfile = (): boolean => {
    const fieldLabels: Record<string, string> = {
      last_name: 'Nom',
      first_name: 'Prénom',
      birth_postal_code: 'Code postal de naissance',
      birth_date: 'Date de naissance',
      current_address: 'Adresse actuelle',
      phone_number: 'Numéro de téléphone',
      email: 'Adresse email',
      housing_entry_date: 'Date d\'entrée dans le logement',
      housing_status: 'Occupation dans le logement',
      job_title: 'Emploi/poste occupé',
      employment_start_date: 'Date d\'entrée (emploi)',
      contract_type: 'Type de contrat',
      monthly_net_salary: 'Salaire net mensuel',
      marital_status: 'Situation maritale',
      vehicle_to_finance: 'Véhicule à financer',
      desired_duration: 'Durée souhaitée',
    };

    const documentLabels: Record<string, string> = {
      id_card_front: 'Pièce d\'identité (recto)',
      id_card_back: 'Pièce d\'identité (verso)',
      driver_license_front: 'Permis de conduire (recto)',
      driver_license_back: 'Permis de conduire (verso)',
      proof_of_residence: 'Justificatif de domicile',
      payslip_1: 'Bulletin de salaire 1',
      payslip_2: 'Bulletin de salaire 2',
      payslip_3: 'Bulletin de salaire 3',
      tax_notice: 'Avis d\'imposition',
      rib: 'RIB',
    };

    const requiredFields = [
      'last_name', 'first_name', 'birth_postal_code', 'birth_date',
      'current_address', 'phone_number', 'email', 'housing_entry_date',
      'housing_status', 'job_title',
      'employment_start_date', 'contract_type', 'monthly_net_salary',
      'marital_status', 'vehicle_to_finance', 'desired_duration'
    ];

    const requiredDocuments = [
      'id_card_front', 'id_card_back', 'driver_license_front', 'driver_license_back',
      'proof_of_residence', 'payslip_1', 'payslip_2', 'payslip_3', 'tax_notice', 'rib'
    ];

    for (const field of requiredFields) {
      if (!profile[field as keyof FinancingProfile]) {
        const label = fieldLabels[field] || field;
        setMessage({ type: 'error', text: `Le champ "${label}" est obligatoire` });
        return false;
      }
    }

    if (profile.rent_or_credit_amount < 0 || profile.monthly_net_salary < 0 || profile.financing_amount < 0) {
      setMessage({ type: 'error', text: 'Les montants ne peuvent pas être négatifs' });
      return false;
    }

    for (const doc of requiredDocuments) {
      if (!profile[doc as keyof FinancingProfile]) {
        const label = documentLabels[doc] || doc;
        setMessage({ type: 'error', text: `Le document "${label}" est obligatoire` });
        return false;
      }
    }

    if (profile.housing_status === 'hébergé') {
      if (!profile.hosting_certificate || !profile.host_id_card) {
        setMessage({ type: 'error', text: 'L\'attestation d\'hébergement et la pièce d\'identité de l\'hébergeur sont obligatoires' });
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const { profile: data } = await appelDossier<{ profile: Record<string, unknown> }>('save', {
        session,
        profile: champsSaisis(),
      });
      appliquerDossier(data);
      setMessage({ type: 'success', text: t('dossier.messages.enregistre') });
    } catch (error) {
      gererErreur(error, "Erreur lors de l'enregistrement du dossier");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateProfile()) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const { profile: data } = await appelDossier<{ profile: Record<string, unknown> }>('submit', {
        session,
        profile: champsSaisis(),
      });
      appliquerDossier(data);
      setMessage({ type: 'success', text: t('dossier.messages.soumis') });
      setTimeout(() => navigate('/financement'), 3000);
    } catch (error) {
      gererErreur(error, 'Erreur lors de la soumission de la demande');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await appelDossier('delete', { session });
      setShowDeleteModal(false);
      setSession('');
      setMessage({ type: 'success', text: t('dossier.messages.supprime') });
      setTimeout(() => navigate('/financement'), 2000);
    } catch (error) {
      setShowDeleteModal(false);
      gererErreur(error, 'Erreur lors de la suppression du dossier');
    }
  };

  const handleReopen = async () => {
    try {
      const { profile: data } = await appelDossier<{ profile: Record<string, unknown> }>('reopen', { session });
      appliquerDossier(data);
      setMessage({ type: 'success', text: t('dossier.messages.reouvert') });
    } catch (error) {
      gererErreur(error, 'Erreur lors de la réouverture du dossier');
    }
  };

  if (showEmailModal) {
    const creation = modeAcces === 'creation';
    return (
      <>
        <SEOHead meta={pageSeo['/financement/dossier']} />
        <Section className="py-12 bg-fond">
          <Container>
            <div className="max-w-md mx-auto">
              <div className="carte p-6 md:p-8">
                <h1 className="!text-[28px] md:!text-[32px] filet-apres mb-5">{t('dossier.acces.titre')}</h1>

                <div className="grid grid-cols-2 gap-1 p-1 mb-6 bg-fond rounded-xl" role="tablist" aria-label="Accès au dossier">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={!creation}
                    onClick={() => { setModeAcces('code'); setErreurAcces(''); }}
                    className={`py-2.5 rounded-lg text-sm font-semibold transition-colors duration-180 ${!creation ? 'bg-surface text-noir shadow-carte' : 'text-gris hover:text-noir'}`}
                  >
                    {t('dossier.acces.onglet_existant')}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={creation}
                    onClick={() => { setModeAcces('creation'); setErreurAcces(''); }}
                    className={`py-2.5 rounded-lg text-sm font-semibold transition-colors duration-180 ${creation ? 'bg-surface text-noir shadow-carte' : 'text-gris hover:text-noir'}`}
                  >
                    {t('dossier.acces.onglet_nouveau')}
                  </button>
                </div>

                <p className="text-gris mb-6 text-[15px]">
                  {creation
                    ? t('dossier.acces.intro_nouveau')
                    : t('dossier.acces.intro_existant')}
                </p>

                <form data-zone="formulaires" onSubmit={handleEmailSubmit} className="space-y-4" noValidate>
                  <Input
                    label={t('dossier.acces.email')}
                    type="email"
                    autoComplete="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder={t('dossier.acces.email_exemple')}
                  />
                  {!creation && (
                    <Input
                      label={t('dossier.acces.code')}
                      autoComplete="one-time-code"
                      autoCapitalize="characters"
                      spellCheck={false}
                      required
                      value={codeInput}
                      onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                      placeholder={t('dossier.acces.code_exemple')}
                      className="font-mono tracking-[0.15em]"
                    />
                  )}

                  {erreurAcces && (
                    <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                      {erreurAcces}
                    </p>
                  )}

                  <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                    <Button type="button" variant="secondary" onClick={() => navigate('/financement')} className="sm:flex-1">
                      {t('dossier.acces.annuler')}
                    </Button>
                    <Button
                      type="submit"
                      className="sm:flex-1"
                      disabled={loading || !emailInput.trim() || (!creation && codeInput.replace(/[^A-Z0-9]/gi, '').length !== 8)}
                    >
                      {loading ? t('dossier.acces.attente') : creation ? t('dossier.acces.creer') : t('dossier.acces.acceder')}
                    </Button>
                  </div>
                </form>

                {!creation && (
                  <p className="mt-6 text-xs text-doux-68">
                    {t('dossier.acces.perdu_avant')}{' '}
                    <a href={lienTelephone(c.telephone)} className="text-lien underline underline-offset-2">{c.telephone}</a>{' '}
                    {t('dossier.acces.perdu_apres')}
                  </p>
                )}
              </div>
            </div>
          </Container>
        </Section>
      </>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-fond flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bleu mx-auto"></div>
          <p className="mt-4 text-gris">{t('dossier.acces.chargement')}</p>
        </div>
      </div>
    );
  }

  const isSubmitted = profile.status === 'submitted';

  const isFormValid = (): boolean => {
    const requiredFields = [
      'last_name', 'first_name', 'birth_postal_code', 'birth_date',
      'current_address', 'phone_number', 'email', 'housing_entry_date',
      'housing_status', 'job_title',
      'employment_start_date', 'contract_type', 'monthly_net_salary',
      'marital_status', 'vehicle_to_finance', 'desired_duration'
    ];

    const requiredDocuments = [
      'id_card_front', 'id_card_back', 'driver_license_front', 'driver_license_back',
      'proof_of_residence', 'payslip_1', 'payslip_2', 'payslip_3', 'tax_notice', 'rib'
    ];

    for (const field of requiredFields) {
      if (!profile[field as keyof FinancingProfile]) {
        return false;
      }
    }

    for (const doc of requiredDocuments) {
      if (!profile[doc as keyof FinancingProfile]) {
        return false;
      }
    }

    if (profile.housing_status === 'hébergé') {
      if (!profile.hosting_certificate || !profile.host_id_card) {
        return false;
      }
    }

    return true;
  };

  return (
    <>
      <SEOHead meta={pageSeo['/financement/dossier']} />

      {message && (
        <Toast
          type={message.type}
          message={message.text}
          onClose={() => setMessage(null)}
        />
      )}

      <Section className="py-8 bg-fond">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="bg-surface rounded-lg shadow-md p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-noir">{t('dossier.entete.titre')}</h1>
                  <p className="text-gris mt-2">
                    {t('dossier.entete.texte1')}
                  </p>
                  <p className="text-gris mt-2">
                    {t('dossier.entete.texte2')}
                  </p>
                </div>
                {isSubmitted && (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-6 h-6 mr-2" />
                    <span className="font-semibold">{t('dossier.entete.soumis')}</span>
                  </div>
                )}
              </div>

              {codeCree && (
                <div role="status" className="mb-8 rounded-2xl border border-or bg-or-voile-leger p-5">
                  <div className="flex items-start gap-3">
                    <KeyRound className="w-6 h-6 text-or-texte flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="font-semibold text-noir">{t('dossier.code.titre')}</p>
                      <p className="text-sm text-gris mt-1">
                        {t('dossier.code.texte')}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-3">
                        <span className="font-mono text-2xl font-bold tracking-[0.2em] text-noir bg-surface border border-bordure rounded-lg px-4 py-2 select-all">
                          {codeCree}
                        </span>
                        <Button type="button" size="sm" variant="secondary" onClick={copierCode}>
                          <Copy className="w-4 h-4" aria-hidden="true" />
                          {codeCopie ? t('dossier.code.copie') : t('dossier.code.copier')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <form data-zone="formulaires" className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-noir mb-4">{t('dossier.perso.titre')}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label={`${t('dossier.perso.nom')} *`}
                      value={profile.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      disabled={isSubmitted}
                      required
                    />
                    <Input
                      label={`${t('dossier.perso.prenom')} *`}
                      value={profile.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      disabled={isSubmitted}
                      required
                    />
                    <Input
                      label={`${t('dossier.perso.cp_naissance')} *`}
                      value={profile.birth_postal_code}
                      onChange={(e) => handleInputChange('birth_postal_code', e.target.value)}
                      disabled={isSubmitted}
                      required
                    />
                    <Input
                      type="date"
                      label={`${t('dossier.perso.date_naissance')} *`}
                      value={profile.birth_date}
                      onChange={(e) => handleInputChange('birth_date', e.target.value)}
                      disabled={isSubmitted}
                      required
                    />
                    <div className="md:col-span-2">
                      <Input
                        label={`${t('dossier.perso.adresse')} *`}
                        value={profile.current_address}
                        onChange={(e) => handleInputChange('current_address', e.target.value)}
                        disabled={isSubmitted}
                        required
                      />
                    </div>
                    <Input
                      type="tel"
                      label={`${t('dossier.perso.telephone')} *`}
                      value={profile.phone_number}
                      onChange={(e) => handleInputChange('phone_number', e.target.value)}
                      disabled={isSubmitted}
                      required
                    />
                    <Input
                      type="email"
                      label={`${t('dossier.perso.email')} *`}
                      value={profile.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={isSubmitted}
                      required
                    />
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-noir mb-4">{t('dossier.logement.titre')}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      type="date"
                      label={`${t('dossier.logement.date_entree')} *`}
                      value={profile.housing_entry_date}
                      onChange={(e) => handleInputChange('housing_entry_date', e.target.value)}
                      disabled={isSubmitted}
                      required
                    />
                    <Select
                      label={`${t('dossier.logement.occupation')} *`}
                      value={profile.housing_status}
                      onChange={(e) => handleInputChange('housing_status', e.target.value)}
                      disabled={isSubmitted}
                      required
                    >
                      <option value="">{t('dossier.logement.choisir')}</option>
                      <option value="locataire">{t('dossier.logement.locataire')}</option>
                      <option value="propriétaire">{t('dossier.logement.proprietaire')}</option>
                      <option value="hébergé">{t('dossier.logement.heberge')}</option>
                    </Select>
                    <Input
                      type="number"
                      label={`${t('dossier.logement.loyer')} *`}
                      value={profile.rent_or_credit_amount}
                      onChange={(e) => handleInputChange('rent_or_credit_amount', parseFloat(e.target.value) || 0)}
                      disabled={isSubmitted}
                      required
                    />
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-noir mb-4">{t('dossier.pro.titre')}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label={`${t('dossier.pro.emploi')} *`}
                      value={profile.job_title}
                      onChange={(e) => handleInputChange('job_title', e.target.value)}
                      disabled={isSubmitted}
                      required
                    />
                    <Input
                      type="date"
                      label={`${t('dossier.pro.date_entree')} *`}
                      value={profile.employment_start_date}
                      onChange={(e) => handleInputChange('employment_start_date', e.target.value)}
                      disabled={isSubmitted}
                      required
                    />
                    <Input
                      label={`${t('dossier.pro.contrat')} *`}
                      value={profile.contract_type}
                      onChange={(e) => handleInputChange('contract_type', e.target.value)}
                      disabled={isSubmitted}
                      placeholder={t('dossier.pro.contrat_exemple')}
                      required
                    />
                    <Input
                      type="number"
                      label={`${t('dossier.pro.salaire')} *`}
                      value={profile.monthly_net_salary}
                      onChange={(e) => handleInputChange('monthly_net_salary', parseFloat(e.target.value) || 0)}
                      disabled={isSubmitted}
                      required
                    />
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-noir mb-4">{t('dossier.finances.titre')}</h2>
                  <div className="space-y-4">
                    <Textarea
                      label={t('dossier.finances.charges')}
                      value={profile.other_charges_or_credits}
                      onChange={(e) => handleInputChange('other_charges_or_credits', e.target.value)}
                      disabled={isSubmitted}
                      rows={3}
                      placeholder={t('dossier.finances.charges_exemple')}
                    />
                    <Textarea
                      label={t('dossier.finances.revenus')}
                      value={profile.other_income_sources}
                      onChange={(e) => handleInputChange('other_income_sources', e.target.value)}
                      disabled={isSubmitted}
                      rows={3}
                      placeholder={t('dossier.finances.revenus_exemple')}
                    />
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-noir mb-4">{t('dossier.situation.titre')}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label={`${t('dossier.situation.maritale')} *`}
                      value={profile.marital_status}
                      onChange={(e) => handleInputChange('marital_status', e.target.value)}
                      disabled={isSubmitted}
                      required
                    >
                      <option value="">{t('dossier.situation.choisir')}</option>
                      <option value="célibataire">{t('dossier.situation.celibataire')}</option>
                      <option value="marié(e)">{t('dossier.situation.marie')}</option>
                      <option value="pacsé(e)">{t('dossier.situation.pacse')}</option>
                      <option value="divorcé(e)">{t('dossier.situation.divorce')}</option>
                      <option value="veuf(ve)">{t('dossier.situation.veuf')}</option>
                    </Select>
                    <Input
                      type="number"
                      label={t('dossier.situation.personnes_charge')}
                      value={profile.dependents_count}
                      onChange={(e) => handleInputChange('dependents_count', parseInt(e.target.value) || 0)}
                      disabled={isSubmitted}
                    />
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-noir mb-4">{t('dossier.projet.titre')}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label={`${t('dossier.projet.vehicule')} *`}
                      value={profile.vehicle_to_finance}
                      onChange={(e) => handleInputChange('vehicle_to_finance', e.target.value)}
                      disabled={isSubmitted}
                      placeholder={t('dossier.projet.vehicule_exemple')}
                      required
                    />
                    <Input
                      type="number"
                      label={`${t('dossier.projet.montant')} *`}
                      value={profile.financing_amount}
                      onChange={(e) => handleInputChange('financing_amount', parseFloat(e.target.value) || 0)}
                      disabled={isSubmitted}
                      placeholder={t('dossier.projet.montant_exemple')}
                      required
                    />
                    <Input
                      type="number"
                      label={`${t('dossier.projet.duree')} *`}
                      value={profile.desired_duration}
                      onChange={(e) => handleInputChange('desired_duration', parseInt(e.target.value) || 0)}
                      disabled={isSubmitted}
                      required
                    />
                  </div>
                  <Textarea
                    label={t('dossier.projet.commentaires')}
                    value={profile.comments || ''}
                    onChange={(e) => handleInputChange('comments', e.target.value)}
                    disabled={isSubmitted}
                    rows={4}
                    placeholder={t('dossier.projet.commentaires_exemple')}
                  />
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-noir mb-4">{t('dossier.documents.titre')}</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-noir mb-3">{t('dossier.documents.identite.titre')}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SingleFileUpload
                          label={`${t('dossier.documents.identite.recto')} *`}
                          value={profile.id_card_front}
                          fileUrl={fileUrls.id_card_front}
                          onChange={(file) => handleSingleFileUpload('id_card_front', file)}
                          onDelete={() => handleDeleteFile('id_card_front')}
                          disabled={isSubmitted}
                          accept="image/*,.pdf"
                          required
                        />
                        <SingleFileUpload
                          label={`${t('dossier.documents.identite.verso')} *`}
                          value={profile.id_card_back}
                          fileUrl={fileUrls.id_card_back}
                          onChange={(file) => handleSingleFileUpload('id_card_back', file)}
                          onDelete={() => handleDeleteFile('id_card_back')}
                          disabled={isSubmitted}
                          accept="image/*,.pdf"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-noir mb-3">{t('dossier.documents.permis.titre')}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SingleFileUpload
                          label={`${t('dossier.documents.permis.recto')} *`}
                          value={profile.driver_license_front}
                          fileUrl={fileUrls.driver_license_front}
                          onChange={(file) => handleSingleFileUpload('driver_license_front', file)}
                          onDelete={() => handleDeleteFile('driver_license_front')}
                          disabled={isSubmitted}
                          accept="image/*,.pdf"
                        />
                        <SingleFileUpload
                          label={`${t('dossier.documents.permis.verso')} *`}
                          value={profile.driver_license_back}
                          fileUrl={fileUrls.driver_license_back}
                          onChange={(file) => handleSingleFileUpload('driver_license_back', file)}
                          onDelete={() => handleDeleteFile('driver_license_back')}
                          disabled={isSubmitted}
                          accept="image/*,.pdf"
                        />
                      </div>
                    </div>

                    <SingleFileUpload
                      label={`${t('dossier.documents.domicile')} *`}
                      value={profile.proof_of_residence}
                          fileUrl={fileUrls.proof_of_residence}
                      onChange={(file) => handleSingleFileUpload('proof_of_residence', file)}
                      onDelete={() => handleDeleteFile('proof_of_residence')}
                      disabled={isSubmitted}
                      accept="image/*,.pdf"
                    />

                    <div>
                      <h3 className="text-lg font-medium text-noir mb-3">{t('dossier.documents.salaires.titre')}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <SingleFileUpload
                          label={`${t('dossier.documents.salaires.1')} *`}
                          value={profile.payslip_1}
                          fileUrl={fileUrls.payslip_1}
                          onChange={(file) => handleSingleFileUpload('payslip_1', file)}
                          onDelete={() => handleDeleteFile('payslip_1')}
                          disabled={isSubmitted}
                          accept="image/*,.pdf"
                        />
                        <SingleFileUpload
                          label={`${t('dossier.documents.salaires.2')} *`}
                          value={profile.payslip_2}
                          fileUrl={fileUrls.payslip_2}
                          onChange={(file) => handleSingleFileUpload('payslip_2', file)}
                          onDelete={() => handleDeleteFile('payslip_2')}
                          disabled={isSubmitted}
                          accept="image/*,.pdf"
                        />
                        <SingleFileUpload
                          label={`${t('dossier.documents.salaires.3')} *`}
                          value={profile.payslip_3}
                          fileUrl={fileUrls.payslip_3}
                          onChange={(file) => handleSingleFileUpload('payslip_3', file)}
                          onDelete={() => handleDeleteFile('payslip_3')}
                          disabled={isSubmitted}
                          accept="image/*,.pdf"
                        />
                      </div>
                    </div>

                    <SingleFileUpload
                      label={`${t('dossier.documents.impots')} *`}
                      value={profile.tax_notice}
                          fileUrl={fileUrls.tax_notice}
                      onChange={(file) => handleSingleFileUpload('tax_notice', file)}
                      onDelete={() => handleDeleteFile('tax_notice')}
                      disabled={isSubmitted}
                      accept="image/*,.pdf"
                    />

                    <SingleFileUpload
                      label={`${t('dossier.documents.rib')} *`}
                      value={profile.rib}
                          fileUrl={fileUrls.rib}
                      onChange={(file) => handleSingleFileUpload('rib', file)}
                      onDelete={() => handleDeleteFile('rib')}
                      disabled={isSubmitted}
                      accept="image/*,.pdf"
                    />

                    {profile.housing_status === 'hébergé' && (
                      <div className="border-t pt-6 mt-6">
                        <h3 className="text-lg font-medium text-noir mb-3">{t('dossier.documents.heberge.titre')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <SingleFileUpload
                            label={`${t('dossier.documents.heberge.attestation')} *`}
                            value={profile.hosting_certificate}
                          fileUrl={fileUrls.hosting_certificate}
                            onChange={(file) => handleSingleFileUpload('hosting_certificate', file)}
                            onDelete={() => handleDeleteFile('hosting_certificate')}
                            disabled={isSubmitted}
                            accept="image/*,.pdf"
                          />
                          <SingleFileUpload
                            label={`${t('dossier.documents.heberge.identite')} *`}
                            value={profile.host_id_card}
                          fileUrl={fileUrls.host_id_card}
                            onChange={(file) => handleSingleFileUpload('host_id_card', file)}
                            onDelete={() => handleDeleteFile('host_id_card')}
                            disabled={isSubmitted}
                            accept="image/*,.pdf"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-6 border-t">
                  {!isSubmitted && (
                    <>
                      <Button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        variant="secondary"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? t('dossier.actions.enregistrement') : t('dossier.actions.enregistrer')}
                      </Button>
                      <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting || !isFormValid()}
                        className={`border-2 font-semibold ${
                          !isFormValid()
                            ? 'bg-gray-300 border-champ text-doux-62 cursor-not-allowed opacity-50'
                            : 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                        }`}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {submitting ? t('dossier.actions.envoi') : t('dossier.actions.soumettre')}
                      </Button>
                    </>
                  )}
                  {isSubmitted && profile.id && (
                    <Button
                      type="button"
                      onClick={handleReopen}
                      variant="secondary"
                      className="bg-bleu text-sur-bouton hover:bg-bleu-hover border-2 border-bleu font-semibold"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      {t('dossier.actions.modifier')}
                    </Button>
                  )}
                  {profile.id && (
                    <Button
                      type="button"
                      onClick={handleDeleteClick}
                      variant="secondary"
                      className="ml-auto bg-red-600 text-white hover:bg-red-700 border-2 border-red-600 font-semibold"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t('dossier.actions.supprimer')}
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </Container>
      </Section>

      {showDeleteModal && (
        <DeleteConfirmModal
          title={t('dossier.suppression.titre')}
          message={t('dossier.suppression.texte')}
          annuler={t('dossier.suppression.annuler')}
          supprimer={t('dossier.suppression.supprimer')}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </>
  );
}
