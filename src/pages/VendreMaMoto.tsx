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

const ETAPES_PARCOURS = [
  {
    icon: ClipboardCheck,
    titre: 'Votre demande',
    texte: 'Décrivez votre moto en 2 minutes, avec quelques photos si vous le pouvez.',
  },
  {
    icon: Phone,
    titre: 'Échange et estimation',
    texte: 'Un conseiller vous rappelle sous 48 h ouvrées et vous propose un prix de vente conseillé.',
  },
  {
    icon: FileSignature,
    titre: 'Le dépôt et le mandat',
    texte: 'Au showroom, nous faisons ensemble l’état des lieux. Vous signez le mandat sur votre téléphone : prix et net vendeur y sont écrits.',
  },
  {
    icon: Store,
    titre: 'La mise en vente',
    texte: 'Annonce, appels, visites : nous nous occupons de tout. Aucun essai sans votre accord. Vous suivez chaque étape en ligne.',
  },
  {
    icon: Handshake,
    titre: 'La vente et le paiement',
    texte: 'Nous gérons l’acheteur et la carte grise. Vous recevez votre net vendeur par virement sous 48 h.',
  },
];

const AVANTAGES = [
  {
    icon: BadgeEuro,
    titre: 'Un prix juste',
    texte: 'Un prix de vente conseillé par des professionnels du deux-roues, qui connaissent le marché.',
  },
  {
    icon: CalendarCheck,
    titre: 'Zéro contrainte',
    texte: 'Annonce sur svmride.com, appels, visites, démarches : nous nous en chargeons, votre moto reste au showroom.',
  },
  {
    icon: ShieldCheck,
    titre: 'Aucun risque après la vente',
    texte: 'SVM Ride achète votre moto au moment de la vente : la garantie et le service après-vente de l’acheteur sont à notre charge.',
  },
  {
    icon: Eye,
    titre: 'Une vente transparente',
    texte: 'Visites, offres, réservation, paiement : suivez chaque étape dans votre espace « Suivre ma vente ».',
  },
];

const FAQ = [
  {
    q: 'Combien coûte le dépôt-vente ?',
    r: 'L’estimation est gratuite. Notre rémunération est la différence entre le prix de vente et votre net vendeur : ces deux montants sont fixés ensemble et écrits dans le mandat avant toute signature. Aucun autre frais, sauf un entretien que vous auriez accepté sur devis.',
  },
  {
    q: 'Combien de temps dure le mandat ?',
    r: 'Deux mois, en exclusivité : pendant cette période, la moto n’est pas proposée ailleurs. Il peut être prolongé par un avenant que vous signez au showroom. Les conditions d’une reprise anticipée de la moto sont précisées dans le mandat.',
  },
  {
    q: 'Quand et comment suis-je payé ?',
    r: 'SVM Ride encaisse le paiement de l’acheteur et vous verse votre net vendeur par virement sous 48 h. Si un acheteur renonce après avoir versé un acompte, cela n’a aucune conséquence pour vous.',
  },
  {
    q: 'Où est ma moto pendant la vente ?',
    r: 'Au showroom de Chaville, couverte par l’assurance du garage. Aucun essai n’est réalisé sans votre accord, et le prix n’est jamais modifié sans votre accord écrit.',
  },
  {
    q: 'Vais-je recevoir une estimation automatique ?',
    r: 'Non. Chaque moto est étudiée par un conseiller, qui vous rappelle sous 48 h ouvrées pour en parler avec vous et vous proposer un prix de vente conseillé.',
  },
  {
    q: 'Quels documents prévoir ?',
    r: 'Pour le dépôt : la carte grise, une pièce d’identité, un certificat de non-gage de moins de 15 jours, le double des clés, et le carnet d’entretien et les factures si vous les avez. Votre RIB vous sera demandé au moment de la vente. Rien n’est demandé pour l’estimation.',
  },
  {
    q: 'Que deviennent mes informations ?',
    r: 'Elles servent uniquement à traiter votre demande. Sans dépôt, elles sont conservées au plus 3 ans et vos photos 12 mois au plus (7 jours seulement si la demande est classée sans suite). Si vous nous confiez votre moto, le dossier est conservé 5 ans après la fin du mandat (obligations légales). Vous pouvez demander à consulter ou corriger vos données à tout moment.',
  },
];

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

