/**
 * Édition des textes sur la page (aperçu de l'admin « Textes du site »).
 *
 * Dans le cadre d'aperçu seulement, chaque texte du registre est entouré de
 * repères invisibles (caractères de largeur nulle) qui portent sa clé : on sait
 * ainsi où chaque texte est affiché sans rien changer aux composants. Le cadre
 * dessine les contours au survol, signale à l'admin le texte cliqué et la
 * position du texte en cours de modification (pour placer la bulle d'édition).
 * Les visiteurs du site ne sont jamais concernés.
 */
import { TEXTES } from '../config/textes';
import { elementDeCle, LISTES_PAR_ID } from '../config/textes-listes';

const DEBUT = '⁣';
const FIN = '⁤';
const CHIFFRES = ['⁡', '⁢', '‌', '⁠'];
const CLES = Object.keys(TEXTES);
const INDEX = new Map(CLES.map((c, i) => [c, i]));

function coder(n: number): string {
  let s = '';
  do {
    s = CHIFFRES[n % 4] + s;
    n = Math.floor(n / 4);
  } while (n > 0);
  return s;
}
function decoder(s: string): number | null {
  let n = 0;
  for (const c of s) {
    const d = CHIFFRES.indexOf(c);
    if (d < 0) return null;
    n = n * 4 + d;
  }
  return s ? n : null;
}

/** Index d'une clé (les textes des éléments ajoutés aux listes sont numérotés à la demande) */
function indexDe(cle: string): number {
  let i = INDEX.get(cle);
  if (i === undefined) {
    i = CLES.length;
    CLES.push(cle);
    INDEX.set(cle, i);
  }
  return i;
}
const estLien = (cle: string) => (TEXTES[cle]?.type ?? elementDeCle(cle)?.champ.type) === 'lien';
/** Libellé d'un texte (bulle « ✎ ») */
export const libelleTexte = (cle: string) => TEXTES[cle]?.libelle ?? elementDeCle(cle)?.champ.libelle ?? 'Texte';

/** Texte entouré des repères de sa clé (appelé par useTexte quand le marquage est actif) */
export function marquer(cle: string, v: string): string {
  if (!v || estLien(cle) || (!TEXTES[cle] && !elementDeCle(cle))) return v;
  return `${DEBUT}${coder(indexDe(cle))}${FIN}${v}${DEBUT}${FIN}`;
}

/** Retire les repères (textes réutilisés hors affichage) */
export const sansReperes = (v: string) => v.replace(/[⁡-⁤‌⁠]/g, '');

export interface Rect { x: number; y: number; l: number; h: number }
interface Zone { cle: string; rects: Rect[]; boite: Rect; /** Zone de clic (l'élément entier s'il ne contient que ce texte) */ clic: Rect[] }

export type MessageEdition =
  | { type: 'svm-edition'; actif: boolean; tous?: boolean; utiliser?: boolean }
  | { type: 'svm-edition-actif'; cle: string | null; montrer?: boolean }
  | { type: 'svm-edition-clic'; cle: string; boite: Rect }
  | { type: 'svm-edition-position'; cle: string; boite: Rect | null; hauteurVue: number }
  | { type: 'svm-liste'; action: ActionListe; liste: string; id: string; boite: Rect };

export type ActionListe = 'monter' | 'descendre' | 'ajouter' | 'supprimer' | 'icone';

