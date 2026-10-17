/**
 * Fiche dossier : déposant, moto et conditions du mandat (prix affiché, net
 * vendeur, rémunération SVM Ride). Après la signature, un changement de prix
 * exige l'accord écrit du déposant et est inscrit dans son suivi.
 */
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Dossier, euros } from '../../../lib/depot';
import { Carte, Champ, Message, boutonPrincipal, champClasse } from './ui';

type Formulaire = Record<string, string>;

const CHAMPS_TEXTE = [
  'prop_civilite', 'prop_prenom', 'prop_nom', 'prop_email', 'prop_telephone', 'prop_adresse', 'prop_piece_type',
  'prop_piece_numero', 'marque', 'modele', 'version', 'immatriculation', 'vin', 'date_mise_circulation',
] as const;
const CHAMPS_NOMBRE = ['annee', 'kilometrage', 'prix_affiche', 'net_vendeur', 'duree_mois'] as const;

const versFormulaire = (d: Dossier): Formulaire => {
  const f: Formulaire = {};
  for (const c of [...CHAMPS_TEXTE, ...CHAMPS_NOMBRE]) f[c] = d[c] == null ? '' : String(d[c]);
  return f;
};

export function DossierFiche({ dossier: d, onMaj }: { dossier: Dossier; onMaj: (d: Dossier) => void }) {
  const [f, setF] = useState<Formulaire>(() => versFormulaire(d));
  const [accord, setAccord] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState<{ texte: string; erreur?: boolean }>({ texte: '' });

  useEffect(() => setF(versFormulaire(d)), [d]);

  const signe = ['actif', 'vendu', 'expire'].includes(d.statut_mandat);
  const verrouille = ['resilie', 'cloture'].includes(d.statut_mandat);
  const prix = Number(f.prix_affiche) || 0;
  const net = f.net_vendeur === '' ? null : Number(f.net_vendeur);
  const prixChange = String(d.prix_affiche ?? '') !== f.prix_affiche || String(d.net_vendeur ?? '') !== f.net_vendeur;
  const modifie = useMemo(() => JSON.stringify(versFormulaire(d)) !== JSON.stringify(f), [d, f]);

  const changer = (cle: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((x) => ({ ...x, [cle]: e.target.value }));

  const enregistrer = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ texte: '' });
    if (net != null && prix && net > prix) return setMessage({ texte: 'Le net vendeur ne peut pas dépasser le prix affiché.', erreur: true });
    if (signe && prixChange && !accord) {
      return setMessage({ texte: "Cochez la case confirmant l'accord écrit du déposant pour changer le prix.", erreur: true });
    }
    setEnvoi(true);
    const maj: Record<string, unknown> = {};
    for (const c of CHAMPS_TEXTE) maj[c] = f[c].trim() === '' ? null : f[c].trim();
    for (const c of CHAMPS_NOMBRE) maj[c] = f[c] === '' ? null : Number(f[c]);
    if (maj.duree_mois == null) maj.duree_mois = 2;
    const { data, error } = await supabase.from('depot_dossiers').update(maj).eq('id', d.id).select('*').single();
    if (error || !data) {
      setEnvoi(false);
      return setMessage({ texte: "L'enregistrement a échoué : vérifiez les champs (e-mail, longueurs, nombres).", erreur: true });
    }
    if (signe && prixChange) {
      await supabase.from('depot_evenements').insert({
        dossier_id: d.id, type: 'mandat', visible_proprietaire: true,
        par: (await supabase.auth.getUser()).data.user?.email ?? null,
        titre: `Prix de vente modifié avec votre accord : ${euros(data.prix_affiche)} (net vendeur ${euros(data.net_vendeur)})`,
      });
    }
    setAccord(false);
    setEnvoi(false);
    setMessage({ texte: 'Enregistré.' });
    onMaj(data as Dossier);
  };

  const texte = (cle: string, libelle: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, aide?: string) => (
    <Champ libelle={libelle} aide={aide}>
      {(id) => <input id={id} value={f[cle]} onChange={changer(cle)} disabled={verrouille} className={champClasse} {...props} />}
    </Champ>
  );

  return (
    <form onSubmit={enregistrer} className="space-y-6">
      <Carte titre="Déposant" id="t-deposant">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Champ libelle="Civilité">
            {(id) => (
              <select id={id} value={f.prop_civilite} onChange={changer('prop_civilite')} disabled={verrouille} className={champClasse}>
                <option value="">—</option>
                <option value="M.">M.</option>
                <option value="Mme">Mme</option>
              </select>
            )}
          </Champ>
          {texte('prop_prenom', 'Prénom', { required: true, maxLength: 80 })}
          {texte('prop_nom', 'Nom', { required: true, maxLength: 80 })}
          {texte('prop_email', 'E-mail', { required: true, type: 'email', maxLength: 254 }, 'Sert à signer le contrat et à suivre la vente')}
          {texte('prop_telephone', 'Téléphone', { required: true, type: 'tel', maxLength: 30 })}
          <div className="sm:col-span-2 lg:col-span-1">{texte('prop_adresse', 'Adresse postale', { maxLength: 300 }, 'Obligatoire pour le contrat')}</div>
          <Champ libelle="Pièce d'identité">
            {(id) => (
              <select id={id} value={f.prop_piece_type} onChange={changer('prop_piece_type')} disabled={verrouille} className={champClasse}>
                <option value="">—</option>
                <option value="cni">Carte d'identité</option>
                <option value="passeport">Passeport</option>
                <option value="titre_sejour">Titre de séjour</option>
                <option value="permis">Permis de conduire</option>
              </select>
            )}
          </Champ>
          {texte('prop_piece_numero', 'Numéro de la pièce', { maxLength: 40 })}
        </div>
      </Carte>

      <Carte titre="Moto" id="t-moto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {texte('marque', 'Marque', { required: true, maxLength: 60 })}
          {texte('modele', 'Modèle', { required: true, maxLength: 80 })}
          {texte('version', 'Version', { maxLength: 80 })}
          {texte('annee', 'Année', { type: 'number', min: 1950, max: 2100 })}
          {texte('kilometrage', 'Kilométrage', { type: 'number', min: 0, max: 1000000 })}
          {texte('immatriculation', 'Immatriculation', { maxLength: 20 }, 'Obligatoire pour le contrat')}
          {texte('vin', 'N° de série (VIN)', { maxLength: 30 }, 'Case E de la carte grise')}
          {texte('date_mise_circulation', '1re mise en circulation', { type: 'date' }, 'Case B de la carte grise')}
        </div>
      </Carte>

      <Carte titre="Conditions du mandat" id="t-conditions">
        <div className="grid sm:grid-cols-3 gap-4">
          {texte('prix_affiche', 'Prix de vente affiché (€ TTC)', { type: 'number', min: 0, max: 1000000 })}
          {texte('net_vendeur', 'Net vendeur (€)', { type: 'number', min: 0, max: 1000000 }, 'Ce que perçoit le déposant')}
          {texte('duree_mois', 'Durée du mandat (mois)', { type: 'number', min: 1, max: 24 }, 'Par défaut 2 mois')}
        </div>
        {prix > 0 && (
          <p className="mt-4 rounded-xl bg-[#F7F7F7] px-4 py-3 text-lg md:text-xl text-[#111111]">
            Rémunération SVM Ride : <strong>{net != null ? euros(prix - net) : '—'}</strong> TTC
          </p>
        )}
        <p className="mt-3 text-xs text-[#666666]">
          Fin anticipée : {euros(d.frais_resiliation)} · gardiennage {euros(d.gardiennage_par_jour)}/jour à partir de J+{d.gardiennage_delai_jours} après la fin du mandat.
        </p>
        {signe && prixChange && (
          <label className="mt-4 flex items-start gap-3 rounded-xl border-2 border-amber-300 bg-amber-50 p-3 text-sm">
            <input type="checkbox" checked={accord} onChange={(e) => setAccord(e.target.checked)} className="mt-0.5 w-4 h-4" />
            <span>
              Le déposant a donné son <strong>accord écrit</strong> (e-mail, SMS ou avenant) pour ce nouveau prix. Le changement sera
              inscrit dans son suivi. Pour une trace signée, préférez un avenant (section Contrat).
            </span>
          </label>
        )}
      </Carte>

      {!verrouille && (
        <div className="flex flex-wrap items-center gap-3 sticky bottom-3 z-10">
          <button type="submit" disabled={!modifie || envoi} className={`${boutonPrincipal} shadow-lg`}>
            {envoi ? 'Enregistrement…' : 'Enregistrer la fiche'}
          </button>
          <Message texte={message.texte} erreur={message.erreur} />
        </div>
      )}
    </form>
  );
}
