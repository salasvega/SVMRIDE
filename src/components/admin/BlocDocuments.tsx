/**
 * Admin — Infos du site › « Tampon et documents » : tampon / signature du
 * garage et logo imprimés sur les contrats de dépôt-vente, les avenants et les
 * certificats de signature.
 *
 * Images en PNG (transparence conservée), recadrées au format attendu par les
 * documents, envoyées dans le stockage des images du site (documents/<version>/)
 * et réglage « documents » (historique automatique). Chaque nouveau contrat garde
 * l'adresse des images utilisées : les contrats existants ne changent pas.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileSignature, Info, RotateCcw, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BUCKET_SITE } from '../../lib/identite';
import { CLE_DOCUMENTS, DOCUMENTS_ORIGINE, FORMAT_LOGO_DOCUMENTS, FORMAT_TAMPON, type Documents } from '../../config/medias';
import type { Identite } from '../../config/identite';
import { RecadrageImage } from './RecadrageImage';
import { ChoixSource, SOURIS_SEULEMENT } from '../ui/ChoixSource';

type Sorte = 'tampon' | 'logo';
const DAMIER = 'repeating-conic-gradient(#EEEEEE 0% 25%, #FFFFFF 0% 50%) 0 0 / 14px 14px';

/** Fond blanc (papier scanné ou photographié) rendu transparent, bords adoucis */
function effacerBlanc(ctx: CanvasRenderingContext2D, l: number, h: number) {
  const d = ctx.getImageData(0, 0, l, h);
  const p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    const clair = Math.min(p[i], p[i + 1], p[i + 2]);
    if (clair >= 235) p[i + 3] = 0;
    else if (clair > 195) p[i + 3] = Math.round(p[i + 3] * (235 - clair) / 40);
  }
  ctx.putImageData(d, 0, 0);
}

/** Aperçu : en-tête du contrat et cadre de signature du garage, comme sur le PDF */
function ApercuContrat({ tampon, logo, nom }: { tampon: string; logo: string; nom: string }) {
  return (
    <div className="w-full max-w-md rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between border-b border-[#E5E5E5] pb-2">
        <img src={logo} alt="Logo des documents" className="h-10 w-10 object-contain" />
        <span className="text-[9px] text-[#888888]">Contrat de dépôt-vente · 2 et 3 roues d'occasion</span>
      </div>
      <p className="mt-3 text-center text-sm font-bold tracking-wide text-[#111111]">CONTRAT DE DÉPÔT-VENTE</p>
      <div className="relative mt-4 h-[92px] rounded bg-[#F4F4F4] px-3 py-2">
        <p className="text-[11px] font-bold text-[#111111]">Le Garage – {nom}</p>
        <p className="text-[9px] italic text-[#666666]">Lu et approuvé · Bon pour dépôt</p>
        <p className="mt-1 text-[9px] text-[#333333]">Pour {nom} :</p>
        <p className="absolute bottom-2 left-3 text-[8px] text-[#888888]">Signature et cachet</p>
        <img src={tampon} alt="Tampon du garage" className="absolute -bottom-1 right-2 w-[118px]" />
      </div>
    </div>
  );
}

