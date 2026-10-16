/**
 * Suivi de la vente : visites, essais, offres et notes (partagés ou non avec le
 * déposant), demandes envoyées par le déposant depuis « Suivre ma vente », et
 * journal technique (modifications, e-mails envoyés).
 */
import { useEffect, useState } from 'react';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { DEMANDES_PROPRIETAIRE, Dossier, STATUTS_DEMANDE, dateHeure, euros } from '../../../lib/depot';
import { Carte, Champ, Message, boutonPrincipal, boutonSecondaire, champClasse } from './ui';

interface Evenement { id: number; fait_le: string; par: string | null; type: string; titre: string; detail: string | null; montant: number | null; visible_proprietaire: boolean }
interface DemandeProp { id: string; cree_le: string; type: string; message: string | null; statut: string; reponse: string | null; traite_le: string | null; traite_par: string | null }

const TYPES_AJOUT: Record<string, { libelle: string; titre: string; visible: boolean }> = {
  visite: { libelle: 'Visite', titre: 'Visite de la moto', visible: true },
  essai: { libelle: 'Essai', titre: 'Essai routier (avec votre accord)', visible: true },
  offre: { libelle: 'Offre reçue', titre: "Offre d'un acheteur", visible: true },
  note: { libelle: 'Note interne', titre: '', visible: false },
};
const SUPPRIMABLES = ['visite', 'essai', 'offre', 'note'];
const ICONES: Record<string, string> = {
  creation: '📁', mandat: '📄', vente: '🏍️', visite: '👀', essai: '🛣️', offre: '💶', document: '📎', contrat: '✍️',
  demande_proprietaire: '💬', note: '📝', email: '✉️', alerte: '⏰',
};

async function moi() {
  return (await supabase.auth.getUser()).data.user?.email ?? null;
}

