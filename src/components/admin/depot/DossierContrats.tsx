/**
 * Contrat : préparation du mandat (ou d'un avenant de prolongation), lien de
 * signature + QR code à montrer au showroom, renvoi, annulation, dossier de preuve.
 * Le PDF est produit et figé par le serveur (empreinte SHA-256) : il ne peut pas
 * être modifié depuis l'administration.
 */
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Download, FileSignature, Mail, QrCode, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Dossier, appelAdmin, dateHeure, euros, jour, messageErreur } from '../../../lib/depot';
import { ouvrirDocument } from './DossierPieces';
import { Carte, Champ, Message, boutonDanger, boutonPrincipal, boutonSecondaire, champClasse } from './ui';

interface Contrat {
  id: string;
  type: 'mandat' | 'avenant';
  numero: number;
  statut: 'a_signer' | 'signe' | 'refuse' | 'expire' | 'annule';
  modele_version: string;
  pdf_chemin: string;
  pdf_sha256: string;
  invitation_expire_le: string | null;
  codes_envoyes: number;
  code_envoye_le: string | null;
  renonciation_retractation: boolean | null;
  signe_le: string | null;
  signe_pdf_chemin: string | null;
  signe_pdf_sha256: string | null;
  cree_le: string;
  cree_par: string | null;
  donnees: { conditions?: { prix_affiche: number; net_vendeur: number; date_debut: string; date_fin: string } };
}
interface Preuve { id: number; fait_le: string; evenement: string; ip: string | null; detail: Record<string, unknown> | null }

const COLONNES =
  'id, type, numero, statut, modele_version, pdf_chemin, pdf_sha256, invitation_expire_le, codes_envoyes, code_envoye_le, renonciation_retractation, signe_le, signe_pdf_chemin, signe_pdf_sha256, cree_le, cree_par, donnees';
const STATUT: Record<Contrat['statut'], { libelle: string; classe: string }> = {
  a_signer: { libelle: 'À signer', classe: 'bg-amber-50 text-amber-800 border-amber-200' },
  signe: { libelle: 'Signé', classe: 'bg-green-50 text-green-800 border-green-200' },
  refuse: { libelle: 'Refusé', classe: 'bg-red-50 text-red-800 border-red-200' },
  expire: { libelle: 'Lien expiré', classe: 'bg-gray-100 text-gray-700 border-gray-200' },
  annule: { libelle: 'Annulé', classe: 'bg-gray-100 text-gray-600 border-gray-200' },
};
const PREUVES: Record<string, string> = {
  cree: 'PDF créé et figé', invitation_creee: 'Lien de signature créé', invitation_envoyee: 'Lien envoyé par e-mail',
  document_ouvert: 'Contrat ouvert par le déposant', code_envoye: 'Code de signature envoyé', code_refuse: 'Code erroné saisi',
  signe: 'Signé', annule: 'Annulé', empreinte_differente: 'Empreinte différente : signature bloquée', expire: 'Lien expiré',
};
const nomContrat = (c: Pick<Contrat, 'type' | 'numero'>) => (c.type === 'mandat' ? 'Mandat de dépôt-vente' : `Avenant n° ${c.numero - 1}`);

