/**
 * Admin — Infos du site, bloc « Logo et icône » : une image carrée (idéalement
 * un PNG transparent d'au moins 512 px) devient le logo de la barre du haut et
 * du pied de page, l'icône de l'onglet, l'icône iPhone / Android et le logo
 * transmis à Google. Cadrage, aperçu avant validation, retour au logo d'origine.
 */
import { useEffect, useMemo, useState } from 'react';
import { Image as ImageIcon, RotateCcw, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BUCKET_SITE, enregistrerIdentite } from '../../lib/identite';
import { declinerIcone, type Declinaison } from '../../lib/declinaisonsIcone';
import { icones, type Icone, type Identite } from '../../config/identite';
import { RecadragePortrait } from './RecadragePortrait';
import { ChoixSource, SOURIS_SEULEMENT } from '../ui/ChoixSource';


/** Aperçu : onglet de navigateur, barre du site, écran d'accueil du téléphone */
function Apercus({ x, titre, nom }: { x: Omit<Icone, 'version'>; titre: string; nom: string }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#666666]">{titre}</p>
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-48 rounded-t-lg border border-b-0 border-[#D1D5DB] bg-[#F5F5F5] px-3 py-2">
          <div className="flex items-center gap-2">
            <img src={x.favicon_32} alt="" width={16} height={16} className="h-4 w-4" />
            <span className="truncate text-xs text-[#333333]">{nom} – Motos et scooters d’occasion</span>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-[#E5E5E5] bg-white px-3 py-2">
          <img src={x.logo} alt="" width={36} height={36} className="h-9 w-9 object-contain" />
          <span className="text-base font-bold text-[#111111]">{nom}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <img src={x.apple_180} alt="" width={56} height={56} className="h-14 w-14 rounded-[14px] shadow-md" />
          <span className="text-[10px] text-[#666666]">Téléphone</span>
        </div>
      </div>
    </div>
  );
}

export function BlocIcone({ identite, nom = 'SVM Ride', onEnregistre }: { identite: Identite; nom?: string; onEnregistre: (message: string) => void }) {
  const [aRecadrer, setARecadrer] = useState<File | null>(null);
  const [nouvelle, setNouvelle] = useState<Declinaison[] | null>(null);
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [retourOrigine, setRetourOrigine] = useState(false);

  // Adresses temporaires des tailles générées, pour l'aperçu
  const apercuNouvelle = useMemo(() => {
    if (!nouvelle) return null;
    return Object.fromEntries(nouvelle.map((d) => [d.champ, URL.createObjectURL(d.blob)])) as Omit<Icone, 'version'>;
  }, [nouvelle]);
  useEffect(() => () => {
    if (apercuNouvelle) Object.values(apercuNouvelle).forEach((u) => URL.revokeObjectURL(u));
  }, [apercuNouvelle]);

  const choisir = (f: File[]) => {
    setErreur('');
    setRetourOrigine(false);
    if (f[0]) setARecadrer(f[0]);
  };

  const recadree = async (png: Blob) => {
    setARecadrer(null);
    try {
      setNouvelle(await declinerIcone(png));
    } catch {
      setErreur("L'image n'a pas pu être préparée. Essayez avec un PNG ou un JPEG.");
    }
  };

  const utiliser = async () => {
    if (!nouvelle) return;
    setEnvoi(true);
    setErreur('');
    try {
      const version = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
      const urls: Partial<Icone> = { version };
      for (const d of nouvelle) {
        const chemin = `icone/${version}/${d.champ}.${d.extension}`;
        const { error } = await supabase.storage.from(BUCKET_SITE).upload(chemin, d.blob, {
          contentType: d.extension === 'webp' ? 'image/webp' : 'image/png', cacheControl: '31536000', upsert: false,
        });
        if (error) throw error;
        urls[d.champ] = supabase.storage.from(BUCKET_SITE).getPublicUrl(chemin).data.publicUrl;
      }
      if (!(await enregistrerIdentite({ icone: urls as Icone }))) throw new Error('réglage');
      setNouvelle(null);
      onEnregistre("Nouvelle icône en place : logo du site, onglet du navigateur, téléphones et Google.");
    } catch {
      setErreur("L'icône n'a pas pu être enregistrée. Réessayez.");
    } finally {
      setEnvoi(false);
    }
  };

  const revenirOrigine = async () => {
    setEnvoi(true);
    const ok = await enregistrerIdentite({ icone: null });
    setEnvoi(false);
    setRetourOrigine(false);
    if (ok) onEnregistre("Le logo d'origine du site est de nouveau utilisé.");
    else setErreur("Le changement n'a pas pu être enregistré. Réessayez.");
  };

  return (
    <div className="space-y-5">
      <Apercus nom={nom} x={icones(identite)} titre={identite.icone ? 'Icône actuelle' : "Icône actuelle (logo d'origine)"} />

      {apercuNouvelle ? (
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
          <Apercus nom={nom} x={apercuNouvelle} titre="Nouvelle icône : aperçu" />
          <p className="mt-3 text-xs text-[#5E5E5E]">
            Elle remplacera le logo de la barre du haut et du pied de page, l'icône de l'onglet, celle des téléphones
            (écran d'accueil) et le logo transmis à Google. Les navigateurs gardent parfois l'ancienne icône d'onglet
            quelques heures en mémoire.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => setNouvelle(null)} disabled={envoi}
              className="rounded-xl border border-[#D1D5DB] bg-white px-4 py-2 text-sm font-semibold text-[#111111] hover:border-[#111111]">
              Annuler
            </button>
            <button type="button" onClick={utiliser} disabled={envoi}
              className="rounded-xl bg-[#111111] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {envoi ? 'Enregistrement…' : 'Utiliser cette icône'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border-2 border-[#D1D5DB] bg-white px-4 py-2 text-sm font-semibold text-[#111111] hover:border-[#111111] ${SOURIS_SEULEMENT}`}>
            <Upload className="h-4 w-4" aria-hidden="true" /> Choisir une nouvelle image
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="sr-only"
              onChange={(e) => {
                choisir(Array.from(e.target.files ?? []));
                e.target.value = '';
              }}
            />
          </label>
          <ChoixSource onFichiers={choisir} accept="image/png,image/jpeg,image/webp" taille="petite" />
          {identite.icone && (
            retourOrigine ? (
              <span className="inline-flex flex-wrap items-center gap-2 rounded-xl bg-[#F5F5F5] px-3 py-1.5 text-sm">
                Revenir au logo d'origine ?
                <button type="button" onClick={revenirOrigine} disabled={envoi} className="rounded-lg bg-[#111111] px-3 py-1 font-semibold text-white">Oui</button>
                <button type="button" onClick={() => setRetourOrigine(false)} className="rounded-lg border border-[#D1D5DB] bg-white px-3 py-1 font-semibold">Non</button>
              </span>
            ) : (
              <button type="button" onClick={() => setRetourOrigine(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 text-sm font-medium text-[#444444] hover:border-[#111111]">
                <RotateCcw className="h-4 w-4" aria-hidden="true" /> Revenir au logo d'origine
              </button>
            )
          )}
        </div>
      )}

      <p className="flex items-start gap-2 text-xs text-[#5E5E5E]">
        <ImageIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Idéalement un PNG carré d'au moins 512 × 512 px, sur fond transparent, avec un logo lisible même tout petit (16 px dans l'onglet).
      </p>
      {erreur && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{erreur}</p>}

      {aRecadrer && (
        <RecadragePortrait mode="logo" fichier={aRecadrer} onAnnuler={() => setARecadrer(null)} onValider={recadree} />
      )}
    </div>
  );
}
