/**
 * Admin — Édition du site › Identité du site › « Image de la page d'accueil ».
 *
 * Une photo choisie est cadrée deux fois : format large pour les ordinateurs
 * (2400 × 760) et format pour téléphones et tablettes (1600 × 1000, avec le
 * repère de la partie visible sur un téléphone). Aperçu de la vraie page
 * d'accueil avant validation, puis envoi dans le stockage des images du site
 * (accueil/<version>/) et réglage « fond_accueil » (historique automatique).
 */
import { useEffect, useMemo, useState } from 'react';
import { Image as ImageIcon, Monitor, RotateCcw, Smartphone, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BUCKET_SITE } from '../../lib/identite';
import { appliquerFondAccueil } from '../../lib/medias';
import { CLE_FOND_ACCUEIL, FOND_ACCUEIL_ORIGINE, FORMATS_FOND, type FondAccueil } from '../../config/medias';
import { RecadrageImage } from './RecadrageImage';
import { ApercuPage } from './ApercuPage';
import { ChoixSource, SOURIS_SEULEMENT } from '../ui/ChoixSource';

/** Voiles sombres de l'accueil (lisibilité du titre), comme sur le site */
const VOILE_ORDINATEUR = 'linear-gradient(180deg, rgba(10,10,10,.08) 0%, rgba(10,10,10,.30) 38%, rgba(10,10,10,.88) 100%)';
const VOILE_MOBILE = 'linear-gradient(180deg, rgba(10,10,10,.35), rgba(10,10,10,.88))';

type Etape = { fichier: File; format: 'ordinateur' | 'mobile'; ordinateur?: Blob };

const extension = (b: Blob) => (b.type === 'image/webp' ? 'webp' : b.type === 'image/png' ? 'png' : 'jpg');
const dateVersion = (v: string) => (/^\d{8}/.test(v) ? `${v.slice(6, 8)}/${v.slice(4, 6)}/${v.slice(0, 4)}` : '');

function Vignettes({ ordinateur, mobile }: { ordinateur: string; mobile: string }) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <figure>
        <div className="relative h-[76px] w-[240px] overflow-hidden rounded-lg border border-[#E5E5E5] bg-[#F5F5F5] bg-cover bg-center" style={{ backgroundImage: `url("${ordinateur}")` }}>
          <div className="absolute inset-0" style={{ background: VOILE_ORDINATEUR }} aria-hidden="true" />
        </div>
        <figcaption className="mt-1 flex items-center gap-1 text-[11px] text-[#666666]"><Monitor className="h-3 w-3" aria-hidden="true" /> Ordinateur</figcaption>
      </figure>
      <figure>
        <div className="relative h-[76px] w-[122px] overflow-hidden rounded-lg border border-[#E5E5E5] bg-[#F5F5F5] bg-cover bg-center" style={{ backgroundImage: `url("${mobile}")` }}>
          <div className="absolute inset-0" style={{ background: VOILE_MOBILE }} aria-hidden="true" />
          {/* Partie visible sur un téléphone */}
          <div className="absolute inset-y-0 left-1/2 w-[55%] -translate-x-1/2 border-x border-dashed border-white/80" aria-hidden="true" />
        </div>
        <figcaption className="mt-1 flex items-center gap-1 text-[11px] text-[#666666]"><Smartphone className="h-3 w-3" aria-hidden="true" /> Téléphone et tablette</figcaption>
      </figure>
    </div>
  );
}

