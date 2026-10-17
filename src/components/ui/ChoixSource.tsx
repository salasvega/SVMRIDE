/**
 * Sur téléphone et tablette (écran tactile) : deux boutons « Photothèque » et
 * « Caméra » pour ajouter des photos ou des documents (demande du 17/10/2026).
 * - Photothèque : sélecteur habituel (photos enregistrées, et fichiers si le champ
 *   accepte les PDF) ;
 * - Caméra : ouvre directement l'appareil photo (capture="environment", objectif
 *   arrière), sans devoir enregistrer la photo dans la photothèque au préalable.
 * Sur ordinateur (souris), rien n'est affiché : le glisser-déposer et le clic restent.
 *
 * Les clics ne remontent pas au parent (zones de dépôt cliquables).
 */
import { useRef } from 'react';
import type { ChangeEvent, MouseEvent } from 'react';
import { Camera, Images } from 'lucide-react';

/** Affiché seulement quand le pointeur principal est le doigt */
export const TACTILE_SEULEMENT = 'hidden [@media(pointer:coarse)]:flex';
/** Masqué quand le pointeur principal est le doigt */
export const SOURIS_SEULEMENT = '[@media(pointer:coarse)]:hidden';

export function ChoixSource({
  onFichiers,
  accept = 'image/*',
  multiple = true,
  disabled = false,
  className = '',
  taille = 'normale',
}: {
  onFichiers: (fichiers: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  taille?: 'normale' | 'petite';
}) {
  const bibliotheque = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const avecFichiers = /pdf|\.doc|application\//i.test(accept);

  const choisi = (e: ChangeEvent<HTMLInputElement>) => {
    const liste = Array.from(e.target.files ?? []);
    e.target.value = ''; // pour pouvoir reprendre le même fichier
    if (liste.length) onFichiers(liste);
  };
  const ouvrir = (ref: typeof camera) => (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    ref.current?.click();
  };

  const bouton = `inline-flex items-center justify-center gap-2 rounded-lg border border-champ bg-surface font-medium text-noir transition-colors hover:border-lien hover:text-lien disabled:opacity-50 ${
    taille === 'petite' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2.5 text-sm'
  }`;

  return (
    <div className={`${TACTILE_SEULEMENT} flex-wrap justify-center gap-2 ${className}`} onClick={(e) => e.stopPropagation()}>
      <input ref={bibliotheque} type="file" accept={accept} multiple={multiple} className="hidden" tabIndex={-1} onChange={choisi} />
      <input ref={camera} type="file" accept="image/*" capture="environment" className="hidden" tabIndex={-1} onChange={choisi} />
      <button type="button" className={bouton} onClick={ouvrir(bibliotheque)} disabled={disabled}>
        <Images className="h-4 w-4" aria-hidden="true" />
        {avecFichiers ? 'Photothèque / fichiers' : 'Photothèque'}
      </button>
      <button type="button" className={bouton} onClick={ouvrir(camera)} disabled={disabled}>
        <Camera className="h-4 w-4" aria-hidden="true" />
        Caméra
      </button>
    </div>
  );
}