const TITRES_ETAPES = ['Vous', 'Votre moto', 'Photos et prix'];

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
  const [resultat, setResultat] = useState<{ reference: string | null; photosRefusees: string[] } | null>(null);

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
    setEnvoi('Préparation…');
    try {
      const r = await envoyerDemande(
        donnees,
        photos.map((p) => p.file),
        { piege, dureeMs: Date.now() - debut.current, consentement },
        (phase, fait, total) => {
          if (phase === 'compression') setEnvoi(`Préparation des photos (${fait + 1}/${total})…`);
          else if (phase === 'envoi') setEnvoi(`Envoi des photos (${fait + 1}/${total})…`);
          else setEnvoi('Finalisation…');
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
                <Button size="lg" className="w-full sm:w-auto">Demander une estimation</Button>
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
                <h2 className="text-lg md:text-xl font-semibold text-noir">Votre moto est déjà chez nous ?</h2>
                <p className="mt-1 text-sm text-gris leading-relaxed">
                  Suivez l'avancement de la vente et retrouvez votre contrat et vos documents : il suffit de votre adresse e-mail.
                </p>
              </div>
              <Link to="/suivre-ma-vente" tabIndex={-1} className="flex-shrink-0">
                <Button size="lg" className="w-full sm:w-auto">Suivez votre vente en ligne</Button>
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      <Section background="white" className="!py-10 md:!py-14">
        <Container>
          <h2 className="titre-section filet-apres mb-8">Comment ça marche ?</h2>
          <ol className="grid gap-4 md:gap-5 md:grid-cols-5">
            {ETAPES_PARCOURS.map((e, i) => (
              <li key={e.titre} className="carte p-5 md:p-6 flex md:flex-col gap-4 md:gap-0">
                <div className="flex-shrink-0 pastille-etape w-11 h-11 text-base md:mb-4" aria-hidden="true">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-noir mb-1.5">{e.titre}</h3>
                  <p className="text-sm text-gris leading-relaxed">{e.texte}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section background="dark" className="!py-10 md:!py-14">
        <Container>
          <h2 className="titre-section filet-avant mb-8">Pourquoi confier votre moto à SVM Ride ?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {AVANTAGES.map((a) => (
              <div key={a.titre} className="rounded-2xl border border-inverse/10 bg-inverse/[0.04] p-5 md:p-6">
                <IconeOr icon={a.icon} className="w-7 h-7 mb-3" />
                <h3 className="font-semibold text-inverse mb-1.5">{a.titre}</h3>
                <p className="text-sm text-inverse-74 leading-relaxed">{a.texte}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-or/40 bg-inverse/[0.04] p-5 md:p-6 flex gap-4 items-start">
            <IconeOr icon={BadgeEuro} className="w-7 h-7 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-inverse mb-1">Un net vendeur écrit noir sur blanc</h3>
              <p className="text-sm text-inverse-84 leading-relaxed">
                Vous savez dès la signature ce que vous recevrez : le net vendeur est écrit dans le mandat, et vous êtes payé
                par virement sous 48 h après la vente. Pas de frais cachés.
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
                <h2 className="text-[26px] md:text-[30px] mb-3">Demande envoyée, merci !</h2>
                {resultat.reference && (
                  <p className="text-noir mb-2">
                    Votre référence : <strong className="tabular-nums">{resultat.reference}</strong>
                  </p>
                )}
                <p className="text-gris leading-relaxed max-w-xl mx-auto">
                  Vous allez recevoir un e-mail de confirmation. Un conseiller SVM Ride étudie votre moto et vous
                  recontacte sous 48 h ouvrées.
                </p>
                {resultat.photosRefusees.length > 0 && (
                  <p className="mt-4 text-sm text-[#8A5A00] bg-[#FFF7E6] border border-[#F2D49B] rounded-xl px-4 py-3 max-w-xl mx-auto">
                    {resultat.photosRefusees.length === 1 ? 'Une photo n’a' : `${resultat.photosRefusees.length} photos n’ont`} pas
                    pu être envoyée{resultat.photosRefusees.length > 1 ? 's' : ''} ({resultat.photosRefusees.join(', ')}).
                    Vous pourrez nous l{resultat.photosRefusees.length > 1 ? 'es' : 'a'} transmettre en répondant à
                    l’e-mail de confirmation.
                  </p>
                )}
                <p className="mt-6">
                  <Link to="/vehicules" className="lien">Voir nos motos en vente →</Link>
                </p>
              </div>
            ) : (
              <form data-zone="formulaires" onSubmit={envoyer} noValidate className="bg-fond border border-bordure rounded-2xl p-5 sm:p-8">
                <h2 className="text-[26px] md:text-[30px] filet-apres mb-2">Demander une estimation</h2>
                <p className="text-sm text-gris mb-6">Gratuit et sans engagement. Réponse sous 48 h ouvrées.</p>

                {/* Progression */}
                <ol className="grid grid-cols-3 gap-2 mb-8" aria-label="Étapes du formulaire">
                  {TITRES_ETAPES.map((t, i) => (
                    <li key={t} aria-current={i === etape ? 'step' : undefined}>
                      <div className={`h-1.5 rounded-full ${i <= etape ? 'bg-bleu' : 'bg-champ'}`} />
                      <p className={`mt-2 text-xs sm:text-sm ${i === etape ? 'text-noir font-semibold' : 'text-gris'}`}>
                        <span className="sr-only">Étape {i + 1} sur 3 : </span>
                        <span aria-hidden="true">{i + 1}. </span>
                        {t}
                      </p>
                    </li>
                  ))}
                </ol>

                <h3 ref={titreEtape} tabIndex={-1} className="text-lg font-semibold text-noir mb-5 outline-none">
                  {TITRES_ETAPES[etape]}
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
                    <Input label="Prénom" name="prenom" autoComplete="given-name" required maxLength={80} value={donnees.prenom} onChange={changer} />
                    <Input label="Nom" name="nom" autoComplete="family-name" required maxLength={80} value={donnees.nom} onChange={changer} />
                  </div>
                  <Input label="E-mail" name="email" type="email" autoComplete="email" required maxLength={254} value={donnees.email} onChange={changer} />
                  <Input
                    label="Téléphone"
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
                    <Input label="Marque" name="marque" required maxLength={60} placeholder="Ex. Yamaha" value={donnees.marque} onChange={changer} />
                    <Input label="Modèle" name="modele" required maxLength={80} placeholder="Ex. MT-07" value={donnees.modele} onChange={changer} />
                  </div>
                  <Input
                    label="Version"
                    name="version"
                    maxLength={80}
                    placeholder="Ex. A2, édition limitée…"
                    helperText="Facultatif"
                    value={donnees.version}
                    onChange={changer}
                  />
                  <div className="grid sm:grid-cols-2 gap-5">
                    <Input label="Année" name="annee" type="number" inputMode="numeric" required min={1950} max={anneeMax} value={donnees.annee} onChange={changer} />
                    <Input label="Kilométrage" name="kilometrage" type="number" inputMode="numeric" required min={0} max={1000000} placeholder="En km" value={donnees.kilometrage} onChange={changer} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <Select label="État général" name="etat" required value={donnees.etat} onChange={changer}>
                      <option value="">Sélectionnez…</option>
                      <option value="excellent">Excellent</option>
                      <option value="tres_bon">Très bon</option>
                      <option value="bon">Bon</option>
                      <option value="correct">Correct</option>
                      <option value="a_reviser">À réviser</option>
                    </Select>
                    <Select label="Entretien" name="entretien" value={donnees.entretien} onChange={changer}>
                      <option value="">Facultatif</option>
                      <option value="complet">Carnet à jour (factures)</option>
                      <option value="partiel">Entretien partiel</option>
                      <option value="inconnu">Je ne sais pas</option>
                    </Select>
                  </div>
                  <Input
                    label="Immatriculation"
                    name="immatriculation"
                    maxLength={20}
                    placeholder="Ex. AB-123-CD"
                    helperText="Facultatif à ce stade"
                    value={donnees.immatriculation}
                    onChange={changer}
                  />
                </fieldset>

                <fieldset ref={(el) => (etapes.current[2] = el)} hidden={etape !== 2} className="space-y-5">
                  <legend className="sr-only">Photos et prix souhaité</legend>
                  <FileUpload
                    elements="photos"
                    label="Photos de la moto (facultatif, 10 au maximum)"
                    maxFiles={10}
                    maxSizeMB={10}
                    accept="image/*"
                    value={photos}
                    onChange={setPhotos}
                  />
                  <p className="text-xs text-gris -mt-2">
                    Conseil : vue de face, de chaque côté, compteur et éventuels défauts. Les photos sont allégées
                    automatiquement avant l’envoi.
                  </p>
                  <Input
                    label="Prix souhaité (€)"
                    id="prix-souhaite"
                    name="prix_souhaite"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={1000000}
                    helperText="Facultatif : laissez vide si vous souhaitez d’abord notre avis"
                    value={donnees.prix_souhaite}
                    onChange={changer}
                  />
                  <Textarea
                    label="Commentaire"
                    name="commentaire"
                    rows={4}
                    maxLength={3000}
                    placeholder="Options, accessoires, entretien récent, défauts à signaler…"
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
                      J’accepte que SVM Ride utilise ces informations pour étudier ma demande et me recontacter. Elles
                      sont conservées au plus 3 ans (12 mois pour les photos) et je peux en demander la suppression à
                      tout moment. Voir la{' '}
                      <Link to="/politique-confidentialite" className="text-lien underline underline-offset-2 hover:decoration-2">
                        politique de confidentialité
                      </Link>
                      . <span className="text-lien" aria-hidden="true">*</span>
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
                      Précédent
                    </Button>
                  ) : (
                    <span className="hidden sm:block" />
                  )}
                  <Button type="submit" size="lg" disabled={!!envoi}>
                    {envoi ?? (etape < 2 ? 'Suivant' : 'Envoyer ma demande')}
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
          <h2 className="titre-section filet-apres mb-6">Questions fréquentes</h2>
          <div className="space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="group carte px-5 py-4">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-semibold text-noir">
                  {f.q}
                  <span className="text-or-texte text-xl leading-none transition-transform duration-180 group-open:rotate-45" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-gris leading-relaxed">{f.r}</p>
              </details>
            ))}
          </div>
          <p className="mt-8 text-gris">
            Une autre question ? Appelez-nous au{' '}
            <a href={lienTelephone(c.telephone)} className="lien whitespace-nowrap">
              {c.telephone}
            </a>{' '}
            ou passez au showroom de Chaville, sur rendez-vous.
          </p>
          <p className="mt-3 text-sm text-gris">
            Vous préférez vendre tout de suite ?{' '}
            <Link to="/reprises" className="lien">Demandez une reprise immédiate</Link>.
          </p>
        </Container>
      </Section>
    </>
  );
}
