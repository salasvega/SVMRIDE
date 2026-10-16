/**
 * Tableau de bord : place utilisée dans le stockage Supabase (offre Pro,
 * 100 Go inclus) et outil de compression des anciennes photos envoyées par les
 * formulaires. La compression se fait dans le navigateur de l'admin : chaque
 * photo est téléchargée, allégée, puis remplacée au même emplacement (les
 * liens et les demandes restent inchangés).
 */
import { useCallback, useEffect, useState } from 'react';
import { HardDrive, Minimize2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { compresserImage } from '../../lib/compressionImage';

const QUOTA = 100 * 1024 ** 3; // 100 Go inclus dans l'offre Pro
const BUCKET = 'form-attachments';
const PARALLELE = 3;

const LIBELLES: Record<string, string> = {
  'form-attachments': 'Pièces jointes des formulaires',
  'vehicle-images': 'Photos des véhicules',
  'financing-documents': 'Dossiers de financement',
  'sales-documents': 'Dossiers de vente',
};

const mo = (o: number) => `${(o / 1024 ** 2).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} Mo`;

interface Espace {
  espace: string;
  fichiers: number;
  octets: number;
}

interface Photo {
  chemin: string;
  octets: number;
}

type Etat =
  | { etape: 'repos' }
  | { etape: 'en_cours'; faites: number; total: number; gain: number; erreurs: number }
  | { etape: 'fini'; total: number; gain: number; erreurs: number };

export function StockageCard() {
  const [espaces, setEspaces] = useState<Espace[] | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [etat, setEtat] = useState<Etat>({ etape: 'repos' });
  const [erreur, setErreur] = useState('');

  const charger = useCallback(async () => {
    const [u, p] = await Promise.all([
      supabase.rpc('stockage_utilise'),
      supabase.rpc('photos_a_compresser', { p_min_octets: 900000 }),
    ]);
    if (u.error) {
      setErreur("Impossible de lire l'espace de stockage.");
      return;
    }
    setEspaces((u.data ?? []).map((e: Espace) => ({ ...e, fichiers: Number(e.fichiers), octets: Number(e.octets) })));
    setPhotos((p.data ?? []).map((e: Photo) => ({ ...e, octets: Number(e.octets) })));
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const compresserUne = async (photo: Photo): Promise<number> => {
    const { data, error } = await supabase.storage.from(BUCKET).download(photo.chemin);
    if (error || !data) throw error ?? new Error('téléchargement');
    const nom = photo.chemin.split('/').pop() || 'photo.jpg';
    const original = new File([data], nom, { type: data.type || 'image/jpeg' });
    const allegee = await compresserImage(original);
    if (allegee === original || allegee.size >= photo.octets) return 0;
    const envoi = await supabase.storage.from(BUCKET).upload(photo.chemin, allegee, {
      upsert: true,
      contentType: 'image/jpeg',
      cacheControl: '3600',
    });
    if (envoi.error) throw envoi.error;
    return photo.octets - allegee.size;
  };

  const lancer = async () => {
    const file = [...photos];
    const total = file.length;
    let faites = 0;
    let gain = 0;
    let erreurs = 0;
    setEtat({ etape: 'en_cours', faites, total, gain, erreurs });

    const ouvrier = async () => {
      for (let photo = file.shift(); photo; photo = file.shift()) {
        try {
          // (pas « gain += await … » : la valeur serait lue avant l'attente et
          // les compressions parallèles s'écraseraient)
          const libere = await compresserUne(photo);
          gain += libere;
        } catch (e) {
          console.error('Compression impossible :', photo.chemin, e);
          erreurs += 1;
        }
        faites += 1;
        setEtat({ etape: 'en_cours', faites, total, gain, erreurs });
      }
    };
    await Promise.all(Array.from({ length: PARALLELE }, ouvrier));
    setEtat({ etape: 'fini', total, gain, erreurs });
    charger();
  };

  const utilise = espaces?.reduce((s, e) => s + e.octets, 0) ?? 0;
  const pourcent = Math.min(100, (utilise / QUOTA) * 100);
  const aCompresser = photos.reduce((s, p) => s + p.octets, 0);
  const couleur = pourcent >= 90 ? 'bg-red-600' : pourcent >= 75 ? 'bg-amber-500' : 'bg-green-600';

  return (
    <section className="bg-white rounded-xl p-6 shadow-sm border-2 border-[#D1D5DB]" aria-labelledby="stockage-titre">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
          <HardDrive className="w-6 h-6 text-[#111111]" aria-hidden="true" />
        </div>
        <div>
          <h3 id="stockage-titre" className="text-lg font-bold text-[#111111]">Stockage des fichiers</h3>
          <p className="text-sm text-[#666666]">Offre Supabase Pro : 100 Go inclus</p>
        </div>
      </div>

      {erreur && <p className="text-sm text-red-700" role="alert">{erreur}</p>}

      {espaces && (
        <>
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-2xl font-bold text-[#111111]">{mo(utilise)}</p>
            <p className="text-sm text-[#666666]">{pourcent.toLocaleString('fr-FR', { maximumFractionDigits: pourcent < 10 ? 1 : 0 })} % utilisés</p>
          </div>
          <div
            className="h-3 rounded-full bg-gray-100 overflow-hidden"
            role="progressbar"
            aria-label="Espace de stockage utilisé"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pourcent)}
          >
            <div className={`h-full ${couleur} transition-[width] duration-500`} style={{ width: `${pourcent}%` }} />
          </div>
          <ul className="mt-4 space-y-1 text-sm text-[#4A4A4A]">
            {espaces
              .filter((e) => e.octets > 0)
              .map((e) => (
                <li key={e.espace} className="flex justify-between gap-4">
                  <span>{LIBELLES[e.espace] ?? e.espace}</span>
                  <span className="tabular-nums">{mo(e.octets)} · {e.fichiers} fichier{e.fichiers > 1 ? 's' : ''}</span>
                </li>
              ))}
          </ul>
        </>
      )}

      <div className="mt-5 pt-5 border-t border-gray-200">
        {etat.etape === 'repos' && photos.length > 0 && (
          <>
            <p className="text-sm text-[#4A4A4A] mb-3">
              {photos.length} photo{photos.length > 1 ? 's' : ''} envoyée{photos.length > 1 ? 's' : ''} par les formulaires
              pèse{photos.length > 1 ? 'nt' : ''} encore {mo(aCompresser)}. Les compresser libère en général plus de 80 % de
              cette place, sans changer les demandes. Gardez cette page ouverte pendant l'opération (quelques minutes).
            </p>
            <button
              type="button"
              onClick={lancer}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111111] text-white text-sm font-semibold hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A8CFF]"
            >
              <Minimize2 className="w-4 h-4" aria-hidden="true" />
              Compresser les anciennes photos
            </button>
          </>
        )}
        {etat.etape === 'repos' && espaces && photos.length === 0 && (
          <p className="text-sm text-[#4A4A4A]">Toutes les photos des formulaires sont déjà compressées.</p>
        )}
        {etat.etape === 'en_cours' && (
          <div role="status" aria-live="polite">
            <p className="text-sm font-medium text-[#111111] mb-2">
              Compression en cours : {etat.faites} / {etat.total} photos — {mo(etat.gain)} libérés
            </p>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full bg-[#254893] transition-[width] duration-300" style={{ width: `${(etat.faites / Math.max(1, etat.total)) * 100}%` }} />
            </div>
            <p className="text-xs text-[#666666] mt-2">Gardez cette page ouverte jusqu'à la fin.</p>
          </div>
        )}
        {etat.etape === 'fini' && (
          <p className="text-sm text-[#111111]" role="status">
            Terminé : {mo(etat.gain)} libérés sur {etat.total} photos.
            {etat.erreurs > 0 && ` ${etat.erreurs} photo${etat.erreurs > 1 ? 's n’ont' : ' n’a'} pas pu être traitée${etat.erreurs > 1 ? 's' : ''} (elles restent intactes).`}
          </p>
        )}
      </div>
    </section>
  );
}
