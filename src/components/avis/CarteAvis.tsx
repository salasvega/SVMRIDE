import { useLayoutEffect, useRef, useState } from 'react';
import type { Avis } from '../../lib/avis/types';
import { formatDate } from '../../lib/avis/format';
import { Etoiles } from './Etoiles';
import { LogoGoogle } from './LogoGoogle';


const initiales = (nom: string) =>
  nom
    .replace(/\(.*?\)/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((m) => m[0]?.toUpperCase() ?? '')
    .join('');

/** Carte d'avis : texte abrégé à 5 lignes, « Lire la suite » quand il est coupé. */
export function CarteAvis({ avis, onLireLaSuite, demo }: { avis: Avis; onLireLaSuite: (a: Avis) => void; demo?: boolean }) {
  const texteRef = useRef<HTMLParagraphElement>(null);
  const [coupe, setCoupe] = useState(false);

  useLayoutEffect(() => {
    const el = texteRef.current;
    if (!el) return;
    const mesurer = () => setCoupe(el.scrollHeight > el.clientHeight + 1);
    mesurer();
    const ro = new ResizeObserver(mesurer);
    ro.observe(el);
    return () => ro.disconnect();
  }, [avis.texte]);

  return (
    <article className="carte flex h-full flex-col p-6 md:p-7 transition-[box-shadow,transform] duration-180 hover:-translate-y-0.5 hover:shadow-vehicule motion-reduce:hover:translate-y-0">
      <header className="flex items-center gap-3">
        <span
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-noir-profond text-sm font-semibold text-or-clair"
          aria-hidden="true"
        >
          {initiales(avis.auteur)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-noir">{avis.auteur}</p>
          <p className="text-xs text-gris">
            <time dateTime={avis.publieLe}>{formatDate(avis.publieLe)}</time>
          </p>
        </div>
      </header>

      <Etoiles note={avis.note} className="mt-4" />

      {avis.texte ? (
        <>
          <p ref={texteRef} className="mt-3 line-clamp-5 text-[15px] leading-relaxed text-gris">
            {avis.texte}
          </p>
          {coupe && (
            <button
              type="button"
              onClick={() => onLireLaSuite(avis)}
              className="lien mt-2 self-start text-sm"
              aria-label={`Lire la suite de l'avis de ${avis.auteur}`}
            >
              Lire la suite
            </button>
          )}
        </>
      ) : (
        <p className="mt-3 text-sm italic text-gris/80">Note sans commentaire.</p>
      )}

      <footer className="mt-auto flex items-center gap-1.5 pt-5 text-xs text-gris">
        <LogoGoogle taille={14} decoratif />
        <span>{demo ? 'Avis de démonstration' : 'Publié sur Google'}</span>
      </footer>
    </article>
  );
}
