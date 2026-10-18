/**
 * Thème du site dans le navigateur.
 *
 * - Le thème publié arrive déjà dans la page (<style id="theme-svm">, posé par
 *   la fonction Netlify « seo »). Après une publication depuis l'admin,
 *   appliquerThemePublie() le remplace tout de suite dans l'onglet ouvert.
 * - Aperçu du Studio Design : l'admin affiche le site dans un cadre
 *   (/?apercu=1) et lui envoie le brouillon par message. Seule une page de
 *   l'admin, sur le même site, peut le faire ; un visiteur qui ouvrirait
 *   /?apercu=1 verrait le site normal. Rien n'est enregistré.
 */
import { cssDuTheme, themeValide, urlPolices, type CleSection, type ThemeConfig } from '../config/design';

export const ID_THEME = 'theme-svm';
const ID_APERCU = 'theme-apercu';
const ID_REPERE = 'theme-repere';

export type MessageApercu =
  | { type: 'svm-apercu'; config: ThemeConfig | null }
  | { type: 'svm-apercu-zone'; zone: CleSection | null }
  | { type: 'svm-apercu-pret'; chemin: string };

function poserStyle(id: string, css: string | null) {
  let el = document.getElementById(id) as HTMLStyleElement | null;
  if (!css) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('style');
    el.id = id;
    document.head.appendChild(el);
  }
  if (el.textContent !== css) el.textContent = css;
}

/** Feuille de polices Google Fonts (adresse construite par le registre) */
function poserPolices(id: string, url: string | null) {
  let el = document.getElementById(id) as HTMLLinkElement | null;
  if (!url) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('link');
    el.id = id;
    el.rel = 'stylesheet';
    document.head.appendChild(el);
  }
  if (el.getAttribute('href') !== url) el.href = url;
}

export function appliquerThemePublie(config: ThemeConfig) {
  if (!themeValide(config)) return;
  poserPolices(`${ID_THEME}-polices`, urlPolices(config));
  poserStyle(ID_THEME, cssDuTheme(config));
}

/** Échantillons des polices dans l'éditeur du Studio */
export function chargerToutesPolices(url: string) {
  poserPolices('studio-polices', url);
}

/** À appeler au démarrage du site : active l'aperçu si la page est dans le cadre du Studio */
export function demarrerApercu() {
  if (typeof window === 'undefined' || window.parent === window) return;
  if (!new URLSearchParams(window.location.search).has('apercu')) return;
  window.addEventListener('message', (e: MessageEvent<MessageApercu>) => {
    if (e.origin !== window.location.origin || e.source !== window.parent) return;
    const m = e.data;
    if (m?.type === 'svm-apercu') {
      const valide = m.config && themeValide(m.config) ? m.config : null;
      poserPolices(`${ID_APERCU}-polices`, valide ? urlPolices(valide) : null);
      poserStyle(ID_APERCU, valide ? cssDuTheme(valide) : null);
    } else if (m?.type === 'svm-apercu-zone') {
      const zone = m.zone && /^[a-z]+$/.test(m.zone) ? m.zone : null;
      poserStyle(
        ID_REPERE,
        zone ? `[data-zone="${zone}"]{outline:3px dashed #E11D48 !important;outline-offset:-3px}` : null,
      );
      if (zone) document.querySelector(`[data-zone="${zone}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  });
  // L'admin renvoie le brouillon à chaque page chargée dans le cadre
  const signaler = () => window.parent.postMessage({ type: 'svm-apercu-pret', chemin: window.location.pathname } satisfies MessageApercu, window.location.origin);
  signaler();
  let chemin = window.location.pathname;
  window.setInterval(() => {
    if (window.location.pathname !== chemin) {
      chemin = window.location.pathname;
      signaler();
    }
  }, 400);
}
