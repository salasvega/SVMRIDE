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
import { supabase } from '../lib/supabase';
import { SEOHead } from '../components/layout/SEOHead';
import { DeleteConfirmModal } from '../components/admin/DeleteConfirmModal';
import { Save, Send, Trash2, CheckCircle, Edit } from 'lucide-react';

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
  const [userEmail, setUserEmail] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(true);
  const [emailInput, setEmailInput] = useState('');
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
    status: 'draft',
    is_complete: false,
  });

  const loadProfile = useCallback(async () => {
    if (!userEmail) {
      console.log('No userEmail, skipping load');
      return;
    }

    console.log('Loading profile for:', userEmail);
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('user_financing_profiles')
        .select('*')
        .eq('user_email', userEmail)
        .maybeSingle();

      console.log('Query result:', { data, error });

      if (error && error.code !== 'PGRST116') {
        console.error('Query error:', error);
        throw error;
      }

      if (data) {
        console.log('Profile data loaded:', data);
        setProfile({
          ...data,
          birth_date: data.birth_date || '',
          housing_entry_date: data.housing_entry_date || '',
          employment_start_date: data.employment_start_date || '',
          rent_or_credit_amount: Number(data.rent_or_credit_amount) || 0,
          monthly_net_salary: Number(data.monthly_net_salary) || 0,
        });
      } else {
        console.log('No profile found, creating new');
        setProfile(prev => ({ ...prev, user_email: userEmail, email: userEmail }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement du profil' });
    } finally {
      console.log('Loading complete');
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    if (userEmail) {
      loadProfile();
    }
  }, [userEmail, loadProfile]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    console.log('Email submitted:', emailInput.trim());
    setUserEmail(emailInput.trim());
    setShowEmailModal(false);
  };

  const handleInputChange = (field: keyof FinancingProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSingleFileUpload = async (field: keyof FinancingProfile, file: File) => {
    if (!userEmail) return;

    const fileNameMapping: Record<string, string> = {
      id_card_front: 'piece_identite_recto',
      id_card_back: 'piece_identite_verso',
      driver_license_front: 'permis_conduire_recto',
      driver_license_back: 'permis_conduire_verso',
      proof_of_residence: 'justificatif_domicile',
      payslip_1: 'bulletin_salaire_1',
      payslip_2: 'bulletin_salaire_2',
      payslip_3: 'bulletin_salaire_3',
      tax_notice: 'avis_imposition',
      rib: 'rib',
      hosting_certificate: 'attestation_hebergement',
      host_id_card: 'piece_identite_hebergeur',
    };

    console.log('Starting file upload:', { field, fileName: file.name, fileSize: file.size });

    try {
      const fileExt = file.name.split('.').pop();
      const frenchFieldName = fileNameMapping[field as string] || field;
      const fileName = `${userEmail}/${frenchFieldName}_${Date.now()}.${fileExt}`;

      console.log('Uploading to storage:', fileName);

      const { data, error: uploadError } = await supabase.storage
        .from('financing-documents')
        .upload(fileName, file);

      console.log('Upload result:', { data, error: uploadError });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('financing-documents')
        .getPublicUrl(fileName);

      console.log('File uploaded successfully:', { fileName, publicUrl });

      handleInputChange(field, fileName);
      setMessage({ type: 'success', text: 'Document téléchargé avec succès' });
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessage({ type: 'error', text: 'Erreur lors du téléchargement du document' });
    }
  };

  const handleDeleteFile = async (field: keyof FinancingProfile) => {
    const fileName = profile[field] as string;
    if (!fileName) return;

    try {
      const { error } = await supabase.storage
        .from('financing-documents')
        .remove([fileName]);

      if (error) throw error;

      handleInputChange(field, '');
      setMessage({ type: 'success', text: 'Document supprimé avec succès' });
    } catch (error) {
      console.error('Error deleting file:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la suppression du document' });
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
      const cleanedProfile = {
        ...profile,
        birth_date: profile.birth_date || null,
        housing_entry_date: profile.housing_entry_date || null,
        employment_start_date: profile.employment_start_date || null,
      };

      const { error } = await supabase
        .from('user_financing_profiles')
        .upsert(cleanedProfile, { onConflict: 'user_email' });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Dossier enregistré avec succès' });
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: 'Erreur lors de l'enregistrement du dossier' });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateProfile()) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const cleanedProfile = {
        ...profile,
        birth_date: profile.birth_date || null,
        housing_entry_date: profile.housing_entry_date || null,
        employment_start_date: profile.employment_start_date || null,
        status: 'submitted',
        is_complete: true,
        submitted_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('user_financing_profiles')
        .upsert(cleanedProfile, { onConflict: 'user_email' });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Demande de financement soumise avec succès ! Vous recevrez une réponse par email.' });
      setTimeout(() => navigate('/financement'), 3000);
    } catch (error) {
      console.error('Error submitting profile:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la soumission de la demande' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      if (!profile.id) {
        setMessage({ type: 'error', text: 'Aucun dossier à supprimer' });
        setShowDeleteModal(false);
        return;
      }

      console.log('Deleting profile:', profile.id);

      const { error } = await supabase
        .from('user_financing_profiles')
        .delete()
        .eq('id', profile.id);

      if (error) throw error;

      const documentFields = [
        'id_card_front', 'id_card_back', 'driver_license_front', 'driver_license_back',
        'proof_of_residence', 'payslip_1', 'payslip_2', 'payslip_3',
        'tax_notice', 'rib', 'hosting_certificate', 'host_id_card'
      ];

      const filesToDelete: string[] = [];
      for (const field of documentFields) {
        const filePath = profile[field as keyof FinancingProfile] as string;
        if (filePath) {
          filesToDelete.push(filePath);
        }
      }

      if (filesToDelete.length > 0) {
        console.log('Attempting to delete', filesToDelete.length, 'files from storage');
        const { error: storageError } = await supabase.storage
          .from('financing-documents')
          .remove(filesToDelete);

        if (storageError) {
          console.error('Error deleting files from storage (non-blocking):', storageError);
        } else {
          console.log('Successfully deleted', filesToDelete.length, 'files from storage');
        }
      }

      console.log('Profile deleted successfully');
      setShowDeleteModal(false);
      setMessage({ type: 'success', text: 'Dossier supprimé avec succès' });
      setTimeout(() => navigate('/financement'), 2000);
    } catch (error) {
      console.error('Error deleting profile:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la suppression du dossier' });
      setShowDeleteModal(false);
    }
  };

  const handleReopen = async () => {
    try {
      if (!profile.id) {
        setMessage({ type: 'error', text: 'Aucun dossier à modifier' });
        return;
      }

      const { error } = await supabase
        .from('user_financing_profiles')
        .update({
          status: 'draft',
          is_complete: false,
          submitted_at: null
        })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile(prev => ({
        ...prev,
        status: 'draft',
        is_complete: false,
        submitted_at: undefined
      }));

      setMessage({ type: 'success', text: 'Dossier réouvert pour modification' });
    } catch (error) {
      console.error('Error reopening profile:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la réouverture du dossier' });
    }
  };

  if (showEmailModal) {
    return (
      <>
        <SEOHead
          title="Mon Dossier Financement - SVM-RIDE"
          description="Gérez votre dossier de financement automobile en ligne"
        />
        <Section className="py-12 bg-gray-50">
          <Container>
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Accès au Dossier</h2>
                <p className="text-gray-600 mb-6">
                  Veuillez entrer votre adresse email pour accéder à votre dossier de financement.
                </p>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <Input
                    label="Adresse email"
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="exemple@email.com"
                  />
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => navigate('/financement')}
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                    <Button type="submit" className="flex-1">
                      Accéder
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </Container>
        </Section>
      </>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  const isSubmitted = profile.status === 'submitted';

  return (
    <>
      <SEOHead
        title="Mon Dossier Financement - Garage Vaillant"
        description="Gérez votre dossier de financement automobile en ligne"
      />

      {message && (
        <Toast
          type={message.type}
          message={message.text}
          onClose={() => setMessage(null)}
        />
      )}

      <Section className="py-8 bg-gray-50">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Mon Dossier Financement</h1>
                  <p className="text-gray-600 mt-2">
                    Complétez votre dossier pour soumettre votre demande de financement
                  </p>
                </div>
                {isSubmitted && (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-6 h-6 mr-2" />
                    <span className="font-semibold">Soumis</span>
                  </div>
                )}
              </div>

              <form className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Informations Personnelles</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Nom *"
                      value={profile.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      disabled={isSubmitted}
                      required
                    />
                    <Input
                      label="Prénom *"
                      value={profile.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      disabled={isSubmitted}
                      required
                    />
                    <Input
                      label="Code postal de naissance *"
                      value={profile.birth_postal_code}
                      onChange={(e) => handleInputChange('birth_postal_code', e.target.value)}
                      disabled={isSubmitted}
                      required
                    />
                    <Input
                      type="date"
                      label="Date de naissance *"
                      value={profile.birth_date}
                      onChange={(e) => handleInputChange('birth_date', e.target.value)}
                      disabled={isSubmitted}
                      required
                    />
                    <div className="md:col-span-2">
                      <Input
                        label="Adresse actuelle *"
                        value={profile.current_address}
                        onChange={(e) => handleInputChange('current_address', e.target.value)}
                        disabled={isSubmitted}
                        required
                      />
                    </div>
                    <Input
                      type="tel"
                      label="Numéro de téléphone *"
                      value={profile.phone_number}
                      onChange={(e) => handleInputChange('phone_number', e.target.value)}
                      disabled={isSubmitted}
                      required
                    />
                    <Input
                      type="email"
                      label="Adresse email *"
                      value={profile.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={isSubmitted}
                      required
                    />
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Informations Logement</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      type="date"
                      label="Date d'entrée dans le logement *"
                      value={profile.housing_entry_date}
                      onChange={(e) => handleInputChange('housing_entry_date', e.target.value)}
                      disabled={isSubmitted}
                      required
                    />
                    <Select
                      label="Occupation dans le logement *"
                      value={profile.housing_status}
                      onChange={(e) => handleInputChange('housing_status', e.target.value)}
                      disabled={isSubmitted}
                      required
                    >
                      <option value="">Sélectionner</option>
                      <option value="locataire">Locataire</option>
                      <option value="propriétaire">Propriétaire</option>
                      <option value="hébergé">Hébergé</option>
                    </Select>
                    <Input
                      type="number"
                      label="Montant du loyer ou du crédit (€) *"
                      value={profile.rent_or_credit_amount}
                      onChange={(e) => handleInputChange('rent_or_credit_amount', parseFloat(e.target.value) || 0)}
                      disabled={isSubmitted}
                      required
                    />
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Informations Professionnelles</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Emploi/poste occupé *"
                      value={profile.job_title}
                      onChange={(e) => handleInputChange('job_title', e.target.value)}
                      disabled={isSubmitted}
                      required
                    />
                    <Input
                      type="date"
                      label="Date d'entrée *"
                      value={profile.employment_start_date}
                      onChange={(e) => handleInputChange('employment_start_date', e.target.value)}
                      disabled={isSubmitted}
                      required
                    />
                    <Input
                      label="Type de contrat *"
                      value={profile.contract_type}
                      onChange={(e) => handleInputChange('contract_type', e.target.value)}
                      disabled={isSubmitted}
                      placeholder="CDI, CDD, intérim, etc."
                      required
                    />
                    <Input
                      type="number"
                      label="Salaire net mensuel (€) *"
                      value={profile.monthly_net_salary}
                      onChange={(e) => handleInputChange('monthly_net_salary', parseFloat(e.target.value) || 0)}
                      disabled={isSubmitted}
                      required
                    />
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Informations Financières</h2>
                  <div className="space-y-4">
                    <Textarea
                      label="Autres charges ou crédits"
                      value={profile.other_charges_or_credits}
                      onChange={(e) => handleInputChange('other_charges_or_credits', e.target.value)}
                      disabled={isSubmitted}
                      rows={3}
                      placeholder="Détaillez vos autres charges mensuelles..."
                    />
                    <Textarea
                      label="Autres sources de revenus"
                      value={profile.other_income_sources}
                      onChange={(e) => handleInputChange('other_income_sources', e.target.value)}
                      disabled={isSubmitted}
                      rows={3}
                      placeholder="Allocation, revenus locatifs, etc..."
                    />
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Situation Personnelle</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Situation maritale *"
                      value={profile.marital_status}
                      onChange={(e) => handleInputChange('marital_status', e.target.value)}
                      disabled={isSubmitted}
                      required
                    >
                      <option value="">Sélectionner</option>
                      <option value="célibataire">Célibataire</option>
                      <option value="marié(e)">Marié(e)</option>
                      <option value="pacsé(e)">Pacsé(e)</option>
                      <option value="divorcé(e)">Divorcé(e)</option>
                      <option value="veuf(ve)">Veuf(ve)</option>
                    </Select>
                    <Input
                      type="number"
                      label="Nombre de personnes à charge"
                      value={profile.dependents_count}
                      onChange={(e) => handleInputChange('dependents_count', parseInt(e.target.value) || 0)}
                      disabled={isSubmitted}
                    />
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Détails du Financement</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Véhicule à financer *"
                      value={profile.vehicle_to_finance}
                      onChange={(e) => handleInputChange('vehicle_to_finance', e.target.value)}
                      disabled={isSubmitted}
                      placeholder="Marque, modèle, année..."
                      required
                    />
                    <Input
                      type="number"
                      label="Montant du financement (€) *"
                      value={profile.financing_amount}
                      onChange={(e) => handleInputChange('financing_amount', parseFloat(e.target.value) || 0)}
                      disabled={isSubmitted}
                      placeholder="Ex: 15000"
                      required
                    />
                    <Input
                      type="number"
                      label="Durée souhaitée (mois) *"
                      value={profile.desired_duration}
                      onChange={(e) => handleInputChange('desired_duration', parseInt(e.target.value) || 0)}
                      disabled={isSubmitted}
                      required
                    />
                  </div>
                  <Textarea
                    label="Commentaires"
                    value={profile.comments || ''}
                    onChange={(e) => handleInputChange('comments', e.target.value)}
                    disabled={isSubmitted}
                    rows={4}
                    placeholder="Ajoutez des commentaires ou informations complémentaires..."
                  />
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Documents Obligatoires</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Pièce d'identité</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SingleFileUpload
                          label="Recto *"
                          value={profile.id_card_front ? `financing-documents/${profile.id_card_front}` : ''}
                          onChange={(file) => handleSingleFileUpload('id_card_front', file)}
                          onDelete={() => handleDeleteFile('id_card_front')}
                          disabled={isSubmitted}
                          accept="image/*,.pdf"
                          required
                        />
                        <SingleFileUpload
                          label="Verso *"
                          value={profile.id_card_back ? `financing-documents/${profile.id_card_back}` : ''}
                          onChange={(file) => handleSingleFileUpload('id_card_back', file)}
                          onDelete={() => handleDeleteFile('id_card_back')}
                          disabled={isSubmitted}
                          accept="image/*,.pdf"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Permis de conduire</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SingleFileUpload
                          label="Recto *"
                          value={profile.driver_license_front ? `financing-documents/${profile.driver_license_front}` : ''}
                          onChange={(file) => handleSingleFileUpload('driver_license_front', file)}
                          onDelete={() => handleDeleteFile('driver_license_front')}
                          disabled={isSubmitted}
                          accept="image/*,.pdf"
                        />
                        <SingleFileUpload
                          label="Verso *"
                          value={profile.driver_license_back ? `financing-documents/${profile.driver_license_back}` : ''}
                          onChange={(file) => handleSingleFileUpload('driver_license_back', file)}
                          onDelete={() => handleDeleteFile('driver_license_back')}
                          disabled={isSubmitted}
                          accept="image/*,.pdf"
                        />
                      </div>
                    </div>

                    <SingleFileUpload
                      label="Justificatif de domicile (moins de 3 mois) *"
                      value={profile.proof_of_residence ? `financing-documents/${profile.proof_of_residence}` : ''}
                      onChange={(file) => handleSingleFileUpload('proof_of_residence', file)}
                      onDelete={() => handleDeleteFile('proof_of_residence')}
                      disabled={isSubmitted}
                      accept="image/*,.pdf"
                    />

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Bulletins de salaire</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <SingleFileUpload
                          label="Bulletin 1 *"
                          value={profile.payslip_1 ? `financing-documents/${profile.payslip_1}` : ''}
                          onChange={(file) => handleSingleFileUpload('payslip_1', file)}
                          onDelete={() => handleDeleteFile('payslip_1')}
                          disabled={isSubmitted}
                          accept="image/*,.pdf"
                        />
                        <SingleFileUpload
                          label="Bulletin 2 *"
                          value={profile.payslip_2 ? `financing-documents/${profile.payslip_2}` : ''}
                          onChange={(file) => handleSingleFileUpload('payslip_2', file)}
                          onDelete={() => handleDeleteFile('payslip_2')}
                          disabled={isSubmitted}
                          accept="image/*,.pdf"
                        />
                        <SingleFileUpload
                          label="Bulletin 3 *"
                          value={profile.payslip_3 ? `financing-documents/${profile.payslip_3}` : ''}
                          onChange={(file) => handleSingleFileUpload('payslip_3', file)}
                          onDelete={() => handleDeleteFile('payslip_3')}
                          disabled={isSubmitted}
                          accept="image/*,.pdf"
                        />
                      </div>
                    </div>

                    <SingleFileUpload
                      label="Dernier avis d'imposition *"
                      value={profile.tax_notice ? `financing-documents/${profile.tax_notice}` : ''}
                      onChange={(file) => handleSingleFileUpload('tax_notice', file)}
                      onDelete={() => handleDeleteFile('tax_notice')}
                      disabled={isSubmitted}
                      accept="image/*,.pdf"
                    />

                    <SingleFileUpload
                      label="RIB *"
                      value={profile.rib ? `financing-documents/${profile.rib}` : ''}
                      onChange={(file) => handleSingleFileUpload('rib', file)}
                      onDelete={() => handleDeleteFile('rib')}
                      disabled={isSubmitted}
                      accept="image/*,.pdf"
                    />

                    {profile.housing_status === 'hébergé' && (
                      <div className="border-t pt-6 mt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Documents si hébergé</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <SingleFileUpload
                            label="Attestation d'hébergement *"
                            value={profile.hosting_certificate ? `financing-documents/${profile.hosting_certificate}` : ''}
                            onChange={(file) => handleSingleFileUpload('hosting_certificate', file)}
                            onDelete={() => handleDeleteFile('hosting_certificate')}
                            disabled={isSubmitted}
                            accept="image/*,.pdf"
                          />
                          <SingleFileUpload
                            label="Pièce d'identité hébergeur *"
                            value={profile.host_id_card ? `financing-documents/${profile.host_id_card}` : ''}
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
                        {saving ? 'Enregistrement...' : 'Enregistrer le brouillon'}
                      </Button>
                      <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="bg-green-600 hover:bg-green-700 text-white border-2 border-green-600 font-semibold"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {submitting ? 'Envoi...' : 'Soumettre la demande'}
                      </Button>
                    </>
                  )}
                  {isSubmitted && profile.id && (
                    <Button
                      type="button"
                      onClick={handleReopen}
                      variant="secondary"
                      className="bg-blue-600 text-white hover:bg-blue-700 border-2 border-blue-600 font-semibold"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier le dossier
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
                      Supprimer le dossier
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
          title="Supprimer le dossier"
          message="Êtes-vous sûr de vouloir supprimer ce dossier de financement ? Cette action est irréversible."
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </>
  );
}
