/**
 * Compression des photos dans le navigateur, avant l'envoi.
 *
 * Les photos de téléphone font 3 à 10 Mo ; réduites à 2000 px de côté en
 * JPEG, elles pèsent 300 à 600 Ko et restent nettes pour une estimation,
 * une annonce ou un justificatif. Les PDF et autres documents ne sont pas
 * modifiés. Si la photo ne peut pas être lue (ex. HEIC hors Safari) ou si la
 * compression ne fait rien gagner, le fichier d'origine est conservé.
 */

export interface OptionsCompression {
  /** Plus grand côté, en pixels */
  cote?: number;
  /** Qualité JPEG, de 0 à 1 */
  qualite?: number;
  /** En dessous de ce poids (et de ce côté), la photo est laissée telle quelle */
  seuilOctets?: number;
}

const TYPES_COMPRESSIBLES = /^image\/(jpe?g|png|webp|heic|heif)$/i;

export const estImageCompressible = (fichier: Blob & { name?: string }) =>
  TYPES_COMPRESSIBLES.test(fichier.type) ||
  (!fichier.type && /\.(jpe?g|png|webp|heic|heif)$/i.test(fichier.name ?? ''));

export async function decoder(fichier: Blob): Promise<{ source: CanvasImageSource; largeur: number; hauteur: number; liberer: () => void }> {
  // createImageBitmap applique l'orientation EXIF (photos prises en portrait)
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(fichier, { imageOrientation: 'from-image' });
      return { source: bitmap, largeur: bitmap.width, hauteur: bitmap.height, liberer: () => bitmap.close() };
    } catch {
      // on tente avec <img> ci-dessous
    }
  }
  const url = URL.createObjectURL(fichier);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return { source: img, largeur: img.naturalWidth, hauteur: img.naturalHeight, liberer: () => URL.revokeObjectURL(url) };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

/** Renvoie une version JPEG allégée de la photo, ou le fichier d'origine */
export async function compresserImage(
  fichier: File,
  { cote = 2000, qualite = 0.82, seuilOctets = 600 * 1024 }: OptionsCompression = {},
): Promise<File> {
  if (!estImageCompressible(fichier)) return fichier;

  let image;
  try {
    image = await decoder(fichier);
  } catch {
    return fichier;
  }

  try {
    const { source, largeur, hauteur } = image;
    if (!largeur || !hauteur) return fichier;
    const echelle = Math.min(1, cote / Math.max(largeur, hauteur));
    const estJpeg = /jpe?g/i.test(fichier.type);
    if (echelle === 1 && fichier.size <= seuilOctets && estJpeg) return fichier;

    const l = Math.max(1, Math.round(largeur * echelle));
    const h = Math.max(1, Math.round(hauteur * echelle));
    const canvas = document.createElement('canvas');
    canvas.width = l;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return fichier;
    ctx.fillStyle = '#ffffff'; // fond blanc pour les PNG transparents
    ctx.fillRect(0, 0, l, h);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, l, h);

    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/jpeg', qualite));
    if (!blob || blob.size >= fichier.size) return fichier;

    const nom = (fichier.name || 'photo').replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], nom, { type: 'image/jpeg', lastModified: fichier.lastModified });
  } catch {
    return fichier;
  } finally {
    image.liberer();
  }
}

/** Extension à utiliser pour le nom de fichier stocké */
export const extensionDe = (fichier: File) =>
  (fichier.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
