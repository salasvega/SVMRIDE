import { Link } from 'react-router-dom';
import { equipeAffichee } from '../../config/equipe';
import { CONTEXTE_SITE } from '../../lib/contexte';
import { Mail, Phone, Instagram, MapPin } from 'lucide-react';
import { siteConfig } from '../../config/site';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="sur-sombre bg-noir-profond text-white">
      <div className="liseret-or" aria-hidden="true" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <Link to="/" className="inline-flex items-center gap-3 mb-4 rounded-lg">
              <img src="/logo-header.webp" alt="" width={44} height={44} className="w-11 h-11 rounded-full ring-1 ring-or/60" />
              <span className="text-2xl font-bold">{siteConfig.name}</span>
            </Link>
            <p className="text-[#AAAAAA] text-sm leading-relaxed mb-4">
              {siteConfig.description}
            </p>

            <div className="space-y-3">
              <h3 className="titre-display text-sm tracking-[1px] mb-2">Notre showroom</h3>
              {siteConfig.showrooms.map((showroom, index) => (
                <a
                  key={index}
                  href={showroom.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 text-[#AAAAAA] hover:text-white transition-colors duration-180 group"
                >
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-or-clair group-hover:text-white transition-colors duration-180" aria-hidden="true" />
                  <div className="text-sm">
                    <div className="font-medium">{showroom.name}</div>
                    <div className="text-xs">{showroom.fullAddress}</div>
                    {showroom.note && (
                      <div className="text-xs italic text-[#888888]">({showroom.note})</div>
                    )}
                  </div>
                </a>
              ))}
              <div className="text-xs text-[#888888] mt-3 pl-6">
                <div>Mardi - Samedi : 9h-18h</div>
                <div>Lundi : Sur rendez-vous</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="titre-display text-lg tracking-[1px] mb-4">Contact</h3>
            <div className="space-y-3">
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="flex items-center gap-2 text-[#AAAAAA] hover:text-white transition-colors duration-180"
              >
                <Mail className="w-5 h-5 text-or-clair" aria-hidden="true" />
                <span className="text-sm">{siteConfig.contact.email}</span>
              </a>
              <a
                href={`tel:${siteConfig.contact.phone.replace(/\s/g, '')}`}
                className="flex items-center gap-2 text-[#AAAAAA] hover:text-white transition-colors duration-180"
              >
                <Phone className="w-5 h-5 text-or-clair" aria-hidden="true" />
                <span className="text-sm">{siteConfig.contact.phone}</span>
              </a>
              <a
                href={siteConfig.contact.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#AAAAAA] hover:text-white transition-colors duration-180"
              >
                <Instagram className="w-5 h-5 text-or-clair" aria-hidden="true" />
                <span className="text-sm">{siteConfig.contact.instagram}</span>
              </a>
            </div>
          </div>

          <div>
            <h3 className="titre-display text-lg tracking-[1px] mb-4">Liens utiles</h3>
            <div className="space-y-2">
              {equipeAffichee(CONTEXTE_SITE) && (
                <Link
                  to="/equipe"
                  className="block text-sm text-[#AAAAAA] hover:text-white transition-colors duration-180"
                >
                  Notre équipe
                </Link>
              )}
              <Link
                to="/mentions-legales"
                className="block text-sm text-[#AAAAAA] hover:text-white transition-colors duration-180"
              >
                Mentions légales
              </Link>
              <Link
                to="/politique-confidentialite"
                className="block text-sm text-[#AAAAAA] hover:text-white transition-colors duration-180"
              >
                Politique de confidentialité
              </Link>
              <Link
                to="/politique-cookies"
                className="block text-sm text-[#AAAAAA] hover:text-white transition-colors duration-180"
              >
                Politique des cookies
              </Link>
              <Link
                to="/plan-du-site"
                className="block text-sm text-[#AAAAAA] hover:text-white transition-colors duration-180"
              >
                Plan du site
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-[#AAAAAA]">
              © {currentYear} {siteConfig.name}. Tous droits réservés.
            </p>
            <Link
              to="/admin/login"
              className="text-xs text-[#8A8A8A] hover:text-white transition-colors duration-180"
            >
              Espace pro
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
