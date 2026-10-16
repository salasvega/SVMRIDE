/**
 * « Suivre ma vente » : espace du déposant. Connexion par e-mail + code à
 * 6 chiffres (pas de mot de passe), puis suivi de chaque moto confiée : étapes,
 * actualités partagées par SVM Ride, documents, et demandes (rappel,
 * prolongation, reprise, prix, question). Tout passe par la fonction
 * depot-proprietaire : le navigateur n'accède jamais directement aux données.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Download, LogOut, MessageSquare, Phone } from 'lucide-react';
import { SEOHead } from '../components/layout/SEOHead';
import { pageSeo } from '../config/seo';
import { siteConfig } from '../config/site';
import { Section } from '../components/ui/Section';
import { Container } from '../components/ui/Container';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import {
  DEMANDES_PROPRIETAIRE, ErreurDepot, ORDRE_VENTE, STATUTS_DEMANDE, StatutMandat, StatutVente, appelProprietaire, dateHeure, euros,
  joursRestants, jour, messageErreur,
} from '../lib/depot';

interface DossierProp {
  id: string;
  reference: string;
  marque: string;
  modele: string;
  version: string | null;
  annee: number | null;
  immatriculation: string | null;
  prix_affiche: number | null;
  net_vendeur: number | null;
  date_debut: string | null;
  date_fin: string | null;
  statut_mandat: StatutMandat;
  statut_vente: StatutVente;
  vendu_le: string | null;
  paye_le: string | null;
  frais_resiliation: number;
  annonce: string | null;
  photo: string | null;
  a_signer: boolean;
  fil: { fait_le: string; type: string; titre: string; detail: string | null; montant: number | null }[];
  documents: { type: string; nom: string; chemin: string; ajoute_le: string }[];
  demandes: { id: string; cree_le: string; type: string; message: string | null; statut: string; reponse: string | null }[];
}

const CLE_SESSION = 'svm-suivi-vente';
const lireSession = (): { jeton: string; expire: number } | null => {
  try {
    const s = JSON.parse(sessionStorage.getItem(CLE_SESSION) ?? 'null');
    return s && s.expire > Date.now() ? s : null;
  } catch {
    return null;
  }
};

const MANDAT_PROPRIETAIRE: Record<StatutMandat, string> = {
  preparation: 'En préparation',
  a_signer: 'Contrat à signer',
  actif: 'En vente',
  vendu: 'Vendue',
  resilie: 'Mandat terminé (moto reprise)',
  expire: 'Mandat arrivé à échéance',
  cloture: 'Dossier terminé',
};

/** Les étapes vues par le déposant (liste donnée par Mattia) */
function etapes(d: DossierProp) {
  const i = ORDRE_VENTE.indexOf(d.statut_vente);
  const a = (t: string) => d.fil.some((e) => e.type === t);
  return [
    { libelle: 'Annonce en ligne', fait: i >= 1 },
    { libelle: 'Visite', fait: a('visite') },
    { libelle: 'Essai', fait: a('essai') },
    { libelle: 'Offre reçue', fait: a('offre') },
    { libelle: 'Réservée', fait: i >= 2 },
    { libelle: 'Vendue', fait: i >= 3 },
    { libelle: 'Préparation', fait: i >= 4 },
    { libelle: 'Livrée', fait: i >= 5 },
    { libelle: 'Payée', fait: i >= 6 },
  ];
}

