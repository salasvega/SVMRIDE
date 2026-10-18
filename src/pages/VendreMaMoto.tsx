import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeEuro,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileSignature,
  Handshake,
  Phone,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { SEOHead } from '../components/layout/SEOHead';
import { pageSeo } from '../config/seo';
import { Section } from '../components/ui/Section';
import { Container } from '../components/ui/Container';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { IconeOr } from '../components/ui/IconeOr';
import { FileUpload, UploadedDoc } from '../components/ui/FileUpload';
import { DonneesDemande, ErreurDemande, envoyerDemande } from '../lib/depotDemande';
import { useCoordonnees } from '../lib/coordonnees';
import { lienTelephone } from '../config/coordonnees';
import { useTexte } from '../lib/textes';
import { demo } from '../lib/apercuDemo';

// Textes réglables dans l'admin (« Textes du site », page Dépôt-vente) : vendre.etapes.<n>.*
const ETAPES_PARCOURS = [ClipboardCheck, Phone, FileSignature, Store, Handshake];

// vendre.avantages.<n>.*
const AVANTAGES = [BadgeEuro, CalendarCheck, ShieldCheck, Eye];

// vendre.faq.<n>.question / reponse
const NB_QUESTIONS = 7;

const VIDE: DonneesDemande = {
  prenom: '',
  nom: '',
  email: '',
  telephone: '',
  marque: '',
  modele: '',
  version: '',
  annee: '',
  kilometrage: '',
  immatriculation: '',
  etat: '',
  entretien: '',
  prix_souhaite: '',
  commentaire: '',
};

const NB_ETAPES_FORMULAIRE = 3; // vendre.formulaire.etape<n>
const MAX_PHOTOS = 10;