export function DossierFil({ dossier: d, version }: { dossier: Dossier; version: number }) {
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [demandes, setDemandes] = useState<DemandeProp[]>([]);
  const [type, setType] = useState('visite');
  const [titre, setTitre] = useState(TYPES_AJOUT.visite.titre);
  const [detail, setDetail] = useState('');
  const [montant, setMontant] = useState('');
  const [visible, setVisible] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState<{ texte: string; erreur?: boolean }>({ texte: '' });

  const charger = async () => {
    const [{ data: ev }, { data: dem }] = await Promise.all([
      supabase.from('depot_evenements').select('*').eq('dossier_id', d.id).order('fait_le', { ascending: false }),
      supabase.from('depot_demandes_proprietaire').select('*').eq('dossier_id', d.id).order('cree_le', { ascending: false }),
    ]);
    setEvenements((ev ?? []) as Evenement[]);
    setDemandes((dem ?? []) as DemandeProp[]);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { charger(); }, [d.id, version]);

  const choisirType = (t: string) => {
    setType(t);
    setTitre(TYPES_AJOUT[t].titre);
    setVisible(TYPES_AJOUT[t].visible);
  };

  const ajouter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre.trim()) return setMessage({ texte: 'Indiquez un titre.', erreur: true });
    setEnvoi(true);
    setMessage({ texte: '' });
    const { error } = await supabase.from('depot_evenements').insert({
      dossier_id: d.id, type, titre: titre.trim(), detail: detail.trim() || null,
      montant: type === 'offre' && montant ? Number(montant) : null, visible_proprietaire: type === 'note' ? false : visible, par: await moi(),
    });
    setEnvoi(false);
    if (error) return setMessage({ texte: "L'ajout a échoué.", erreur: true });
    setDetail('');
    setMontant('');
    choisirType(type);
    setMessage({ texte: visible && type !== 'note' ? 'Ajouté. Le déposant le verra dans son suivi.' : 'Ajouté.' });
    charger();
  };

  const basculer = async (ev: Evenement) => {
    await supabase.from('depot_evenements').update({ visible_proprietaire: !ev.visible_proprietaire }).eq('id', ev.id);
    charger();
  };
  const supprimer = async (ev: Evenement) => {
    if (!window.confirm(`Supprimer « ${ev.titre} » ?`)) return;
    await supabase.from('depot_evenements').delete().eq('id', ev.id);
    charger();
  };

  const ouvertes = demandes.filter((x) => ['nouvelle', 'en_cours'].includes(x.statut)).length;

  return (
    <div className="space-y-6">
      <Carte titre={`Demandes du déposant${ouvertes ? ` (${ouvertes} à traiter)` : ''}`} id="t-demandes-prop">
        {demandes.length === 0 ? (
          <p className="text-sm text-[#666666]">Aucune demande envoyée depuis l'espace « Suivre ma vente ».</p>
        ) : (
          <ul className="space-y-3">
            {demandes.map((x) => <DemandeLigne key={x.id} demande={x} onMaj={charger} />)}
          </ul>
        )}
      </Carte>

      <Carte titre="Suivi de la vente" id="t-fil">
        <form onSubmit={ajouter} className="rounded-xl bg-[#F7F7F7] p-4 space-y-3 mb-5">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Type d'événement">
            {Object.entries(TYPES_AJOUT).map(([cle, t]) => (
              <button key={cle} type="button" onClick={() => choisirType(cle)} aria-pressed={type === cle}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border ${type === cle ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white border-[#D1D5DB]'}`}>
                {t.libelle}
              </button>
            ))}
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Champ libelle="Titre">
                {(id) => <input id={id} value={titre} maxLength={200} onChange={(e) => setTitre(e.target.value)} className={champClasse} placeholder="Ex. Appel d'un acheteur intéressé" />}
              </Champ>
            </div>
            {type === 'offre' && (
              <Champ libelle="Montant proposé (€)">
                {(id) => <input id={id} type="number" min={0} value={montant} onChange={(e) => setMontant(e.target.value)} className={champClasse} />}
              </Champ>
            )}
          </div>
          <Champ libelle="Détail (facultatif)">
            {(id) => <textarea id={id} rows={2} maxLength={3000} value={detail} onChange={(e) => setDetail(e.target.value)} className={champClasse} />}
          </Champ>
          <div className="flex flex-wrap items-center gap-3">
            {type !== 'note' && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} className="w-4 h-4" />
                Visible par le déposant{type === 'offre' && ' (il reçoit aussi un e-mail)'}
              </label>
            )}
            <button type="submit" disabled={envoi} className={`${boutonPrincipal} ml-auto`}>{envoi ? 'Ajout…' : 'Ajouter'}</button>
          </div>
          <Message texte={message.texte} erreur={message.erreur} />
        </form>

        {evenements.length === 0 ? (
          <p className="text-sm text-[#666666]">Aucun événement.</p>
        ) : (
          <ol className="space-y-3">
            {evenements.map((ev) => (
              <li key={ev.id} className="flex gap-3 text-sm">
                <span className="w-7 text-center flex-shrink-0" aria-hidden="true">{ICONES[ev.type] ?? '•'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[#111111] font-medium">
                    {ev.titre}{ev.montant != null && ` — ${euros(ev.montant)}`}
                  </p>
                  {ev.detail && <p className="text-[#444444] whitespace-pre-line">{ev.detail}</p>}
                  <p className="text-xs text-[#666666]">{dateHeure(ev.fait_le)}{ev.par ? ` · ${ev.par}` : ''}</p>
                </div>
                <button type="button" onClick={() => basculer(ev)} aria-pressed={ev.visible_proprietaire}
                  title="Visible dans l'espace « Suivre ma vente » du déposant"
                  className={`self-start inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs ${ev.visible_proprietaire ? 'border-green-300 bg-green-50 text-green-800' : 'border-[#D1D5DB] text-[#555555]'}`}>
                  {ev.visible_proprietaire ? <Eye className="w-3 h-3" aria-hidden="true" /> : <EyeOff className="w-3 h-3" aria-hidden="true" />}
                  {ev.visible_proprietaire ? 'Partagé' : 'Interne'}
                </button>
                {SUPPRIMABLES.includes(ev.type) && (
                  <button type="button" onClick={() => supprimer(ev)} className="self-start p-1 rounded text-red-700 hover:bg-red-50" aria-label={`Supprimer ${ev.titre}`}>
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ol>
        )}
      </Carte>

      <Journal dossierId={d.id} version={version} />
    </div>
  );
}

function DemandeLigne({ demande: x, onMaj }: { demande: DemandeProp; onMaj: () => void }) {
  const [statut, setStatut] = useState(x.statut);
  const [reponse, setReponse] = useState(x.reponse ?? '');
  const [envoi, setEnvoi] = useState(false);
  const modifie = statut !== x.statut || reponse !== (x.reponse ?? '');
  const enregistrer = async () => {
    setEnvoi(true);
    const fini = ['acceptee', 'refusee', 'terminee'].includes(statut);
    await supabase.from('depot_demandes_proprietaire').update({
      statut, reponse: reponse.trim() || null, ...(fini ? { traite_le: new Date().toISOString(), traite_par: await moi() } : {}),
    }).eq('id', x.id);
    setEnvoi(false);
    onMaj();
  };
  const ouverte = ['nouvelle', 'en_cours'].includes(x.statut);
  return (
    <li className={`rounded-xl border p-4 ${ouverte ? 'border-brand/50 bg-red-50/30' : 'border-[#E5E5E5]'}`}>
      <p className="font-semibold text-[#111111]">
        {DEMANDES_PROPRIETAIRE[x.type] ?? x.type} <span className="font-normal text-xs text-[#666666]">· {dateHeure(x.cree_le)}</span>
      </p>
      {x.message && <p className="text-sm text-[#333333] whitespace-pre-line mt-1">« {x.message} »</p>}
      {x.type === 'reprise_anticipee' && (
        <p className="text-xs text-[#8A5A00] mt-1">Fin anticipée : indemnité prévue au contrat (sauf geste commercial, ex. vente à un proche).</p>
      )}
      <div className="grid sm:grid-cols-[12rem_1fr_auto] gap-2 mt-3 items-end">
        <Champ libelle="Statut">
          {(id) => (
            <select id={id} value={statut} onChange={(e) => setStatut(e.target.value)} className={champClasse}>
              {Object.entries(STATUTS_DEMANDE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          )}
        </Champ>
        <Champ libelle="Réponse visible par le déposant (facultatif)">
          {(id) => <input id={id} maxLength={2000} value={reponse} onChange={(e) => setReponse(e.target.value)} className={champClasse} />}
        </Champ>
        <button type="button" onClick={enregistrer} disabled={!modifie || envoi} className={boutonSecondaire}>{envoi ? '…' : 'Enregistrer'}</button>
      </div>
      {x.traite_le && <p className="text-xs text-[#666666] mt-2">Traitée le {dateHeure(x.traite_le)}{x.traite_par ? ` par ${x.traite_par}` : ''}</p>}
    </li>
  );
}

interface LigneAudit { id: number; fait_le: string; par_email: string | null; table_nom: string; action: string; avant: Record<string, unknown> | null; apres: Record<string, unknown> | null }
interface Courriel { id: number; cree_le: string; destinataire: string; sujet: string; statut: string; erreur: string | null }

function Journal({ dossierId, version }: { dossierId: string; version: number }) {
  const [ouvert, setOuvert] = useState(false);
  const [audit, setAudit] = useState<LigneAudit[]>([]);
  const [emails, setEmails] = useState<Courriel[]>([]);
  useEffect(() => {
    if (!ouvert) return;
    Promise.all([
      supabase.from('journal_audit').select('*').eq('table_nom', 'depot_dossiers').eq('ligne_id', dossierId).order('fait_le', { ascending: false }).limit(100),
      supabase.from('depot_emails').select('id, cree_le, destinataire, sujet, statut, erreur').eq('dossier_id', dossierId).order('cree_le', { ascending: false }),
    ]).then(([a, e]) => {
      setAudit((a.data ?? []) as LigneAudit[]);
      setEmails((e.data ?? []) as Courriel[]);
    });
  }, [ouvert, dossierId, version]);

  return (
    <Carte titre="Journal" id="t-journal" action={
      <button type="button" onClick={() => setOuvert((o) => !o)} className={`${boutonSecondaire} !py-1.5`} aria-expanded={ouvert}>
        {ouvert ? 'Masquer' : 'Afficher'}
      </button>
    }>
      {!ouvert ? (
        <p className="text-sm text-[#666666]">Toutes les modifications du dossier (qui, quand, avant / après) et les e-mails automatiques envoyés.</p>
      ) : (
        <div className="space-y-5">
          <div>
            <h3 className="font-semibold text-sm mb-2">E-mails automatiques ({emails.length})</h3>
            {emails.length === 0 ? <p className="text-sm text-[#666666]">Aucun.</p> : (
              <ul className="text-sm space-y-1">
                {emails.map((m) => (
                  <li key={m.id}>
                    {dateHeure(m.cree_le)} — {m.sujet} → {m.destinataire}{' '}
                    <span className={m.statut === 'erreur' ? 'text-red-700' : 'text-[#666666]'}>({m.statut === 'envoye' ? 'envoyé' : m.statut}{m.erreur ? ` : ${m.erreur}` : ''})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-2">Modifications ({audit.length})</h3>
            <ul className="text-xs space-y-2">
              {audit.map((l) => (
                <li key={l.id} className="border-l-2 border-[#D1D5DB] pl-2">
                  <p className="text-[#666666]">{dateHeure(l.fait_le)} · {l.par_email ?? 'système'} · {l.action}</p>
                  {l.apres && (
                    <p className="text-[#333333] break-words">
                      {Object.keys(l.apres).filter((k) => !['updated_at'].includes(k)).slice(0, 12).map((k) => (
                        <span key={k} className="mr-3"><strong>{k}</strong> : {JSON.stringify(l.avant?.[k] ?? null)} → {JSON.stringify(l.apres?.[k])}</span>
                      ))}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Carte>
  );
}
