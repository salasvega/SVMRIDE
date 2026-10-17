/**
 * Recadrage d'un portrait (admin, onglet Équipe) : la photo choisie est affichée
 * dans un carré avec le cercle du portrait ; on la déplace au doigt ou à la
 * souris et on règle le zoom. Résultat : image carrée de 640 px en WebP (JPEG si
 * le navigateur ne sait pas produire de WebP), légère et au même cadrage pour
 * toute l'équipe.
 */
import { useCallback, useEffect, useRef, useState, type PointerEvent as PE } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import { decoder } from '../../lib/compressionImage';

const APERCU = 280;
const SORTIE = 640;

interface Image {
  source: CanvasImageSource;
  largeur: number;
  hauteur: number;
  liberer: () => void;
}

/** Zone source (carré) pour un centre et un zoom donnés, gardée dans l'image */
function zone(img: Image, cx: number, cy: number, zoom: number) {
  const cote = Math.min(img.largeur, img.hauteur) / zoom;
  const x = Math.min(Math.max(cx - cote / 2, 0), img.largeur - cote);
  const y = Math.min(Math.max(cy - cote / 2, 0), img.hauteur - cote);
  return { x, y, cote };
}

async function versBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const essai = (type: string, q: number) => new Promise<Blob | null>((r) => canvas.toBlob(r, type, q));
  const webp = await essai('image/webp', 0.86);
  if (webp && webp.type === 'image/webp') return webp;
  const jpeg = await essai('image/jpeg', 0.88);
  if (!jpeg) throw new Error('Image impossible à produire');
  return jpeg;
}

async function enPng(canvas: HTMLCanvasElement): Promise<Blob> {
  const png = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
  if (!png) throw new Error('Image impossible à produire');
  return png;
}

