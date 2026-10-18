/**
 * Bandeau d'annonce en haut de toutes les pages (fermeture exceptionnelle,
 * promotion…), réglé dans l'admin : Textes du site › Bandeau d'annonce.
 * Rien n'est affiché quand le message est vide. Le visiteur peut le fermer :
 * il ne revient pas pendant sa visite, sauf si le message change.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, X } from 'lucide-react';
import { useTexte } from '../../lib/textes';

const CLE = 'svm-annonce-fermee';

function fermee(message: string): boolean {
  try {
    return sessionStorage.getItem(CLE) === message;
  } catch {
    return false;
  }
}

export function AnnonceSite() {
  const t = useTexte();
  const message = t('annonce.texte').trim();
  const lien = t('annonce.lien').trim();
  const texteLien = t('annonce.lien_texte').trim() || 'En savoir plus';
  const [masquee, setMasquee] = useState<string | null>(null);
  if (!message || masquee === message || fermee(message)) return null;

  const fermer = () => {
    setMasquee(message);
    try {
      sessionStorage.setItem(CLE, message);
    } catch {
      // sans importance
    }
  };
  const classeLien = 'font-semibold text-or-clair underline underline-offset-4 hover:decoration-2 whitespace-nowrap';

  return (
    <div className="sur-sombre relative bg-noir-profond text-inverse-91" role="region" aria-label="Annonce">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-11 py-2.5 text-center text-sm leading-snug sm:px-12">
        <Megaphone className="hidden h-4 w-4 shrink-0 text-or-clair sm:block" aria-hidden="true" />
        <p>
          {message}
          {lien && (
            <>
              {' '}
              {lien.startsWith('/') ? (
                <Link to={lien} className={classeLien}>{texteLien}</Link>
              ) : (
                <a href={lien} target="_blank" rel="noopener noreferrer" className={classeLien}>{texteLien}</a>
              )}
            </>
          )}
        </p>
        <button type="button" onClick={fermer} aria-label="Fermer l'annonce"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-inverse-74 transition-colors hover:text-inverse">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="liseret-or" aria-hidden="true" />
    </div>
  );
}
