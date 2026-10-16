import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { siteConfig, navLinks } from '../../config/site';
import { Button } from '../ui/Button';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-[0_1px_0_rgba(17,17,17,0.02),0_6px_18px_rgba(17,17,17,0.05)]">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Navigation principale">
        {/* Barre du haut */}
        <div className="flex justify-between items-center h-[68px] lg:h-20">
          {/* Logo + nom */}
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-lg transition-opacity duration-180 hover:opacity-85"
          >
            <img
              src="/logo-header.webp"
              alt="SVM Ride Logo"
              className="w-11 h-11 object-contain"
              width={44}
              height={44}
            />
            <span className="text-[22px] font-bold text-noir tracking-tight">
              {siteConfig.name}
            </span>
          </Link>

          {/* Navigation desktop */}
          <div className="hidden xl:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={`relative py-2 text-sm font-medium whitespace-nowrap transition-colors duration-180 hover:text-bleu after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-[2px] after:rounded-full after:bg-degrade-or after:transition-opacity after:duration-180 ${
                  isActive(link.href)
                    ? 'text-bleu after:opacity-100'
                    : 'text-gris after:opacity-0'
                }`}
              >
                {link.label}
              </Link>
            ))}

            <Link to="/contact" tabIndex={-1}>
              <Button size="sm" variant="secondary">Contactez-nous</Button>
            </Link>
          </div>

          {/* Bouton burger mobile */}
          <button
            type="button"
            className="xl:hidden -mr-2 p-2.5 text-noir hover:bg-fond rounded-xl transition-colors duration-180"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Fermer le menu de navigation' : 'Ouvrir le menu de navigation'}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Menu mobile déroulant */}
        <div
          className={`
            xl:hidden border-t border-bordure overflow-hidden
            transition-all duration-300 ease-out
            ${mobileMenuOpen
              ? 'max-h-[560px] opacity-100 translate-y-0 pointer-events-auto pt-3 pb-6'
              : 'max-h-0 opacity-0 -translate-y-2 pointer-events-none py-0'
            }
          `}
        >
          <div className="flex flex-col gap-1.5">
            {navLinks.map((link, index) => (
              <Link
                key={link.href}
                to={link.href}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={`px-4 py-3 text-base rounded-r-xl border-l-[3px] transition-all duration-300 ease-out ${
                  isActive(link.href)
                    ? 'bg-fond text-bleu font-bold border-or'
                    : 'text-noir font-medium border-transparent hover:bg-fond'
                } ${
                  mobileMenuOpen
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 -translate-x-4'
                }`}
                style={{
                  transitionDelay: mobileMenuOpen ? `${index * 50}ms` : '0ms'
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <Link
              to="/contact"
              onClick={() => setMobileMenuOpen(false)}
              tabIndex={-1}
              className={`mt-3 transition-all duration-300 ease-out ${
                mobileMenuOpen
                  ? 'opacity-100 translate-x-0'
                  : 'opacity-0 -translate-x-4'
              }`}
              style={{
                transitionDelay: mobileMenuOpen ? `${navLinks.length * 50}ms` : '0ms'
              }}
            >
              <Button fullWidth>Contactez-nous</Button>
            </Link>
          </div>
        </div>
      </nav>
      {/* Liseré or repris du logo */}
      <div className="liseret-or" aria-hidden="true" />
    </header>
  );
}
