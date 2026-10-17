import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { demarrerApercu } from './lib/theme';

// Aperçu du Studio Design (site affiché dans un cadre de l'admin)
demarrerApercu();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
