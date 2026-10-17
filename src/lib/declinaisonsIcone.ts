/**
 * Décline une icône carrée (PNG 512 px, issue du cadrage) dans toutes les tailles
 * utiles au site : logo de la barre du haut, icônes d'onglet, iPhone, Android et
 * Google. Tout se fait dans le navigateur avant l'envoi.
 */
import type { Icone } from '../config/identite';

type Champ = keyof Omit<Icone, 'version'>;

interface Taille {
  champ: Champ;
  cote: number;
  /** Fond plein (iPhone et Android remplissent sinon la transparence en noir) */
  fond?: string;
  /** Part du carré occupée par le logo (zone de sécurité des icônes Android) */
  echelle?: number;
  /** WebP pour le logo affiché sur le site, PNG pour les icônes */
  webp?: boolean;
}

export const TAILLES: Taille[] = [
  { champ: 'logo', cote: 176, webp: true },
  { champ: 'favicon_32', cote: 32 },
  { champ: 'favicon_48', cote: 48 },
  { champ: 'apple_180', cote: 180, fond: '#FFFFFF' },
  { champ: 'icon_192', cote: 192 },
  { champ: 'icon_512', cote: 512 },
  { champ: 'maskable_512', cote: 512, fond: '#FFFFFF', echelle: 0.8 },
];

const enBlob = (c: HTMLCanvasElement, type: string, q?: number) =>
  new Promise<Blob | null>((r) => c.toBlob(r, type, q));

export interface Declinaison {
  champ: Champ;
  blob: Blob;
  extension: 'png' | 'webp';
}

export async function declinerIcone(source: Blob): Promise<Declinaison[]> {
  const image = await createImageBitmap(source);
  try {
    const sortie: Declinaison[] = [];
    for (const t of TAILLES) {
      const c = document.createElement('canvas');
      c.width = t.cote;
      c.height = t.cote;
      const ctx = c.getContext('2d')!;
      ctx.imageSmoothingQuality = 'high';
      if (t.fond) {
        ctx.fillStyle = t.fond;
        ctx.fillRect(0, 0, t.cote, t.cote);
      }
      const cote = t.cote * (t.echelle ?? 1);
      const marge = (t.cote - cote) / 2;
      ctx.drawImage(image, marge, marge, cote, cote);
      let blob: Blob | null = null;
      let extension: 'png' | 'webp' = 'png';
      if (t.webp) {
        blob = await enBlob(c, 'image/webp', 0.9);
        if (blob?.type === 'image/webp') extension = 'webp';
        else blob = null;
      }
      blob ??= await enBlob(c, 'image/png');
      if (!blob) throw new Error(`Taille ${t.cote} px impossible à produire`);
      sortie.push({ champ: t.champ, blob, extension });
    }
    return sortie;
  } finally {
    image.close();
  }
}
