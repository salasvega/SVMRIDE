/**
 * Admin — fiche d'un dossier de dépôt-vente, en 4 onglets :
 *  Vente (étapes, annonce, demandes du déposant, suivi), Fiche (déposant, moto,
 *  conditions), Pièces (pièces, état des lieux, documents), Contrat (signature).
 */
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle, ExternalLink, Mail, Phone, Trash2 } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import {
  Dossier, MANDAT, ORDRE_VENTE, PIECES, StatutMandat, StatutVente, VENTE, euros, joursRestants, jour,
} from '../../lib/depot';
import { DossierFiche } from '../../components/admin/depot/DossierFiche';
import { DocumentDossier, DossierPieces } from '../../components/admin/depot/DossierPieces';
import { DossierContrats } from '../../components/admin/depot/DossierContrats';
import { DossierFil } from '../../components/admin/depot/DossierFil';
import { Carte, Message, boutonDanger, boutonPrincipal, boutonSecondaire, champClasse } from '../../components/admin/depot/ui';

type Onglet = 'vente' | 'fiche' | 'pieces' | 'contrat';
const ONGLETS: { cle: Onglet; libelle: string }[] = [
  { cle: 'vente', libelle: 'Vente' },
  { cle: 'fiche', libelle: 'Fiche' },
  { cle: 'pieces', libelle: 'Pièces et documents' },
  { cle: 'contrat', libelle: 'Contrat' },
];

/** Ce qu'il manque avant de pouvoir préparer le mandat (mêmes contrôles que le serveur) */
export function manquesAvantContrat(d: Dossier): string[] {
  const m: string[] = [];
  if (!d.prop_adresse) m.push('Adresse du déposant');
  if (!d.prix_affiche) m.push('Prix affiché');
  if (d.net_vendeur == null) m.push('Net vendeur');
  if (!d.immatriculation) m.push('Immatriculation');
  for (const p of PIECES.filter((x) => x.obligatoire)) if (!d.pieces?.[p.cle]?.recu) m.push(p.libelle);
  if (!d.etat_des_lieux?.fait_le) m.push("État des lieux d'entrée");
  return m;
}

