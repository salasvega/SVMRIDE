/**
 * Studio Design — une couleur : pastille (sélecteur visuel), code HEX,
 * pastille de lisibilité et retour à la valeur de départ.
 */
import { useEffect, useId, useState } from 'react';
import { RotateCcw, X } from 'lucide-react';
import type { Resultat } from '../../../config/design';
import { normaliserHex, STYLE_NIVEAU } from './outils';


const ratio = (r: number) => `${r.toFixed(1).replace('.', ',')}:1`;


/** Pastille du contrôle le plus faible parmi ceux donnés */
export function PastilleContraste({ resultats, compacte = false }: { resultats: Resultat[]; compacte?: boolean }) {
  if (!resultats.length) return null;
  const pire = [...resultats].sort((a, b) => a.ratio / a.controle.seuil - b.ratio / b.controle.seuil)[0];
  const s = STYLE_NIVEAU[pire.niveau];
  const titre = resultats.map((r) => `${r.controle.libelle} : ${ratio(r.ratio)} (${STYLE_NIVEAU[r.niveau].libelle.toLowerCase()})`).join('\n');
  return (
    <span title={titre} className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold ${s.classe}`}>
      {pire.niveau === 'ok' ? '✓ Lisible' : `${pire.niveau === 'grand' ? (compacte ? 'Titres' : 'Grands textes') : 'Illisible'} ${ratio(pire.ratio)}`}
    </span>
  );
}

interface Props {
  libelle: string;
  aide?: string;
  valeur: string | undefined;
  /** Valeur héritée affichée quand aucune valeur n'est définie (sections) */
  heritee?: string;
  /** Valeur de départ : bouton ↺ si différente */
  origine?: string;
  resultats?: Resultat[];
  onChange: (hex: string) => void;
  /** Sections : supprime l'exception */
  onEffacer?: () => void;
}

export function ChampCouleur({ libelle, aide, valeur, heritee, origine, resultats = [], onChange, onEffacer }: Props) {
  const id = useId();
  const affichee = valeur ?? heritee ?? '#000000';
  const [texte, setTexte] = useState(valeur ?? '');
  useEffect(() => setTexte(valeur ?? ''), [valeur]);
  const invalide = texte !== '' && !normaliserHex(texte);

  const valider = () => {
    const h = normaliserHex(texte);
    if (h && h !== valeur) onChange(h);
    else if (!h) setTexte(valeur ?? '');
  };

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5">
      <label
        className={`relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 ${valeur ? 'border-[#D1D5DB]' : 'border-dashed border-[#AAAAAA]'}`}
        style={{ background: affichee }}
        title="Choisir une couleur"
      >
        <input
          type="color"
          value={affichee.toLowerCase()}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label={`${libelle} : sélecteur de couleur`}
        />
      </label>
      <div className="min-w-0 flex-1 basis-40">
        <label htmlFor={id} className="block text-sm font-semibold text-[#111111]">{libelle}</label>
        {aide && <p className="text-xs text-[#666666]">{aide}</p>}
        {!valeur && heritee && <p className="text-xs text-[#666666]">Suit le thème global ({heritee})</p>}
      </div>
      <div className="flex items-center gap-2">
        <input
          id={id}
          value={texte}
          placeholder={heritee ?? '#000000'}
          onChange={(e) => {
            setTexte(e.target.value);
            const h = normaliserHex(e.target.value);
            if (h && e.target.value.replace('#', '').length === 6) onChange(h);
          }}
          onBlur={valider}
          onKeyDown={(e) => e.key === 'Enter' && valider()}
          spellCheck={false}
          maxLength={7}
          aria-invalid={invalide}
          className={`w-[92px] rounded-lg border-2 px-2 py-1.5 font-mono text-sm uppercase text-[#111111] focus:outline-none ${invalide ? 'border-red-400' : 'border-[#D1D5DB] focus:border-[#111111]'}`}
        />
        <span className="w-[132px]"><PastilleContraste resultats={resultats} /></span>
        {onEffacer ? (
          <button type="button" onClick={onEffacer} disabled={!valeur} title="Revenir au thème global" aria-label={`${libelle} : revenir au thème global`}
            className="rounded-lg p-1.5 text-[#666666] hover:bg-[#F5F5F5] hover:text-[#111111] disabled:invisible">
            <X className="h-4 w-4" />
          </button>
        ) : (
          <button type="button" onClick={() => origine && onChange(origine)} disabled={!origine || origine === valeur} title={`Revenir à ${origine}`}
            aria-label={`${libelle} : revenir à la valeur de départ`} className="rounded-lg p-1.5 text-[#666666] hover:bg-[#F5F5F5] hover:text-[#111111] disabled:invisible">
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
