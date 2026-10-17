/**
 * Admin — dépôt-vente : demandes d'estimation reçues par la page
 * « Vendre ma moto ». Liste filtrable, fiche détaillée avec photos (liens
 * temporaires), changement de statut avec note, historique consigné par la
 * base (qui, quand, avant / après).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Camera, ExternalLink, FolderPlus, FolderOpen, Mail, Phone, Search, Trash2, X } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { DepotOnglets } from '../../components/admin/DepotOnglets';
import { appelAdmin, messageErreur } from '../../lib/depot';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';
import { supabase } from '../../lib/supabase';
import { AvisSansSuite } from '../../components/admin/AvisSansSuite';

type Statut = 'nouvelle' | 'a_qualifier' | 'en_echange' | 'acceptee' | 'refusee' | 'sans_suite';

interface Demande {
  id: string;
  reference: string;
  created_at: string;
  statut: Statut;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  marque: string;
  modele: string;
  version: string | null;
  annee: number;
  kilometrage: number;
  immatriculation: string | null;
  etat: string;
  entretien: string | null;
  prix_souhaite: number | null;
  commentaire: string | null;
  photos: { path: string; taille?: number | null }[];
  lu_le: string | null;
  accuse_envoye_le: string | null;
  consentement_le: string;
  sans_suite_le: string | null;
}

interface Evenement {
  id: number;
  fait_le: string;
  par: string | null;
  action: 'creation' | 'statut' | 'note';
  ancien_statut: string | null;
  nouveau_statut: string | null;
  note: string | null;
}

export const STATUTS: Record<Statut, { libelle: string; classe: string }> = {
  nouvelle: { libelle: 'Nouvelle', classe: 'bg-blue-50 text-blue-800 border-blue-200' },
  a_qualifier: { libelle: 'À qualifier', classe: 'bg-amber-50 text-amber-800 border-amber-200' },
  en_echange: { libelle: 'En échange', classe: 'bg-violet-50 text-violet-800 border-violet-200' },
  acceptee: { libelle: 'Acceptée', classe: 'bg-green-50 text-green-800 border-green-200' },
  refusee: { libelle: 'Refusée', classe: 'bg-red-50 text-red-800 border-red-200' },
  sans_suite: { libelle: 'Sans suite', classe: 'bg-gray-100 text-gray-700 border-gray-200' },
};
/** Libellés des statuts qui n'existent plus (historique) */
const ANCIENS_STATUTS: Record<string, string> = { abandonnee: 'Abandonnée' };
const libelleStatut = (s: string | null) => (s && (STATUTS[s as Statut]?.libelle ?? ANCIENS_STATUTS[s])) || s;
const ORDRE: Statut[] = ['nouvelle', 'a_qualifier', 'en_echange', 'acceptee', 'refusee', 'sans_suite'];
const ACTIVES: Statut[] = ['nouvelle', 'a_qualifier', 'en_echange'];

const ETATS: Record<string, string> = {
  excellent: 'Excellent', tres_bon: 'Très bon', bon: 'Bon', correct: 'Correct', a_reviser: 'À réviser',
};
const ENTRETIENS: Record<string, string> = {
  complet: 'Carnet à jour (factures)', partiel: 'Entretien partiel', inconnu: 'Ne sait pas',
};

const date = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const nombre = (n: number) => n.toLocaleString('fr-FR');
const normaliser = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function Badge({ statut }: { statut: Statut }) {
  const s = STATUTS[statut];
  return <span className={`inline-flex px-2.5 py-1 rounded-full border text-xs font-semibold whitespace-nowrap ${s.classe}`}>{s.libelle}</span>;
}

