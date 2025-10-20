import { Link } from 'react-router-dom';
import { Mail, Phone, Instagram } from 'lucide-react';
import { siteConfig } from '../../config/site';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#111111] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <svg className="w-8 h-8 text-[#D10000]" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m18 14-1-3"/>
                <path d="m3 9 6 2a2 2 0 0 1 2-2h2a2 2 0 0 1 1.99 1.81"/>
                <path d="M8 17h3a1 1 0 0 0 1-1 6 6 0 0 1 6-6 1 1 0 0 0 1-1v-.75A5 5 0 0 0 17 5"/>
                <circle cx="19" cy="17" r="3"/>
                <circle cx="5" cy="17" r="3"/>
              </svg>
              <span className="text-2xl font-bold">{siteConfig.name}</span>
            </Link>
            <p className="text-[#AAAAAA] text-sm leading-relaxed">
              Votre spécialiste du deux-roues en Île-de-France. Vente, reprise, financement et personnalisation.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="space-y-3">
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="flex items-center gap-2 text-[#AAAAAA] hover:text-white transition-colors"
              >
                <Mail className="w-5 h-5" aria-hidden="true" />
                <span className="text-sm">{siteConfig.contact.email}</span>
              </a>
              <a
                href={`tel:${siteConfig.contact.phone.replace(/\s/g, '')}`}
                className="flex items-center gap-2 text-[#AAAAAA] hover:text-white transition-colors"
              >
                <Phone className="w-5 h-5" aria-hidden="true" />
                <span className="text-sm">{siteConfig.contact.phone}</span>
              </a>
              <a
                href={siteConfig.contact.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#AAAAAA] hover:text-white transition-colors"
              >
                <Instagram className="w-5 h-5" aria-hidden="true" />
                <span className="text-sm">{siteConfig.contact.instagram}</span>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Liens utiles</h3>
            <div className="space-y-2">
              <Link
                to="/mentions-legales"
                className="block text-sm text-[#AAAAAA] hover:text-white transition-colors"
              >
                Mentions légales
              </Link>
              <Link
                to="/politique-confidentialite"
                className="block text-sm text-[#AAAAAA] hover:text-white transition-colors"
              >
                Politique de confidentialité
              </Link>
              <Link
                to="/politique-cookies"
                className="block text-sm text-[#AAAAAA] hover:text-white transition-colors"
              >
                Politique des cookies
              </Link>
              <Link
                to="/plan-du-site"
                className="block text-sm text-[#AAAAAA] hover:text-white transition-colors"
              >
                Plan du site
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#444444]">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-[#AAAAAA]">
              © {currentYear} {siteConfig.name}. Tous droits réservés.
            </p>
            <Link
              to="/admin/login"
              className="text-xs text-[#666666] hover:text-[#AAAAAA] transition-colors"
            >
              Administration
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
