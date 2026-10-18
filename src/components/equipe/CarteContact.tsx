/**
 * Carte de visite du contact principal (page Contact, « Nos coordonnées ») :
 * portrait, prénom, fonction, téléphone, e-mail et Instagram du site (comme une
 * carte de visite). Le membre est choisi
 * dans l'admin (Édition du site › Contact) ; par défaut, le membre mis en avant.
 * Aussi affichée en aperçu dans l'admin.
 */
import { Instagram, Mail, Phone } from 'lucide-react';
import type { Membre } from '../../config/equipe';
import { lienInstagram, lienTelephone } from '../../config/coordonnees';
import { Portrait } from './Portrait';

export function CarteContact({ membre, telephone, email, instagram = '', className = '' }: {
  membre: Membre; telephone: string; email: string;
  /** Pseudo sans @ (vide : pas de ligne Instagram) */
  instagram?: string;
  className?: string;
}) {
  return (
    <div className={`sur-sombre relative overflow-hidden rounded-2xl bg-noir-profond text-inverse shadow-vehicule ${className}`}>
      <div className="liseret-or" aria-hidden="true" />
      <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-5 md:p-6">
        <div className="flex items-center gap-4 sm:block flex-shrink-0">
          <Portrait
            membre={membre}
            taille={96}
            classeTaille="h-20 w-20 md:h-24 md:w-24"
            anneauOr
            surSombre
            decoratif={false}
          />
          <div className="sm:hidden">
            <p className="titre-display text-2xl leading-none">{membre.prenom}</p>
            <p className="mt-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-or-clair">
              {membre.fonction}
            </p>
          </div>
        </div>

        <div className="flex-1 min-w-0 sm:border-l sm:border-inverse/15 sm:pl-5">
          <div className="hidden sm:block mb-3">
            <p className="titre-display text-[26px] leading-none">{membre.prenom}</p>
            <p className="mt-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-or-clair">
              {membre.fonction}
            </p>
          </div>
          <div className="space-y-1">
            <a
              href={lienTelephone(telephone)}
              className="flex items-center gap-2.5 rounded-lg py-1.5 text-inverse-91 hover:text-inverse transition-colors duration-180"
            >
              <Phone className="w-[18px] h-[18px] text-or-clair flex-shrink-0" strokeWidth={1.8} aria-hidden="true" />
              <span className="font-medium">{telephone}</span>
            </a>
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-2.5 rounded-lg py-1.5 text-inverse-91 hover:text-inverse transition-colors duration-180 break-all"
            >
              <Mail className="w-[18px] h-[18px] text-or-clair flex-shrink-0" strokeWidth={1.8} aria-hidden="true" />
              <span>{email}</span>
            </a>
            {instagram && (
              <a
                href={lienInstagram(instagram)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 rounded-lg py-1.5 text-inverse-91 hover:text-inverse transition-colors duration-180 break-all"
              >
                <Instagram className="w-[18px] h-[18px] text-or-clair flex-shrink-0" strokeWidth={1.8} aria-hidden="true" />
                <span>@{instagram}<span className="sr-only"> sur Instagram (nouvel onglet)</span></span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