export function VendreMaMoto() {
  const t = useTexte();
  const c = useCoordonnees(); // modifiables dans l'admin, onglet « Édition du site »
  const [donnees, setDonnees] = useState<DonneesDemande>(VIDE);
  const [photos, setPhotos] = useState<UploadedDoc[]>([]);
  const [consentement, setConsentement] = useState(false);
  const [piege, setPiege] = useState('');
  const [etape, setEtape] = useState(0);
  const [envoi, setEnvoi] = useState<string | null>(null);
  const [erreur, setErreur] = useState('');
  // Aperçu de l'admin : message après envoi affiché directement (?demo=envoye)
  const [resultat, setResultat] = useState<{ reference: string | null; photosRefusees: string[] } | null>(() => (demo() === 'envoye' ? { reference: 'DV-2026-0042', photosRefusees: [] } : null));

  const debut = useRef(Date.now());
  const etapes = useRef<(HTMLFieldSetElement | null)[]>([]);
  const titreEtape = useRef<HTMLHeadingElement>(null);
  const premierAffichage = useRef(true);

  // À chaque étape, le focus va au titre (lecteurs d'écran, clavier)
  useEffect(() => {
    if (premierAffichage.current) {
      premierAffichage.current = false;
      return;
    }
    titreEtape.current?.focus();
  }, [etape]);

  const changer = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDonnees((d) => ({ ...d, [name]: value }));
  };

  // Contrôle des champs de l'étape affichée (messages du navigateur)
  const etapeValide = (i: number) => {
    const champs = etapes.current[i]?.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      'input, select, textarea',
    );
    for (const champ of Array.from(champs ?? [])) {
      if (!champ.checkValidity()) {
        champ.reportValidity();
        champ.focus();
        return false;
      }
    }
    return true;
  };

  const suivant = () => {
    if (etapeValide(etape)) setEtape((e) => Math.min(e + 1, 2));
  };

  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (etape < 2) return suivant();
    if (!etapeValide(2)) return;
    setErreur('');
    setEnvoi(t('vendre.formulaire.envoi.preparation'));
    try {
      const r = await envoyerDemande(
        donnees,
        photos.map((p) => p.file),
        { piege, dureeMs: Date.now() - debut.current, consentement },
        (phase, fait, total) => {
          if (phase === 'compression') setEnvoi(t('vendre.formulaire.envoi.photos_preparation', { n: fait + 1, total }));
          else if (phase === 'envoi') setEnvoi(t('vendre.formulaire.envoi.photos_envoi', { n: fait + 1, total }));
          else setEnvoi(t('vendre.formulaire.envoi.finalisation'));
        },
      );
      setResultat(r);
      window.scrollTo({ top: document.getElementById('formulaire')?.offsetTop ?? 0, behavior: 'smooth' });
    } catch (err) {
      setErreur(err instanceof ErreurDemande ? err.message : 'Une erreur est survenue. Réessayez dans un instant.');
    } finally {
      setEnvoi(null);
    }
  };

  const anneeMax = new Date().getFullYear() + 1;
  const titresEtapes = Array.from({ length: NB_ETAPES_FORMULAIRE }, (_, i) => t(`vendre.formulaire.etape${i + 1}`));
  const nbRefusees = resultat?.photosRefusees.length ?? 0;

  return (
    <>
      <SEOHead meta={pageSeo['/vendre-ma-moto']} />

      <Section background="gray" className="!pt-8 !pb-8 md:!pt-12 md:!pb-12">
        <Container>
          <div className="max-w-3xl">
            <h1 className="filet-apres mb-4">{t('vendre.titre')}</h1>
            <p className="text-base md:text-lg text-gris mb-6 leading-relaxed">
              {t('vendre.intro')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="#formulaire" tabIndex={-1}>
                <Button size="lg" className="w-full sm:w-auto">{t('vendre.hero.bouton')}</Button>
              </a>
              <a href={lienTelephone(c.telephone)} tabIndex={-1}>
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  <Phone className="w-4 h-4" aria-hidden="true" />
                  {c.telephone}
                </Button>
              </a>
            </div>
            <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-or/50 bg-surface p-5 shadow-carte sm:flex-row sm:items-center md:p-6">
              <IconeOr icon={Eye} className="hidden h-10 w-10 flex-shrink-0 sm:block" />
              <div className="flex-1">
                <h2 className="text-lg md:text-xl font-semibold text-noir">{t('vendre.suivi.titre')}</h2>
                <p className="mt-1 text-sm text-gris leading-relaxed">
                  {t('vendre.suivi.texte')}
                </p>
              </div>
              <Link to="/suivre-ma-vente" tabIndex={-1} className="flex-shrink-0">
                <Button size="lg" className="w-full sm:w-auto">{t('vendre.suivi.bouton')}</Button>
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      <Section background="white" className="!py-10 md:!py-14">
        <Container>
          <h2 className="titre-section filet-apres mb-8">{t('vendre.etapes.titre')}</h2>
          <ol className="grid gap-4 md:gap-5 md:grid-cols-5">
            {ETAPES_PARCOURS.map((_, i) => (
              <li key={i} className="carte p-5 md:p-6 flex md:flex-col gap-4 md:gap-0">
                <div className="flex-shrink-0 pastille-etape w-11 h-11 text-base md:mb-4" aria-hidden="true">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-noir mb-1.5">{t(`vendre.etapes.${i + 1}.titre`)}</h3>
                  <p className="text-sm text-gris leading-relaxed">{t(`vendre.etapes.${i + 1}.texte`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section background="dark" className="!py-10 md:!py-14">
        <Container>
          <h2 className="titre-section filet-avant mb-8">{t('vendre.avantages.titre')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {AVANTAGES.map((icone, i) => (
              <div key={i} className="rounded-2xl border border-inverse/10 bg-inverse/[0.04] p-5 md:p-6">
                <IconeOr icon={icone} className="w-7 h-7 mb-3" />
                <h3 className="font-semibold text-inverse mb-1.5">{t(`vendre.avantages.${i + 1}.titre`)}</h3>
                <p className="text-sm text-inverse-74 leading-relaxed">{t(`vendre.avantages.${i + 1}.texte`)}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-or/40 bg-inverse/[0.04] p-5 md:p-6 flex gap-4 items-start">
            <IconeOr icon={BadgeEuro} className="w-7 h-7 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-inverse mb-1">{t('vendre.avantages.net.titre')}</h3>
              <p className="text-sm text-inverse-84 leading-relaxed">
                {t('vendre.avantages.net.texte')}
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <Section background="white" className="!py-10 md:!py-14">
        <Container size="md">
          <div id="formulaire" className="scroll-mt-24">
            {resultat ? (
              <div className="carte p-6 md:p-10 text-center" role="status">
                <CheckCircle2 className="w-14 h-14 text-green-700 mx-auto mb-4" aria-hidden="true" />
                <h2 className="text-[26px] md:text-[30px] mb-3">{t('vendre.confirmation.titre')}</h2>
                {resultat.reference && (
                  <p className="text-noir mb-2">
                    {t('vendre.confirmation.reference')}{' '}<strong className="tabular-nums">{resultat.reference}</strong>
                  </p>
                )}
                <p className="text-gris leading-relaxed max-w-xl mx-auto">
                  {t('vendre.confirmation.texte')}
                </p>
                {nbRefusees > 0 && (
                  <p className="mt-4 text-sm text-[#8A5A00] bg-[#FFF7E6] border border-[#F2D49B] rounded-xl px-4 py-3 max-w-xl mx-auto">
                    {nbRefusees === 1
                      ? t('vendre.confirmation.photo_refusee', { photos: resultat.photosRefusees.join(', ') })
                      : t('vendre.confirmation.photos_refusees', { n: nbRefusees, photos: resultat.photosRefusees.join(', ') })}
                  </p>
                )}
                <p className="mt-6">
                  <Link to="/vehicules" className="lien">{t('vendre.confirmation.lien')}</Link>
                </p>
              </div>
            ) : (
              <form data-zone="formulaires" onSubmit={envoyer} noValidate className="bg-fond border border-bordure rounded-2xl p-5 sm:p-8">
                <h2 className="text-[26px] md:text-[30px] filet-apres mb-2">{t('vendre.formulaire.titre')}</h2>
                <p className="text-sm text-gris mb-6">{t('vendre.formulaire.sous_titre')}</p>

                {/* Progression */}
                <ol className="grid grid-cols-3 gap-2 mb-8" aria-label="Étapes du formulaire">
                  {titresEtapes.map((titre, i) => (
                    <li key={i} aria-current={i === etape ? 'step' : undefined}>
                      <div className={`h-1.5 rounded-full ${i <= etape ? 'bg-bleu' : 'bg-champ'}`} />
                      <p className={`mt-2 text-xs sm:text-sm ${i === etape ? 'text-noir font-semibold' : 'text-gris'}`}>
                        <span className="sr-only">Étape {i + 1} sur 3 : </span>
                        <span aria-hidden="true">{i + 1}. </span>
                        {titre}
                      </p>
                    </li>
                  ))}
                </ol>

                <h3 ref={titreEtape} tabIndex={-1} className="text-lg font-semibold text-noir mb-5 outline-none">
                  {titresEtapes[etape]}
                </h3>

                {/* Champ piège pour les robots : invisible et ignoré par les humains */}
                <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
                  <label htmlFor="site_web">Ne pas remplir ce champ</label>
                  <input
                    id="site_web"
                    name="site_web"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={piege}
                    onChange={(e) => setPiege(e.target.value)}
                  />
                </div>

                <fieldset ref={(el) => (etapes.current[0] = el)} hidden={etape !== 0} className="space-y-5">
                  <legend className="sr-only">Vos coordonnées</legend>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <Input label={t('vendre.formulaire.prenom')} id="prénom" name="prenom" autoComplete="given-name" required maxLength={80} value={donnees.prenom} onChange={changer} />
                    <Input label={t('vendre.formulaire.nom')} id="nom" name="nom" autoComplete="family-name" required maxLength={80} value={donnees.nom} onChange={changer} />
                  </div>
                  <Input label={t('vendre.formulaire.email')} id="e-mail" name="email" type="email" autoComplete="email" required maxLength={254} value={donnees.email} onChange={changer} />
                  <Input
                    label={t('vendre.formulaire.telephone')}
                    id="téléphone"
                    name="telephone"
                    type="tel"
                    autoComplete="tel"
                    required
                    pattern="[+0-9 ().\-]{9,30}"
                    title="Un numéro de téléphone, par exemple 06 12 34 56 78"
                    value={donnees.telephone}
                    onChange={changer}
                  />
                </fieldset>

                <fieldset ref={(el) => (etapes.current[1] = el)} hidden={etape !== 1} className="space-y-5">
                  <legend className="sr-only">Votre moto</legend>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <Input label={t('vendre.formulaire.marque')} id="marque" name="marque" required maxLength={60} placeholder={t('vendre.formulaire.marque_exemple')} value={donnees.marque} onChange={changer} />
                    <Input label={t('vendre.formulaire.modele')} id="modèle" name="modele" required maxLength={80} placeholder={t('vendre.formulaire.modele_exemple')} value={donnees.modele} onChange={changer} />
                  </div>
                  <Input
                    label={t('vendre.formulaire.version')}
                    id="version"
                    name="version"
                    maxLength={80}
                    placeholder={t('vendre.formulaire.version_exemple')}
                    helperText={t('vendre.formulaire.version_aide')}
                    value={donnees.version}
                    onChange={changer}
                  />
                  <div className="grid sm:grid-cols-2 gap-5">
                    <Input label={t('vendre.formulaire.annee')} id="année" name="annee" type="number" inputMode="numeric" required min={1950} max={anneeMax} value={donnees.annee} onChange={changer} />
                    <Input label={t('vendre.formulaire.kilometrage')} id="kilométrage" name="kilometrage" type="number" inputMode="numeric" required min={0} max={1000000} placeholder={t('vendre.formulaire.kilometrage_exemple')} value={donnees.kilometrage} onChange={changer} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <Select label={t('vendre.formulaire.etat')} id="état-général" name="etat" required value={donnees.etat} onChange={changer}>
                      <option value="">{t('vendre.formulaire.etat_choisir')}</option>
                      <option value="excellent">{t('vendre.formulaire.etat_excellent')}</option>
                      <option value="tres_bon">{t('vendre.formulaire.etat_tres_bon')}</option>
                      <option value="bon">{t('vendre.formulaire.etat_bon')}</option>
                      <option value="correct">{t('vendre.formulaire.etat_correct')}</option>
                      <option value="a_reviser">{t('vendre.formulaire.etat_a_reviser')}</option>
                    </Select>
                    <Select label={t('vendre.formulaire.entretien')} id="entretien" name="entretien" value={donnees.entretien} onChange={changer}>
                      <option value="">{t('vendre.formulaire.entretien_choisir')}</option>
                      <option value="complet">{t('vendre.formulaire.entretien_complet')}</option>
                      <option value="partiel">{t('vendre.formulaire.entretien_partiel')}</option>
                      <option value="inconnu">{t('vendre.formulaire.entretien_inconnu')}</option>
                    </Select>
                  </div>
                  <Input
                    label={t('vendre.formulaire.immatriculation')}
                    id="immatriculation"
                    name="immatriculation"
                    maxLength={20}
                    placeholder={t('vendre.formulaire.immatriculation_exemple')}
                    helperText={t('vendre.formulaire.immatriculation_aide')}
                    value={donnees.immatriculation}
                    onChange={changer}
                  />
                </fieldset>

                <fieldset ref={(el) => (etapes.current[2] = el)} hidden={etape !== 2} className="space-y-5">
                  <legend className="sr-only">Photos et prix souhaité</legend>
                  <FileUpload
                    elements="photos"
                    label={t('vendre.formulaire.photos', { max: MAX_PHOTOS })}
                    maxFiles={MAX_PHOTOS}
                    maxSizeMB={10}
                    accept="image/*"
                    value={photos}
                    onChange={setPhotos}
                  />
                  <p className="text-xs text-gris -mt-2">
                    {t('vendre.formulaire.photos_conseil')}
                  </p>
                  <Input
                    label={t('vendre.formulaire.prix')}
                    id="prix-souhaite"
                    name="prix_souhaite"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={1000000}
                    helperText={t('vendre.formulaire.prix_aide')}
                    value={donnees.prix_souhaite}
                    onChange={changer}
                  />
                  <Textarea
                    label={t('vendre.formulaire.commentaire')}
                    id="commentaire"
                    name="commentaire"
                    rows={4}
                    maxLength={3000}
                    placeholder={t('vendre.formulaire.commentaire_exemple')}
                    value={donnees.commentaire}
                    onChange={changer}
                  />
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="consentement"
                      required
                      checked={consentement}
                      onChange={(e) => setConsentement(e.target.checked)}
                      className="mt-1 w-4 h-4 flex-shrink-0 rounded accent-bleu"
                    />
                    <label htmlFor="consentement" className="text-sm text-gris leading-relaxed">
                      {t('vendre.formulaire.consentement.avant')}{' '}
                      <Link to="/politique-confidentialite" className="text-lien underline underline-offset-2 hover:decoration-2">
                        {t('vendre.formulaire.consentement.lien')}
                      </Link>
                      {t('vendre.formulaire.consentement.apres')}{' '}<span className="text-lien" aria-hidden="true">*</span>
                    </label>
                  </div>
                </fieldset>

                {erreur && (
                  <div role="alert" className="mt-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm">
                    {erreur}
                  </div>
                )}

                <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3 sm:justify-between">
                  {etape > 0 ? (
                    <Button type="button" variant="outline" onClick={() => setEtape((e) => e - 1)} disabled={!!envoi}>
                      {t('vendre.formulaire.precedent')}
                    </Button>
                  ) : (
                    <span className="hidden sm:block" />
                  )}
                  <Button type="submit" size="lg" disabled={!!envoi}>
                    {envoi ?? (etape < 2 ? t('vendre.formulaire.suivant') : t('vendre.formulaire.envoyer'))}
                  </Button>
                </div>
                {envoi && (
                  <p className="sr-only" role="status" aria-live="polite">
                    {envoi}
                  </p>
                )}
              </form>
            )}
          </div>
        </Container>
      </Section>

      <Section background="gray" className="!py-10 md:!py-14">
        <Container size="md">
          <h2 className="titre-section filet-apres mb-6">{t('vendre.faq.titre')}</h2>
          <div className="space-y-3">
            {Array.from({ length: NB_QUESTIONS }, (_, i) => (
              <details key={i} className="group carte px-5 py-4">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-semibold text-noir">
                  {t(`vendre.faq.${i + 1}.question`)}
                  <span className="text-or-texte text-xl leading-none transition-transform duration-180 group-open:rotate-45" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-gris leading-relaxed">{t(`vendre.faq.${i + 1}.reponse`)}</p>
              </details>
            ))}
          </div>
          <p className="mt-8 text-gris">
            {t('vendre.faq.contact.avant')}{' '}
            <a href={lienTelephone(c.telephone)} className="lien whitespace-nowrap">
              {c.telephone}
            </a>{' '}
            {t('vendre.faq.contact.apres')}
          </p>
          <p className="mt-3 text-sm text-gris">
            {t('vendre.faq.reprise.avant')}{' '}
            <Link to="/reprises" className="lien">{t('vendre.faq.reprise.lien')}</Link>
            {t('vendre.faq.reprise.apres')}
          </p>
        </Container>
      </Section>
    </>
  );
}
