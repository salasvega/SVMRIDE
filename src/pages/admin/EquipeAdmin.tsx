/**
 * Admin — Équipe : fiches affichées sur le site (accueil « Des passionnés à
 * votre service », page /equipe, carte du responsable sur la page Contact).
 * Ajout, modification (prénom, fonction, citation, photo recadrée), ordre,
 * affichage ou non, suppression (la photo est effacée du stockage avec la fiche).
 * Table equipe_membres, photos dans le bucket public equipe-photos.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, Camera, Crown, Eye, EyeOff, ExternalLink, Pencil, Plus, Trash2, X } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';
import { RecadragePortrait } from '../../components/admin/RecadragePortrait';
import { Portrait } from '../../components/equipe/Portrait';
import { ChoixSource, SOURIS_SEULEMENT } from '../../components/ui/ChoixSource';
import { supabase } from '../../lib/supabase';
import { BUCKET_EQUIPE, oublierEquipe, versMembre, type LigneEquipe } from '../../lib/equipe';
import { nomAffiche } from '../../config/equipe';

const LIMITES = { prenom: 40, nom: 60, fonction: 60, citation: 220, presentation: 1500 };

type Brouillon = {
  id: string | null;
  prenom: string;
  nom: string;
  fonction: string;
  citation: string;
  presentation: string;
  responsable: boolean;
  visible: boolean;
  accord: boolean;
  /** Photo enregistrée (URL) ; null si aucune ou retirée */
  photoActuelle: string | null;
  /** Nouvelle photo recadrée, pas encore envoyée */
  nouvellePhoto: Blob | null;
};

const vide = (): Brouillon => ({
  id: null, prenom: '', nom: '', fonction: '', citation: '', presentation: '', responsable: false, visible: true,
  accord: false, photoActuelle: null, nouvellePhoto: null,
});

const depuisLigne = (l: LigneEquipe): Brouillon => ({
  id: l.id, prenom: l.prenom, nom: l.nom ?? '', fonction: l.fonction, citation: l.citation ?? '',
  presentation: l.presentation ?? '', responsable: l.responsable, visible: l.visible,
  accord: !!l.accord_photo_le, photoActuelle: l.photo_url, nouvellePhoto: null,
});

const nettoyer = (s: string) => s.replace(/\s+/g, ' ').trim();
const texteLong = (s: string) => s.replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