export function BlocDocuments({ documents, identite, nom, onEnregistre }: {
  documents: Documents; identite: Identite; nom: string; onEnregistre: (message: string) => void;
}) {
  const [recadrer, setRecadrer] = useState<{ sorte: Sorte; fichier: File } | null>(null);
  const [blanc, setBlanc] = useState(true);
  const [nouveau, setNouveau] = useState<Partial<Record<Sorte, Blob | string>>>({});
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [retour, setRetour] = useState<Sorte | null>(null);

  const apercus = useMemo(() => Object.fromEntries(
    Object.entries(nouveau).map(([k, v]) => [k, typeof v === 'string' ? v : URL.createObjectURL(v)]),
  ) as Partial<Record<Sorte, string>>, [nouveau]);
  useEffect(() => () => {
    Object.entries(nouveau).forEach(([k, v]) => { if (typeof v !== 'string' && apercus[k as Sorte]) URL.revokeObjectURL(apercus[k as Sorte]!); });
  }, [apercus, nouveau]);

  const actuel = { tampon: documents.tampon ?? DOCUMENTS_ORIGINE.tampon, logo: documents.logo ?? DOCUMENTS_ORIGINE.logo };
  const affiche = { tampon: apercus.tampon ?? actuel.tampon, logo: apercus.logo ?? actuel.logo };
  const enCours = Object.keys(nouveau).length > 0;
  const iconeSite = identite.icone?.icon_512 ?? null;

  const choisir = (sorte: Sorte) => (f: File[]) => {
    setErreur('');
    setRetour(null);
    if (f[0]) {
      setBlanc(sorte === 'tampon' && !/png|webp/i.test(f[0].type));
      setRecadrer({ sorte, fichier: f[0] });
    }
  };
  const apres = useCallback((ctx: CanvasRenderingContext2D, l: number, h: number) => effacerBlanc(ctx, l, h), []);

  const enregistrer = async (valeur: Documents, message: string) => {
    const { error } = await supabase.from('site_reglages').upsert({ cle: CLE_DOCUMENTS, valeur });
    if (error) throw error;
    onEnregistre(message);
  };

  const utiliser = async () => {
    setEnvoi(true);
    setErreur('');
    try {
      const version = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
      const valeur: Documents = { version, tampon: documents.tampon, logo: documents.logo };
      for (const sorte of ['tampon', 'logo'] as const) {
        const v = nouveau[sorte];
        if (!v) continue;
        if (typeof v === 'string') {
          valeur[sorte] = v;
          continue;
        }
        const chemin = `documents/${version}/${sorte}.png`;
        const { error } = await supabase.storage.from(BUCKET_SITE).upload(chemin, v, { contentType: 'image/png', cacheControl: '31536000', upsert: false });
        if (error) throw error;
        valeur[sorte] = supabase.storage.from(BUCKET_SITE).getPublicUrl(chemin).data.publicUrl;
      }
      await enregistrer(valeur, 'Enregistré : les prochains contrats, avenants et certificats de signature utiliseront ces images.');
      setNouveau({});
    } catch {
      setErreur("Les images n'ont pas pu être enregistrées. Réessayez.");
    } finally {
      setEnvoi(false);
    }
  };

  const revenir = async (sorte: Sorte) => {
    setEnvoi(true);
    try {
      await enregistrer({ ...documents, version: documents.version, [sorte]: null },
        sorte === 'tampon' ? "Le tampon d'origine sera utilisé pour les prochains documents." : "Le logo d'origine sera utilisé pour les prochains documents.");
    } catch {
      setErreur("Le changement n'a pas pu être enregistré. Réessayez.");
    } finally {
      setEnvoi(false);
      setRetour(null);
    }
  };

  const choix = (sorte: Sorte, libelle: string) => (
    <div className="flex flex-wrap items-center gap-2">
      <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border-2 border-[#D1D5DB] bg-white px-3.5 py-2 text-sm font-semibold text-[#111111] hover:border-[#111111] ${SOURIS_SEULEMENT}`}>
        <Upload className="h-4 w-4" aria-hidden="true" /> {libelle}
        <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label={libelle}
          onChange={(e) => { choisir(sorte)(Array.from(e.target.files ?? [])); e.target.value = ''; }} />
      </label>
      <ChoixSource onFichiers={choisir(sorte)} accept="image/png,image/jpeg,image/webp" taille="petite" />
      {documents[sorte] && !nouveau[sorte] && (
        retour === sorte ? (
          <span className="inline-flex flex-wrap items-center gap-2 rounded-xl bg-[#F5F5F5] px-3 py-1.5 text-sm">
            Revenir à l'image d'origine ?
            <button type="button" onClick={() => revenir(sorte)} disabled={envoi} className="rounded-lg bg-[#111111] px-3 py-1 font-semibold text-white">Oui</button>
            <button type="button" onClick={() => setRetour(null)} className="rounded-lg border border-[#D1D5DB] bg-white px-3 py-1 font-semibold">Non</button>
          </span>
        ) : (
          <button type="button" onClick={() => setRetour(sorte)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 text-sm font-medium text-[#444444] hover:border-[#111111]">
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Image d'origine
          </button>
        )
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-[#111111]">Tampon / signature du garage</h3>
            <p className="mb-3 text-sm text-[#666666]">Apposé dans le cadre de signature du garage, sur les contrats, les avenants et les certificats de signature.</p>
            <div className="mb-3 flex h-24 w-36 items-center justify-center rounded-lg border border-[#E5E5E5] p-1" style={{ background: DAMIER }}>
              <img src={affiche.tampon} alt="" className="max-h-full max-w-full object-contain" />
            </div>
            {choix('tampon', 'Choisir un tampon')}
            <p className="mt-2 text-xs text-[#5E5E5E]">
              Format conseillé : PNG transparent, {FORMAT_TAMPON.largeur} × {FORMAT_TAMPON.hauteur} px (3:2). Un tampon scanné ou photographié sur
              papier blanc convient : le fond blanc peut être effacé au cadrage.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-[#111111]">Logo des documents</h3>
            <p className="mb-3 text-sm text-[#666666]">En haut de chaque page des contrats et certificats.</p>
            <div className="mb-3 flex h-24 w-24 items-center justify-center rounded-lg border border-[#E5E5E5] p-1" style={{ background: DAMIER }}>
              <img src={affiche.logo} alt="" className="max-h-full max-w-full object-contain" />
            </div>
            {choix('logo', 'Choisir un logo')}
            {iconeSite && nouveau.logo !== iconeSite && documents.logo !== iconeSite && (
              <button type="button" onClick={() => setNouveau((n) => ({ ...n, logo: iconeSite }))}
                className="mt-2 text-sm font-semibold text-[#111111] underline underline-offset-2">
                Reprendre l'icône du site
              </button>
            )}
            <p className="mt-2 text-xs text-[#5E5E5E]">Format conseillé : PNG carré, {FORMAT_LOGO_DOCUMENTS.largeur} × {FORMAT_LOGO_DOCUMENTS.hauteur} px, fond transparent ou blanc.</p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#666666]">{enCours ? 'Aperçu avec les nouvelles images' : 'Aperçu sur un contrat'}</p>
          <ApercuContrat tampon={affiche.tampon} logo={affiche.logo} nom={nom} />
        </div>
      </div>

      {enCours && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">
            {nouveau.tampon && nouveau.logo ? 'Nouveau tampon et nouveau logo' : nouveau.tampon ? 'Nouveau tampon' : 'Nouveau logo'} : pas encore enregistré.
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setNouveau({})} disabled={envoi}
              className="rounded-xl border border-[#D1D5DB] bg-white px-4 py-2 text-sm font-semibold text-[#111111] hover:border-[#111111]">Annuler</button>
            <button type="button" onClick={utiliser} disabled={envoi}
              className="rounded-xl bg-[#111111] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {envoi ? 'Enregistrement…' : 'Utiliser pour les prochains documents'}
            </button>
          </div>
        </div>
      )}

      <p className="flex items-start gap-2 rounded-lg bg-[#F9F9F9] px-3 py-2 text-xs text-[#5E5E5E]">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>
          Les contrats déjà créés, signés ou non, gardent le tampon et le logo de leur création (leur certificat de signature aussi) :
          ils ne sont jamais modifiés. Les prochains contrats, avenants et certificats utilisent les nouvelles images.
        </span>
      </p>
      {erreur && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{erreur}</p>}

      {recadrer && (
        <RecadrageImage
          fichier={recadrer.fichier}
          largeur={recadrer.sorte === 'tampon' ? FORMAT_TAMPON.largeur : FORMAT_LOGO_DOCUMENTS.largeur}
          hauteur={recadrer.sorte === 'tampon' ? FORMAT_TAMPON.hauteur : FORMAT_LOGO_DOCUMENTS.hauteur}
          titre={recadrer.sorte === 'tampon' ? 'Cadrer le tampon' : 'Cadrer le logo des documents'}
          transparent
          pngSeulement
          apres={blanc ? apres : undefined}
          consigne={(
            <div className="space-y-2">
              <p>Faites glisser et zoomez pour placer {recadrer.sorte === 'tampon' ? 'le tampon' : 'le logo'} dans le cadre, sans le couper. Les zones en damier restent transparentes.</p>
              <label className="inline-flex items-center gap-2 font-medium text-[#111111]">
                <input type="checkbox" checked={blanc} onChange={(e) => setBlanc(e.target.checked)} className="h-4 w-4 accent-[#111111]" />
                <FileSignature className="h-4 w-4" aria-hidden="true" /> Effacer le fond blanc (image scannée ou photographiée)
              </label>
            </div>
          )}
          onAnnuler={() => setRecadrer(null)}
          onValider={(b) => { setNouveau((n) => ({ ...n, [recadrer.sorte]: b })); setRecadrer(null); }}
        />
      )}
    </div>
  );
}
