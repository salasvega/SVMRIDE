import { Link } from 'react-router-dom';
import { useEquipe } from '../../lib/equipe';
import { useCoordonnees } from '../../lib/coordonnees';
import { useIdentite } from '../../lib/identite';
import { icones } from '../../config/identite';
import { adresseComplete, lienInstagram, lienMaps, lienTelephone, lignesHoraires } from '../../config/coordonnees';
import { Mail, Phone, Instagram, MapPin } from 'lucide-react';
import { useTexte } from '../../lib/textes';

export function Footer() {
  const t = useTexte();
  // Lien « Notre équipe » : seulement si l'équipe est affichée (réglage de l'admin)
  const equipe = useEquipe();
  // Coordonnées modifiables dans l'admin, onglet « Édition du site »
  const c = useCoordonnees();
  const logo = icones(useIdentite()).logo;
  const currentYear = new Date().getFullYear();

  return (
    <footer data-zone="footer" className="sur-sombre bg-noir-profond text-inverse">
      <div className="liseret-or" aria-hidden="true" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <Link to="/" className="inline-flex items-center gap-3 mb-4 rounded-lg">
              <img src={logo} alt="" width={44} height={44} className="w-11 h-11 rounded-full ring-1 ring-or/60" />
              <span className="text-2xl font-bold">{t('site.nom')}</span>
            </Link>
            <p className="text-inverse-66 text-sm leading-relaxed mb-4">
              {t('pied.description')}
            </p>

            <div className="space-y-3">
              <h3 className="titre-display text-sm tracking-[1px] mb-2">Notre showroom</h3>
              {[c.showroom].map((showroom, index) => (
                <a
                  key={index}
                  href={lienMaps(c)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 text-inverse-66 hover:text-inverse transition-colors duration-180 group"
                >
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-or-clair group-hover:text-inverse transition-colors duration-180" aria-hidden="true" />
                  <div className="text-sm">
                    <div className="font-medium">{showroom.nom}</div>
                    <div className="text-xs">{adresseComplete(c)}</div>
                    {showroom.note && (
                      <div className="text-xs italic text-inverse-52">({showroom.note})</div>
                    )}
                  </div>
                </a>
              ))}
              <div className="text-xs text-inverse-52 mt-3 pl-6">
                {lignesHoraires(c.horaires).map((l) => <div key={l}>{l}</div>)}
              </div>
            </div>
          </div>

          <div>
            <h3 className="titre-display text-lg tracking-[1px] mb-4">Contact</h3>
            <div className="space-y-3">
              <a
                href={`mailto:${c.email}`}
                className="flex items-center gap-2 text-inverse-66 hover:text-inverse transition-colors duration-180"
              >
                <Mail className="w-5 h-5 text-or-clair" aria-hidden="true" />
                <span className="text-sm">{c.email}</span>
              </a>
              <a
                href={lienTelephone(c.telephone)}
                className="flex items-center gap-2 text-inverse-66 hover:text-inverse transition-colors duration-180"
              >
                <Phone className="w-5 h-5 text-or-clair" aria-hidden="true" />
                <span className="text-sm">{c.telephone}</span>
              </a>
{c.instagram && (
              <a
                href={lienInstagram(c.instagram)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-inverse-66 hover:text-inverse transition-colors duration-180"
              >
                <Instagram className="w-5 h-5 text-or-clair" aria-hidden="true" />
                <span className="text-sm">@{c.instagram}</span>
              </a>
              )}
            </div>
          </div>

          <div>
            <h3 className="titre-display text-lg tracking-[1px] mb-4">Liens utiles</h3>
            <div className="space-y-2">
              {equipe?.affichee && (
                <Link
                  to="/equipe"
                  className="block text-sm text-inverse-66 hover:text-inverse transition-colors duration-180"
                >
                  Notre équipe
                </Link>
              )}
              <Link
                to="/suivre-ma-vente"
                className="block text-sm text-inverse-66 hover:text-inverse transition-colors duration-180"
              >
                Suivre ma vente (dépôt-vente)
              </Link>
              <Link
                to="/mentions-legales"
                className="block text-sm text-inverse-66 hover:text-inverse transition-colors duration-180"
              >
                Mentions légales
              </Link>
              <Link
                to="/politique-confidentialite"
                className="block text-sm text-inverse-66 hover:text-inverse transition-colors duration-180"
              >
                Politique de confidentialité
              </Link>
              <Link
                to="/politique-cookies"
                className="block text-sm text-inverse-66 hover:text-inverse transition-colors duration-180"
              >
                Politique des cookies
              </Link>
              <Link
                to="/plan-du-site"
                className="block text-sm text-inverse-66 hover:text-inverse transition-colors duration-180"
              >
                Plan du site
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-inverse/10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-inverse-66">
              © {currentYear} {t('site.nom')}. Tous droits réservés.
            </p>
            <Link
              to="/admin/login"
              className="text-xs text-inverse-53 hover:text-inverse transition-colors duration-180"
            >
              Espace pro
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