export function RecadragePortrait({
  fichier,
  onValider,
  onAnnuler,
  mode = 'portrait',
}: {
  fichier: File;
  onValider: (image: Blob) => void;
  onAnnuler: () => void;
  /** « logo » : cadre carré, zoom arrière possible (zones vides transparentes), PNG 512 px */
  mode?: 'portrait' | 'logo';
}) {
  const logo = mode === 'logo';
  const zoomMin = logo ? 0.3 : 1;
  const sortie = logo ? 512 : SORTIE;
  const canvas = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<Image | null>(null);
  const [erreur, setErreur] = useState('');
  const [zoom, setZoom] = useState(1);
  const [centre, setCentre] = useState({ x: 0, y: 0 });
  const glisse = useRef<{ id: number; x: number; y: number } | null>(null);
  const [travail, setTravail] = useState(false);

  useEffect(() => {
    let actif = true;
    let charge: Image | null = null;
    decoder(fichier)
      .then((i) => {
        charge = i;
        if (!actif) return i.liberer();
        setImg(i);
        if (logo) {
          // Logo en entier dans le carré, centré
          setZoom(Math.min(i.largeur, i.hauteur) / Math.max(i.largeur, i.hauteur));
          setCentre({ x: i.largeur / 2, y: i.hauteur / 2 });
          return;
        }
        // Centré, un peu remonté : les visages sont souvent dans le haut de la photo
        setCentre({ x: i.largeur / 2, y: i.hauteur > i.largeur ? i.hauteur * 0.4 : i.hauteur / 2 });
      })
      .catch(() => actif && setErreur("Cette photo ne peut pas être lue. Essayez une photo JPEG ou PNG (les photos HEIC d'iPhone passent si vous les choisissez depuis la photothèque)."));
    return () => {
      actif = false;
      charge?.liberer();
    };
  }, [fichier, logo]);

  // Garde le centre dans l'image quand le zoom change
  const borne = useCallback((cx: number, cy: number, z: number) => {
    if (!img) return { x: cx, y: cy };
    if (logo) return { x: Math.min(Math.max(cx, 0), img.largeur), y: Math.min(Math.max(cy, 0), img.hauteur) };
    const z0 = zone(img, cx, cy, z);
    return { x: z0.x + z0.cote / 2, y: z0.y + z0.cote / 2 };
  }, [img, logo]);

  /** Dessine le cadrage sur un carré de « taille » px (zones hors image transparentes) */
  const dessiner = useCallback((ctx: CanvasRenderingContext2D, taille: number) => {
    if (!img) return;
    const cote = Math.min(img.largeur, img.hauteur) / zoom;
    const k = taille / cote;
    ctx.clearRect(0, 0, taille, taille);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img.source, -(centre.x - cote / 2) * k, -(centre.y - cote / 2) * k, img.largeur * k, img.hauteur * k);
  }, [img, zoom, centre]);

  useEffect(() => {
    const c = canvas.current;
    if (!c || !img) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = APERCU * dpr;
    c.height = APERCU * dpr;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    dessiner(ctx, c.width);
  }, [img, dessiner]);

  const changerZoom = (z: number) => {
    const n = Math.min(Math.max(z, zoomMin), 4);
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
    const echelle = APERCU / (Math.min(img.largeur, img.hauteur) / zoom); // px écran par px image
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
      c.width = sortie;
      c.height = sortie;
      dessiner(c.getContext('2d')!, sortie);
      onValider(logo ? await enPng(c) : await versBlob(c));
    } catch {
      setErreur("La photo n'a pas pu être préparée. Réessayez avec une autre photo.");
      setTravail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="recadrage-titre">
      <div className="my-auto w-full max-w-sm shrink-0 overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E5E5E5] px-5 py-4">
          <h2 id="recadrage-titre" className="text-lg font-bold text-[#111111]">{logo ? "Cadrer l'icône" : 'Cadrer la photo'}</h2>
          <button type="button" onClick={onAnnuler} className="rounded-full p-1 hover:bg-[#F5F5F5]" aria-label="Annuler">
            <X className="h-5 w-5 text-[#666666]" />
          </button>
        </div>

        <div className="px-5 py-5">
          {erreur ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{erreur}</p>
          ) : (
            <>
              <p className="mb-3 text-sm text-[#666666]">
                {logo
                  ? 'Faites glisser et zoomez pour placer le logo dans le carré. Les zones vides (damier) restent transparentes.'
                  : 'Faites glisser la photo pour placer le visage dans le cercle, et zoomez si besoin.'}
              </p>
              <div className="relative mx-auto select-none" style={{ width: APERCU, height: APERCU }}>
                <canvas
                  ref={canvas}
                  style={{
                    width: APERCU, height: APERCU, touchAction: 'none',
                    ...(logo ? { background: 'repeating-conic-gradient(#E5E5E5 0% 25%, #FFFFFF 0% 50%) 0 0 / 16px 16px' } : {}),
                  }}
                  className={`block rounded-lg ${logo ? '' : 'bg-[#F5F5F5]'} ${img ? 'cursor-grab active:cursor-grabbing' : 'animate-pulse'}`}
                  onPointerDown={appui}
                  onPointerMove={deplace}
                  onPointerUp={relache}
                  onPointerCancel={relache}
                  onWheel={(e) => changerZoom(zoom - e.deltaY / 500)}
                  aria-label="Aperçu du cadrage"
                />
                {logo ? (
                  <div className="pointer-events-none absolute inset-0 rounded-lg border-2 border-[#111111]/70" aria-hidden="true" />
                ) : (
                  <>
                    {/* Cercle du portrait : l'extérieur est assombri */}
                    <div
                      className="pointer-events-none absolute inset-0 rounded-lg"
                      style={{ background: 'radial-gradient(circle closest-side, transparent 99%, rgba(0,0,0,0.45) 100%)' }}
                      aria-hidden="true"
                    />
                    <div className="pointer-events-none absolute inset-0 rounded-full border-2 border-white/90" aria-hidden="true" />
                  </>
                )}
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button type="button" onClick={() => changerZoom(zoom - 0.25)} className="rounded-lg border border-[#D1D5DB] p-2 hover:border-[#111111]" aria-label="Zoom arrière">
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="range"
                  min={zoomMin}
                  max={4}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => changerZoom(Number(e.target.value))}
                  className="flex-1 accent-[#111111]"
                  aria-label="Zoom"
                />
                <button type="button" onClick={() => changerZoom(zoom + 0.25)} className="rounded-lg border border-[#D1D5DB] p-2 hover:border-[#111111]" aria-label="Zoom avant">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 bg-[#F9F9F9] px-5 py-4">
          <button type="button" onClick={onAnnuler} className="flex-1 rounded-xl border border-[#E5E5E5] bg-white py-2.5 font-semibold text-[#111111] hover:bg-[#F5F5F5]">
            Annuler
          </button>
          <button
            type="button"
            onClick={valider}
            disabled={!img || !!erreur || travail}
            className="flex-1 rounded-xl bg-[#111111] py-2.5 font-semibold text-white disabled:opacity-50"
          >
            {travail ? 'Préparation…' : logo ? 'Utiliser cette image' : 'Utiliser cette photo'}
          </button>
        </div>
      </div>
    </div>
  );
}