export function BlocFondAccueil({ fond, onEnregistre }: { fond: FondAccueil | null; onEnregistre: (message: string) => void }) {
  const [etape, setEtape] = useState<Etape | null>(null);
  const [nouveau, setNouveau] = useState<{ fichier: File; ordinateur: Blob; mobile: Blob } | null>(null);
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [retourOrigine, setRetourOrigine] = useState(false);

  const urls = useMemo(() => (nouveau ? { ordinateur: URL.createObjectURL(nouveau.ordinateur), mobile: URL.createObjectURL(nouveau.mobile) } : null), [nouveau]);
  useEffect(() => () => {
    if (urls) Object.values(urls).forEach((u) => URL.revokeObjectURL(u));
  }, [urls]);

  const actuel = fond ?? { version: '', ...FOND_ACCUEIL_ORIGINE };

  const choisir = (f: File[]) => {
    setErreur('');
    setRetourOrigine(false);
    if (f[0]) setEtape({ fichier: f[0], format: 'ordinateur' });
  };

  const recadree = (b: Blob) => {
    if (!etape) return;
    if (etape.format === 'ordinateur') {
      setEtape({ ...etape, format: 'mobile', ordinateur: b });
      return;
    }
    setNouveau({ fichier: etape.fichier, ordinateur: etape.ordinateur!, mobile: b });
    setEtape(null);
  };

  const utiliser = async () => {
    if (!nouveau) return;
    setEnvoi(true);
    setErreur('');
    try {
      const version = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
      const valeur: FondAccueil = { version, ordinateur: '', mobile: '' };
      for (const format of ['ordinateur', 'mobile'] as const) {
        const blob = nouveau[format];
        const chemin = `accueil/${version}/${format}.${extension(blob)}`;
        const { error } = await supabase.storage.from(BUCKET_SITE).upload(chemin, blob, { contentType: blob.type, cacheControl: '31536000', upsert: false });
        if (error) throw error;
        valeur[format] = supabase.storage.from(BUCKET_SITE).getPublicUrl(chemin).data.publicUrl;
      }
      const { error } = await supabase.from('site_reglages').upsert({ cle: CLE_FOND_ACCUEIL, valeur });
      if (error) throw error;
      appliquerFondAccueil(valeur);
      setNouveau(null);
      onEnregistre("Nouvelle image d'accueil en place, sur ordinateur, tablette et téléphone.");
    } catch {
      setErreur("L'image n'a pas pu être enregistrée. Réessayez.");
    } finally {
      setEnvoi(false);
    }
  };

  const revenirOrigine = async () => {
    setEnvoi(true);
    const { error } = await supabase.from('site_reglages').upsert({ cle: CLE_FOND_ACCUEIL, valeur: { origine: true } });
    setEnvoi(false);
    setRetourOrigine(false);
    if (error) return setErreur("Le changement n'a pas pu être enregistré. Réessayez.");
    appliquerFondAccueil(null);
    onEnregistre("L'image d'accueil d'origine est de nouveau utilisée.");
  };

  const { ordinateur: fo, mobile: fm } = FORMATS_FOND;

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#666666]">
          {fond ? `Image actuelle${dateVersion(fond.version) ? ` (depuis le ${dateVersion(fond.version)})` : ''}` : "Image actuelle (image d'origine)"}
        </p>
        <Vignettes ordinateur={actuel.ordinateur} mobile={actuel.mobile} />
      </div>

      {nouveau && urls ? (
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-900">Nouvelle image : aperçu</p>
          <Vignettes ordinateur={urls.ordinateur} mobile={urls.mobile} />
          <div className="mt-4 rounded-xl bg-white p-3">
            <ApercuPage chemin="/" fond={{ version: 'apercu', ...urls }} hauteurMax={460}
              legende="Aperçu de la page d'accueil avec la nouvelle image ; les visiteurs la verront après « Utiliser cette image »." />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => setNouveau(null)} disabled={envoi}
              className="rounded-xl border border-[#D1D5DB] bg-white px-4 py-2 text-sm font-semibold text-[#111111] hover:border-[#111111]">
              Annuler
            </button>
            <button type="button" onClick={() => { setEtape({ fichier: nouveau.fichier, format: 'ordinateur' }); setNouveau(null); }} disabled={envoi}
              className="rounded-xl border border-[#D1D5DB] bg-white px-4 py-2 text-sm font-semibold text-[#111111] hover:border-[#111111]">
              Recadrer
            </button>
            <button type="button" onClick={utiliser} disabled={envoi}
              className="rounded-xl bg-[#111111] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {envoi ? 'Enregistrement…' : 'Utiliser cette image'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border-2 border-[#D1D5DB] bg-white px-4 py-2 text-sm font-semibold text-[#111111] hover:border-[#111111] ${SOURIS_SEULEMENT}`}>
            <Upload className="h-4 w-4" aria-hidden="true" /> Choisir une nouvelle image
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
              onChange={(e) => { choisir(Array.from(e.target.files ?? [])); e.target.value = ''; }} />
          </label>
          <ChoixSource onFichiers={choisir} accept="image/jpeg,image/png,image/webp" taille="petite" />
          {fond && (
            retourOrigine ? (
              <span className="inline-flex flex-wrap items-center gap-2 rounded-xl bg-[#F5F5F5] px-3 py-1.5 text-sm">
                Revenir à l'image d'origine ?
                <button type="button" onClick={revenirOrigine} disabled={envoi} className="rounded-lg bg-[#111111] px-3 py-1 font-semibold text-white">Oui</button>
                <button type="button" onClick={() => setRetourOrigine(false)} className="rounded-lg border border-[#D1D5DB] bg-white px-3 py-1 font-semibold">Non</button>
              </span>
            ) : (
              <button type="button" onClick={() => setRetourOrigine(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 text-sm font-medium text-[#444444] hover:border-[#111111]">
                <RotateCcw className="h-4 w-4" aria-hidden="true" /> Revenir à l'image d'origine
              </button>
            )
          )}
        </div>
      )}

      <p className="flex items-start gap-2 text-xs text-[#5E5E5E]">
        <ImageIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>
          Format conseillé : photo horizontale d'au moins {fo.largeur} px de large (idéalement {fo.largeur} × 1500 px ou plus, pour pouvoir cadrer
          les deux formats), en JPEG, PNG ou WebP. Gardez le sujet au centre et un bas d'image sans détail important : le titre s'y affiche,
          sur un voile sombre. Vous cadrez ensuite l'image pour les ordinateurs ({fo.largeur} × {fo.hauteur} px) puis pour les téléphones et
          tablettes ({fm.largeur} × {fm.hauteur} px) ; elle est allégée automatiquement.
        </span>
      </p>
      {erreur && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{erreur}</p>}

      {etape && (
        <RecadrageImage
          key={etape.format}
          fichier={etape.fichier}
          largeur={etape.format === 'ordinateur' ? fo.largeur : fm.largeur}
          hauteur={etape.format === 'ordinateur' ? fo.hauteur : fm.hauteur}
          etape={etape.format === 'ordinateur' ? 'Étape 1 sur 2' : 'Étape 2 sur 2'}
          titre={etape.format === 'ordinateur' ? 'Cadrage pour les ordinateurs' : 'Cadrage pour les téléphones et tablettes'}
          consigne={etape.format === 'ordinateur'
            ? 'Faites glisser et zoomez pour cadrer la bande large affichée sur ordinateur. Sur les très grands écrans, le haut et le bas sont un peu rognés (repère).'
            : 'Faites glisser et zoomez pour cadrer l’image des tablettes. Sur un téléphone, seule la partie centrale est visible (repère « Téléphone ») : placez-y le sujet.'}
          reperes={etape.format === 'ordinateur' ? [{ ratio: 3.85, libelle: 'Grand écran' }] : [{ ratio: 390 / 440, libelle: 'Téléphone' }]}
          voile={etape.format === 'ordinateur' ? VOILE_ORDINATEUR : VOILE_MOBILE}
          onAnnuler={() => setEtape(null)}
          onValider={recadree}
        />
      )}
    </div>
  );
}
