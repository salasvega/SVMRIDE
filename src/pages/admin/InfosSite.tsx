/**
 * Admin — Infos du site : coordonnées affichées partout (en-tête de contact,
 * pied de page, page Contact, pages légales, Dépôt-vente…), envoyées à Google
 * (fiche concession) et utilisées dans les e-mails automatiques.
 *
 * Contact (téléphone, e-mails, Instagram), showroom (adresse, précision) et
 * horaires jour par jour. Chaque enregistrement est confirmé (liste des
 * changements) et gardé dans l'historique, d'où l'on peut revenir en arrière.
 * Réglage « coordonnees » de la table site_reglages (format : src/config/coordonnees.ts).
 */
import { useEffect, useMemo, useState } from 'react';
import { Clock, ExternalLink, History, Mail, MapPin, Phone, Plus, RotateCcw, X } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import { appliquerCoordonnees } from '../../lib/coordonnees';
import {
  adresseComplete, chiffresTelephone, CLE_COORDONNEES, COORDONNEES_DEFAUT, EMAIL, formaterTelephone, HEURE, JOURS,
  lienMaps, lignesHoraires, normaliserCoordonnees, pseudoInstagram, type Coordonnees, type Jour, type ModeJour,
} from '../../config/coordonnees';

interface Version {
  id: number;
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

function Bloc({ icone, titre, sousTitre, children }: { icone: React.ReactNode; titre: string; sousTitre: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border-2 border-[#D1D5DB] bg-white p-4 md:p-6">
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
  const [historique, setHistorique] = useState<Version[]>([]);
  const [erreur, setErreur] = useState('');
  const [message, setMessage] = useState('');
  const [tentative, setTentative] = useState(false);
  const [confirmation, setConfirmation] = useState<{ valeur: Coordonnees; titre: string } | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const charger = async () => {
    const [{ data, error }, { data: h }] = await Promise.all([
      supabase.from('site_reglages').select('valeur').eq('cle', CLE_COORDONNEES).maybeSingle(),
      supabase.from('site_reglages_historique').select('id, ancienne_valeur, nouvelle_valeur, par, fait_le')
        .eq('cle', CLE_COORDONNEES).order('fait_le', { ascending: false }).limit(15),
    ]);
    if (error) {
      setErreur("Impossible de charger les informations. Vérifiez que vous êtes connecté avec un compte administrateur.");
      return;
    }
    const v = normaliserCoordonnees(data?.valeur);
    setEnregistrees(v);
    setC(v);
    setHistorique((h as Version[]) ?? []);
  };

  useEffect(() => {
    charger();
  }, []);

  const erreurs = useMemo(() => verifier(c), [c]);
  const propre = useMemo(() => nettoyer(c), [c]);
  const diff = useMemo(() => (enregistrees ? changements(enregistrees, propre) : []), [enregistrees, propre]);
  const modifie = !!enregistrees && JSON.stringify(c) !== JSON.stringify(enregistrees);
  const montrer = (cle: string) => (tentative ? erreurs[cle] : undefined);

  const maj = (p: Partial<Coordonnees>) => setC((x) => ({ ...x, ...p }));
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
    setConfirmation({ valeur: propre, titre: 'Enregistrer ces modifications ?' });
  };

  const enregistrer = async (valeur: Coordonnees) => {
    setEnvoi(true);
    const { error } = await supabase.from('site_reglages').upsert({ cle: CLE_COORDONNEES, valeur });
    setEnvoi(false);
    setConfirmation(null);
    if (error) {
      setErreur("L'enregistrement n'a pas fonctionné. Réessayez.");
      return;
    }
    appliquerCoordonnees(valeur);
    setTentative(false);
    setMessage("Enregistré : le site, les informations pour Google et les e-mails utilisent maintenant ces coordonnées.");
    await charger();
  };

  const restaurer = (v: Version) => {
    const valeur = normaliserCoordonnees(v.ancienne_valeur);
    setMessage('');
    setConfirmation({ valeur, titre: `Revenir aux informations d'avant la modification du ${new Date(v.fait_le).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'long', timeStyle: 'short' })} ?` });
  };

  const apercuHoraires = lignesHoraires(propre.horaires);

  return (
    <AdminLayout>
      <div className="space-y-6 pb-24">
        <div>
          <h1 className="text-3xl font-bold text-[#111111]">Infos du site</h1>
          <p className="mt-1 max-w-3xl text-[#666666]">
            Coordonnées affichées sur tout le site (page Contact, pied de page, mentions légales, Dépôt-vente…), envoyées à Google
            et reprises dans les e-mails automatiques. Les changements s'appliquent dès l'enregistrement.
          </p>
        </div>

        {message && <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900" role="status">{message}</p>}
        {erreur && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{erreur}</p>}

        {!enregistrees && !erreur ? (
          <p className="text-[#666666]">Chargement…</p>
        ) : enregistrees && (
          <>
            <Bloc icone={<Phone className="h-5 w-5" />} titre="Contact" sousTitre="Comment les clients vous joignent.">
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

            <Bloc icone={<MapPin className="h-5 w-5" />} titre="Showroom" sousTitre="Adresse affichée, lien Google Maps et informations pour Google.">
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

            <Bloc icone={<Clock className="h-5 w-5" />} titre="Horaires" sousTitre="Jour par jour ; le texte affiché sur le site et les horaires pour Google en sont tirés.">
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

            <section className="rounded-xl border-2 border-[#D1D5DB] bg-white p-4 md:p-6" aria-labelledby="historique-titre">
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
                    const avant = v.ancienne_valeur ? normaliserCoordonnees(v.ancienne_valeur) : null;
                    const apres = normaliserCoordonnees(v.nouvelle_valeur);
                    const d = avant ? changements(avant, apres) : [];
                    return (
                      <li key={v.id} className="rounded-lg border border-[#E5E5E5] p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm">
                            <span className="font-semibold text-[#111111]">
                              {new Date(v.fait_le).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'long', timeStyle: 'short' })}
                            </span>
                            <span className="text-[#666666]"> · {v.par ?? 'inconnu'}</span>
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
              <button type="button" onClick={() => { setC(enregistrees); setTentative(false); setErreur(''); }}
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

      {confirmation && enregistrees && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-titre">
          <div className="my-auto w-full max-w-lg shrink-0 overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-[#E5E5E5] px-5 py-4">
              <h2 id="confirm-titre" className="text-lg font-bold text-[#111111]">{confirmation.titre}</h2>
            </div>
            <div className="px-5 py-4">
              {changements(enregistrees, confirmation.valeur).length === 0 ? (
                <p className="text-sm text-[#666666]">Aucun changement par rapport aux informations actuelles.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {changements(enregistrees, confirmation.valeur).map((x) => (
                    <li key={x.champ}>
                      <p className="font-semibold text-[#111111]">{x.champ}</p>
                      <p className="text-[#666666] line-through decoration-[#999]">{x.avant}</p>
                      <p className="text-[#111111]">{x.apres}</p>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-4 text-xs text-[#5E5E5E]">Appliqué immédiatement sur le site, pour Google et dans les prochains e-mails.</p>
            </div>
            <div className="flex gap-3 bg-[#F9F9F9] px-5 py-4">
              <button type="button" onClick={() => setConfirmation(null)}
                className="flex-1 rounded-xl border border-[#E5E5E5] bg-white py-2.5 font-semibold text-[#111111] hover:bg-[#F5F5F5]">
                Annuler
              </button>
              <button type="button" disabled={envoi || changements(enregistrees, confirmation.valeur).length === 0}
                onClick={() => enregistrer(confirmation.valeur)}
                className="flex-1 rounded-xl bg-[#111111] py-2.5 font-semibold text-white disabled:opacity-50">
                {envoi ? 'Enregistrement…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
