/**
 * Admin — Infos du site : coordonnées affichées partout (en-tête de contact,
 * pied de page, page Contact, pages légales, Dépôt-vente…), envoyées à Google
 * (fiche concession) et utilisées dans les e-mails automatiques.
 *
 * Contact (téléphone, e-mails, Instagram), showroom (adresse, précision) et
 * horaires jour par jour. Chaque enregistrement est confirmé (liste des
 * changements) et gardé dans l'historique, d'où l'on peut revenir en arrière.
 * Réglage « coordonnees » de la table site_reglages (format : src/config/coordonnees.ts).
 *
 * Bloc Société (mentions légales et contrats) : réglage « societe »
 * (src/config/societe.ts). Chaque nouveau contrat de dépôt-vente en garde une copie.
 *
 * Bloc Identité du site : nom du site et phrase d'accroche (textes « site.nom »
 * et « site.accroche » du réglage « textes », aussi modifiables dans Textes du
 * site), logo et icône (réglage « identite »), image de la page d'accueil
 * (réglage « fond_accueil »).
 *
 * Bloc Tampon et documents : tampon du garage et logo des contrats (réglage
 * « documents », lu par les fonctions qui produisent les contrats).
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Building2, Clock, FileSignature, ExternalLink, Fingerprint, History, Mail, MapPin, Phone, Plus, RotateCcw, X } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import { appliquerCoordonnees } from '../../lib/coordonnees';
import { appliquerSociete } from '../../lib/societe';
import { BlocIcone } from '../../components/admin/BlocIcone';
import { BlocFondAccueil } from '../../components/admin/BlocFondAccueil';
import { BlocDocuments } from '../../components/admin/BlocDocuments';
import { appliquerTextes } from '../../lib/textes';
import { appliquerFondAccueil } from '../../lib/medias';
import { CLE_TEXTES, normaliserTextes, TEXTES, texte, type Textes } from '../../config/textes';
import { CLE_DOCUMENTS, CLE_FOND_ACCUEIL, normaliserDocuments, normaliserFondAccueil, type Documents, type FondAccueil } from '../../config/medias';
import { enregistrerIdentite } from '../../lib/identite';
import { CLE_IDENTITE, IDENTITE_DEFAUT, normaliserIdentite, type Identite } from '../../config/identite';
import {
  chiffresSiret, CLE_SOCIETE, formaterSiret, normaliserSociete, siren, siretPlausible, SOCIETE_DEFAUT, texteMediateur, type Societe,
} from '../../config/societe';
import {
  adresseComplete, chiffresTelephone, CLE_COORDONNEES, COORDONNEES_DEFAUT, EMAIL, formaterTelephone, HEURE, JOURS,
  lienMaps, lignesHoraires, normaliserCoordonnees, pseudoInstagram, type Coordonnees, type Jour, type ModeJour,
} from '../../config/coordonnees';

interface Version {
  id: number;
  cle: string;
  ancienne_valeur: unknown;
  nouvelle_valeur: unknown;
  par: string | null;
  fait_le: string;
}

type Erreurs = Partial<Record<string, string>>;

/** Libellés des champs, pour la liste des changements et l'historique */
function changements(a: Coordonnees, b: Coordonnees): { champ: string; avant: string; apres: string }[] {
  const champs: [string, (c: Coordonnees) => string][] = [
    ['Téléphone', (c) => c.telephone],
    ['E-mail affiché', (c) => c.email],
    ['E-mail qui reçoit les demandes', (c) => c.email_reception],
    ['Instagram', (c) => (c.instagram ? `@${c.instagram}` : '(aucun)')],
    ['Nom du showroom', (c) => c.showroom.nom],
    ['Adresse', (c) => adresseComplete(c)],
    ["Précision sous l'adresse", (c) => c.showroom.note || '(aucune)'],
    ['Horaires', (c) => lignesHoraires(c.horaires).join(' · ')],
    ['Précision sous les horaires', (c) => c.horaires_note || '(aucune)'],
  ];
  return champs.map(([champ, f]) => ({ champ, avant: f(a), apres: f(b) })).filter((x) => x.avant !== x.apres);
}

/** Changement du logo et de l'icône (historique) */
const decrireIdentite = (i: Identite) => (i.icone ? `Icône personnalisée (${i.icone.version.slice(6, 8)}/${i.icone.version.slice(4, 6)}/${i.icone.version.slice(0, 4)})` : "Logo d'origine");
function changementsIdentite(a: Identite, b: Identite) {
  const avant = decrireIdentite(a), apres = decrireIdentite(b);
  return avant === apres && a.icone?.version === b.icone?.version ? [] : [{ champ: 'Logo et icône', avant, apres }];
}

/** Nom et accroche du site (textes) */
interface NomAccroche { nom: string; accroche: string }
const lireNomAccroche = (t: Textes): NomAccroche => ({ nom: texte(t, 'site.nom'), accroche: texte(t, 'site.accroche') });
function changementsNom(a: NomAccroche, b: NomAccroche) {
  return ([['Nom du site', 'nom'], ["Phrase d'accroche", 'accroche']] as const)
    .map(([champ, k]) => ({ champ, avant: a[k], apres: b[k].trim() || TEXTES[k === 'nom' ? 'site.nom' : 'site.accroche'].defaut }))
    .filter((x) => x.avant !== x.apres);
}

/** Image d'accueil (historique) */
const decrireFond = (f: FondAccueil | null) => (f ? `Image personnalisée${/^\d{8}/.test(f.version) ? ` (${f.version.slice(6, 8)}/${f.version.slice(4, 6)}/${f.version.slice(0, 4)})` : ''}` : "Image d'origine");
function changementsFond(a: FondAccueil | null, b: FondAccueil | null) {
  return a?.version === b?.version && !!a === !!b ? [] : [{ champ: "Image d'accueil", avant: decrireFond(a), apres: decrireFond(b) }];
}

