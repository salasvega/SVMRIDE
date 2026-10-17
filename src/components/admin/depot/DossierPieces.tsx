/**
 * Pièces du dossier (case « reçu » + fichier), état des lieux d'entrée et liste
 * de tous les documents (ouvrir, partager avec le déposant, supprimer).
 * Les contrats sont produits par le serveur et ne peuvent être ni remplacés ni supprimés.
 */
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Camera, CheckCircle2, Circle, Eye, EyeOff, FileText, Trash2, Upload } from 'lucide-react';
import { SOURIS_SEULEMENT, TACTILE_SEULEMENT } from '../../ui/ChoixSource';
import { supabase } from '../../../lib/supabase';
import { compresserImage, extensionDe } from '../../../lib/compressionImage';
import { Dossier, EtatDesLieux, PIECES, TYPES_DOCUMENT, aujourdhui, dateHeure, heureFr, jour, maintenantHeure } from '../../../lib/depot';
import { Carte, Champ, Message, boutonPrincipal, boutonSecondaire, champClasse } from './ui';

export interface DocumentDossier {
  id: string;
  type: string;
  nom: string;
  chemin: string;
  taille: number | null;
  mime: string | null;
  visible_proprietaire: boolean;
  ajoute_le: string;
  ajoute_par: string | null;
}

const BUCKET = 'depot-documents';
const PROTEGES = ['contrat', 'contrat_signe', 'preuve'];

async function moi() {
  return (await supabase.auth.getUser()).data.user?.email ?? null;
}

export async function ouvrirDocument(chemin: string, telecharger = false) {
  // Fenêtre ouverte tout de suite (sinon bloquée par le navigateur), puis redirigée
  const fenetre = window.open('', '_blank');
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(chemin, 300, telecharger ? { download: true } : undefined);
  if (data?.signedUrl) {
    if (fenetre) fenetre.location.href = data.signedUrl;
    else window.location.href = data.signedUrl;
  } else fenetre?.close();
}

