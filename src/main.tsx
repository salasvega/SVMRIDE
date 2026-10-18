import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { demarrerApercu } from './lib/theme';
import { surveillerNouvelleVersion } from './lib/nouvelleVersion';
import { demarrerDemo } from './lib/apercuDemo';

// Aperçus de l'admin (site affiché dans un cadre) : rien n'est envoyé, pages d'exemple
demarrerDemo();
demarrerApercu();
// Onglet resté ouvert pendant une mise en ligne : rechargé une fois
surveillerNouvelleVersion();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