/** Tampon et logo des documents (historique) */
const decrireImage = (u: string | null, origine: string) => (u ? `personnalisé${/\/documents\/(\d{8})/.test(u) ? ` (${u.replace(/.*\/documents\/(\d{4})(\d{2})(\d{2}).*/, '$3/$2/$1')})` : ''}` : origine);
function changementsDocuments(a: Documents, b: Documents) {
  return [
    ...(a.tampon !== b.tampon ? [{ champ: 'Tampon', avant: decrireImage(a.tampon, "tampon d'origine"), apres: decrireImage(b.tampon, "tampon d'origine") }] : []),
    ...(a.logo !== b.logo ? [{ champ: 'Logo des documents', avant: decrireImage(a.logo, "logo d'origine"), apres: decrireImage(b.logo, "logo d'origine") }] : []),
  ];
}

const LIBELLES_CLE: Record<string, string> = {
  [CLE_DOCUMENTS]: 'Tampon et documents', [CLE_SOCIETE]: 'Société', [CLE_IDENTITE]: 'Logo et icône', [CLE_FOND_ACCUEIL]: "Image d'accueil", [CLE_COORDONNEES]: 'Coordonnées',
};

/** Changements du bloc Société */
function changementsSociete(a: Societe, b: Societe): { champ: string; avant: string; apres: string }[] {
  const vide = (v: string) => v || '(aucun)';
  const champs: [string, (s: Societe) => string][] = [
    ['Raison sociale', (s) => s.raison_sociale],
    ['Forme juridique', (s) => s.forme],
    ['Capital social', (s) => vide(s.capital)],
    ['SIRET', (s) => s.siret],
    ['RCS', (s) => s.rcs],
    ['N° de TVA', (s) => vide(s.tva)],
    ['Siège social', (s) => s.siege],
    ['Directeur de la publication', (s) => s.directeur_publication],
    ['Assureur', (s) => s.assureur],
    ['Médiateur de la consommation', (s) => vide(texteMediateur(s))],
  ];
  return champs.map(([champ, f]) => ({ champ, avant: f(a), apres: f(b) })).filter((x) => x.avant !== x.apres);
}

function verifierSociete(s: Societe): Erreurs {
  const e: Erreurs = {};
  if (!s.raison_sociale.trim()) e.s_raison = 'Obligatoire.';
  if (!s.forme.trim()) e.s_forme = 'Obligatoire.';
  if (!chiffresSiret(s.siret)) e.s_siret = '14 chiffres.';
  if (!s.rcs.trim()) e.s_rcs = 'Obligatoire (ex. RCS Nanterre).';
  if (!s.siege.trim()) e.s_siege = 'Obligatoire.';
  if (!s.directeur_publication.trim()) e.s_directeur = 'Obligatoire.';
  if (!s.assureur.trim()) e.s_assureur = 'Obligatoire (cité dans les contrats).';
  if ((s.mediateur_site.trim() || s.mediateur_adresse.trim()) && !s.mediateur_nom.trim()) e.s_mediateur = 'Indiquez le nom du médiateur.';
  return e;
}

function verifier(c: Coordonnees): Erreurs {
  const e: Erreurs = {};
  if (!chiffresTelephone(c.telephone)) e.telephone = 'Numéro français à 10 chiffres, ex. 01 84 19 01 74.';
  if (!EMAIL.test(c.email.trim())) e.email = 'Adresse e-mail non valable.';
  if (!EMAIL.test(c.email_reception.trim())) e.email_reception = 'Adresse e-mail non valable.';
  if (c.instagram.trim() && !pseudoInstagram(c.instagram)) e.instagram = 'Pseudo Instagram non valable (lettres, chiffres, point et tiret bas).';
  if (!c.showroom.nom.trim()) e.nom = 'Obligatoire.';
  if (!c.showroom.adresse.trim()) e.adresse = 'Obligatoire.';
  if (!/^\d{5}$/.test(c.showroom.code_postal.trim())) e.code_postal = '5 chiffres.';
  if (!c.showroom.ville.trim()) e.ville = 'Obligatoire.';
  c.horaires.forEach((j, i) => {
    if (j.mode !== 'ouvert') return;
    if (!j.plages.length) e[`jour${i}`] = 'Indiquez au moins une plage horaire.';
    j.plages.forEach((p) => {
      if (!HEURE.test(p.de) || !HEURE.test(p.a)) e[`jour${i}`] = 'Heures au format 09:00.';
      else if (p.de >= p.a) e[`jour${i}`] = "L'heure de fin doit être après l'heure de début.";
    });
    if (j.plages.length === 2 && HEURE.test(j.plages[0].a) && HEURE.test(j.plages[1].de) && j.plages[1].de <= j.plages[0].a) {
      e[`jour${i}`] = "La deuxième plage doit commencer après la fin de la première.";
    }
  });
  return e;
}

/** Valeurs telles qu'elles seront enregistrées (mises en forme) */
function nettoyer(c: Coordonnees): Coordonnees {
  return normaliserCoordonnees({
    ...c,
    telephone: formaterTelephone(c.telephone),
    instagram: pseudoInstagram(c.instagram),
  });
}

const classeChamp = (err?: string) =>
  `w-full px-3.5 py-2.5 bg-white text-noir border-[1.5px] rounded-xl focus:outline-none focus:border-bleu focus:ring-4 focus:ring-bleu/15 ${err ? 'border-red-600' : 'border-champ'}`;