export function DossierPieces({
  dossier: d, documents, onMaj, onDocuments,
}: {
  dossier: Dossier;
  documents: DocumentDossier[];
  onMaj: (d: Dossier) => void;
  onDocuments: () => void;
}) {
  const [message, setMessage] = useState<{ texte: string; erreur?: boolean }>({ texte: '' });
  const [envoi, setEnvoi] = useState<string | null>(null);
  const fichier = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const cible = useRef<string>('autre');
  const verrouille = ['resilie', 'cloture'].includes(d.statut_mandat);

  const majPieces = async (cle: string, recu: boolean) => {
    const pieces = { ...d.pieces, [cle]: recu ? { recu: true, le: aujourdhui() } : { recu: false } };
    const { data, error } = await supabase.from('depot_dossiers').update({ pieces }).eq('id', d.id).select('*').single();
    if (error || !data) return setMessage({ texte: 'La mise à jour a échoué.', erreur: true });
    onMaj(data as Dossier);
  };

  const choisir = (type: string, viaCamera = false) => {
    cible.current = type;
    (viaCamera ? camera : fichier).current?.click();
  };

  /** Boutons d'ajout : « Ajouter un fichier » sur ordinateur ; « Photothèque » et « Caméra » sur téléphone */
  const boutonsAjout = (type: string, libelle: string, classe = '') => (
    <span className="inline-flex flex-wrap gap-2">
      <button type="button" onClick={() => choisir(type)} disabled={!!envoi} className={`${boutonSecondaire} ${classe}`}>
        <Upload className="w-4 h-4" aria-hidden="true" />
        <span className={SOURIS_SEULEMENT}>{libelle}</span>
        <span className={TACTILE_SEULEMENT}>Photothèque</span>
      </button>
      <button type="button" onClick={() => choisir(type, true)} disabled={!!envoi} className={`${boutonSecondaire} ${classe} ${TACTILE_SEULEMENT}`}>
        <Camera className="w-4 h-4" aria-hidden="true" /> Caméra
      </button>
    </span>
  );

  const envoyer = async (fichiers: FileList | null) => {
    const liste = Array.from(fichiers ?? []);
    if (!liste.length) return;
    setMessage({ texte: '' });
    const type = cible.current;
    let n = 0;
    try {
      for (const original of liste) {
        n += 1;
        setEnvoi(`Envoi ${n}/${liste.length}…`);
        const f = await compresserImage(original, { cote: 2400, qualite: 0.85 });
        if (f.size > 15 * 1024 * 1024) throw new Error(`${original.name} dépasse 15 Mo.`);
        const ext = extensionDe(f);
        const dossierType = type === 'photo' ? 'photos' : 'pieces';
        const chemin = `${d.id}/${dossierType}/${type}-${Date.now()}-${n}.${ext}`;
        const { error } = await supabase.storage.from(BUCKET).upload(chemin, f, { contentType: f.type || undefined });
        if (error) throw new Error(`Envoi refusé pour ${original.name} : formats JPG, PNG, WEBP, HEIC ou PDF, 15 Mo maximum.`);
        const { error: e2 } = await supabase.from('depot_documents').insert({
          dossier_id: d.id, type, nom: `${TYPES_DOCUMENT[type] ?? 'Document'} – ${original.name}`.slice(0, 200), chemin,
          taille: f.size, mime: f.type || null, ajoute_par: await moi(),
        });
        if (e2) throw e2;
      }
      if (PIECES.some((p) => p.cle === type) && !d.pieces?.[type]?.recu) await majPieces(type, true);
      setMessage({ texte: liste.length > 1 ? `${liste.length} fichiers ajoutés.` : 'Fichier ajouté.' });
    } catch (e) {
      setMessage({ texte: e instanceof Error ? e.message : "L'envoi a échoué.", erreur: true });
    } finally {
      setEnvoi(null);
      if (fichier.current) fichier.current.value = '';
      if (camera.current) camera.current.value = '';
      onDocuments();
    }
  };

  const basculer = async (doc: DocumentDossier) => {
    const { error } = await supabase.from('depot_documents').update({ visible_proprietaire: !doc.visible_proprietaire }).eq('id', doc.id);
    if (error) setMessage({ texte: 'La mise à jour a échoué.', erreur: true });
    onDocuments();
  };

  const supprimer = async (doc: DocumentDossier) => {
    if (!window.confirm(`Supprimer « ${doc.nom} » ?`)) return;
    await supabase.storage.from(BUCKET).remove([doc.chemin]);
    const { error } = await supabase.from('depot_documents').delete().eq('id', doc.id);
    if (error) setMessage({ texte: 'La suppression a échoué.', erreur: true });
    onDocuments();
  };

  return (
    <div className="space-y-6">
      <input
        ref={fichier}
        type="file"
        multiple
        accept="image/*,application/pdf"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => envoyer(e.target.files)}
      />
      {/* Appareil photo du téléphone, sans passer par la photothèque */}
      <input
        ref={camera}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => envoyer(e.target.files)}
      />

      <Carte titre="Pièces du dossier" id="t-pieces" action={envoi && <span className="text-sm text-[#444444]" role="status">{envoi}</span>}>
        <ul className="divide-y divide-[#F0F0F0]">
          {PIECES.map((p) => {
            const recu = !!d.pieces?.[p.cle]?.recu;
            const fichiers = documents.filter((x) => x.type === p.cle);
            return (
              <li key={p.cle} className="py-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => majPieces(p.cle, !recu)}
                  disabled={verrouille}
                  aria-pressed={recu}
                  className="inline-flex items-center gap-2 text-left min-w-[14rem] flex-1"
                >
                  {recu ? <CheckCircle2 className="w-5 h-5 text-green-700 flex-shrink-0" aria-hidden="true" /> : <Circle className="w-5 h-5 text-[#9A9A9A] flex-shrink-0" aria-hidden="true" />}
                  <span>
                    <span className="font-medium text-[#111111]">{p.libelle}</span>
                    {p.obligatoire && <span className="text-xs text-bleu ml-1.5">exigée pour signer</span>}
                    <span className="block text-xs text-[#666666]">
                      {recu ? `Reçue${d.pieces[p.cle]?.le ? ` le ${jour(d.pieces[p.cle].le)}` : ''}` : p.aide ?? 'Non reçue'}
                      {fichiers.length > 0 && ` · ${fichiers.length} fichier${fichiers.length > 1 ? 's' : ''}`}
                    </span>
                  </span>
                </button>
                {p.cle !== 'double_cles' && !verrouille && (
                  boutonsAjout(p.cle, 'Ajouter un fichier', '!py-1.5')
                )}
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-[#666666] mt-2">Cliquez sur une pièce pour la cocher ou la décocher. Ajouter un fichier la coche automatiquement.</p>
      </Carte>

      <EtatDesLieuxForm dossier={d} onMaj={onMaj} verrouille={verrouille} boutonsPhotos={boutonsAjout('photo', "Photos de l'état des lieux")} />

      <Carte
        titre={`Documents (${documents.length})`}
        id="t-documents"
        action={!verrouille && (
          boutonsAjout('autre', 'Autre document', '!py-1.5')
        )}
      >
        {documents.length === 0 ? (
          <p className="text-sm text-[#666666]">Aucun document.</p>
        ) : (
          <ul className="divide-y divide-[#F0F0F0]">
            {documents.map((doc) => (
              <li key={doc.id} className="py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <FileText className="w-4 h-4 text-[#666666] flex-shrink-0" aria-hidden="true" />
                <button type="button" onClick={() => ouvrirDocument(doc.chemin)} className="text-left text-[#111111] hover:underline flex-1 min-w-[12rem]">
                  {doc.nom}
                  <span className="block text-xs text-[#666666]">
                    {TYPES_DOCUMENT[doc.type] ?? doc.type} · {dateHeure(doc.ajoute_le)}{doc.ajoute_par ? ` · ${doc.ajoute_par}` : ''}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => basculer(doc)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${
                    doc.visible_proprietaire ? 'border-green-300 bg-green-50 text-green-800' : 'border-[#D1D5DB] text-[#555555]'
                  }`}
                  aria-pressed={doc.visible_proprietaire}
                  title="Visible dans l'espace « Suivre ma vente » du déposant"
                >
                  {doc.visible_proprietaire ? <Eye className="w-3.5 h-3.5" aria-hidden="true" /> : <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />}
                  {doc.visible_proprietaire ? 'Partagé' : 'Interne'}
                </button>
                {!PROTEGES.includes(doc.type) && !verrouille && (
                  <button type="button" onClick={() => supprimer(doc)} className="p-1.5 rounded-lg text-red-700 hover:bg-red-50" aria-label={`Supprimer ${doc.nom}`}>
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Carte>
      <Message texte={message.texte} erreur={message.erreur} />
    </div>
  );
}

function EtatDesLieuxForm({ dossier: d, onMaj, verrouille, boutonsPhotos }: { dossier: Dossier; onMaj: (d: Dossier) => void; verrouille: boolean; boutonsPhotos: ReactNode }) {
  const initial = (): Record<string, string> => ({
    fait_le: d.etat_des_lieux?.fait_le ?? '',
    heure: d.etat_des_lieux?.heure ?? '',
    kilometrage: d.etat_des_lieux?.kilometrage != null ? String(d.etat_des_lieux.kilometrage) : d.kilometrage != null ? String(d.kilometrage) : '',
    etat: d.etat_des_lieux?.etat ?? '',
    accessoires: d.etat_des_lieux?.accessoires ?? '',
    cles: d.etat_des_lieux?.cles ?? '',
    remarques: d.etat_des_lieux?.remarques ?? '',
  });
  const [f, setF] = useState(initial);
  const [message, setMessage] = useState<{ texte: string; erreur?: boolean }>({ texte: '' });
  const [envoi, setEnvoi] = useState(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setF(initial()), [d.etat_des_lieux]);
  const signe = ['actif', 'vendu', 'expire'].includes(d.statut_mandat);

  const enregistrer = async () => {
    setEnvoi(true);
    setMessage({ texte: '' });
    const e: EtatDesLieux = {
      fait_le: f.fait_le || aujourdhui(),
      heure: f.heure || maintenantHeure(),
      kilometrage: f.kilometrage === '' ? null : Number(f.kilometrage),
      etat: f.etat.trim(), accessoires: f.accessoires.trim(), cles: f.cles.trim(), remarques: f.remarques.trim(),
    };
    const { data, error } = await supabase.from('depot_dossiers').update({ etat_des_lieux: e }).eq('id', d.id).select('*').single();
    setEnvoi(false);
    if (error || !data) return setMessage({ texte: "L'enregistrement a échoué.", erreur: true });
    setMessage({ texte: 'État des lieux enregistré.' });
    onMaj(data as Dossier);
  };

  const zone = (cle: string, libelle: string, placeholder: string) => (
    <Champ libelle={libelle}>
      {(id) => (
        <textarea id={id} rows={2} maxLength={1000} value={f[cle]} placeholder={placeholder} disabled={verrouille}
          onChange={(e) => setF((x) => ({ ...x, [cle]: e.target.value }))} className={champClasse} />
      )}
    </Champ>
  );

  return (
    <Carte
      titre="État des lieux d'entrée"
      id="t-edl"
      action={d.etat_des_lieux?.fait_le && <span className="text-sm text-green-800">Fait le {jour(d.etat_des_lieux.fait_le)}{d.etat_des_lieux.heure ? ` à ${heureFr(d.etat_des_lieux.heure)}` : ''}</span>}
    >
      <p className="text-sm text-[#666666] mb-4">
        À faire avec le déposant, au showroom. Il est repris en page 2 du contrat{signe ? ' (le contrat signé garde la version du jour de la signature)' : ''}.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Champ libelle="Date">
          {(id) => <input id={id} type="date" value={f.fait_le} disabled={verrouille} onChange={(e) => setF((x) => ({ ...x, fait_le: e.target.value }))} className={champClasse} />}
        </Champ>
        <Champ libelle="Heure">
          {(id) => <input id={id} type="time" step={60} value={f.heure} disabled={verrouille} onChange={(e) => setF((x) => ({ ...x, heure: e.target.value }))} className={champClasse} />}
        </Champ>
        <Champ libelle="Kilométrage relevé">
          {(id) => <input id={id} type="number" min={0} value={f.kilometrage} disabled={verrouille} onChange={(e) => setF((x) => ({ ...x, kilometrage: e.target.value }))} className={champClasse} />}
        </Champ>
        <Champ libelle="Clés remises">
          {(id) => <input id={id} maxLength={200} value={f.cles} placeholder="Ex. 2 clés + badge alarme" disabled={verrouille} onChange={(e) => setF((x) => ({ ...x, cles: e.target.value }))} className={champClasse} />}
        </Champ>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {zone('etat', 'État général', 'Ex. très bon état, pneus 70 %, chaîne neuve…')}
        {zone('accessoires', 'Accessoires remis', 'Ex. top case, bulle haute, housse…')}
        {zone('remarques', 'Défauts et remarques', 'Ex. rayure réservoir côté gauche…')}
      </div>
      {!verrouille && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" onClick={enregistrer} disabled={envoi} className={boutonPrincipal}>
            {envoi ? 'Enregistrement…' : d.etat_des_lieux?.fait_le ? "Mettre à jour l'état des lieux" : "Enregistrer l'état des lieux"}
          </button>
          {boutonsPhotos}
          <Message texte={message.texte} erreur={message.erreur} />
        </div>
      )}
    </Carte>
  );
}