export function DepotDemandesList() {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [filtre, setFiltre] = useState<'actives' | 'toutes' | Statut>('actives');
  const [recherche, setRecherche] = useState('');
  const [params, setParams] = useSearchParams();
  const ouverte = params.get('demande');

  const charger = useCallback(async () => {
    const { data, error } = await supabase
      .from('depot_demandes')
      .select('*')
      .eq('envoi_termine', true)
      .order('created_at', { ascending: false });
    if (error) setErreur("Impossible de charger les demandes. Vérifiez que vous êtes connecté avec un compte administrateur.");
    else setDemandes((data ?? []) as Demande[]);
    setChargement(false);
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const compte = useMemo(() => {
    const c: Record<string, number> = { toutes: demandes.length, actives: 0 };
    for (const d of demandes) {
      c[d.statut] = (c[d.statut] ?? 0) + 1;
      if (ACTIVES.includes(d.statut)) c.actives += 1;
    }
    return c;
  }, [demandes]);

  const visibles = useMemo(() => {
    const q = normaliser(recherche.trim());
    return demandes.filter((d) => {
      if (filtre === 'actives' && !ACTIVES.includes(d.statut)) return false;
      if (filtre !== 'actives' && filtre !== 'toutes' && d.statut !== filtre) return false;
      if (!q) return true;
      return normaliser(
        [d.reference, d.prenom, d.nom, d.email, d.telephone, d.marque, d.modele, d.version, d.immatriculation].join(' '),
      ).includes(q);
    });
  }, [demandes, filtre, recherche]);

  const demandeOuverte = demandes.find((d) => d.id === ouverte) ?? null;
  const ouvrir = (id: string | null) => {
    const p = new URLSearchParams(params);
    if (id) p.set('demande', id);
    else p.delete('demande');
    setParams(p, { replace: !id });
  };

  const filtres: { cle: 'actives' | 'toutes' | Statut; libelle: string }[] = [
    { cle: 'actives', libelle: 'À traiter' },
    ...ORDRE.map((s) => ({ cle: s, libelle: STATUTS[s].libelle })),
    { cle: 'toutes', libelle: 'Toutes' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#111111]">Dépôt-vente</h1>
          <p className="text-[#666666] mt-1">Demandes d'estimation reçues par la page « Vendre ma moto ». Réponse annoncée : 48 h ouvrées.</p>
        </div>

        <DepotOnglets demandes={compte.nouvelle} />

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par statut">
            {filtres.map((f) => (
              <button
                key={f.cle}
                type="button"
                onClick={() => setFiltre(f.cle)}
                aria-pressed={filtre === f.cle}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap transition-colors ${
                  filtre === f.cle ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-[#444444] border-[#D1D5DB] hover:border-[#111111]'
                }`}
              >
                {f.libelle} <span className="tabular-nums opacity-70">({compte[f.cle] ?? 0})</span>
              </button>
            ))}
          </div>
          <label className="relative block w-full sm:max-w-md">
            <span className="sr-only">Rechercher une demande</span>
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#767676]" aria-hidden="true" />
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Nom, e-mail, moto, référence…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#D1D5DB] bg-white text-sm focus:outline-none focus:border-bleu focus:ring-4 focus:ring-bleu/15"
            />
          </label>
        </div>

        {erreur && <p className="text-red-700" role="alert">{erreur}</p>}

        {chargement ? (
          <p className="text-[#666666]">Chargement…</p>
        ) : visibles.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-[#D1D5DB] p-10 text-center text-[#666666]">
            {demandes.length === 0 ? 'Aucune demande pour le moment.' : 'Aucune demande ne correspond à ces critères.'}
          </div>
        ) : (
          <ul className="space-y-3">
            {visibles.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => ouvrir(d.id)}
                  className="w-full text-left bg-white rounded-xl border-2 border-[#D1D5DB] hover:border-[#111111] p-4 md:p-5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A8CFF]"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
                    {!d.lu_le && <span className="w-2.5 h-2.5 rounded-full bg-bleu" aria-label="Non lue" />}
                    <span className="font-semibold text-[#111111] tabular-nums">{d.reference}</span>
                    <Badge statut={d.statut} />
                    <span className="text-sm text-[#666666] ml-auto">{date(d.created_at)}</span>
                  </div>
                  <p className="text-lg font-semibold text-[#111111]">
                    {d.marque} {d.modele} <span className="font-normal text-[#666666]">· {d.annee} · {nombre(d.kilometrage)} km</span>
                  </p>
                  <p className="text-sm text-[#444444] mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <span>{d.prenom} {d.nom}</span>
                    <span>{d.prix_souhaite != null ? `Prix souhaité : ${nombre(d.prix_souhaite)} €` : 'Sans prix souhaité'}</span>
                    <span className="inline-flex items-center gap-1"><Camera className="w-4 h-4" aria-hidden="true" />{d.photos.length}</span>
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {demandeOuverte && (
        <FicheDemande
          demande={demandeOuverte}
          onFermer={() => ouvrir(null)}
          onMaj={(maj) => setDemandes((l) => l.map((d) => (d.id === maj.id ? { ...d, ...maj } : d)))}
          onSuppression={(id) => {
            setDemandes((l) => l.filter((d) => d.id !== id));
            ouvrir(null);
          }}
        />
      )}
    </AdminLayout>
  );
}

function FicheDemande({
  demande: d,
  onFermer,
  onMaj,
  onSuppression,
}: {
  demande: Demande;
  onFermer: () => void;
  onMaj: (maj: Partial<Demande> & { id: string }) => void;
  onSuppression: (id: string) => void;
}) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [historique, setHistorique] = useState<Evenement[]>([]);
  const [statut, setStatut] = useState<Statut>(d.statut);
  const [note, setNote] = useState('');
  const [enregistrement, setEnregistrement] = useState(false);
  const [message, setMessage] = useState('');
  const [suppression, setSuppression] = useState(false);
  const [dossier, setDossier] = useState<{ id: string; reference: string } | null>(null);
  const [conversion, setConversion] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setDossier(null);
    supabase.from('depot_dossiers').select('id, reference').eq('demande_id', d.id).maybeSingle()
      .then(({ data }: { data: { id: string; reference: string } | null }) => setDossier(data));
  }, [d.id]);

  const creerDossier = async () => {
    setConversion(true);
    setMessage('');
    try {
      const r = await appelAdmin<{ dossier: { id: string } }>('convertir', { demande_id: d.id });
      navigate(`/admin/depot-vente/dossiers/${r.dossier.id}`);
    } catch (e) {
      setMessage(messageErreur(e));
      setConversion(false);
    }
  };

  const chargerHistorique = useCallback(async () => {
    const { data } = await supabase
      .from('depot_demandes_historique')
      .select('*')
      .eq('demande_id', d.id)
      .order('fait_le', { ascending: false });
    setHistorique((data ?? []) as Evenement[]);
  }, [d.id]);

  useEffect(() => {
    setStatut(d.statut);
    setNote('');
    setMessage('');
    chargerHistorique();
    if (d.photos.length) {
      supabase.storage
        .from('depot-photos')
        .createSignedUrls(d.photos.map((p) => p.path), 600)
        .then(({ data }: { data: { signedUrl: string | null }[] | null }) =>
          setPhotos((data ?? []).map((u) => u.signedUrl).filter(Boolean) as string[]),
        );
    } else {
      setPhotos([]);
    }
    if (!d.lu_le) {
      const lu_le = new Date().toISOString();
      supabase.from('depot_demandes').update({ lu_le }).eq('id', d.id).then(({ error }: { error: unknown }) => {
        if (!error) onMaj({ id: d.id, lu_le });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d.id]);

  // Échap ferme la fiche
  useEffect(() => {
    const touche = (e: KeyboardEvent) => e.key === 'Escape' && !suppression && onFermer();
    window.addEventListener('keydown', touche);
    return () => window.removeEventListener('keydown', touche);
  }, [onFermer, suppression]);

  const enregistrer = async () => {
    setEnregistrement(true);
    setMessage('');
    try {
      if (statut !== d.statut) {
        const { data, error } = await supabase.from('depot_demandes').update({ statut }).eq('id', d.id).select('sans_suite_le').single();
        if (error) throw error;
        onMaj({ id: d.id, statut, sans_suite_le: (data as { sans_suite_le: string | null } | null)?.sans_suite_le ?? null });
      }
      if (note.trim()) {
        const { error } = await supabase
          .from('depot_demandes_historique')
          .insert({ demande_id: d.id, action: 'note', note: note.trim(), par: (await supabase.auth.getUser()).data.user?.email ?? null });
        if (error) throw error;
        setNote('');
      }
      await chargerHistorique();
      setMessage('Enregistré.');
    } catch {
      setMessage("L'enregistrement a échoué. Réessayez.");
    } finally {
      setEnregistrement(false);
    }
  };

  const supprimer = async () => {
    const { error } = await supabase.from('depot_demandes').delete().eq('id', d.id);
    setSuppression(false);
    if (error) setMessage('La suppression a échoué.');
    else onSuppression(d.id);
  };

  const ligne = (libelle: string, valeur: React.ReactNode) => (
    <div className="flex flex-col sm:flex-row sm:gap-4 py-2 border-b border-[#F0F0F0] last:border-0">
      <dt className="sm:w-40 flex-shrink-0 text-sm text-[#666666]">{libelle}</dt>
      <dd className="text-[#111111] break-words">{valeur}</dd>
    </div>
  );
  const tel = d.telephone.replace(/[^\d+]/g, '');
  const modifie = statut !== d.statut || note.trim() !== '';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onFermer}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="fiche-titre"
        className="h-full w-full max-w-2xl bg-white overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 bg-white border-b border-[#E5E5E5] px-5 py-4 flex items-start gap-3 z-10">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#666666] tabular-nums">{d.reference} · reçue le {date(d.created_at)}</p>
            <h2 id="fiche-titre" className="text-xl font-bold text-[#111111] truncate">
              {d.marque} {d.modele} {d.annee}
            </h2>
          </div>
          <Badge statut={d.statut} />
          <button type="button" onClick={onFermer} className="p-2 -m-1 rounded-lg hover:bg-[#F5F5F5]" aria-label="Fermer la fiche">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-5 space-y-8">
          <div className="flex flex-wrap gap-2">
            <a href={`tel:${tel}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111111] text-white text-sm font-semibold">
              <Phone className="w-4 h-4" aria-hidden="true" /> Appeler {d.telephone}
            </a>
            <a
              href={`mailto:${d.email}?subject=${encodeURIComponent(`Votre demande ${d.reference} — SVM Ride`)}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-[#111111] text-sm font-semibold"
            >
              <Mail className="w-4 h-4" aria-hidden="true" /> Écrire
            </a>
          </div>

          <div className="rounded-xl border-2 border-bleu/30 bg-blue-50/50 p-4">
            {dossier ? (
              <Link to={`/admin/depot-vente/dossiers/${dossier.id}`} className="inline-flex items-center gap-2 font-semibold text-bleu hover:underline">
                <FolderOpen className="w-4 h-4" aria-hidden="true" /> Ouvrir le dossier {dossier.reference}
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  onClick={creerDossier}
                  disabled={conversion}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bleu text-white text-sm font-semibold disabled:opacity-50"
                >
                  <FolderPlus className="w-4 h-4" aria-hidden="true" /> {conversion ? 'Création…' : 'Créer le dossier de dépôt-vente'}
                </button>
                <p className="text-xs text-[#555555] mt-2">
                  Quand la moto est confiée : le dossier reprend le propriétaire, la moto et les photos, et la demande passe en « Acceptée ».
                </p>
              </>
            )}
          </div>

          <section aria-labelledby="t-proprio">
            <h3 id="t-proprio" className="font-semibold text-[#111111] mb-2">Propriétaire</h3>
            <dl>
              {ligne('Nom', `${d.prenom} ${d.nom}`)}
              {ligne('E-mail', d.email)}
              {ligne('Téléphone', d.telephone)}
              {ligne('Accusé de réception', d.accuse_envoye_le ? `Envoyé le ${date(d.accuse_envoye_le)}` : 'Non envoyé')}
            </dl>
          </section>

          <section aria-labelledby="t-moto">
            <h3 id="t-moto" className="font-semibold text-[#111111] mb-2">Moto</h3>
            <dl>
              {ligne('Modèle', `${d.marque} ${d.modele}${d.version ? ` ${d.version}` : ''}`)}
              {ligne('Année', d.annee)}
              {ligne('Kilométrage', `${nombre(d.kilometrage)} km`)}
              {ligne('État', ETATS[d.etat] ?? d.etat)}
              {ligne('Entretien', d.entretien ? ENTRETIENS[d.entretien] : 'Non précisé')}
              {ligne('Immatriculation', d.immatriculation ?? 'Non précisée')}
              {ligne('Prix souhaité', d.prix_souhaite != null ? `${nombre(d.prix_souhaite)} €` : 'Non précisé')}
              {d.commentaire && ligne('Commentaire', <span className="whitespace-pre-line">{d.commentaire}</span>)}
            </dl>
          </section>

          <section aria-labelledby="t-photos">
            <h3 id="t-photos" className="font-semibold text-[#111111] mb-3">Photos ({d.photos.length})</h3>
            {d.photos.length === 0 ? (
              <p className="text-sm text-[#666666]">Aucune photo envoyée.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {photos.map((url, i) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="group relative block aspect-[4/3] rounded-lg overflow-hidden bg-[#F5F5F5]">
                    <img src={url} alt={`Photo ${i + 1} de la ${d.marque} ${d.modele}`} className="w-full h-full object-cover" loading="lazy" />
                    <span className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    </span>
                  </a>
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="t-suivi" className="bg-[#F9F9F9] rounded-xl p-4 space-y-4">
            <h3 id="t-suivi" className="font-semibold text-[#111111]">Suivi</h3>
            <label className="block">
              <span className="block text-sm font-medium text-[#111111] mb-1.5">Statut</span>
              <select
                value={statut}
                onChange={(e) => setStatut(e.target.value as Statut)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#D1D5DB] bg-white"
              >
                {ORDRE.map((s) => (
                  <option key={s} value={s}>{STATUTS[s].libelle}</option>
                ))}
              </select>
            </label>
            <AvisSansSuite statut={statut} sansSuiteLe={d.statut === 'sans_suite' ? d.sans_suite_le : null} nbFichiers={d.photos.length} />
            <label className="block">
              <span className="block text-sm font-medium text-[#111111] mb-1.5">Note interne (jamais visible par le client)</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={3000}
                placeholder="Ex. appelé le 17/10, rappeler lundi ; estimation 6 200 €…"
                className="w-full px-3 py-2.5 rounded-xl border border-[#D1D5DB] bg-white"
              />
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={enregistrer}
                disabled={!modifie || enregistrement}
                className="px-4 py-2.5 rounded-xl bg-bleu text-white text-sm font-semibold disabled:opacity-50"
              >
                {enregistrement ? 'Enregistrement…' : 'Enregistrer'}
              </button>
              {message && <p className="text-sm text-[#444444]" role="status">{message}</p>}
            </div>
          </section>

          <section aria-labelledby="t-histo">
            <h3 id="t-histo" className="font-semibold text-[#111111] mb-3">Historique</h3>
            {historique.length === 0 ? (
              <p className="text-sm text-[#666666]">Aucun événement.</p>
            ) : (
              <ol className="space-y-3">
                {historique.map((h) => (
                  <li key={h.id} className="text-sm border-l-2 border-[#D1D5DB] pl-3">
                    <p className="text-[#666666]">{date(h.fait_le)} · {h.par ?? '—'}</p>
                    <p className="text-[#111111]">
                      {h.action === 'creation' && 'Demande reçue par le formulaire'}
                      {h.action === 'statut' &&
                        `Statut : ${libelleStatut(h.ancien_statut)} → ${libelleStatut(h.nouveau_statut)}`}
                      {h.action === 'note' && <span className="whitespace-pre-line">{h.note}</span>}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="pt-4 border-t border-[#E5E5E5]">
            <button
              type="button"
              onClick={() => setSuppression(true)}
              className="inline-flex items-center gap-2 text-sm text-red-700 hover:underline"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" /> Supprimer la demande et ses photos
            </button>
            <p className="text-xs text-[#666666] mt-1">
              À utiliser si le propriétaire demande l'effacement de ses données. Sinon, la suppression est automatique
              (photos 7 jours après le passage en « Sans suite », 12 mois après la demande si elle est refusée ; demande après 3 ans).
            </p>
          </section>
        </div>
      </section>

      {suppression && (
        <div onClick={(e) => e.stopPropagation()}>
          <DeleteConfirmModal
            title="Supprimer cette demande ?"
            message={`La demande ${d.reference}, ses photos et son historique seront définitivement supprimés.`}
            onConfirm={supprimer}
            onCancel={() => setSuppression(false)}
          />
        </div>
      )}
    </div>
  );
}