const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function DepotDossierDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [d, setD] = useState<Dossier | null>(null);
  const [documents, setDocuments] = useState<DocumentDossier[]>([]);
  const [vehicule, setVehicule] = useState<{ id: string; slug: string; available: boolean } | null>(null);
  const [introuvable, setIntrouvable] = useState(false);
  const [version, setVersion] = useState(0);

  const charger = useCallback(async () => {
    const { data } = await supabase.from('depot_dossiers').select('*').eq('id', id).maybeSingle();
    if (!data) return setIntrouvable(true);
    setD(data as Dossier);
    setVersion((v) => v + 1);
  }, [id]);
  const chargerDocuments = useCallback(async () => {
    const { data } = await supabase.from('depot_documents').select('*').eq('dossier_id', id).order('ajoute_le', { ascending: false });
    setDocuments((data ?? []) as DocumentDossier[]);
  }, [id]);

  useEffect(() => {
    charger();
    chargerDocuments();
  }, [charger, chargerDocuments]);

  useEffect(() => {
    if (!d?.vehicle_id) return setVehicule(null);
    supabase.from('vehicles').select('id, slug, available').eq('id', d.vehicle_id).maybeSingle()
      .then(({ data }: { data: { id: string; slug: string; available: boolean } | null }) => setVehicule(data));
  }, [d?.vehicle_id, d?.statut_vente]);

  const majDossier = (n: Dossier) => {
    setD(n);
    setVersion((v) => v + 1);
  };

  if (introuvable) {
    return (
      <AdminLayout>
        <p className="text-[#444444]">Dossier introuvable. <Link to="/admin/depot-vente/dossiers" className="text-bleu underline">Retour aux dossiers</Link></p>
      </AdminLayout>
    );
  }
  if (!d) return <AdminLayout><p className="text-[#666666]">Chargement…</p></AdminLayout>;

  const defaut: Onglet = d.statut_mandat === 'preparation' ? 'fiche' : d.statut_mandat === 'a_signer' ? 'contrat' : 'vente';
  const onglet = (ONGLETS.find((o) => o.cle === params.get('onglet'))?.cle ?? defaut) as Onglet;
  const choisir = (o: Onglet) => {
    const p = new URLSearchParams(params);
    p.set('onglet', o);
    setParams(p, { replace: true });
  };
  const j = d.statut_mandat === 'actif' ? joursRestants(d.date_fin) : null;
  const manques = ['preparation', 'a_signer'].includes(d.statut_mandat) ? manquesAvantContrat(d) : [];
  const tel = d.prop_telephone.replace(/[^\d+]/g, '');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <Link to="/admin/depot-vente/dossiers" className="inline-flex items-center gap-1.5 text-sm text-[#444444] hover:text-[#111111]">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Tous les dossiers
        </Link>

        <header className="bg-white rounded-2xl border border-[#E5E5E5] p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-sm text-[#666666] tabular-nums">{d.reference}</span>
            <span className={`inline-flex px-2.5 py-1 rounded-full border text-xs font-semibold ${MANDAT[d.statut_mandat].classe}`}>{MANDAT[d.statut_mandat].libelle}</span>
            {['actif', 'vendu'].includes(d.statut_mandat) && (
              <span className="inline-flex px-2.5 py-1 rounded-full border border-[#D1D5DB] text-xs font-medium">{VENTE[d.statut_vente]}</span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#111111]">
            {d.marque} {d.modele}{d.version ? ` ${d.version}` : ''}{d.annee ? ` · ${d.annee}` : ''}
          </h1>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[#444444]">
            <span>{d.prop_civilite ? `${d.prop_civilite} ` : ''}{d.prop_prenom} {d.prop_nom}</span>
            <span>Affiché {euros(d.prix_affiche)} · net vendeur {euros(d.net_vendeur)}</span>
            {d.date_debut && <span>Mandat du {jour(d.date_debut)} au {jour(d.date_fin)}</span>}
            {j != null && (
              <span className={j <= 7 ? 'text-orange-800 font-semibold' : ''}>
                {j < 0 ? `Dépassé de ${-j} j` : j === 0 ? "Se termine aujourd'hui" : `${j} j restants`}
              </span>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={`tel:${tel}`} className={`${boutonSecondaire} !py-1.5`}><Phone className="w-4 h-4" aria-hidden="true" /> {d.prop_telephone}</a>
            <a href={`mailto:${d.prop_email}?subject=${encodeURIComponent(`Votre dépôt-vente ${d.reference} — SVM Ride`)}`} className={`${boutonSecondaire} !py-1.5`}>
              <Mail className="w-4 h-4" aria-hidden="true" /> {d.prop_email}
            </a>
            {d.demande_id && (
              <Link to={`/admin/depot-vente?demande=${d.demande_id}`} className={`${boutonSecondaire} !py-1.5`}>Demande d'origine</Link>
            )}
          </div>

          {manques.length > 0 && (
            <div className="mt-5 rounded-xl bg-amber-50 border border-amber-200 p-4">
              <p className="font-semibold text-amber-900 text-sm mb-2">Avant de préparer le contrat, il manque :</p>
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-amber-900">
                {manques.map((m) => <li key={m} className="flex items-center gap-1.5"><Circle className="w-3.5 h-3.5" aria-hidden="true" />{m}</li>)}
              </ul>
            </div>
          )}
          {['preparation', 'a_signer'].includes(d.statut_mandat) && manques.length === 0 && d.statut_mandat === 'preparation' && (
            <p className="mt-5 rounded-xl bg-green-50 border border-green-200 p-3 text-sm text-green-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Dossier complet : le contrat peut être préparé (onglet Contrat).
            </p>
          )}
        </header>

        <nav aria-label="Sections du dossier" className="flex gap-1 border-b border-[#D1D5DB] overflow-x-auto overflow-y-hidden">
          {ONGLETS.map((o) => (
            <button
              key={o.cle}
              type="button"
              onClick={() => choisir(o.cle)}
              aria-current={onglet === o.cle ? 'page' : undefined}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap ${
                onglet === o.cle ? 'border-[#111111] text-[#111111]' : 'border-transparent text-[#666666] hover:text-[#111111]'
              }`}
            >
              {o.libelle}
            </button>
          ))}
        </nav>

        {onglet === 'vente' && (
          <div className="space-y-6">
            <EtapesVente dossier={d} onMaj={majDossier} />
            <Annonce dossier={d} vehicule={vehicule} onMaj={majDossier} />
            <DossierFil dossier={d} version={version} />
            <FinDossier dossier={d} onMaj={majDossier} onSupprime={() => navigate('/admin/depot-vente/dossiers')} />
          </div>
        )}
        {onglet === 'fiche' && <DossierFiche dossier={d} onMaj={majDossier} />}
        {onglet === 'pieces' && <DossierPieces dossier={d} documents={documents} onMaj={majDossier} onDocuments={chargerDocuments} />}
        {onglet === 'contrat' && <DossierContrats dossier={d} onChange={() => { charger(); chargerDocuments(); }} />}
      </div>
    </AdminLayout>
  );
}

function EtapesVente({ dossier: d, onMaj }: { dossier: Dossier; onMaj: (d: Dossier) => void }) {
  const [cible, setCible] = useState<StatutVente | null>(null);
  const [prixVente, setPrixVente] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState<{ texte: string; erreur?: boolean }>({ texte: '' });
  const actif = ['actif', 'vendu'].includes(d.statut_mandat);
  const index = ORDRE_VENTE.indexOf(d.statut_vente);

  const appliquer = async (s: StatutVente) => {
    setEnvoi(true);
    setMessage({ texte: '' });
    const maj: Record<string, unknown> = { statut_vente: s };
    if (['vendue', 'preparation', 'livree', 'payee'].includes(s) && prixVente) maj.prix_vente = Number(prixVente);
    const { data, error } = await supabase.from('depot_dossiers').update(maj).eq('id', d.id).select('*').single();
    setEnvoi(false);
    setCible(null);
    if (error || !data) return setMessage({ texte: 'La mise à jour a échoué.', erreur: true });
    const envoieEmail = ['en_ligne', 'reservee', 'vendue', 'livree', 'payee'].includes(s);
    setMessage({ texte: `Étape « ${VENTE[s]} » enregistrée${envoieEmail ? ' : le déposant est prévenu par e-mail' : ''}.` });
    onMaj(data as Dossier);
  };

  const demander = (s: StatutVente) => {
    if (s === d.statut_vente) return;
    setPrixVente(d.prix_vente != null ? String(d.prix_vente) : d.prix_affiche != null ? String(d.prix_affiche) : '');
    setCible(s);
  };

  return (
    <Carte titre="Étapes de la vente" id="t-etapes">
      {!actif && (
        <p className="text-sm text-[#666666] mb-4">
          {['preparation', 'a_signer'].includes(d.statut_mandat)
            ? "Les étapes s'activent dès que le mandat est signé."
            : 'Le mandat est terminé : les étapes ne sont plus modifiables.'}
        </p>
      )}
      <ol className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2" aria-label="Étape actuelle de la vente">
        {ORDRE_VENTE.map((s, i) => (
          <li key={s}>
            <button
              type="button"
              disabled={!actif || envoi}
              onClick={() => demander(s)}
              aria-current={s === d.statut_vente ? 'step' : undefined}
              className={`w-full h-full text-left rounded-xl border-2 px-3 py-2.5 text-sm transition-colors disabled:cursor-not-allowed ${
                s === d.statut_vente
                  ? 'border-bleu bg-bleu text-white font-semibold'
                  : i < index
                    ? 'border-green-300 bg-green-50 text-green-900'
                    : 'border-[#D1D5DB] bg-white text-[#444444] hover:border-[#111111]'
              } ${!actif ? 'opacity-60' : ''}`}
            >
              <span className="block text-xs opacity-80">{i + 1}</span>
              {VENTE[s]}
            </button>
          </li>
        ))}
      </ol>
      {cible && (
        <div className="mt-4 rounded-xl border-2 border-bleu/40 bg-blue-50/50 p-4 space-y-3">
          <p className="text-sm text-[#111111]">
            Passer à l'étape <strong>« {VENTE[cible]} »</strong> ?
            {['en_ligne', 'reservee', 'vendue', 'livree', 'payee'].includes(cible) && ' Le déposant recevra un e-mail.'}
            {cible === 'en_ligne' && ' La fiche annonce liée devient visible sur le site.'}
            {cible === 'payee' && ` À faire une fois le virement du net vendeur (${euros(d.net_vendeur)}) envoyé.`}
          </p>
          {['vendue', 'preparation', 'livree', 'payee'].includes(cible) && d.prix_vente == null && (
            <label className="block max-w-xs">
              <span className="block text-sm font-medium mb-1">Prix de vente final (€)</span>
              <input type="number" min={0} value={prixVente} onChange={(e) => setPrixVente(e.target.value)} className={champClasse} />
            </label>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => appliquer(cible)} disabled={envoi} className={boutonPrincipal}>{envoi ? '…' : 'Confirmer'}</button>
            <button type="button" onClick={() => setCible(null)} className={boutonSecondaire}>Annuler</button>
          </div>
        </div>
      )}
      <div className="mt-3"><Message texte={message.texte} erreur={message.erreur} /></div>
      {(d.vendu_le || d.paye_le) && (
        <p className="mt-2 text-sm text-[#444444]">
          {d.vendu_le && `Vendue le ${jour(d.vendu_le)}${d.prix_vente != null ? ` à ${euros(d.prix_vente)}` : ''}. `}
          {d.paye_le && `Déposant payé le ${jour(d.paye_le)}.`}
        </p>
      )}
      <p className="mt-2 text-xs text-[#666666]">Visites, essais et offres s'ajoutent dans « Suivi de la vente » ci-dessous.</p>
    </Carte>
  );
}

function Annonce({ dossier: d, vehicule, onMaj }: { dossier: Dossier; vehicule: { id: string; slug: string; available: boolean } | null; onMaj: (d: Dossier) => void }) {
  const navigate = useNavigate();
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState<{ texte: string; erreur?: boolean }>({ texte: '' });

  const creer = async () => {
    setEnvoi(true);
    setMessage({ texte: '' });
    const base = slug(`${d.marque}-${d.modele}-${d.annee ?? ''}`) || 'moto';
    const { data: v, error } = await supabase.from('vehicles').insert({
      slug: `${base}-${d.reference.slice(-4)}`.replace(/-+/g, '-'),
      brand: d.marque, model: [d.modele, d.version].filter(Boolean).join(' '), year: d.annee ?? new Date().getFullYear(),
      type: 'moto', price: d.prix_affiche ?? 0, mileage: d.etat_des_lieux?.kilometrage ?? d.kilometrage ?? 0,
      purchase_price: d.net_vendeur ?? 0, description: '', features: [], images: [],
      warranty: "Garantie 6 mois pièces et main d'œuvre", status: 'available', available: false,
    }).select('id').single();
    if (error || !v) {
      setEnvoi(false);
      return setMessage({ texte: 'La création de la fiche a échoué.', erreur: true });
    }
    const { data } = await supabase.from('depot_dossiers').update({ vehicle_id: v.id }).eq('id', d.id).select('*').single();
    if (data) onMaj(data as Dossier);
    navigate(`/admin/vehicles/edit/${v.id}`);
  };

  return (
    <Carte titre="Annonce sur le site" id="t-annonce">
      {vehicule ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-[#444444] flex-1 min-w-[14rem]">
            Fiche liée{vehicule.available ? ' — visible sur le site' : ' — masquée (elle s’affiche à l’étape « Annonce en ligne »)'}.
            Le statut (disponible, réservé, vendu) suit automatiquement les étapes de la vente.
          </p>
          <Link to={`/admin/vehicles/edit/${vehicule.id}`} className={`${boutonSecondaire} !py-1.5`}>Photos et description</Link>
          {vehicule.available && (
            <a href={`/vehicules/${vehicule.slug}`} target="_blank" rel="noopener noreferrer" className={`${boutonSecondaire} !py-1.5`}>
              <ExternalLink className="w-4 h-4" aria-hidden="true" /> Voir l'annonce
            </a>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-[#444444] flex-1 min-w-[14rem]">
            Créez la fiche annonce à partir du dossier (marque, modèle, prix, kilométrage, prix d'achat = net vendeur). Elle reste masquée
            jusqu'à l'étape « Annonce en ligne » ; ajoutez-y photos et description.
          </p>
          <button type="button" onClick={creer} disabled={envoi || ['resilie', 'cloture'].includes(d.statut_mandat)} className={boutonPrincipal}>
            {envoi ? 'Création…' : 'Créer la fiche annonce'}
          </button>
        </div>
      )}
      <div className="mt-2"><Message texte={message.texte} erreur={message.erreur} /></div>
    </Carte>
  );
}

function FinDossier({ dossier: d, onMaj, onSupprime }: { dossier: Dossier; onMaj: (d: Dossier) => void; onSupprime: () => void }) {
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState<{ texte: string; erreur?: boolean }>({ texte: '' });

  const changer = async (statut: StatutMandat, question: string) => {
    if (!window.confirm(question)) return;
    setEnvoi(true);
    const { data, error } = await supabase.from('depot_dossiers').update({ statut_mandat: statut }).eq('id', d.id).select('*').single();
    setEnvoi(false);
    if (error || !data) return setMessage({ texte: 'La mise à jour a échoué.', erreur: true });
    setMessage({ texte: 'Enregistré.' });
    onMaj(data as Dossier);
  };
  const supprimer = async () => {
    if (!window.confirm(`Supprimer définitivement le dossier ${d.reference}, ses documents et son historique ?`)) return;
    setEnvoi(true);
    const { error } = await supabase.from('depot_dossiers').delete().eq('id', d.id);
    setEnvoi(false);
    if (error) return setMessage({ texte: 'La suppression a échoué.', erreur: true });
    onSupprime();
  };

  const actions: React.ReactNode[] = [];
  if (d.statut_mandat === 'actif') {
    actions.push(
      <button key="r" type="button" disabled={envoi} className={boutonDanger}
        onClick={() => changer('resilie', `Le déposant reprend sa moto avant la fin du mandat ?\n\nL'indemnité de ${euros(d.frais_resiliation)} prévue au contrat est due (sauf geste commercial). L'annonce sera masquée.`)}>
        Fin anticipée : le déposant reprend sa moto
      </button>,
    );
  }
  if (['vendu', 'resilie', 'expire'].includes(d.statut_mandat)) {
    actions.push(
      <button key="c" type="button" disabled={envoi} className={boutonSecondaire}
        onClick={() => changer('cloture', d.statut_mandat === 'vendu' && d.statut_vente !== 'payee'
          ? 'Le déposant n’est pas encore marqué comme payé. Clôturer quand même ?'
          : 'Clôturer le dossier ? Il sera conservé 5 ans puis effacé automatiquement.')}>
        Clôturer le dossier
      </button>,
    );
  }
  const supprimable = d.statut_mandat === 'preparation';

  if (!actions.length && !supprimable) return null;
  return (
    <Carte titre="Fin du dossier" id="t-fin">
      <div className="flex flex-wrap gap-2">{actions}</div>
      {d.statut_mandat === 'expire' && (
        <p className="text-sm text-[#444444] mt-3">
          Mandat échu sans vente : prolongez-le par un avenant (onglet Contrat) ou rendez la moto puis clôturez. Gardiennage :{' '}
          {euros(d.gardiennage_par_jour)}/jour à partir de J+{d.gardiennage_delai_jours} après le {jour(d.date_fin)}.
        </p>
      )}
      {supprimable && (
        <button type="button" onClick={supprimer} disabled={envoi} className="mt-3 inline-flex items-center gap-2 text-sm text-red-700 hover:underline">
          <Trash2 className="w-4 h-4" aria-hidden="true" /> Supprimer ce dossier (aucun contrat préparé)
        </button>
      )}
      <div className="mt-2"><Message texte={message.texte} erreur={message.erreur} /></div>
    </Carte>
  );
}