export function EquipeAdmin() {
  const [lignes, setLignes] = useState<LigneEquipe[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [message, setMessage] = useState('');
  const [edition, setEdition] = useState<Brouillon | null>(null);
  const [aSupprimer, setASupprimer] = useState<LigneEquipe | null>(null);
  const [occupe, setOccupe] = useState(false);

  const charger = async () => {
    const { data, error } = await supabase.from('equipe_membres').select('*').order('ordre').order('created_at');
    if (error) setErreur("Impossible de charger l'équipe. Vérifiez que vous êtes connecté avec un compte administrateur.");
    else setLignes(data as LigneEquipe[]);
    setChargement(false);
  };

  useEffect(() => {
    charger();
  }, []);

  const informer = (t: string) => {
    setMessage(t);
    setErreur('');
    oublierEquipe();
    window.setTimeout(() => setMessage((m) => (m === t ? '' : m)), 5000);
  };

  /** Monter / descendre : les ordres sont renumérotés 0, 1, 2… */
  const deplacer = async (index: number, sens: -1 | 1) => {
    const cible = index + sens;
    if (cible < 0 || cible >= lignes.length || occupe) return;
    const nouvel = [...lignes];
    [nouvel[index], nouvel[cible]] = [nouvel[cible], nouvel[index]];
    const changes = nouvel.map((l, i) => ({ ...l, ordre: i })).filter((l, i) => lignes.find((x) => x.id === l.id)?.ordre !== i);
    setLignes(nouvel.map((l, i) => ({ ...l, ordre: i })));
    setOccupe(true);
    const res = await Promise.all(changes.map((l) => supabase.from('equipe_membres').update({ ordre: l.ordre }).eq('id', l.id)));
    setOccupe(false);
    if (res.some((r) => r.error)) {
      setErreur("L'ordre n'a pas pu être enregistré. Réessayez.");
      charger();
    } else informer("Ordre enregistré : il est déjà appliqué sur le site.");
  };

  const basculer = async (l: LigneEquipe) => {
    setOccupe(true);
    const { error } = await supabase.from('equipe_membres').update({ visible: !l.visible }).eq('id', l.id);
    setOccupe(false);
    if (error) return setErreur("Le changement n'a pas pu être enregistré. Réessayez.");
    setLignes((ls) => ls.map((x) => (x.id === l.id ? { ...x, visible: !l.visible } : x)));
    informer(l.visible ? `${l.prenom} n'est plus affiché(e) sur le site.` : `${l.prenom} est de nouveau affiché(e) sur le site.`);
  };

  const supprimer = async (l: LigneEquipe) => {
    setASupprimer(null);
    setOccupe(true);
    const { error } = await supabase.from('equipe_membres').delete().eq('id', l.id);
    if (!error && l.photo_chemin) await supabase.storage.from(BUCKET_EQUIPE).remove([l.photo_chemin]);
    setOccupe(false);
    if (error) return setErreur("La fiche n'a pas pu être supprimée. Réessayez.");
    setLignes((ls) => ls.filter((x) => x.id !== l.id));
    informer(`La fiche de ${l.prenom} est supprimée (photo comprise).`);
  };

  const apresEnregistrement = (prenom: string, nouvelle: boolean) => {
    setEdition(null);
    charger();
    informer(nouvelle ? `Fiche de ${prenom} ajoutée.` : `Fiche de ${prenom} enregistrée : les changements sont déjà visibles sur le site.`);
  };

  const affichees = lignes.filter((l) => l.visible).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-[#111111]">Équipe</h1>
            <p className="text-[#666666] mt-1 max-w-2xl">
              Fiches affichées sur la page d'accueil (« Des passionnés à votre service »), la page Équipe et la page Contact.
              Les changements sont visibles immédiatement.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="/equipe"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-[#D1D5DB] bg-white text-sm font-semibold text-[#111111] hover:border-[#111111]"
            >
              <ExternalLink className="w-4 h-4" aria-hidden="true" /> Voir la page Équipe
            </a>
            <button
              type="button"
              onClick={() => setEdition(vide())}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111111] text-white text-sm font-semibold"
            >
              <Plus className="w-4 h-4" aria-hidden="true" /> Ajouter une personne
            </button>
          </div>
        </div>

        {message && (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900" role="status">{message}</p>
        )}
        {erreur && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{erreur}</p>
        )}

        {chargement ? (
          <p className="text-[#666666]">Chargement…</p>
        ) : lignes.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-[#D1D5DB] bg-white p-8 text-center text-[#666666]">
            Aucune fiche pour l'instant : la section Équipe est masquée sur le site. Ajoutez une première personne.
          </div>
        ) : (
          <>
            <p className="text-sm text-[#666666]">
              {affichees} fiche{affichees > 1 ? 's' : ''} affichée{affichees > 1 ? 's' : ''} sur le site, dans l'ordre ci-dessous.
              La personne mise en avant (couronne) apparaît dans la grande carte noire ; sur l'accueil, les 6 premières autres personnes sont présentées.
            </p>
            <ul className="space-y-3">
              {lignes.map((l, i) => (
                <li
                  key={l.id}
                  className={`flex flex-col gap-4 rounded-xl border-2 bg-white p-4 sm:flex-row sm:items-center ${l.visible ? 'border-[#D1D5DB]' : 'border-dashed border-[#D1D5DB] bg-[#FAFAFA]'}`}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="flex flex-col gap-1" role="group" aria-label={`Position de ${l.prenom}`}>
                      <button
                        type="button"
                        onClick={() => deplacer(i, -1)}
                        disabled={i === 0 || occupe}
                        className="rounded-md border border-[#D1D5DB] p-1 text-[#444444] hover:border-[#111111] disabled:opacity-30"
                        aria-label={`Monter ${l.prenom}`}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deplacer(i, 1)}
                        disabled={i === lignes.length - 1 || occupe}
                        className="rounded-md border border-[#D1D5DB] p-1 text-[#444444] hover:border-[#111111] disabled:opacity-30"
                        aria-label={`Descendre ${l.prenom}`}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                    </div>
                    <Portrait membre={versMembre(l)} taille={64} anneauOr={l.responsable} className={l.visible ? '' : 'opacity-50'} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-[#111111]">{nomAffiche({ prenom: l.prenom, nom: l.nom ?? undefined })}</span>
                        {l.responsable && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#111111] px-2.5 py-0.5 text-xs font-semibold text-white">
                            <Crown className="h-3 w-3" aria-hidden="true" /> Mis en avant
                          </span>
                        )}
                        {!l.visible && (
                          <span className="inline-flex rounded-full border border-[#D1D5DB] px-2.5 py-0.5 text-xs font-semibold text-[#666666]">Masqué(e)</span>
                        )}
                        {!l.photo_url && (
                          <span className="inline-flex rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-900">Sans photo</span>
                        )}
                        {l.photo_url && !l.accord_photo_le && (
                          <span className="inline-flex rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-900">Accord photo à confirmer</span>
                        )}
                      </div>
                      <p className="text-sm text-[#444444]">{l.fonction}</p>
                      {l.citation && <p className="mt-1 text-sm italic text-[#666666] line-clamp-1">« {l.citation} »</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                    <button
                      type="button"
                      onClick={() => basculer(l)}
                      disabled={occupe}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm font-medium text-[#444444] hover:border-[#111111] disabled:opacity-50"
                    >
                      {l.visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                      {l.visible ? 'Masquer' : 'Afficher'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEdition(depuisLigne(l))}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm font-medium text-[#111111] hover:border-[#111111]"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" /> Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => setASupprimer(l)}
                      disabled={occupe}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:border-red-600 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" /> Supprimer
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {edition && (
        <FormulaireFiche
          brouillon={edition}
          lignes={lignes}
          onFermer={() => setEdition(null)}
          onEnregistre={apresEnregistrement}
        />
      )}

      {aSupprimer && (
        <DeleteConfirmModal
          title={`Supprimer la fiche de ${aSupprimer.prenom} ?`}
          message="La fiche disparaît du site et sa photo est effacée définitivement. Pour la retirer seulement pour un temps, utilisez plutôt « Masquer »."
          onConfirm={() => supprimer(aSupprimer)}
          onCancel={() => setASupprimer(null)}
        />
      )}
    </AdminLayout>
  );
}

function Champ({
  label, valeur, onChange, max, requis, aide, multiligne, lignes = 3, id,
}: {
  label: string; valeur: string; onChange: (v: string) => void; max: number; requis?: boolean; aide?: string;
  multiligne?: boolean; lignes?: number; id: string;
}) {
  const classe = 'w-full px-4 py-3 bg-white text-noir border-[1.5px] border-champ rounded-xl focus:outline-none focus:border-bleu focus:ring-4 focus:ring-bleu/15';
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-noir">
          {label}
          {requis && <span className="text-bleu ml-1" aria-hidden="true">*</span>}
        </label>
        <span className={`text-xs tabular-nums ${valeur.length > max * 0.9 ? 'text-amber-800' : 'text-[#767676]'}`}>
          {valeur.length}/{max}
        </span>
      </div>
      {multiligne ? (
        <textarea id={id} value={valeur} onChange={(e) => onChange(e.target.value)} maxLength={max} rows={lignes} required={requis} className={classe} />
      ) : (
        <input id={id} value={valeur} onChange={(e) => onChange(e.target.value)} maxLength={max} required={requis} className={classe} />
      )}
      {aide && <p className="mt-1 text-xs text-[#5E5E5E]">{aide}</p>}
    </div>
  );
}

function FormulaireFiche({
  brouillon, lignes, onFermer, onEnregistre,
}: {
  brouillon: Brouillon;
  lignes: LigneEquipe[];
  onFermer: () => void;
  onEnregistre: (prenom: string, nouvelle: boolean) => void;
}) {
  const [b, setB] = useState<Brouillon>(brouillon);
  const [aRecadrer, setARecadrer] = useState<File | null>(null);
  const [apercu, setApercu] = useState<string | null>(null);
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const maj = (p: Partial<Brouillon>) => setB((x) => ({ ...x, ...p }));

  // Aperçu de la nouvelle photo
  useEffect(() => {
    if (!b.nouvellePhoto) return setApercu(null);
    const u = URL.createObjectURL(b.nouvellePhoto);
    setApercu(u);
    return () => URL.revokeObjectURL(u);
  }, [b.nouvellePhoto]);

  const autreResponsable = lignes.find((l) => l.responsable && l.id !== b.id);
  const photo = apercu ?? b.photoActuelle;
  const origine = b.id ? lignes.find((l) => l.id === b.id) : undefined;

  const choisir = (f: File[]) => {
    if (f[0]) setARecadrer(f[0]);
  };

  const enregistrer = async (e: FormEvent) => {
    e.preventDefault();
    setErreur('');
    const prenom = nettoyer(b.prenom), fonction = nettoyer(b.fonction);
    if (!prenom || !fonction) return setErreur('Le prénom et la fonction sont obligatoires.');
    if (photo && !b.accord) return setErreur("Cochez la case d'accord pour publier la photo, ou retirez la photo.");
    setEnvoi(true);
    try {
      let photoUrl: string | null = b.photoActuelle;
      let photoChemin: string | null = b.photoActuelle ? origine?.photo_chemin ?? null : null;
      let avif: string | null = b.photoActuelle ? origine?.photo_avif ?? null : null;
      let jpg: string | null = b.photoActuelle ? origine?.photo_jpg ?? null : null;
      if (b.nouvellePhoto) {
        const ext = b.nouvellePhoto.type === 'image/webp' ? 'webp' : 'jpg';
        const chemin = `${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from(BUCKET_EQUIPE).upload(chemin, b.nouvellePhoto, {
          contentType: b.nouvellePhoto.type, cacheControl: '31536000', upsert: false,
        });
        if (error) throw new Error("La photo n'a pas pu être envoyée.");
        photoUrl = supabase.storage.from(BUCKET_EQUIPE).getPublicUrl(chemin).data.publicUrl;
        photoChemin = chemin;
        avif = null;
        jpg = null;
      }

      // Une seule personne mise en avant : l'ancienne est retirée d'abord
      if (b.responsable && autreResponsable) {
        const { error } = await supabase.from('equipe_membres').update({ responsable: false }).eq('id', autreResponsable.id);
        if (error) throw new Error("La mise en avant n'a pas pu être changée.");
      }

      const champs = {
        prenom,
        nom: nettoyer(b.nom) || null,
        fonction,
        citation: nettoyer(b.citation).replace(/^[«"\s]+|[»"\s]+$/g, '') || null,
        presentation: texteLong(b.presentation) || null,
        responsable: b.responsable,
        visible: b.visible,
        photo_url: photoUrl,
        photo_avif: avif,
        photo_jpg: jpg,
        photo_chemin: photoChemin,
        accord_photo_le: photoUrl ? (origine?.accord_photo_le && !b.nouvellePhoto ? origine.accord_photo_le : new Date().toISOString()) : null,
      };
      const { error } = b.id
        ? await supabase.from('equipe_membres').update(champs).eq('id', b.id)
        : await supabase.from('equipe_membres').insert({ ...champs, ordre: lignes.reduce((m, l) => Math.max(m, l.ordre), -1) + 1 });
      if (error) {
        if (b.nouvellePhoto && photoChemin) await supabase.storage.from(BUCKET_EQUIPE).remove([photoChemin]);
        throw new Error("La fiche n'a pas pu être enregistrée.");
      }
      // Ancienne photo remplacée ou retirée : effacée du stockage
      if (origine?.photo_chemin && origine.photo_chemin !== photoChemin) {
        await supabase.storage.from(BUCKET_EQUIPE).remove([origine.photo_chemin]);
      }
      onEnregistre(prenom, !b.id);
    } catch (err) {
      setErreur(`${err instanceof Error ? err.message : 'Erreur.'} Réessayez.`);
      setEnvoi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="fiche-titre">
      <form onSubmit={enregistrer} className="my-4 w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E5E5E5] px-5 py-4">
          <h2 id="fiche-titre" className="text-xl font-bold text-[#111111]">{b.id ? `Modifier la fiche de ${brouillon.prenom}` : 'Ajouter une personne'}</h2>
          <button type="button" onClick={onFermer} className="rounded-full p-1 hover:bg-[#F5F5F5]" aria-label="Fermer sans enregistrer">
            <X className="h-5 w-5 text-[#666666]" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          {/* Photo */}
          <div className="flex flex-col items-center gap-4 rounded-xl bg-[#F9F9F9] p-4 sm:flex-row sm:items-start">
            <Portrait
              membre={{ id: 'apercu', prenom: b.prenom || '?', nom: b.nom || undefined, fonction: b.fonction, ordre: 0, photo: photo ? { webp: photo } : undefined }}
              taille={96}
              anneauOr={b.responsable}
            />
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <p className="text-sm font-medium text-noir">Photo</p>
              <p className="text-xs text-[#5E5E5E]">Portrait de face ou de trois-quarts, visage bien éclairé. Vous la cadrerez à l'étape suivante. Sans photo, les initiales s'affichent.</p>
              <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#D1D5DB] bg-white px-3 py-1.5 text-sm font-medium text-[#111111] hover:border-[#111111] ${SOURIS_SEULEMENT}`}>
                  <Camera className="h-4 w-4" aria-hidden="true" /> {photo ? 'Changer la photo' : 'Choisir une photo'}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      choisir(Array.from(e.target.files ?? []));
                      e.target.value = '';
                    }}
                  />
                </label>
                <ChoixSource onFichiers={choisir} accept="image/*" taille="petite" />
                {photo && (
                  <button
                    type="button"
                    onClick={() => maj({ photoActuelle: null, nouvellePhoto: null, accord: false })}
                    className="rounded-lg border border-[#D1D5DB] bg-white px-3 py-1.5 text-sm font-medium text-[#444444] hover:border-[#111111]"
                  >
                    Retirer la photo
                  </button>
                )}
              </div>
            </div>
          </div>
          {photo && (
            <label className="flex items-start gap-3 rounded-xl border-2 border-amber-200 bg-amber-50 p-3 text-sm text-[#111111]">
              <input type="checkbox" checked={b.accord} onChange={(e) => maj({ accord: e.target.checked })} className="mt-0.5 h-4 w-4 accent-[#111111]" />
              <span>
                <strong className="font-semibold">Accord de la personne</strong> : elle accepte que sa photo et son prénom soient publiés sur svmride.com
                (droit à l'image). Elle peut le retirer à tout moment : il suffit alors de retirer la photo ou de supprimer la fiche.
              </span>
            </label>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Champ id="fiche-prenom" label="Prénom" valeur={b.prenom} onChange={(v) => maj({ prenom: v })} max={LIMITES.prenom} requis />
            <Champ id="fiche-nom" label="Nom (facultatif)" valeur={b.nom} onChange={(v) => maj({ nom: v })} max={LIMITES.nom} aide="Sur le site, seul le prénom est affiché sur l'accueil." />
          </div>
          <Champ id="fiche-fonction" label="Fonction" valeur={b.fonction} onChange={(v) => maj({ fonction: v })} max={LIMITES.fonction} requis aide="Ex. : Conseillère en financement" />
          <Champ
            id="fiche-citation"
            label="Citation (facultative)"
            valeur={b.citation}
            onChange={(v) => maj({ citation: v })}
            max={LIMITES.citation}
            multiligne
            lignes={2}
            aide="Une phrase personnelle, affichée entre guillemets sur la page Équipe (les guillemets sont ajoutés automatiquement)."
          />

          <label className="flex items-start gap-3 text-sm text-[#111111]">
            <input type="checkbox" checked={b.responsable} onChange={(e) => maj({ responsable: e.target.checked })} className="mt-0.5 h-4 w-4 accent-[#111111]" />
            <span>
              <strong className="font-semibold">Mettre en avant</strong> (grande carte noire sur l'accueil, la page Équipe et la page Contact)
              {b.responsable && autreResponsable && (
                <span className="block text-amber-800">{autreResponsable.prenom} ne sera plus mis(e) en avant : une seule personne peut l'être.</span>
              )}
            </span>
          </label>
          {b.responsable && (
            <Champ
              id="fiche-presentation"
              label="Présentation"
              valeur={b.presentation}
              onChange={(v) => maj({ presentation: v })}
              max={LIMITES.presentation}
              multiligne
              lignes={6}
              aide="Laissez une ligne vide entre deux paragraphes. Le premier paragraphe est aussi repris sur la page d'accueil."
            />
          )}

          <label className="flex items-start gap-3 text-sm text-[#111111]">
            <input type="checkbox" checked={b.visible} onChange={(e) => maj({ visible: e.target.checked })} className="mt-0.5 h-4 w-4 accent-[#111111]" />
            <span>
              <strong className="font-semibold">Affiché(e) sur le site</strong>
              <span className="block text-[#5E5E5E]">Décochez pour préparer la fiche ou la retirer un temps sans la supprimer.</span>
            </span>
          </label>

          {erreur && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{erreur}</p>}
        </div>

        <div className="flex gap-3 bg-[#F9F9F9] px-5 py-4">
          <button type="button" onClick={onFermer} className="flex-1 rounded-xl border border-[#E5E5E5] bg-white py-3 font-semibold text-[#111111] hover:bg-[#F5F5F5]">
            Annuler
          </button>
          <button type="submit" disabled={envoi} className="flex-1 rounded-xl bg-[#111111] py-3 font-semibold text-white disabled:opacity-50">
            {envoi ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>

      {aRecadrer && (
        <RecadragePortrait
          fichier={aRecadrer}
          onAnnuler={() => setARecadrer(null)}
          onValider={(image) => {
            setARecadrer(null);
            maj({ nouvellePhoto: image, accord: false });
          }}
        />
      )}
    </div>
  );
}
