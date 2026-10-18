/**
 * Recadrage d'une image à un format précis (admin) : image de fond de
 * l'accueil, tampon du garage, logo des documents.
 *
 * L'image est affichée dans un cadre aux proportions du résultat ; on la
 * déplace au doigt ou à la souris et on règle le zoom. Des repères montrent
 * ce qui reste visible sur certains écrans (ex. téléphone). Résultat : image
 * aux dimensions exactes demandées, en WebP (JPEG si le navigateur ne sait pas
 * produire de WebP) ou en PNG transparent.
 */
import { useCallback, useEffect, useRef, useState, type PointerEvent as PE, type ReactNode } from 'react';
import { AlertTriangle, Minus, Plus, X } from 'lucide-react';
import { decoder } from '../../lib/compressionImage';

interface Img {
  source: CanvasImageSource;
  largeur: number;
  hauteur: number;
  liberer: () => void;
}

export interface Repere {
  /** Proportions (largeur / hauteur) de la partie visible, image centrée */
  ratio: number;
  libelle: string;
}

/** Poids maximal accepté par le stockage des images du site */
const POIDS_MAX = 2 * 1024 * 1024;

async function produire(canvas: HTMLCanvasElement, transparent: boolean, pngSeulement: boolean): Promise<Blob> {
  const essai = (type: string, q?: number) => new Promise<Blob | null>((r) => canvas.toBlob(r, type, q));
  if (transparent) {
    const png = await essai('image/png');
    if (!png) throw new Error('Image impossible à produire');
    if (png.size <= POIDS_MAX) return png;
    if (pngSeulement) throw new Error('Image trop lourde');
    const webp = await essai('image/webp', 0.9);
    if (webp?.type === 'image/webp' && webp.size <= POIDS_MAX) return webp;
    throw new Error('Image trop lourde');
  }
  for (const q of [0.82, 0.72, 0.62]) {
    const webp = await essai('image/webp', q);
    if (webp?.type === 'image/webp') {
      if (webp.size <= POIDS_MAX) return webp;
      continue;
    }
    const jpeg = await essai('image/jpeg', q + 0.04);
    if (jpeg && jpeg.size <= POIDS_MAX) return jpeg;
  }
  throw new Error('Image trop lourde');
}

