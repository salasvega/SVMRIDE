/**
 * Admin — dépôt-vente : liste des dossiers (motos confiées), avec alertes
 * (fin de mandat proche, demandes du déposant à traiter) et création manuelle
 * d'un dossier sans demande en ligne (client venu au showroom).
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, MessageSquare, Plus, Search, X } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { DepotOnglets } from '../../components/admin/DepotOnglets';
import { supabase } from '../../lib/supabase';
import { Dossier, MANDAT, StatutMandat, VENTE, euros, joursRestants, jour } from '../../lib/depot';

type Ligne = Pick<Dossier,
  'id' | 'reference' | 'created_at' | 'prop_prenom' | 'prop_nom' | 'marque' | 'modele' | 'version' | 'annee' | 'prix_affiche' |
  'net_vendeur' | 'date_fin' | 'statut_mandat' | 'statut_vente' | 'immatriculation'>;

const EN_COURS: StatutMandat[] = ['preparation', 'a_signer', 'actif', 'vendu', 'expire'];
const normaliser = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function DepotDossiersList() {
  const [dossiers, setDossiers] = useState<Ligne[]>([]);
  const [demandesOuvertes, setDemandesOuvertes] = useState<Record<string, number>>({});
  const [nouvellesDemandes, setNouvellesDemandes] = useState(0);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [filtre, setFiltre] = useState<'en_cours' | 'tous' | StatutMandat>('en_cours');
  const [recherche, setRecherche] = useState('');
  const [creation, setCreation] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data, error }, { data: dem }, { count }] = await Promise.all([
        supabase.from('depot_dossiers')
          .select('id, reference, created_at, prop_prenom, prop_nom, marque, modele, version, annee, prix_affiche, net_vendeur, date_fin, statut_mandat, statut_vente, immatriculation')
          .order('created_at', { ascending: false }),
        supabase.from('depot_demandes_proprietaire').select('dossier_id').in('statut', ['nouvelle', 'en_cours']),
        supabase.from('depot_demandes').select('id', { count: 'exact', head: true }).eq('envoi_termine', true).eq('statut', 'nouvelle'),
      ]);
      if (error) setErreur("Impossible de charger les dossiers. Vérifiez que vous êtes connecté avec un compte administrateur.");
      else setDossiers((data ?? []) as Ligne[]);
      const c: Record<string, number> = {};
      for (const x of (dem ?? []) as { dossier_id: string }[]) c[x.dossier_id] = (c[x.dossier_id] ?? 0) + 1;
      setDemandesOuvertes(c);
      setNouvellesDemandes(count ?? 0);
      setChargement(false);
    })();
  }, []);

  const compte = useMemo(() => {
    const c: Record<string, number> = { tous: dossiers.length, en_cours: 0 };
    for (const d of dossiers) {
      c[d.statut_mandat] = (c[d.statut_mandat] ?? 0) + 1;
      if (EN_COURS.includes(d.statut_mandat)) c.en_cours += 1;
    }
    return c;
  }, [dossiers]);

  const visibles = useMemo(() => {
    const q = normaliser(recherche.trim());
    return dossiers.filter((d) => {
      if (filtre === 'en_cours' && !EN_COURS.includes(d.statut_mandat)) return false;
      if (filtre !== 'en_cours' && filtre !== 'tous' && d.statut_mandat !== filtre) return false;
      return !q || normaliser([d.reference, d.prop_prenom, d.prop_nom, d.marque, d.modele, d.version, d.immatriculation].join(' ')).includes(q);
    });
  }, [dossiers, filtre, recherche]);

  const aTraiter = Object.keys(demandesOuvertes).length;
  const filtres: { cle: typeof filtre; libelle: string }[] = [
    { cle: 'en_cours', libelle: 'En cours' },
    ...(Object.keys(MANDAT) as StatutMandat[]).map((s) => ({ cle: s, libelle: MANDAT[s].libelle })),
    { cle: 'tous', libelle: 'Tous' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-[#111111]">Dépôt-vente</h1>
            <p className="text-[#666666] mt-1">Motos confiées : mandat, contrat signé en ligne, avancement de la vente et paiement du déposant.</p>
          </div>
          <button
            type="button"
            onClick={() => setCreation(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111111] text-white text-sm font-semibold"
          >
            <Plus className="w-4 h-4" aria-hidden="true" /> Nouveau dossier
          </button>
        </div>

        <DepotOnglets demandes={nouvellesDemandes} dossiers={aTraiter} />

        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" role="group" aria-label="Filtrer par statut du mandat">
            {filtres.map((f) => (
              <button
                key={f.cle}
                type="button"
                onClick={() => setFiltre(f.cle)}
                aria-pressed={filtre === f.cle}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap ${
                  filtre === f.cle ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-[#444444] border-[#D1D5DB] hover:border-[#111111]'
                }`}
              >
                {f.libelle} <span className="tabular-nums opacity-70">({compte[f.cle] ?? 0})</span>
              </button>
            ))}
          </div>
          <label className="relative block lg:w-80">
            <span className="sr-only">Rechercher un dossier</span>
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#767676]" aria-hidden="true" />
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Nom, moto, immatriculation, référence…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#D1D5DB] bg-white text-sm focus:outline-none focus:border-bleu focus:ring-4 focus:ring-bleu/15"
            />
          </label>
        </div>

        {erreur && <p className="text-red-700" role="alert">{erreur}</p>}

        {chargement ? (
          <p className="text-[#666666]">Chargement…</p>
        ) : visibles.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-[#D1D5DB] p-10 text-center text-[#666666]">
            {dossiers.length === 0
              ? "Aucun dossier pour le moment. Ouvrez-en un depuis une demande d'estimation (bouton « Créer le dossier ») ou avec « Nouveau dossier »."
              : 'Aucun dossier ne correspond à ces critères.'}
          </div>
        ) : (
          <ul className="space-y-3">
            {visibles.map((d) => {
              const j = d.statut_mandat === 'actif' ? joursRestants(d.date_fin) : null;
              const ouvertes = demandesOuvertes[d.id] ?? 0;
              return (
                <li key={d.id}>
                  <Link
                    to={`/admin/depot-vente/dossiers/${d.id}`}
                    className="block bg-white rounded-xl border-2 border-[#D1D5DB] hover:border-[#111111] p-4 md:p-5 transition-colors"
                  >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
                      <span className="font-semibold text-[#111111] tabular-nums">{d.reference}</span>
                      <span className={`inline-flex px-2.5 py-1 rounded-full border text-xs font-semibold ${MANDAT[d.statut_mandat].classe}`}>
                        {MANDAT[d.statut_mandat].libelle}
                      </span>
                      {['actif', 'vendu'].includes(d.statut_mandat) && (
                        <span className="inline-flex px-2.5 py-1 rounded-full border border-[#D1D5DB] text-xs font-medium text-[#444444]">
                          {VENTE[d.statut_vente]}
                        </span>
                      )}
                      {ouvertes > 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand text-white text-xs font-semibold">
                          <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" /> {ouvertes} demande{ouvertes > 1 ? 's' : ''} du déposant
                        </span>
                      )}
                      {j != null && j <= 7 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 text-orange-900 text-xs font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                          {j < 0 ? 'Mandat dépassé' : j === 0 ? "Fin du mandat aujourd'hui" : `Fin du mandat dans ${j} j`}
                        </span>
                      )}
                    </div>
                    <p className="text-lg font-semibold text-[#111111]">
                      {d.marque} {d.modele}{d.version ? ` ${d.version}` : ''}
                      {d.annee && <span className="font-normal text-[#666666]"> · {d.annee}</span>}
                    </p>
                    <p className="text-sm text-[#444444] mt-1 flex flex-wrap gap-x-4 gap-y-1">
                      <span>{d.prop_prenom} {d.prop_nom}</span>
                      <span>Prix affiché {euros(d.prix_affiche)} · net vendeur {euros(d.net_vendeur)}</span>
                      {d.date_fin && <span>Fin du mandat : {jour(d.date_fin)}</span>}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {creation && <NouveauDossier onFermer={() => setCreation(false)} />}
    </AdminLayout>
  );
}

function NouveauDossier({ onFermer }: { onFermer: () => void }) {
  const navigate = useNavigate();
  const [v, setV] = useState({ prop_prenom: '', prop_nom: '', prop_email: '', prop_telephone: '', marque: '', modele: '', annee: '', kilometrage: '' });
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    const t = (e: KeyboardEvent) => e.key === 'Escape' && onFermer();
    window.addEventListener('keydown', t);
    return () => window.removeEventListener('keydown', t);
  }, [onFermer]);

  const creer = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnvoi(true);
    setErreur('');
    const { data: p } = await supabase.from('depot_parametres').select('*').maybeSingle();
    const { data, error } = await supabase.from('depot_dossiers').insert({
      prop_prenom: v.prop_prenom.trim(), prop_nom: v.prop_nom.trim(), prop_email: v.prop_email.trim(),
      prop_telephone: v.prop_telephone.trim(), marque: v.marque.trim(), modele: v.modele.trim(),
      annee: v.annee ? Number(v.annee) : null, kilometrage: v.kilometrage ? Number(v.kilometrage) : null,
      duree_mois: p?.duree_mandat_mois ?? 2, frais_resiliation: p?.frais_resiliation ?? 290,
      gardiennage_par_jour: p?.gardiennage_par_jour ?? 50, gardiennage_delai_jours: p?.gardiennage_delai_jours ?? 7,
    }).select('id').single();
    if (error || !data) {
      setErreur("La création a échoué. Vérifiez les champs et réessayez.");
      setEnvoi(false);
      return;
    }
    navigate(`/admin/depot-vente/dossiers/${data.id}`);
  };

  const champ = (cle: keyof typeof v, libelle: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block">
      <span className="block text-sm font-medium text-[#111111] mb-1">{libelle}</span>
      <input
        value={v[cle]}
        onChange={(e) => setV((x) => ({ ...x, [cle]: e.target.value }))}
        className="w-full px-3 py-2.5 rounded-xl border border-[#D1D5DB] bg-white focus:outline-none focus:border-bleu focus:ring-4 focus:ring-bleu/15"
        {...props}
      />
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onFermer}>
      <form
        onSubmit={creer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="nd-titre"
        className="w-full max-w-lg bg-white rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="nd-titre" className="text-xl font-bold text-[#111111]">Nouveau dossier de dépôt-vente</h2>
          <button type="button" onClick={onFermer} className="p-1 rounded-lg hover:bg-[#F5F5F5]" aria-label="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-[#666666]">Le reste (adresse, pièce d'identité, prix, état des lieux…) se complète dans le dossier.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {champ('prop_prenom', 'Prénom du déposant', { required: true, maxLength: 80, autoFocus: true })}
          {champ('prop_nom', 'Nom', { required: true, maxLength: 80 })}
          {champ('prop_email', 'E-mail', { required: true, type: 'email', maxLength: 254 })}
          {champ('prop_telephone', 'Téléphone', { required: true, type: 'tel', maxLength: 30 })}
          {champ('marque', 'Marque', { required: true, maxLength: 60 })}
          {champ('modele', 'Modèle', { required: true, maxLength: 80 })}
          {champ('annee', 'Année', { type: 'number', min: 1950, max: 2100 })}
          {champ('kilometrage', 'Kilométrage', { type: 'number', min: 0, max: 1000000 })}
        </div>
        {erreur && <p className="text-sm text-red-700" role="alert">{erreur}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onFermer} className="px-4 py-2.5 rounded-xl border-2 border-[#D1D5DB] text-sm font-semibold">Annuler</button>
          <button type="submit" disabled={envoi} className="px-4 py-2.5 rounded-xl bg-bleu text-white text-sm font-semibold disabled:opacity-50">
            {envoi ? 'Création…' : 'Créer le dossier'}
          </button>
        </div>
      </form>
    </div>
  );
}
