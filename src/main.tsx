import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { demarrerApercu } from './lib/theme';
import { surveillerNouvelleVersion } from './lib/nouvelleVersion';

// Aperçu du Studio Design (site affiché dans un cadre de l'admin)
demarrerApercu();
// Onglet resté ouvert pendant une mise en ligne : rechargé une fois
surveillerNouvelleVersion();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