export function RecadrageImage({
  fichier, largeur, hauteur, titre, etape, consigne, reperes = [], transparent = false, pngSeulement = false, voile, apres, onValider, onAnnuler,
}: {
  fichier: File;
  /** Dimensions du résultat, en pixels */
  largeur: number;
  hauteur: number;
  titre: string;
  /** Ex. « Étape 1 sur 2 » */
  etape?: string;
  consigne: ReactNode;
  reperes?: Repere[];
  /** Zoom arrière possible, zones vides transparentes (PNG) */
  transparent?: boolean;
  /** PNG obligatoire (documents PDF) */
  pngSeulement?: boolean;
  /** Retouche du résultat avant l'enregistrement (ex. fond blanc rendu transparent) */
  apres?: (ctx: CanvasRenderingContext2D, largeur: number, hauteur: number) => void;
  /** Dégradé posé sur l'aperçu (ex. voile sombre du haut de l'accueil) */
  voile?: string;
  onValider: (image: Blob) => void;
  onAnnuler: () => void;
}) {
  const ratio = largeur / hauteur;
  const boite = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [place, setPlace] = useState(560);
  const [img, setImg] = useState<Img | null>(null);
  const [erreur, setErreur] = useState('');
  const [zoom, setZoom] = useState(1);
  const [centre, setCentre] = useState({ x: 0, y: 0 });
  const [travail, setTravail] = useState(false);
  const glisse = useRef<{ id: number; x: number; y: number } | null>(null);
  const zoomMin = transparent ? 0.25 : 1;

  // Cadre aux proportions du résultat, à la largeur disponible (pas trop haut)
  const apL = Math.round(Math.min(place, 520 * ratio));
  const apH = Math.round(apL / ratio);

  useEffect(() => {
    const el = boite.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setPlace(Math.max(200, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let actif = true;
    let charge: Img | null = null;
    decoder(fichier)
      .then((i) => {
        charge = i;
        if (!actif) return i.liberer();
        setImg(i);
        setCentre({ x: i.largeur / 2, y: i.hauteur / 2 });
        if (transparent) {
          // Image entière dans le cadre, centrée
          const couvre = Math.min(i.largeur, i.hauteur * ratio);
          const contient = Math.max(i.largeur, i.hauteur * ratio);
          setZoom(Math.max(0.25, (couvre / contient) * 0.92));
        }
      })
      .catch(() => actif && setErreur("Cette image ne peut pas être lue. Essayez une image JPEG ou PNG (les photos HEIC d'iPhone passent si vous les choisissez depuis la photothèque)."));
    return () => {
      actif = false;
      charge?.liberer();
    };
  }, [fichier, transparent, ratio]);

  /** Zone de l'image utilisée : largeur et hauteur en pixels de l'image */
  const source = useCallback((z: number) => {
    if (!img) return { sl: 1, sh: 1 };
    const sl = Math.min(img.largeur, img.hauteur * ratio) / z;
    return { sl, sh: sl / ratio };
  }, [img, ratio]);

  const borne = useCallback((cx: number, cy: number, z: number) => {
    if (!img) return { x: cx, y: cy };
    if (transparent) return { x: Math.min(Math.max(cx, 0), img.largeur), y: Math.min(Math.max(cy, 0), img.hauteur) };
    const { sl, sh } = source(z);
    return {
      x: Math.min(Math.max(cx, sl / 2), img.largeur - sl / 2),
      y: Math.min(Math.max(cy, sh / 2), img.hauteur - sh / 2),
    };
  }, [img, source, transparent]);

  const dessiner = useCallback((ctx: CanvasRenderingContext2D, l: number, h: number) => {
    if (!img) return;
    const { sl } = source(zoom);
    const k = l / sl;
    ctx.clearRect(0, 0, l, h);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img.source, -(centre.x - sl / 2) * k, -(centre.y - sl / ratio / 2) * k, img.largeur * k, img.hauteur * k);
  }, [img, zoom, centre, source, ratio]);

  useEffect(() => {
    const c = canvas.current;
    if (!c || !img) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(apL * dpr);
    c.height = Math.round(apH * dpr);
    const ctx = c.getContext('2d');
    if (!ctx) return;
    dessiner(ctx, c.width, c.height);
    apres?.(ctx, c.width, c.height);
  }, [img, dessiner, apL, apH, apres]);

  const changerZoom = (z: number) => {
    const n = Math.min(Math.max(z, zoomMin), 5);
    setZoom(n);
    setCentre((c) => borne(c.x, c.y, n));
  };

  const appui = (e: PE<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    glisse.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
  };
  const deplace = (e: PE<HTMLCanvasElement>) => {
    const g = glisse.current;
    if (!g || g.id !== e.pointerId || !img) return;
    const echelle = apL / source(zoom).sl; // px écran par px image
    const dx = (e.clientX - g.x) / echelle, dy = (e.clientY - g.y) / echelle;
    glisse.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    setCentre((c) => borne(c.x - dx, c.y - dy, zoom));
  };
  const relache = () => {
    glisse.current = null;
  };

  const valider = async () => {
    if (!img) return;
    setTravail(true);
    try {
      const c = document.createElement('canvas');
      c.width = largeur;
      c.height = hauteur;
      const ctx = c.getContext('2d', { willReadFrequently: !!apres })!;
      dessiner(ctx, largeur, hauteur);
      apres?.(ctx, largeur, hauteur);
      onValider(await produire(c, transparent, pngSeulement));
    } catch {
      setErreur("L'image n'a pas pu être préparée. Réessayez avec une autre image.");
      setTravail(false);
    }
  };

  // Image trop petite pour le format : risque de flou
  const flou = !!img && source(zoom).sl < largeur * 0.7;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="recadrage-image-titre">
      <div className="my-auto w-full max-w-3xl shrink-0 overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-[#E5E5E5] px-5 py-4">
          <div>
            {etape && <p className="text-xs font-semibold uppercase tracking-wide text-[#666666]">{etape}</p>}
            <h2 id="recadrage-image-titre" className="text-lg font-bold text-[#111111]">{titre}</h2>
          </div>
          <button type="button" onClick={onAnnuler} className="rounded-full p-1 hover:bg-[#F5F5F5]" aria-label="Annuler">
            <X className="h-5 w-5 text-[#666666]" />
          </button>
        </div>

        <div className="px-5 py-5">
          {erreur ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{erreur}</p>
          ) : (
            <>
              <div className="mb-3 text-sm text-[#666666]">{consigne}</div>
              <div ref={boite} className="w-full">
                <div className="relative mx-auto select-none overflow-hidden rounded-lg" style={{ width: apL, height: apH }}>
                  <canvas
                    ref={canvas}
                    style={{
                      width: apL, height: apH, touchAction: 'none',
                      background: transparent ? 'repeating-conic-gradient(#E5E5E5 0% 25%, #FFFFFF 0% 50%) 0 0 / 16px 16px' : '#F5F5F5',
                    }}
                    className={`block ${img ? 'cursor-grab active:cursor-grabbing' : 'animate-pulse'}`}
                    onPointerDown={appui}
                    onPointerMove={deplace}
                    onPointerUp={relache}
                    onPointerCancel={relache}
                    onWheel={(e) => changerZoom(zoom - e.deltaY / 600)}
                    aria-label="Aperçu du cadrage : faites glisser pour déplacer l'image"
                  />
                  {voile && <div className="pointer-events-none absolute inset-0" style={{ background: voile }} aria-hidden="true" />}
                  {reperes.map((r) => {
                    const l = r.ratio < ratio ? (r.ratio / ratio) * 100 : 100;
                    const h = r.ratio > ratio ? (ratio / r.ratio) * 100 : 100;
                    return (
                      <div key={r.libelle} className="pointer-events-none absolute border-2 border-dashed border-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
                        style={{ left: `${(100 - l) / 2}%`, top: `${(100 - h) / 2}%`, width: `${l}%`, height: `${h}%` }} aria-hidden="true">
                        <span className="absolute left-1 top-1 rounded bg-black/65 px-1.5 py-0.5 text-[11px] font-semibold text-white">{r.libelle}</span>
                      </div>
                    );
                  })}
                  <div className="pointer-events-none absolute inset-0 rounded-lg border-2 border-[#111111]/70" aria-hidden="true" />
                </div>
              </div>

              <div className="mx-auto mt-4 flex max-w-md items-center gap-3">
                <button type="button" onClick={() => changerZoom(zoom - 0.2)} className="rounded-lg border border-[#D1D5DB] p-2 hover:border-[#111111]" aria-label="Zoom arrière">
                  <Minus className="h-4 w-4" />
                </button>
                <input type="range" min={zoomMin} max={5} step={0.01} value={zoom} onChange={(e) => changerZoom(Number(e.target.value))}
                  className="flex-1 accent-[#111111]" aria-label="Zoom" />
                <button type="button" onClick={() => changerZoom(zoom + 0.2)} className="rounded-lg border border-[#D1D5DB] p-2 hover:border-[#111111]" aria-label="Zoom avant">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-center text-xs text-[#666666]">Résultat : {largeur} × {hauteur} px{transparent ? ', fond transparent conservé' : ''}</p>
              {flou && (
                <p className="mx-auto mt-3 flex max-w-xl items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  Image un peu petite pour ce format (ou trop zoomée) : elle risque d'être floue. Dézoomez ou choisissez une image plus grande.
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex gap-3 bg-[#F9F9F9] px-5 py-4">
          <button type="button" onClick={onAnnuler} className="flex-1 rounded-xl border border-[#E5E5E5] bg-white py-2.5 font-semibold text-[#111111] hover:bg-[#F5F5F5]">
            Annuler
          </button>
          <button type="button" onClick={valider} disabled={!img || !!erreur || travail}
            className="flex-1 rounded-xl bg-[#111111] py-2.5 font-semibold text-white disabled:opacity-50">
            {travail ? 'Préparation…' : 'Valider ce cadrage'}
          </button>
        </div>
      </div>
    </div>
  );
}
