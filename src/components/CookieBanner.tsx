import { useState, useEffect } from 'react';
import { Button } from './ui/Button';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem('cookie-consent', 'all');
    setVisible(false);
  };

  const acceptEssential = () => {
    localStorage.setItem('cookie-consent', 'essential');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#EEEEEE] shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[#111111] mb-2">Gestion des cookies</h3>
            <p className="text-sm text-[#444444] leading-relaxed">
              Nous utilisons des cookies pour améliorer votre expérience sur notre site. Les cookies essentiels sont nécessaires au fonctionnement du site, tandis que les cookies analytiques nous aident à comprendre comment vous utilisez notre site.
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Button variant="outline" onClick={acceptEssential} className="flex-1 md:flex-none">
              Essentiels uniquement
            </Button>
            <Button onClick={acceptAll} className="flex-1 md:flex-none">
              Tout accepter
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
