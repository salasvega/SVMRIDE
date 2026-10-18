import { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { useTexte } from '../lib/textes';

export function CookieBanner() {
  const t = useTexte();
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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-bordure shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
      <div className="liseret-or" aria-hidden="true" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="titre-display text-lg mb-2">{t('cookies.titre')}</h3>
            <p className="text-sm text-gris leading-relaxed">
              {t('cookies.texte')}
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Button variant="outline" onClick={acceptEssential} className="flex-1 md:flex-none">
              {t('cookies.essentiels')}
            </Button>
            <Button onClick={acceptAll} className="flex-1 md:flex-none">
              {t('cookies.tout')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