const SVG = (d: string) => `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const BOUTONS: { action: ActionListe; titre: string; svg: string }[] = [
  { action: 'monter', titre: 'Monter', svg: SVG('<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>') },
  { action: 'descendre', titre: 'Descendre', svg: SVG('<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>') },
  { action: 'ajouter', titre: 'Ajouter après', svg: SVG('<path d="M5 12h14"/><path d="M12 5v14"/>') },
  { action: 'icone', titre: 'Changer l’icône', svg: SVG('<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>') },
  { action: 'supprimer', titre: 'Supprimer', svg: SVG('<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>') },
];

const versRect = (r: DOMRect): Rect => ({ x: r.left, y: r.top, l: r.width, h: r.height });
function union(rects: Rect[]): Rect {
  const x = Math.min(...rects.map((r) => r.x)), y = Math.min(...rects.map((r) => r.y));
  return { x, y, l: Math.max(...rects.map((r) => r.x + r.l)) - x, h: Math.max(...rects.map((r) => r.y + r.h)) - y };
}
const dedans = (r: Rect, x: number, y: number, marge = 3) => x >= r.x - marge && x <= r.x + r.l + marge && y >= r.y - marge && y <= r.y + r.h + marge;

/** Repère dans la page tous les textes marqués visibles */
function relever(): Zone[] {
  const zones: Zone[] = [];
  const marcheur = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = marcheur.nextNode() as Text | null; n; n = marcheur.nextNode() as Text | null) {
    const s = n.data;
    if (!s.includes(DEBUT) || n.parentElement?.closest('#svm-edition-calque')) continue;
    let i = 0;
    while (i < s.length) {
      const a = s.indexOf(DEBUT, i);
      if (a < 0) break;
      const b = s.indexOf(FIN, a);
      if (b < 0) break;
      const idx = decoder(s.slice(a + 1, b));
      if (idx === null) {
        i = b + 1;
        continue;
      }
      const fin = s.indexOf(DEBUT + FIN, b);
      const stop = fin < 0 ? s.length : fin;
      const r = document.createRange();
      r.setStart(n, b + 1);
      r.setEnd(n, stop);
      const rects = Array.from(r.getClientRects()).filter((x) => x.width > 0.5 && x.height > 0.5).map(versRect);
      if (rects.length) {
        const parent = n.parentElement;
        const seul = !!parent && sansReperes(parent.textContent ?? '').trim() === sansReperes(s.slice(b + 1, stop)).trim();
        const rp = seul && parent ? versRect(parent.getBoundingClientRect()) : null;
        zones.push({ cle: CLES[idx], rects, boite: union(rects), clic: rp && rp.h < 200 ? [rp] : rects });
      }
      i = stop + 2;
    }
  }
  // Textes indicatifs des champs (placeholder)
  document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[placeholder]').forEach((el) => {
    const p = el.getAttribute('placeholder') ?? '';
    const a = p.indexOf(DEBUT), b = p.indexOf(FIN);
    if (a < 0 || b < 0) return;
    const idx = decoder(p.slice(a + 1, b));
    const r = el.getBoundingClientRect();
    if (idx !== null && r.width > 0 && r.height > 0) zones.push({ cle: CLES[idx], rects: [versRect(r)], boite: versRect(r), clic: [versRect(r)] });
  });
  return zones;
}

/** Démarre l'édition sur la page (appelé une fois, dans le cadre d'aperçu) */
export function demarrerEdition(changerMarquage: (actif: boolean) => void) {
  let actif = false, tous = false, utiliser = false, survol: string | null = null, courant: string | null = null;
  let zones: Zone[] = [];
  let calque: HTMLDivElement | null = null;
  let prevu = 0;
  /** Élément de liste survolé (barre d'outils : monter, descendre, ajouter, icône, supprimer) */
  let element: HTMLElement | null = null;
  const outils = document.createElement('div');
  outils.id = 'svm-outils';
  outils.setAttribute('role', 'toolbar');
  const envoyer = (m: MessageEdition) => window.parent.postMessage(m, window.location.origin);

  const style = document.createElement('style');
  style.textContent = `
    #svm-edition-calque{position:fixed;inset:0;pointer-events:none;z-index:2147483646}
    #svm-edition-calque .z{position:fixed;border-radius:4px;box-sizing:border-box}
    #svm-edition-calque .t{outline:1.5px dashed rgba(225,29,72,.45);outline-offset:2px}
    #svm-edition-calque .s{outline:2px dashed #E11D48;outline-offset:3px;background:rgba(225,29,72,.06)}
    #svm-edition-calque .a{outline:3px solid #E11D48;outline-offset:3px;background:rgba(225,29,72,.08)}
    #svm-edition-calque .e{outline:2px dashed rgba(17,17,17,.45);outline-offset:6px;border-radius:12px}
    #svm-outils{position:fixed;z-index:2147483647;display:none;align-items:center;gap:2px;padding:3px;background:#111;border-radius:10px;box-shadow:0 6px 20px rgba(0,0,0,.28);font:600 11px/1 system-ui,sans-serif;color:#fff}
    #svm-outils span{padding:0 6px 0 5px;color:rgba(255,255,255,.75);white-space:nowrap}
    #svm-outils button{all:unset;display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:7px;cursor:pointer;color:#fff}
    #svm-outils button:hover{background:rgba(255,255,255,.16)}
    #svm-outils button[disabled]{opacity:.3;cursor:not-allowed;background:none}
    #svm-outils button[data-action=supprimer]:not([disabled]):hover{background:#E11D48}
    #svm-edition-calque .crayon{position:fixed;transform:translate(-50%,-100%);background:#E11D48;color:#fff;border-radius:999px;font:600 11px/1 system-ui,sans-serif;padding:4px 8px;white-space:nowrap}
    html.svm-edition-survol, html.svm-edition-survol *{cursor:text !important}`;

  const dessiner = () => {
    prevu = 0;
    if (!actif) return;
    // Questions fréquentes et autres blocs repliés : ouverts pour en modifier le contenu
    if (!utiliser) document.querySelectorAll('details:not([open])').forEach((d) => d.setAttribute('open', ''));
    zones = relever();
    if (!calque) {
      calque = document.createElement('div');
      calque.id = 'svm-edition-calque';
      document.body.appendChild(calque);
    }
    const morceaux: string[] = [];
    const boite = (r: Rect, c: string) => morceaux.push(`<div class="z ${c}" style="left:${r.x - 2}px;top:${r.y - 1}px;width:${r.l + 4}px;height:${r.h + 2}px"></div>`);
    for (const z of zones) {
      if (utiliser) break;
      const c = z.cle === courant ? 'a' : z.cle === survol ? 's' : tous ? 't' : '';
      if (c) boite(z.boite, c);
    }
    const zs = survol && survol !== courant ? zones.find((z) => z.cle === survol) : null;
    if (zs) {
      const libelle = libelleTexte(zs.cle);
      morceaux.push(`<div class="crayon" style="left:${zs.boite.x + Math.min(zs.boite.l / 2, 80)}px;top:${Math.max(zs.boite.y - 6, 18)}px">✎ ${libelle.replace(/[<>&]/g, '')}</div>`);
    }
    // Élément de liste survolé : contour et barre d'outils
    if (element && !document.body.contains(element)) element = null;
    if (element && !utiliser) {
      const r = element.getBoundingClientRect();
      morceaux.push(`<div class="z e" style="left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px"></div>`);
      const def = LISTES_PAR_ID[element.dataset.liste ?? ''];
      const freres = Array.from(document.querySelectorAll<HTMLElement>(`[data-liste="${element.dataset.liste}"]`));
      const i = freres.indexOf(element);
      const special = !!def?.speciaux?.includes(element.dataset.element ?? '');
      const etat: Record<ActionListe, boolean> = {
        monter: i > 0, descendre: i < freres.length - 1, ajouter: !!def && freres.length < def.max,
        icone: !!def?.icones && !special, supprimer: !!def && freres.length > def.min,
      };
      const nom = def ? `${def.element.charAt(0).toUpperCase()}${def.element.slice(1)} ${i + 1}` : '';
      const html = `<span>${nom}</span>${BOUTONS.filter((b) => b.action !== 'icone' || def?.icones).map((b) =>
        `<button type="button" data-action="${b.action}" title="${b.titre}" aria-label="${b.titre}"${etat[b.action] ? '' : ' disabled'}>${b.svg}</button>`).join('')}`;
      if (outils.dataset.cle !== `${element.dataset.liste}/${element.dataset.element}/${i}/${freres.length}`) {
        outils.innerHTML = html;
        outils.dataset.cle = `${element.dataset.liste}/${element.dataset.element}/${i}/${freres.length}`;
      }
      outils.style.display = 'flex';
      const largeur = outils.offsetWidth || 180;
      outils.style.left = `${Math.min(Math.max(4, r.right - largeur), window.innerWidth - largeur - 4)}px`;
      outils.style.top = `${Math.max(4, r.top - 34)}px`;
    } else outils.style.display = 'none';
    calque.innerHTML = morceaux.join('');
    if (courant) {
      const z = zones.find((x) => x.cle === courant && x.boite.y + x.boite.h > 0 && x.boite.y < window.innerHeight) ?? zones.find((x) => x.cle === courant);
      envoyer({ type: 'svm-edition-position', cle: courant, boite: z?.boite ?? null, hauteurVue: window.innerHeight });
    }
  };
  const planifier = () => {
    if (!prevu) prevu = window.requestAnimationFrame(dessiner);
  };

  /** Texte sous le pointeur : la plus petite zone qui le contient */
  const sous = (x: number, y: number): Zone | null => {
    let meilleur: Zone | null = null;
    for (const z of zones) {
      if (!z.rects.some((r) => dedans(r, x, y)) && !z.clic.some((r) => dedans(r, x, y, 0))) continue;
      const exact = z.rects.some((r) => dedans(r, x, y));
      const exactM = meilleur ? meilleur.rects.some((r) => dedans(r, x, y)) : false;
      if (!meilleur || (exact && !exactM) || (exact === exactM && z.boite.l * z.boite.h < meilleur.boite.l * meilleur.boite.h)) meilleur = z;
    }
    return meilleur;
  };

  const surMouvement = (e: MouseEvent) => {
    if (!actif || utiliser) return;
    const cible = e.target instanceof Element ? e.target : null;
    if (!cible?.closest('#svm-outils')) {
      const el = (document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-element]') as HTMLElement | null) ?? null;
      if (el !== element) {
        element = el;
        planifier();
      }
    }
    const z = sous(e.clientX, e.clientY);
    const cle = z?.cle ?? null;
    document.documentElement.classList.toggle('svm-edition-survol', !!cle);
    if (cle !== survol) {
      survol = cle;
      planifier();
    }
  };
  const surClic = (e: MouseEvent) => {
    if (!actif || utiliser) return;
    const bouton = e.target instanceof Element ? e.target.closest<HTMLButtonElement>('#svm-outils button') : null;
    if (bouton || (e.target instanceof Element && e.target.closest('#svm-outils'))) {
      e.preventDefault();
      e.stopPropagation();
      if (bouton && !bouton.disabled && element?.dataset.liste && element.dataset.element) {
        envoyer({ type: 'svm-liste', action: bouton.dataset.action as ActionListe, liste: element.dataset.liste, id: element.dataset.element, boite: versRect(element.getBoundingClientRect()) });
        courant = null;
      }
      return;
    }
    const z = sous(e.clientX, e.clientY);
    if (!z) return;
    e.preventDefault();
    e.stopPropagation();
    courant = z.cle;
    survol = null;
    envoyer({ type: 'svm-edition-clic', cle: z.cle, boite: z.boite });
    planifier();
  };
  // Les textes des boutons et liens s'éditent : pas d'action au clic ni au toucher
  const bloquer = (e: Event) => {
    if (!actif || utiliser) return;
    if (e.target instanceof Element && e.target.closest('#svm-outils')) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    const p = e as PointerEvent;
    if (sous(p.clientX, p.clientY)) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  window.addEventListener('mousemove', surMouvement, true);
  window.addEventListener('click', surClic, true);
  window.addEventListener('pointerdown', bloquer, true);
  window.addEventListener('mousedown', bloquer, true);
  window.addEventListener('scroll', planifier, true);
  window.addEventListener('resize', planifier);
  new MutationObserver((liste) => {
    if (liste.every((m) => (calque && calque.contains(m.target)) || outils.contains(m.target))) return;
    planifier();
  }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class', 'style', 'placeholder', 'open', 'hidden'] });

  window.addEventListener('message', (e: MessageEvent<MessageEdition>) => {
    if (e.origin !== window.location.origin || e.source !== window.parent) return;
    const m = e.data;
    if (m?.type === 'svm-edition') {
      if (m.actif !== actif) {
        actif = m.actif;
        changerMarquage(actif);
        if (actif) {
          document.head.appendChild(style);
          document.body.appendChild(outils);
        } else {
          style.remove();
          outils.remove();
          calque?.remove();
          calque = null;
          document.documentElement.classList.remove('svm-edition-survol');
        }
      }
      tous = !!m.tous;
      if (utiliser !== !!m.utiliser) {
        utiliser = !!m.utiliser;
        survol = null;
        element = null;
        document.documentElement.classList.remove('svm-edition-survol');
      }
      planifier();
    } else if (m?.type === 'svm-edition-actif') {
      courant = m.cle;
      planifier();
      if (m.cle && m.montrer) {
        window.setTimeout(() => {
          const z = relever().find((x) => x.cle === m.cle);
          if (z && (z.boite.y < 70 || z.boite.y + z.boite.h > window.innerHeight - 30)) {
            window.scrollTo({ top: Math.max(0, window.scrollY + z.boite.y - window.innerHeight / 3), behavior: 'smooth' });
          }
        }, 80);
      }
    }
  });
}