export function DossierContrats({ dossier: d, onChange }: { dossier: Dossier; onChange: () => void }) {
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [preuves, setPreuves] = useState<Record<string, Preuve[]>>({});
  const [lien, setLien] = useState<{ contratId: string; url: string; expire: string; qr: string } | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState<{ texte: string; erreur?: boolean }>({ texte: '' });
  const [avenant, setAvenant] = useState(false);
  const [av, setAv] = useState({ mois: '1', prix_affiche: '', net_vendeur: '' });
  const [envoyerEmail, setEnvoyerEmail] = useState(false);
  const [representant, setRepresentant] = useState('');

  const charger = async () => {
    const { data } = await supabase.from('depot_contrats').select(COLONNES).eq('dossier_id', d.id).order('numero', { ascending: false });
    const liste = (data ?? []) as Contrat[];
    setContrats(liste);
    if (liste.length) {
      const { data: p } = await supabase.from('depot_contrat_preuves').select('id, contrat_id, fait_le, evenement, ip, detail')
        .in('contrat_id', liste.map((c) => c.id)).order('fait_le');
      const g: Record<string, Preuve[]> = {};
      for (const x of (p ?? []) as (Preuve & { contrat_id: string })[]) (g[x.contrat_id] ??= []).push(x);
      setPreuves(g);
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { charger(); }, [d.id, d.statut_mandat]);

  const afficherLien = async (contratId: string, url: string, expire: string) => {
    const qr = await QRCode.toDataURL(url, { margin: 1, width: 320, errorCorrectionLevel: 'M' });
    setLien({ contratId, url, expire, qr });
  };

  const preparer = async (type: 'mandat' | 'avenant') => {
    setEnvoi(true);
    setMessage({ texte: '' });
    try {
      const corps: Record<string, unknown> = { dossier_id: d.id, type, envoyer_email: envoyerEmail, representant: representant.trim() || undefined };
      if (type === 'avenant') {
        corps.mois = Number(av.mois) || 1;
        if (av.prix_affiche) corps.prix_affiche = Number(av.prix_affiche);
        if (av.net_vendeur) corps.net_vendeur = Number(av.net_vendeur);
      }
      const r = await appelAdmin<{ contrat_id: string; url: string; expire_le: string }>('contrat-preparer', corps);
      await afficherLien(r.contrat_id, r.url, r.expire_le);
      setMessage({ texte: envoyerEmail ? 'Contrat prêt : lien envoyé par e-mail au déposant.' : 'Contrat prêt : faites scanner le QR code au déposant.' });
      setAvenant(false);
      await charger();
      onChange();
    } catch (e) {
      setMessage({ texte: messageErreur(e), erreur: true });
    } finally {
      setEnvoi(false);
    }
  };

  const renvoyer = async (c: Contrat, email: boolean) => {
    setEnvoi(true);
    setMessage({ texte: '' });
    try {
      const r = await appelAdmin<{ url: string; expire_le: string }>('contrat-renvoyer', { contrat_id: c.id, envoyer_email: email });
      await afficherLien(c.id, r.url, r.expire_le);
      setMessage({ texte: email ? 'Nouveau lien envoyé par e-mail (l’ancien ne fonctionne plus).' : 'Nouveau lien créé (l’ancien ne fonctionne plus).' });
      await charger();
    } catch (e) {
      setMessage({ texte: messageErreur(e), erreur: true });
    } finally {
      setEnvoi(false);
    }
  };

  const annuler = async (c: Contrat) => {
    const motif = window.prompt('Annuler ce contrat non signé ? Indiquez le motif (facultatif) :', '');
    if (motif === null) return;
    setEnvoi(true);
    try {
      await appelAdmin('contrat-annuler', { contrat_id: c.id, motif });
      setLien(null);
      setMessage({ texte: 'Contrat annulé.' });
      await charger();
      onChange();
    } catch (e) {
      setMessage({ texte: messageErreur(e), erreur: true });
    } finally {
      setEnvoi(false);
    }
  };

  const copier = async () => {
    if (!lien) return;
    try {
      await navigator.clipboard.writeText(lien.url);
      setMessage({ texte: 'Lien copié.' });
    } catch {
      setMessage({ texte: 'Copie impossible : sélectionnez le lien à la main.', erreur: true });
    }
  };

  const aSigner = contrats.find((c) => c.statut === 'a_signer');
  const mandatSigne = contrats.some((c) => c.type === 'mandat' && c.statut === 'signe');
  const peutPreparerMandat = !mandatSigne && ['preparation', 'a_signer'].includes(d.statut_mandat);
  const peutAvenant = mandatSigne && ['actif', 'expire'].includes(d.statut_mandat);

  return (
    <Carte titre="Contrat et signature" id="t-contrat">
      {lien && (
        <div className="mb-5 rounded-2xl border-2 border-bleu bg-blue-50/60 p-4 md:p-5 flex flex-col md:flex-row gap-5 items-center" aria-live="polite">
          <img src={lien.qr} alt="QR code du lien de signature" className="w-48 h-48 rounded-xl bg-white p-2" />
          <div className="flex-1 min-w-0 space-y-2">
            <p className="font-semibold text-[#111111] flex items-center gap-2"><QrCode className="w-5 h-5" aria-hidden="true" /> À scanner par le déposant avec son téléphone</p>
            <p className="text-sm text-[#444444]">
              Il lit le contrat, coche les cases, reçoit un code par e-mail ({d.prop_email}) et signe. Lien personnel valable jusqu'au {dateHeure(lien.expire)}.
            </p>
            <p className="text-xs text-[#555555] break-all bg-white rounded-lg px-3 py-2 border border-[#D1D5DB]">{lien.url}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={copier} className={`${boutonSecondaire} !py-1.5`}><Copy className="w-4 h-4" aria-hidden="true" /> Copier le lien</button>
              <button type="button" onClick={() => setLien(null)} className={`${boutonSecondaire} !py-1.5`}>Masquer</button>
            </div>
          </div>
        </div>
      )}

      {(peutPreparerMandat || peutAvenant) && !aSigner && (
        <div className="rounded-xl bg-[#F7F7F7] p-4 space-y-4 mb-5">
          {peutPreparerMandat ? (
            <p className="text-sm text-[#333333]">
              Le serveur vérifie le dossier (adresse, prix, immatriculation, 4 pièces, état des lieux), produit le PDF du mandat
              ({d.duree_mois} mois à partir d'aujourd'hui, {euros(d.prix_affiche)} affichés, net vendeur {euros(d.net_vendeur)}) et crée le lien de signature.
            </p>
          ) : (
            <>
              <p className="text-sm text-[#333333]">
                Prolongation du mandat (fin actuelle : {jour(d.date_fin)}). Chaque prolongation fait l'objet d'un avenant signé.
              </p>
              {avenant && (
                <div className="grid sm:grid-cols-3 gap-3">
                  <Champ libelle="Prolonger de (mois)">
                    {(id) => <input id={id} type="number" min={1} max={12} value={av.mois} onChange={(e) => setAv((x) => ({ ...x, mois: e.target.value }))} className={champClasse} />}
                  </Champ>
                  <Champ libelle="Nouveau prix affiché (facultatif)" aide={`Actuel : ${euros(d.prix_affiche)}`}>
                    {(id) => <input id={id} type="number" min={0} value={av.prix_affiche} onChange={(e) => setAv((x) => ({ ...x, prix_affiche: e.target.value }))} className={champClasse} />}
                  </Champ>
                  <Champ libelle="Nouveau net vendeur (facultatif)" aide={`Actuel : ${euros(d.net_vendeur)}`}>
                    {(id) => <input id={id} type="number" min={0} value={av.net_vendeur} onChange={(e) => setAv((x) => ({ ...x, net_vendeur: e.target.value }))} className={champClasse} />}
                  </Champ>
                </div>
              )}
            </>
          )}
          {(peutPreparerMandat || avenant) && (
            <div className="grid sm:grid-cols-2 gap-3">
              <Champ libelle="Signé pour SVM Ride par" aide="Toute personne habilitée (par défaut : Mattia SARAVIA)">
                {(id) => <input id={id} maxLength={80} value={representant} placeholder="Mattia SARAVIA" onChange={(e) => setRepresentant(e.target.value)} className={champClasse} />}
              </Champ>
              <label className="flex items-start gap-2 text-sm self-end pb-2">
                <input type="checkbox" checked={envoyerEmail} onChange={(e) => setEnvoyerEmail(e.target.checked)} className="mt-0.5 w-4 h-4" />
                <span>Envoyer aussi le lien par e-mail au déposant (signature à distance)</span>
              </label>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {peutPreparerMandat && (
              <button type="button" onClick={() => preparer('mandat')} disabled={envoi} className={boutonPrincipal}>
                <FileSignature className="w-4 h-4" aria-hidden="true" /> {envoi ? 'Préparation…' : 'Préparer le contrat à signer'}
              </button>
            )}
            {peutAvenant && !avenant && (
              <button type="button" onClick={() => setAvenant(true)} className={boutonSecondaire}>
                <FileSignature className="w-4 h-4" aria-hidden="true" /> Préparer un avenant de prolongation
              </button>
            )}
            {peutAvenant && avenant && (
              <>
                <button type="button" onClick={() => preparer('avenant')} disabled={envoi} className={boutonPrincipal}>
                  {envoi ? 'Préparation…' : "Préparer l'avenant à signer"}
                </button>
                <button type="button" onClick={() => setAvenant(false)} className={boutonSecondaire}>Annuler</button>
              </>
            )}
          </div>
        </div>
      )}

      <Message texte={message.texte} erreur={message.erreur} />

      {contrats.length === 0 ? (
        <p className="text-sm text-[#666666] mt-2">Aucun contrat pour le moment.</p>
      ) : (
        <ul className="space-y-4 mt-3">
          {contrats.map((c) => (
            <li key={c.id} className="rounded-xl border border-[#E5E5E5] p-4">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="font-semibold text-[#111111]">{nomContrat(c)}</span>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full border text-xs font-semibold ${STATUT[c.statut].classe}`}>{STATUT[c.statut].libelle}</span>
                <span className="text-xs text-[#666666] ml-auto">Créé le {dateHeure(c.cree_le)}{c.cree_par ? ` par ${c.cree_par}` : ''}</span>
              </div>
              {c.donnees?.conditions && (
                <p className="text-sm text-[#444444]">
                  {euros(c.donnees.conditions.prix_affiche)} affichés · net vendeur {euros(c.donnees.conditions.net_vendeur)} · du {jour(c.donnees.conditions.date_debut)} au {jour(c.donnees.conditions.date_fin)}
                </p>
              )}
              {c.statut === 'signe' && (
                <p className="text-sm text-green-800 mt-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" /> Signé le {dateHeure(c.signe_le)}
                  {c.renonciation_retractation && ' · exécution immédiate demandée'}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                <button type="button" onClick={() => ouvrirDocument(c.signe_pdf_chemin ?? c.pdf_chemin)} className={`${boutonSecondaire} !py-1.5`}>
                  <Download className="w-4 h-4" aria-hidden="true" /> {c.signe_pdf_chemin ? 'PDF signé' : 'PDF à signer'}
                </button>
                {c.statut === 'a_signer' && (
                  <>
                    <button type="button" onClick={() => renvoyer(c, false)} disabled={envoi} className={`${boutonSecondaire} !py-1.5`}>
                      <RefreshCw className="w-4 h-4" aria-hidden="true" /> Nouveau QR code
                    </button>
                    <button type="button" onClick={() => renvoyer(c, true)} disabled={envoi} className={`${boutonSecondaire} !py-1.5`}>
                      <Mail className="w-4 h-4" aria-hidden="true" /> Renvoyer par e-mail
                    </button>
                    <button type="button" onClick={() => annuler(c)} disabled={envoi} className={`${boutonDanger} !py-1.5`}>
                      <XCircle className="w-4 h-4" aria-hidden="true" /> Annuler
                    </button>
                  </>
                )}
              </div>
              {c.statut === 'a_signer' && c.invitation_expire_le && (
                <p className="text-xs text-[#666666] mt-2">
                  Lien valable jusqu'au {dateHeure(c.invitation_expire_le)}{c.codes_envoyes ? ` · ${c.codes_envoyes} code(s) envoyé(s), dernier le ${dateHeure(c.code_envoye_le)}` : ''}.
                  {lien?.contratId !== c.id && ' Le lien n’est pas conservé en clair : « Nouveau QR code » en crée un autre.'}
                </p>
              )}
              {(preuves[c.id]?.length ?? 0) > 0 && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm text-bleu">Dossier de preuve ({preuves[c.id].length} étapes)</summary>
                  <ol className="mt-2 space-y-1 text-xs text-[#444444]">
                    {preuves[c.id].map((p) => (
                      <li key={p.id} className="border-l-2 border-[#D1D5DB] pl-2">
                        {dateHeure(p.fait_le)} — {PREUVES[p.evenement] ?? p.evenement}
                        {p.ip ? ` · IP ${p.ip}` : ''}
                        {typeof p.detail?.par === 'string' ? ` · ${p.detail.par}` : ''}
                      </li>
                    ))}
                  </ol>
                  <p className="text-xs text-[#666666] mt-2 break-all">Empreinte SHA-256 du PDF : {c.pdf_sha256}{c.signe_pdf_sha256 ? ` · PDF signé : ${c.signe_pdf_sha256}` : ''}</p>
                  <p className="text-xs text-[#666666]">Modèle : {c.modele_version}</p>
                </details>
              )}
            </li>
          ))}
        </ul>
      )}
    </Carte>
  );
}