export function SuivreMaVente() {
  const [session, setSession] = useState(lireSession);
  const [dossiers, setDossiers] = useState<DossierProp[] | null>(null);
  const [email, setEmail] = useState('');
  const [erreur, setErreur] = useState('');

  const deconnecter = useCallback(() => {
    try { sessionStorage.removeItem(CLE_SESSION); } catch { /* ignore */ }
    setSession(null);
    setDossiers(null);
  }, []);

  const charger = useCallback(async () => {
    if (!session) return;
    try {
      const r = await appelProprietaire<{ email: string; dossiers: DossierProp[] }>('dossiers', {}, session.jeton);
      setEmail(r.email);
      setDossiers(r.dossiers);
    } catch (e) {
      if (e instanceof ErreurDepot && e.status === 401) deconnecter();
      else setErreur(messageErreur(e));
    }
  }, [session, deconnecter]);

  useEffect(() => { charger(); }, [charger]);

  return (
    <>
      <SEOHead meta={pageSeo['/suivre-ma-vente']} />
      <Section background="gray" className="!py-8 md:!py-12 min-h-[70vh]">
        <Container size="md">
          {!session ? (
            <Connexion onConnecte={(jeton, heures) => {
              const s = { jeton, expire: Date.now() + heures * 3600_000 };
              try { sessionStorage.setItem(CLE_SESSION, JSON.stringify(s)); } catch { /* session en mémoire seulement */ }
              setSession(s);
            }} />
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h1 className="text-[28px] md:text-[34px] filet-apres mb-1">Suivre ma vente</h1>
                  {email && <p className="text-sm text-gris">Connecté avec {email}</p>}
                </div>
                <button type="button" onClick={deconnecter} className="inline-flex items-center gap-2 text-sm text-gris hover:text-noir">
                  <LogOut className="w-4 h-4" aria-hidden="true" /> Se déconnecter
                </button>
              </div>
              {erreur && <div role="alert" className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm">{erreur}</div>}
              {dossiers === null ? (
                <p className="text-gris" role="status">Chargement…</p>
              ) : dossiers.length === 0 ? (
                <div className="carte p-6 text-gris">Aucun dossier de dépôt-vente en cours pour cette adresse.</div>
              ) : (
                dossiers.map((d) => <CarteDossier key={d.id} dossier={d} session={session.jeton} onMaj={charger} />)
              )}
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}

function Connexion({ onConnecte }: { onConnecte: (jeton: string, heures: number) => void }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [etape, setEtape] = useState<'email' | 'code'>('email');
  const [envoi, setEnvoi] = useState(false);
  const [info, setInfo] = useState('');
  const [erreur, setErreur] = useState('');
  const champCode = useRef<HTMLInputElement>(null);

  const demander = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setErreur('');
    setEnvoi(true);
    try {
      const r = await appelProprietaire<{ message: string }>('code', { email });
      setInfo(r.message);
      setEtape('code');
      setTimeout(() => champCode.current?.focus(), 50);
    } catch (err) {
      setErreur(messageErreur(err));
    } finally {
      setEnvoi(false);
    }
  };

  const connecter = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur('');
    setEnvoi(true);
    try {
      const r = await appelProprietaire<{ session: string; heures: number }>('connexion', { email, code });
      onConnecte(r.session, r.heures);
    } catch (err) {
      setErreur(messageErreur(err));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-[28px] md:text-[34px] filet-apres mb-3">Suivre ma vente</h1>
      <p className="text-gris mb-6">
        Vous nous avez confié votre moto en dépôt-vente ? Suivez ici chaque étape de la vente. Connectez-vous avec l'adresse
        e-mail de votre contrat : nous vous envoyons un code, sans mot de passe.
      </p>
      {etape === 'email' ? (
        <form onSubmit={demander} className="carte p-5 md:p-6 space-y-4">
          <Input label="Votre e-mail" type="email" name="email" autoComplete="email" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" size="lg" disabled={envoi || !email} fullWidth>{envoi ? 'Envoi…' : 'Recevoir mon code'}</Button>
          {erreur && <p role="alert" className="text-sm text-red-700">{erreur}</p>}
        </form>
      ) : (
        <form onSubmit={connecter} className="carte p-5 md:p-6 space-y-4">
          <p className="text-sm text-noir" role="status">{info}</p>
          <div>
            <label htmlFor="code-suivi" className="block text-sm font-medium text-noir mb-2">Code reçu par e-mail</label>
            <input
              ref={champCode}
              id="code-suivi"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-4 py-3 bg-white text-noir border-[1.5px] border-champ rounded-xl text-2xl tracking-[0.4em] tabular-nums focus:outline-none focus:border-bleu focus:ring-4 focus:ring-bleu/15"
            />
            <p className="text-xs text-gris mt-1">Valable 10 minutes. Pensez à vos courriers indésirables.</p>
          </div>
          <Button type="submit" size="lg" disabled={envoi || code.length !== 6} fullWidth>{envoi ? 'Connexion…' : 'Me connecter'}</Button>
          <div className="flex justify-between text-sm">
            <button type="button" className="lien" onClick={() => { setEtape('email'); setCode(''); setErreur(''); }}>Changer d'e-mail</button>
            <button type="button" className="lien" onClick={() => demander()} disabled={envoi}>Renvoyer le code</button>
          </div>
          {erreur && <p role="alert" className="text-sm text-red-700">{erreur}</p>}
        </form>
      )}
      <p className="mt-6 text-sm text-gris">
        Pas encore de dossier ? <Link to="/vendre-ma-moto" className="lien">Faites estimer votre moto</Link>.
      </p>
    </div>
  );
}

function CarteDossier({ dossier: d, session, onMaj }: { dossier: DossierProp; session: string; onMaj: () => void }) {
  const liste = etapes(d);
  const derniere = liste.reduce((n, e, i) => (e.fait ? i : n), -1);
  const j = d.statut_mandat === 'actif' ? joursRestants(d.date_fin) : null;
  const enCours = ['actif', 'vendu'].includes(d.statut_mandat);
  const [erreurDoc, setErreurDoc] = useState('');

  const telecharger = async (chemin: string) => {
    setErreurDoc('');
    const fenetre = window.open('about:blank', '_blank');
    try {
      const r = await appelProprietaire<{ url: string }>('document', { chemin }, session);
      if (fenetre) fenetre.location.href = r.url;
      else window.location.href = r.url;
    } catch (e) {
      fenetre?.close();
      setErreurDoc(messageErreur(e));
    }
  };

  return (
    <article className="carte overflow-hidden" aria-labelledby={`t-${d.id}`}>
      <div className="flex flex-col sm:flex-row">
        {d.photo && <img src={d.photo} alt="" className="sm:w-56 h-44 sm:h-auto object-cover bg-fond" loading="lazy" />}
        <div className="p-5 md:p-6 flex-1">
          <p className="text-xs text-gris tabular-nums">{d.reference}</p>
          <h2 id={`t-${d.id}`} className="text-xl font-semibold text-noir">
            {d.marque} {d.modele}{d.version ? ` ${d.version}` : ''}{d.annee ? ` · ${d.annee}` : ''}
          </h2>
          <p className="mt-1 inline-flex px-2.5 py-1 rounded-full bg-bleu/10 text-bleu text-xs font-semibold">{MANDAT_PROPRIETAIRE[d.statut_mandat]}</p>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div><dt className="text-gris">Prix affiché</dt><dd className="text-noir font-semibold">{euros(d.prix_affiche)}</dd></div>
            <div><dt className="text-gris">Vous percevez</dt><dd className="text-noir font-semibold">{euros(d.net_vendeur)}</dd></div>
            {d.date_fin && (
              <div className="col-span-2">
                <dt className="text-gris">Mandat</dt>
                <dd className="text-noir">
                  Du {jour(d.date_debut)} au {jour(d.date_fin)}
                  {j != null && j >= 0 && <span className="text-gris"> · {j === 0 ? "se termine aujourd'hui" : `${j} jour${j > 1 ? 's' : ''} restant${j > 1 ? 's' : ''}`}</span>}
                </dd>
              </div>
            )}
          </dl>
          {d.annonce && <p className="mt-3"><Link to={d.annonce} className="lien text-sm">Voir mon annonce sur svmride.com →</Link></p>}
        </div>
      </div>

      {d.a_signer && (
        <div className="mx-5 md:mx-6 mb-5 rounded-xl border-2 border-or bg-or/10 p-4 text-sm text-noir">
          Un document attend votre signature : utilisez le lien reçu par e-mail ou le QR code présenté au showroom. Lien perdu ?
          Demandez-en un nouveau ci-dessous (« Être rappelé ») ou au {siteConfig.contact.phone}.
        </div>
      )}

      {(enCours || d.statut_mandat === 'cloture') && (
        <div className="px-5 md:px-6 pb-5">
          <h3 className="font-semibold text-noir mb-3">Avancement</h3>
          <ol className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
            {liste.map((e, i) => (
              <li key={e.libelle} aria-current={i === derniere ? 'step' : undefined}
                className={`rounded-xl border px-2 py-2 text-xs text-center ${
                  e.fait ? (i === derniere ? 'bg-bleu text-white border-bleu font-semibold' : 'bg-green-50 border-green-200 text-green-900') : 'bg-white border-bordure text-gris'
                }`}>
                {e.fait && i !== derniere && <Check className="w-3.5 h-3.5 mx-auto mb-0.5" aria-hidden="true" />}
                {e.libelle}
                <span className="sr-only">{e.fait ? ' : fait' : ' : à venir'}</span>
              </li>
            ))}
          </ol>
          {d.paye_le && <p className="text-sm text-green-800 mt-3">Virement du net vendeur effectué le {jour(d.paye_le)}.</p>}
          {d.vendu_le && !d.paye_le && <p className="text-sm text-gris mt-3">Vendue le {jour(d.vendu_le)} : vous êtes payé par virement sous 48 h après l'encaissement.</p>}
        </div>
      )}

      <div className="border-t border-bordure grid md:grid-cols-2">
        <div className="p-5 md:p-6 md:border-r border-bordure">
          <h3 className="font-semibold text-noir mb-3">Actualités</h3>
          {d.fil.length === 0 ? (
            <p className="text-sm text-gris">Rien pour le moment.</p>
          ) : (
            <ol className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {d.fil.map((e, i) => (
                <li key={i} className="text-sm border-l-2 border-or pl-3">
                  <p className="text-noir">{e.titre}{e.montant != null && ` — ${euros(e.montant)}`}</p>
                  {e.detail && <p className="text-gris whitespace-pre-line">{e.detail}</p>}
                  <p className="text-xs text-gris">{dateHeure(e.fait_le)}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
        <div className="p-5 md:p-6">
          <h3 className="font-semibold text-noir mb-3">Documents</h3>
          {d.documents.length === 0 ? (
            <p className="text-sm text-gris">Aucun document partagé.</p>
          ) : (
            <ul className="space-y-2">
              {d.documents.map((doc) => (
                <li key={doc.chemin}>
                  <button type="button" onClick={() => telecharger(doc.chemin)} className="inline-flex items-center gap-2 text-sm text-bleu hover:underline text-left">
                    <Download className="w-4 h-4 flex-shrink-0" aria-hidden="true" /> {doc.nom}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {erreurDoc && <p role="alert" className="text-sm text-red-700 mt-2">{erreurDoc}</p>}
        </div>
      </div>

      {d.statut_mandat !== 'cloture' && <Demandes dossier={d} session={session} onMaj={onMaj} />}
    </article>
  );
}

function Demandes({ dossier: d, session, onMaj }: { dossier: DossierProp; session: string; onMaj: () => void }) {
  const [type, setType] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [retour, setRetour] = useState<{ texte: string; erreur?: boolean }>({ texte: '' });

  const types = ['actif', 'expire'].includes(d.statut_mandat)
    ? ['rappel', 'baisse_prix', 'prolongation', 'reprise_anticipee', 'question']
    : ['rappel', 'question'];
  const textes: Record<string, string> = {
    rappel: 'Un conseiller vous rappelle rapidement.',
    baisse_prix: 'Indiquez le nouveau prix souhaité. Rappel : une baisse du prix affiché réduit d’autant votre net vendeur, sauf accord différent.',
    prolongation: 'Nous vous préparons un avenant de prolongation à signer en ligne.',
    reprise_anticipee: `Avant la fin du mandat, une indemnité de ${euros(d.frais_resiliation)} est prévue par votre contrat. Un conseiller vous recontacte pour organiser la reprise.`,
    question: 'Posez votre question, nous vous répondons rapidement.',
  };
  const messageRequis = ['baisse_prix', 'question'].includes(type ?? '');

  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type) return;
    setEnvoi(true);
    setRetour({ texte: '' });
    try {
      await appelProprietaire('demande', { dossier_id: d.id, type, message }, session);
      setRetour({ texte: 'Demande envoyée. Nous revenons vers vous rapidement.' });
      setType(null);
      setMessage('');
      onMaj();
    } catch (err) {
      setRetour({ texte: messageErreur(err), erreur: true });
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="border-t border-bordure p-5 md:p-6">
      <h3 className="font-semibold text-noir mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4" aria-hidden="true" /> Une demande ?</h3>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Type de demande">
        {types.map((t) => (
          <button key={t} type="button" onClick={() => { setType(t === type ? null : t); setRetour({ texte: '' }); }} aria-pressed={type === t}
            className={`px-3 py-2 rounded-xl text-sm font-medium border-[1.5px] ${type === t ? 'bg-noir text-white border-noir' : 'bg-white border-champ text-noir hover:border-noir'}`}>
            {DEMANDES_PROPRIETAIRE[t]}
          </button>
        ))}
      </div>
      {type && (
        <form onSubmit={envoyer} className="mt-4 space-y-3">
          <p className="text-sm text-gris">{textes[type]}</p>
          <Textarea
            label={messageRequis ? 'Votre message' : 'Message (facultatif)'}
            name="message"
            rows={3}
            maxLength={2000}
            required={messageRequis}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button type="submit" disabled={envoi || (messageRequis && !message.trim())}>{envoi ? 'Envoi…' : 'Envoyer la demande'}</Button>
        </form>
      )}
      {retour.texte && <p role={retour.erreur ? 'alert' : 'status'} className={`mt-3 text-sm ${retour.erreur ? 'text-red-700' : 'text-green-800'}`}>{retour.texte}</p>}

      {d.demandes.length > 0 && (
        <ul className="mt-5 space-y-2">
          {d.demandes.map((x) => (
            <li key={x.id} className="text-sm rounded-xl bg-fond px-4 py-3">
              <p className="text-noir">
                <strong>{DEMANDES_PROPRIETAIRE[x.type] ?? x.type}</strong> · {dateHeure(x.cree_le)} ·{' '}
                <span className="text-gris">{STATUTS_DEMANDE[x.statut] ?? x.statut}</span>
              </p>
              {x.message && <p className="text-gris whitespace-pre-line">« {x.message} »</p>}
              {x.reponse && <p className="text-noir mt-1">Réponse de SVM Ride : {x.reponse}</p>}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-5 text-sm text-gris flex items-center gap-2">
        <Phone className="w-4 h-4" aria-hidden="true" /> Ou appelez-nous au{' '}
        <a href={`tel:${siteConfig.contact.phone.replace(/\s/g, '')}`} className="lien">{siteConfig.contact.phone}</a>
      </p>
    </div>
  );
}
