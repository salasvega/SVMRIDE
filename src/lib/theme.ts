/**
 * Thème du site dans le navigateur.
 *
 * - Le thème publié arrive déjà dans la page (<style id="theme-svm">, posé par
 *   la fonction Netlify « seo »). Après une publication depuis l'admin,
 *   appliquerThemePublie() le remplace tout de suite dans l'onglet ouvert.
 * - Aperçu du Studio Design et des Textes du site : l'admin affiche le site dans un cadre
 *   (/?apercu=1) et lui envoie le brouillon par message. Seule une page de
 *   l'admin, sur le même site, peut le faire ; un visiteur qui ouvrirait
 *   /?apercu=1 verrait le site normal. Rien n'est enregistré.
 */
import { cssAdmin, cssDuTheme, themeValide, urlPolices, type CleSection, type ThemeConfig } from '../config/design';
import { apercuTextes } from './textes';

export const ID_THEME = 'theme-svm';
const ID_APERCU = 'theme-apercu';
const ID_REPERE = 'theme-repere';

export type MessageApercu =
  | { type: 'svm-apercu'; config: ThemeConfig | null }
  | { type: 'svm-apercu-zone'; zone: CleSection | null }
  | { type: 'svm-apercu-textes'; textes: Record<string, string> | null }
  | { type: 'svm-apercu-repere'; texte: string | null }
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
  poserStyle(ID_THEME, cssDuTheme(config) + cssAdmin(config));
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
    } else if (m?.type === 'svm-apercu-textes') {
      apercuTextes(m.textes && typeof m.textes === 'object' ? m.textes : null);
    } else if (m?.type === 'svm-apercu-repere') {
      // Entoure le texte en cours de modification et le montre
      document.querySelectorAll('[data-repere-texte]').forEach((el) => el.removeAttribute('data-repere-texte'));
      const net = (s: string) => s.replace(/\s+/g, ' ').trim();
      const cherche = typeof m.texte === 'string' ? net(m.texte).slice(0, 60) : '';
      if (cherche) {
        window.setTimeout(() => {
          const contient = (el: Element) => !el.closest('script,style,noscript') && net(el.textContent ?? '').includes(cherche);
          if (!contient(document.body)) return;
          // L'élément le plus précis qui contient tout le texte cherché
          let el: Element = document.body;
          for (let suivant = Array.from(el.children).find(contient); suivant; suivant = Array.from(el.children).find(contient)) el = suivant;
          if (el === document.body) return;
          el.setAttribute('data-repere-texte', '');
          // Défilement dans l'aperçu seulement (pas de la page de l'admin autour)
          const r = el.getBoundingClientRect();
          if (r.top < 60 || r.bottom > window.innerHeight - 20) {
            window.scrollTo({ top: Math.max(0, window.scrollY + r.top - window.innerHeight / 2 + r.height / 2), behavior: 'smooth' });
          }
        }, 60);
      }
      poserStyle('theme-repere-texte', '[data-repere-texte]{outline:4px dashed #E11D48 !important;outline-offset:5px;border-radius:4px}');
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
