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
    <header className="sticky top-0 z-50 bg-white border-b border-[#EEEEEE] shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Barre du haut */}
        <div className="flex justify-between items-center h-20">
          {/* Logo + nom */}
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img
              src="/image copy.png"
              alt="SVM Ride Logo"
              className="w-12 h-12 object-contain"
            />
            <span className="text-2xl font-bold text-[#111111]">
              {siteConfig.name}
            </span>
          </Link>

          {/* Navigation desktop */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium transition-colors hover:text-[#D10000] ${
                  isActive(link.href)
                    ? 'text-[#D10000]'
                    : 'text-[#444444]'
                }`}
              >
                {link.label}
              </Link>
            ))}

            <Link to="/contact">
              <Button size="sm">Contactez-nous</Button>
            </Link>
          </div>

          {/* Bouton burger mobile */}
          <button
            type="button"
            className="lg:hidden p-2 text-[#111111] hover:bg-[#F9F9F9] rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Ouvrir le menu de navigation"
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
            lg:hidden border-t border-[#EEEEEE] overflow-hidden
            transition-all duration-300 ease-out
            ${mobileMenuOpen
              ? 'max-h-[500px] opacity-100 translate-y-0 pointer-events-auto py-4'
              : 'max-h-0 opacity-0 -translate-y-2 pointer-events-none py-0'
            }
          `}
        >
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-4 py-2 text-base font-medium rounded-lg transition-colors ${
                  isActive(link.href)
                    ? 'bg-[#F9F9F9] text-[#D10000]'
                    : 'text-[#444444] hover:bg-[#F9F9F9]'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <Link
              to="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4"
            >
              <Button fullWidth size="sm">Contactez-nous</Button>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