function Champ({
  id, label, valeur, onChange, err, aide, type = 'text', placeholder, onBlur, autoComplete = 'off', className = '',
}: {
  id: string; label: string; valeur: string; onChange: (v: string) => void; err?: string; aide?: string; type?: string;
  placeholder?: string; onBlur?: () => void; autoComplete?: string; className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-noir">{label}</label>
      <input
        id={id}
        type={type}
        value={valeur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={!!err}
        aria-describedby={err || aide ? `${id}-aide` : undefined}
        className={classeChamp(err)}
      />
      {(err || aide) && (
        <p id={`${id}-aide`} className={`mt-1 text-xs ${err ? 'text-red-700' : 'text-[#5E5E5E]'}`}>{err ?? aide}</p>
      )}
    </div>
  );
}

const RUBRIQUES = [
  ['identite', 'Identité du site'], ['contact', 'Contact'], ['showroom', 'Showroom'], ['horaires', 'Horaires'], ['societe', 'Société'], ['documents', 'Tampon et documents'], ['historique', 'Historique'],
] as const;

function Bloc({ id, icone, titre, sousTitre, children }: { id: string; icone: React.ReactNode; titre: string; sousTitre: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-32 rounded-xl border-2 border-[#D1D5DB] bg-white p-4 md:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="mt-0.5 text-[#111111]" aria-hidden="true">{icone}</span>
        <div>
          <h2 className="text-lg font-bold text-[#111111]">{titre}</h2>
          <p className="text-sm text-[#666666]">{sousTitre}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

const MODES: { v: ModeJour; l: string }[] = [
  { v: 'ouvert', l: 'Ouvert' },
  { v: 'rdv', l: 'Sur rendez-vous' },
  { v: 'ferme', l: 'Fermé' },
];

export function InfosSite() {
  const [enregistrees, setEnregistrees] = useState<Coordonnees | null>(null);
  const [c, setC] = useState<Coordonnees>(COORDONNEES_DEFAUT);
  const [societeEnregistree, setSocieteEnregistree] = useState<Societe | null>(null);
  const [soc, setSoc] = useState<Societe>(SOCIETE_DEFAUT);
  const [identite, setIdentite] = useState<Identite>(IDENTITE_DEFAUT);
  const [nomEnregistre, setNomEnregistre] = useState<NomAccroche | null>(null);
  const [na, setNa] = useState<NomAccroche>({ nom: '', accroche: '' });
  const [fond, setFond] = useState<FondAccueil | null>(null);
  const [documents, setDocuments] = useState<Documents>(normaliserDocuments(null));
  const [historique, setHistorique] = useState<Version[]>([]);
  const [erreur, setErreur] = useState('');
  const [message, setMessage] = useState('');
  const [tentative, setTentative] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    coord: Coordonnees; soc: Societe; titre: string; nom?: NomAccroche; identite?: Identite; fond?: { valeur: FondAccueil | null }; documents?: Documents;
  } | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const charger = async () => {
    const [{ data, error }, { data: ds }, { data: di }, { data: dt }, { data: df }, { data: dd }, { data: h }] = await Promise.all([
      supabase.from('site_reglages').select('valeur').eq('cle', CLE_COORDONNEES).maybeSingle(),
      supabase.from('site_reglages').select('valeur').eq('cle', CLE_SOCIETE).maybeSingle(),
      supabase.from('site_reglages').select('valeur').eq('cle', CLE_IDENTITE).maybeSingle(),
      supabase.from('site_reglages').select('valeur').eq('cle', CLE_TEXTES).maybeSingle(),
      supabase.from('site_reglages').select('valeur').eq('cle', CLE_FOND_ACCUEIL).maybeSingle(),
      supabase.from('site_reglages').select('valeur').eq('cle', CLE_DOCUMENTS).maybeSingle(),
      supabase.from('site_reglages_historique').select('id, cle, ancienne_valeur, nouvelle_valeur, par, fait_le')
        .in('cle', [CLE_COORDONNEES, CLE_SOCIETE, CLE_IDENTITE, CLE_FOND_ACCUEIL, CLE_DOCUMENTS]).order('fait_le', { ascending: false }).limit(15),
    ]);
    if (error) {
      setErreur("Impossible de charger les informations. Vérifiez que vous êtes connecté avec un compte administrateur.");
      return;
    }
    const v = normaliserCoordonnees(data?.valeur);
    const vs = normaliserSociete(ds?.valeur);
    setEnregistrees(v);
    setC(v);
    setSocieteEnregistree(vs);
    setSoc(vs);
    setIdentite(normaliserIdentite(di?.valeur));
    const n = lireNomAccroche(normaliserTextes(dt?.valeur));
    setNomEnregistre(n);
    setNa(n);
    setFond(normaliserFondAccueil(df?.valeur));
    setDocuments(normaliserDocuments(dd?.valeur));
    setHistorique((h as Version[]) ?? []);
  };

  useEffect(() => {
    charger();
  }, []);

  const erreurs = useMemo(() => {
    const e: Erreurs = { ...verifier(c), ...verifierSociete(soc) };
    if (!na.nom.trim()) e.nom_site = 'Obligatoire.';
    if (!na.accroche.trim()) e.accroche = 'Obligatoire.';
    return e;
  }, [c, soc, na]);
  const diffNom = useMemo(() => (nomEnregistre ? changementsNom(nomEnregistre, na) : []), [nomEnregistre, na]);
  const propre = useMemo(() => nettoyer(c), [c]);
  const propreSoc = useMemo(() => normaliserSociete({ ...soc, siret: formaterSiret(soc.siret) }), [soc]);
  const diff = useMemo(
    () => (enregistrees && societeEnregistree
      ? [...diffNom, ...changements(enregistrees, propre), ...changementsSociete(societeEnregistree, propreSoc)]
      : []),
    [enregistrees, propre, societeEnregistree, propreSoc, diffNom],
  );
  const modifie = !!enregistrees && (JSON.stringify(c) !== JSON.stringify(enregistrees) || JSON.stringify(soc) !== JSON.stringify(societeEnregistree)
    || JSON.stringify(na) !== JSON.stringify(nomEnregistre));
  const montrer = (cle: string) => (tentative ? erreurs[cle] : undefined);

  const maj = (p: Partial<Coordonnees>) => setC((x) => ({ ...x, ...p }));
  const majSoc = (p: Partial<Societe>) => setSoc((x) => ({ ...x, ...p }));
  const majShowroom = (p: Partial<Coordonnees['showroom']>) => setC((x) => ({ ...x, showroom: { ...x.showroom, ...p } }));
  const majJour = (i: number, j: Jour) => setC((x) => ({ ...x, horaires: x.horaires.map((y, k) => (k === i ? j : y)) }));

  const preparer = () => {
    setTentative(true);
    setMessage('');
    if (Object.keys(erreurs).length) {
      setErreur('Certains champs sont à corriger (en rouge).');
      return;
    }
    setErreur('');
    setConfirmation({ coord: propre, soc: propreSoc, nom: { nom: na.nom.trim(), accroche: na.accroche.trim() }, titre: 'Enregistrer ces modifications ?' });
  };

  const enregistrer = async (coord: Coordonnees, societe: Societe, nouvelleIdentite?: Identite, nom?: NomAccroche, nouveauFond?: { valeur: FondAccueil | null }, docs?: Documents) => {
    if (!enregistrees || !societeEnregistree || !nomEnregistre) return;
    setEnvoi(true);
    if (docs) {
      const { error } = await supabase.from('site_reglages').upsert({ cle: CLE_DOCUMENTS, valeur: docs });
      setEnvoi(false);
      setConfirmation(null);
      if (error) return setErreur("L'enregistrement n'a pas fonctionné. Réessayez.");
      setMessage('Tampon et logo des documents rétablis pour les prochains documents.');
      await charger();
      return;
    }
    if (nouveauFond) {
      const { error } = await supabase.from('site_reglages').upsert({ cle: CLE_FOND_ACCUEIL, valeur: nouveauFond.valeur ?? { origine: true } });
      setEnvoi(false);
      setConfirmation(null);
      if (error) return setErreur("L'enregistrement n'a pas fonctionné. Réessayez.");
      appliquerFondAccueil(nouveauFond.valeur);
      setMessage("Image d'accueil rétablie.");
      await charger();
      return;
    }
    if (nouvelleIdentite) {
      const ok = await enregistrerIdentite(nouvelleIdentite);
      setEnvoi(false);
      setConfirmation(null);
      if (!ok) return setErreur("L'enregistrement n'a pas fonctionné. Réessayez.");
      setMessage('Logo et icône rétablis.');
      await charger();
      return;
    }
    const lignes: { cle: string; valeur: unknown }[] = [
      ...(changements(enregistrees, coord).length ? [{ cle: CLE_COORDONNEES, valeur: coord }] : []),
      ...(changementsSociete(societeEnregistree, societe).length ? [{ cle: CLE_SOCIETE, valeur: societe }] : []),
    ];
    // Nom et accroche : fusionnés dans les textes du site tels qu'ils sont enregistrés à cet instant
    let textes: Textes | null = null;
    if (nom && changementsNom(nomEnregistre, nom).length) {
      const { data, error: e } = await supabase.from('site_reglages').select('valeur').eq('cle', CLE_TEXTES).maybeSingle();
      if (e) {
        setEnvoi(false);
        setConfirmation(null);
        return setErreur("L'enregistrement n'a pas fonctionné. Réessayez.");
      }
      textes = normaliserTextes({ ...normaliserTextes(data?.valeur), 'site.nom': nom.nom, 'site.accroche': nom.accroche });
      lignes.push({ cle: CLE_TEXTES, valeur: textes });
    }
    const { error } = await supabase.from('site_reglages').upsert(lignes);
    setEnvoi(false);
    setConfirmation(null);
    if (error) {
      setErreur("L'enregistrement n'a pas fonctionné. Réessayez.");
      return;
    }
    appliquerCoordonnees(coord);
    appliquerSociete(societe);
    if (textes) appliquerTextes(textes);
    setTentative(false);
    setMessage("Enregistré : le site, les informations pour Google et les e-mails utilisent maintenant ces coordonnées.");
    await charger();
  };

  const restaurer = (v: Version) => {
    if (!enregistrees || !societeEnregistree) return;
    if (v.cle === CLE_DOCUMENTS) {
      setMessage('');
      setConfirmation({ coord: enregistrees, soc: societeEnregistree, documents: normaliserDocuments(v.ancienne_valeur), titre: "Revenir au tampon et au logo d'avant ?" });
      return;
    }
    if (v.cle === CLE_FOND_ACCUEIL) {
      setMessage('');
      setConfirmation({ coord: enregistrees, soc: societeEnregistree, fond: { valeur: normaliserFondAccueil(v.ancienne_valeur) }, titre: "Revenir à l'image d'accueil d'avant ?" });
      return;
    }
    if (v.cle === CLE_IDENTITE) {
      setMessage('');
      setConfirmation({ coord: enregistrees, soc: societeEnregistree, identite: normaliserIdentite(v.ancienne_valeur), titre: 'Revenir au logo et à l\'icône d\'avant ?' });
      return;
    }
    const coord = v.cle === CLE_SOCIETE ? enregistrees : normaliserCoordonnees(v.ancienne_valeur);
    const societe = v.cle === CLE_SOCIETE ? normaliserSociete(v.ancienne_valeur) : societeEnregistree;
    setMessage('');
    setConfirmation({ coord, soc: societe, titre: `Revenir aux informations d'avant la modification du ${new Date(v.fait_le).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'long', timeStyle: 'short' })} ?` });
  };

  const apercuHoraires = lignesHoraires(propre.horaires);

  return (
    <AdminLayout>
      <div className="space-y-6 pb-24">
        <div>
          <h1 className="text-3xl font-bold text-[#111111]">Infos du site</h1>
          <p className="mt-1 max-w-3xl text-[#666666]">
            L'identité du site (nom, logo, image d'accueil), les coordonnées affichées partout et envoyées à Google, et les
            informations légales de la société (mentions légales, contrats). Les changements s'appliquent dès l'enregistrement.
          </p>
        </div>

        {enregistrees && (
          <nav aria-label="Rubriques" className="sticky top-[4.25rem] z-20 -mx-4 flex gap-1.5 overflow-x-auto border-b border-[#E5E5E5] bg-[#F9FAFB]/95 px-4 py-2 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-2">
            {RUBRIQUES.map(([id, libelle]) => (
              <a key={id} href={`#${id}`} className="shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-[#444444] hover:bg-white hover:text-[#111111]">{libelle}</a>
            ))}
          </nav>
        )}

        {message && <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900" role="status">{message}</p>}
        {erreur && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{erreur}</p>}

        {!enregistrees && !erreur ? (
          <p className="text-[#666666]">Chargement…</p>
        ) : enregistrees && (
          <>
            <Bloc id="identite" icone={<Fingerprint className="h-5 w-5" />} titre="Identité du site" sousTitre="Ce qui fait reconnaître le site : son nom, sa phrase d'accroche, son logo et l'image de la page d'accueil.">
              <div className="grid gap-4 md:grid-cols-2">
                <Champ id="n-nom" label="Nom du site" valeur={na.nom} onChange={(v) => setNa((x) => ({ ...x, nom: v.slice(0, 40) }))} err={montrer('nom_site')}
                  aide="Barre du haut, pied de page, onglet du navigateur, résultats Google. Peut différer de la raison sociale." />
                <div>
                  <label htmlFor="n-accroche" className="mb-1.5 block text-sm font-medium text-noir">Phrase d'accroche</label>
                  <textarea id="n-accroche" rows={2} value={na.accroche} onChange={(e) => setNa((x) => ({ ...x, accroche: e.target.value.replace(/\n/g, ' ').slice(0, 160) }))}
                    aria-invalid={!!montrer('accroche')} aria-describedby="n-accroche-aide" className={`${classeChamp(montrer('accroche'))} resize-none`} />
                  <p id="n-accroche-aide" className={`mt-1 flex justify-between gap-3 text-xs ${montrer('accroche') ? 'text-red-700' : 'text-[#5E5E5E]'}`}>
                    <span>{montrer('accroche') ?? "Sous le titre de la page d'accueil."}</span><span>{na.accroche.length}/160</span>
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-[#5E5E5E]">
                Le nom remplace aussi « {'{nom}'} » dans les textes du site. Tous les autres textes (titres, boutons, pages) se modifient dans{' '}
                <Link to="/admin/textes" className="font-semibold text-[#111111] underline underline-offset-2">Textes du site</Link>.
              </p>

              <div className="mt-6 border-t border-[#E5E5E5] pt-5">
                <h3 className="font-semibold text-[#111111]">Logo et icône</h3>
                <p className="mb-4 text-sm text-[#666666]">Logo de la barre du haut et du pied de page, icône de l'onglet, des téléphones et de Google.</p>
                <BlocIcone identite={identite} nom={nomEnregistre?.nom} onEnregistre={(m) => { setMessage(m); setErreur(''); charger(); }} />
              </div>

              <div className="mt-6 border-t border-[#E5E5E5] pt-5">
                <h3 className="font-semibold text-[#111111]">Image de la page d'accueil</h3>
                <p className="mb-4 text-sm text-[#666666]">La grande photo en haut de la page d'accueil, derrière le titre.</p>
                <BlocFondAccueil fond={fond} onEnregistre={(m) => { setMessage(m); setErreur(''); charger(); }} />
              </div>
            </Bloc>

            <Bloc id="contact" icone={<Phone className="h-5 w-5" />} titre="Contact" sousTitre="Comment les clients vous joignent.">
              <div className="grid gap-4 md:grid-cols-2">
                <Champ id="i-tel" label="Téléphone" type="tel" valeur={c.telephone} onChange={(v) => maj({ telephone: v })}
                  onBlur={() => chiffresTelephone(c.telephone) && maj({ telephone: formaterTelephone(c.telephone) })}
                  err={montrer('telephone')} aide="Affiché et cliquable (appel) sur le site." />
                <Champ id="i-insta" label="Instagram (facultatif)" valeur={c.instagram} onChange={(v) => maj({ instagram: v })}
                  err={montrer('instagram')} placeholder="svm_ride" aide="Pseudo ou lien du compte. Vide : Instagram n'est plus affiché." />
                <Champ id="i-mail" label="E-mail affiché" type="email" valeur={c.email} onChange={(v) => maj({ email: v })}
                  err={montrer('email')} aide="Visible sur le site et dans les e-mails envoyés aux clients." />
                <Champ id="i-recep" label="E-mail qui reçoit les demandes" type="email" valeur={c.email_reception} onChange={(v) => maj({ email_reception: v })}
                  err={montrer('email_reception')} aide="Messages de contact, reprises, financement, dépôt-vente… et réponses des clients." />
              </div>
              <p className="mt-4 flex items-start gap-2 text-xs text-[#5E5E5E]">
                <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Les e-mails automatiques partent toujours de contact@svmride.com (adresse technique liée au domaine).
              </p>
            </Bloc>

            <Bloc id="showroom" icone={<MapPin className="h-5 w-5" />} titre="Showroom" sousTitre="Adresse affichée, lien Google Maps et informations pour Google.">
              <div className="grid gap-4 md:grid-cols-6">
                <Champ className="md:col-span-2" id="i-nom" label="Nom du showroom" valeur={c.showroom.nom} onChange={(v) => majShowroom({ nom: v })} err={montrer('nom')} aide="Ex. : Chaville" />
                <Champ className="md:col-span-4" id="i-adr" label="Adresse" valeur={c.showroom.adresse} onChange={(v) => majShowroom({ adresse: v })} err={montrer('adresse')} placeholder="310 Avenue Roger Salengro" />
                <Champ className="md:col-span-2" id="i-cp" label="Code postal" valeur={c.showroom.code_postal} onChange={(v) => majShowroom({ code_postal: v.replace(/\D/g, '').slice(0, 5) })} err={montrer('code_postal')} />
                <Champ className="md:col-span-4" id="i-ville" label="Ville" valeur={c.showroom.ville} onChange={(v) => majShowroom({ ville: v })} err={montrer('ville')} />
                <Champ className="md:col-span-6" id="i-note" label="Précision sous l'adresse (facultative)" valeur={c.showroom.note} onChange={(v) => majShowroom({ note: v })} placeholder="Ex. : entrée par la cour" />
              </div>
              <a
                href={lienMaps(propre)}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-bleu underline underline-offset-2"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" /> Vérifier l'adresse sur Google Maps
              </a>
            </Bloc>

            <Bloc id="horaires" icone={<Clock className="h-5 w-5" />} titre="Horaires" sousTitre="Jour par jour ; le texte affiché sur le site et les horaires pour Google en sont tirés.">
              <ul className="divide-y divide-[#E5E5E5]">
                {c.horaires.map((j, i) => (
                  <li key={JOURS[i]} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4">
                    <span className="w-24 shrink-0 font-semibold text-[#111111]">{JOURS[i]}</span>
                    <select
                      value={j.mode}
                      onChange={(e) => {
                        const mode = e.target.value as ModeJour;
                        majJour(i, { mode, plages: mode === 'ouvert' ? (j.plages.length ? j.plages : [{ de: '09:00', a: '18:00' }]) : [] });
                      }}
                      className={`${classeChamp()} sm:w-48`}
                      aria-label={`${JOURS[i]} : ouverture`}
                    >
                      {MODES.map((m) => <option key={m.v} value={m.v}>{m.l}</option>)}
                    </select>
                    {j.mode === 'ouvert' && (
                      <div className="flex flex-wrap items-center gap-2">
                        {j.plages.map((p, k) => (
                          <span key={k} className="inline-flex items-center gap-1.5">
                            {k === 1 && <span className="text-sm text-[#666666]">et</span>}
                            <input type="time" value={p.de} step={900} aria-label={`${JOURS[i]}, plage ${k + 1} : début`}
                              onChange={(e) => majJour(i, { ...j, plages: j.plages.map((q, n) => (n === k ? { ...q, de: e.target.value } : q)) })}
                              className={`${classeChamp(montrer(`jour${i}`))} w-[7.5rem]`} />
                            <span className="text-sm text-[#666666]">à</span>
                            <input type="time" value={p.a} step={900} aria-label={`${JOURS[i]}, plage ${k + 1} : fin`}
                              onChange={(e) => majJour(i, { ...j, plages: j.plages.map((q, n) => (n === k ? { ...q, a: e.target.value } : q)) })}
                              className={`${classeChamp(montrer(`jour${i}`))} w-[7.5rem]`} />
                            {k === 1 && (
                              <button type="button" onClick={() => majJour(i, { ...j, plages: [j.plages[0]] })}
                                className="rounded-lg p-1.5 text-[#666666] hover:bg-[#F5F5F5]" aria-label={`${JOURS[i]} : retirer la deuxième plage`}>
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </span>
                        ))}
                        {j.plages.length === 1 && (
                          <button type="button"
                            onClick={() => majJour(i, { ...j, plages: [{ de: j.plages[0].de, a: '12:00' }, { de: '14:00', a: j.plages[0].a }] })}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#D1D5DB] px-2.5 py-1.5 text-xs font-medium text-[#444444] hover:border-[#111111]">
                            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Pause du midi
                          </button>
                        )}
                      </div>
                    )}
                    {montrer(`jour${i}`) && <p className="text-xs text-red-700 sm:ml-2">{montrer(`jour${i}`)}</p>}
                  </li>
                ))}
              </ul>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Champ id="i-hnote" label="Précision sous les horaires (facultative)" valeur={c.horaires_note} onChange={(v) => maj({ horaires_note: v })}
                  placeholder="Ex. : Sur rendez-vous à notre showroom de Chaville" />
                <div className="rounded-xl bg-[#F9F9F9] p-4">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[#666666]">Affiché sur le site</p>
                  {apercuHoraires.map((l) => <p key={l} className="text-sm text-[#111111]">{l}</p>)}
                  {propre.horaires_note && <p className="mt-2 text-xs italic text-[#666666]">{propre.horaires_note}</p>}
                </div>
              </div>
            </Bloc>

            <Bloc id="societe" icone={<Building2 className="h-5 w-5" />} titre="Société" sousTitre="Mentions légales du site et parties des contrats de dépôt-vente.">
              <p className="mb-5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  Ces informations ont une valeur légale : chaque nouveau contrat en garde une copie (les contrats déjà créés ou signés ne
                  changent pas). Faites vérifier tout changement de siège, de SIRET ou de forme juridique par votre expert-comptable ou un juriste.
                </span>
              </p>
              <div className="grid gap-4 md:grid-cols-6">
                <Champ className="md:col-span-3" id="s-raison" label="Raison sociale" valeur={soc.raison_sociale} onChange={(v) => majSoc({ raison_sociale: v })} err={montrer('s_raison')} />
                <Champ className="md:col-span-1" id="s-forme" label="Forme" valeur={soc.forme} onChange={(v) => majSoc({ forme: v })} err={montrer('s_forme')} placeholder="SAS" />
                <Champ className="md:col-span-2" id="s-capital" label="Capital social (facultatif)" valeur={soc.capital} onChange={(v) => majSoc({ capital: v })} placeholder="Ex. : 1 000 €" />
                <Champ className="md:col-span-3" id="s-siret" label="SIRET (siège)" valeur={soc.siret} onChange={(v) => majSoc({ siret: v })}
                  onBlur={() => chiffresSiret(soc.siret) && majSoc({ siret: formaterSiret(soc.siret) })} err={montrer('s_siret')}
                  aide={chiffresSiret(soc.siret)
                    ? `SIREN : ${siren(propreSoc)}${siretPlausible(soc.siret) ? '' : ' · attention : la clé de contrôle de ce numéro semble incorrecte, vérifiez-le.'}`
                    : '14 chiffres ; le SIREN (9 premiers chiffres) en est tiré.'} />
                <Champ className="md:col-span-3" id="s-rcs" label="RCS" valeur={soc.rcs} onChange={(v) => majSoc({ rcs: v })} err={montrer('s_rcs')} placeholder="RCS Nanterre" />
                <Champ className="md:col-span-3" id="s-tva" label="N° de TVA intracommunautaire (facultatif)" valeur={soc.tva} onChange={(v) => majSoc({ tva: v.toUpperCase() })} placeholder="FR…" />
                <Champ className="md:col-span-3" id="s-assureur" label="Assureur du garage" valeur={soc.assureur} onChange={(v) => majSoc({ assureur: v })} err={montrer('s_assureur')} aide="Cité dans les contrats (garde et assurance du véhicule)." />
                <Champ className="md:col-span-6" id="s-siege" label="Siège social" valeur={soc.siege} onChange={(v) => majSoc({ siege: v })} err={montrer('s_siege')} />
                <Champ className="md:col-span-6" id="s-directeur" label="Directeur de la publication" valeur={soc.directeur_publication} onChange={(v) => majSoc({ directeur_publication: v })} err={montrer('s_directeur')} aide="Le représentant légal de la société (mentions légales)." />
              </div>
              <div className="mt-6 rounded-xl bg-[#F9F9F9] p-4">
                <p className="text-sm font-semibold text-[#111111]">Médiateur de la consommation</p>
                <p className="mb-3 text-xs text-[#5E5E5E]">
                  Obligatoire pour vendre à des particuliers. Dès qu'il est renseigné, il apparaît dans les mentions légales et dans l'article
                  « Litiges » des prochains contrats.
                </p>
                <div className="grid gap-4 md:grid-cols-6">
                  <Champ className="md:col-span-2" id="s-med-nom" label="Nom" valeur={soc.mediateur_nom} onChange={(v) => majSoc({ mediateur_nom: v })} err={montrer('s_mediateur')} />
                  <Champ className="md:col-span-2" id="s-med-site" label="Site internet" valeur={soc.mediateur_site} onChange={(v) => majSoc({ mediateur_site: v })} placeholder="www.…" />
                  <Champ className="md:col-span-2" id="s-med-adr" label="Adresse" valeur={soc.mediateur_adresse} onChange={(v) => majSoc({ mediateur_adresse: v })} />
                </div>
              </div>
            </Bloc>

            <Bloc id="documents" icone={<FileSignature className="h-5 w-5" />} titre="Tampon et documents" sousTitre="Tampon / signature du garage et logo des contrats de dépôt-vente, avenants et certificats de signature.">
              <BlocDocuments documents={documents} identite={identite} nom={nomEnregistre?.nom ?? 'SVM Ride'}
                onEnregistre={(m) => { setMessage(m); setErreur(''); charger(); }} />
            </Bloc>

            <section id="historique" className="scroll-mt-32 rounded-xl border-2 border-[#D1D5DB] bg-white p-4 md:p-6" aria-labelledby="historique-titre">
              <div className="mb-4 flex items-start gap-3">
                <History className="mt-0.5 h-5 w-5 text-[#111111]" aria-hidden="true" />
                <div>
                  <h2 id="historique-titre" className="text-lg font-bold text-[#111111]">Historique des modifications</h2>
                  <p className="text-sm text-[#666666]">Les 15 dernières, avec leur auteur. Vous pouvez revenir aux informations d'avant une modification.</p>
                </div>
              </div>
              {historique.length === 0 ? (
                <p className="text-sm text-[#666666]">Aucune modification pour l'instant.</p>
              ) : (
                <ul className="space-y-3">
                  {historique.map((v) => {
                    const d = !v.ancienne_valeur ? [] : v.cle === CLE_DOCUMENTS
                      ? changementsDocuments(normaliserDocuments(v.ancienne_valeur), normaliserDocuments(v.nouvelle_valeur))
                      : v.cle === CLE_FOND_ACCUEIL
                      ? changementsFond(normaliserFondAccueil(v.ancienne_valeur), normaliserFondAccueil(v.nouvelle_valeur))
                      : v.cle === CLE_IDENTITE
                      ? changementsIdentite(normaliserIdentite(v.ancienne_valeur), normaliserIdentite(v.nouvelle_valeur))
                      : v.cle === CLE_SOCIETE
                      ? changementsSociete(normaliserSociete(v.ancienne_valeur), normaliserSociete(v.nouvelle_valeur))
                      : changements(normaliserCoordonnees(v.ancienne_valeur), normaliserCoordonnees(v.nouvelle_valeur));
                    const avant = !!v.ancienne_valeur;
                    return (
                      <li key={v.id} className="rounded-lg border border-[#E5E5E5] p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm">
                            <span className="font-semibold text-[#111111]">
                              {new Date(v.fait_le).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'long', timeStyle: 'short' })}
                            </span>
                            <span className="text-[#666666]"> · {LIBELLES_CLE[v.cle] ?? 'Coordonnées'} · {v.par ?? 'inconnu'}</span>
                          </p>
                          {avant && d.length > 0 && (
                            <button type="button" onClick={() => restaurer(v)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#D1D5DB] px-3 py-1.5 text-sm font-medium text-[#111111] hover:border-[#111111]">
                              <RotateCcw className="h-4 w-4" aria-hidden="true" /> Revenir à avant
                            </button>
                          )}
                        </div>
                        {avant ? (
                          d.length ? (
                            <ul className="mt-2 space-y-1 text-sm text-[#444444]">
                              {d.map((x) => (
                                <li key={x.champ}>
                                  <span className="font-medium text-[#111111]">{x.champ}</span> : <span className="line-through decoration-[#999]">{x.avant}</span> → {x.apres}
                                </li>
                              ))}
                            </ul>
                          ) : <p className="mt-1 text-sm text-[#666666]">Aucun changement visible.</p>
                        ) : <p className="mt-1 text-sm text-[#666666]">Informations de départ (reprises du site).</p>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}
      </div>

      {/* Barre d'enregistrement, visible dès qu'il y a un changement */}
      {enregistrees && modifie && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E5E5E5] bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <p className="text-sm text-[#444444]">
              {diff.length > 0
                ? <><strong className="text-[#111111]">{diff.length} modification{diff.length > 1 ? 's' : ''}</strong> non enregistrée{diff.length > 1 ? 's' : ''}</>
                : <strong className="text-[#111111]">Modification en cours</strong>}
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setC(enregistrees); if (societeEnregistree) setSoc(societeEnregistree); if (nomEnregistre) setNa(nomEnregistre); setTentative(false); setErreur(''); }}
                className="rounded-xl border border-[#D1D5DB] bg-white px-4 py-2.5 text-sm font-semibold text-[#111111] hover:border-[#111111]">
                Annuler
              </button>
              <button type="button" onClick={preparer} className="rounded-xl bg-[#111111] px-5 py-2.5 text-sm font-semibold text-white">
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmation && enregistrees && societeEnregistree && nomEnregistre && (() => {
        const liste = confirmation.documents
          ? changementsDocuments(documents, confirmation.documents)
          : confirmation.fond
          ? changementsFond(fond, confirmation.fond.valeur)
          : confirmation.identite
          ? changementsIdentite(identite, confirmation.identite)
          : [
            ...(confirmation.nom ? changementsNom(nomEnregistre, confirmation.nom) : []),
            ...changements(enregistrees, confirmation.coord), ...changementsSociete(societeEnregistree, confirmation.soc),
          ];
        const societeChange = changementsSociete(societeEnregistree, confirmation.soc).length > 0;
        return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-titre">
          <div className="my-auto w-full max-w-lg shrink-0 overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-[#E5E5E5] px-5 py-4">
              <h2 id="confirm-titre" className="text-lg font-bold text-[#111111]">{confirmation.titre}</h2>
            </div>
            <div className="px-5 py-4">
              {liste.length === 0 ? (
                <p className="text-sm text-[#666666]">Aucun changement par rapport aux informations actuelles.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {liste.map((x) => (
                    <li key={x.champ}>
                      <p className="font-semibold text-[#111111]">{x.champ}</p>
                      <p className="text-[#666666] line-through decoration-[#999]">{x.avant}</p>
                      <p className="text-[#111111]">{x.apres}</p>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-4 text-xs text-[#5E5E5E]">Appliqué immédiatement sur le site, pour Google et dans les prochains e-mails.</p>
              {societeChange && (
                <p className="mt-2 text-xs text-[#5E5E5E]">Les informations de la société figureront dans les mentions légales et dans les prochains contrats ; les contrats déjà créés ou signés ne changent pas.</p>
              )}
            </div>
            <div className="flex gap-3 bg-[#F9F9F9] px-5 py-4">
              <button type="button" onClick={() => setConfirmation(null)}
                className="flex-1 rounded-xl border border-[#E5E5E5] bg-white py-2.5 font-semibold text-[#111111] hover:bg-[#F5F5F5]">
                Annuler
              </button>
              <button type="button" disabled={envoi || liste.length === 0}
                onClick={() => enregistrer(confirmation.coord, confirmation.soc, confirmation.identite, confirmation.nom, confirmation.fond, confirmation.documents)}
                className="flex-1 rounded-xl bg-[#111111] py-2.5 font-semibold text-white disabled:opacity-50">
                {envoi ? 'Enregistrement…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
        );
      })()}
    </AdminLayout>
  );
}
