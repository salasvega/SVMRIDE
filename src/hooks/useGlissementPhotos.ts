/**
 * Photos d'un véhicule qu'on fait défiler en glissant le doigt (ou la souris),
 * en plus des flèches. La photo suit le doigt ; au-delà d'un petit seuil (ou d'un
 * geste rapide) on passe à la suivante / précédente, en boucle.
 *
 * - Seules 3 images sont dans la page (précédente, courante, suivante), et les
 *   voisines ne se chargent qu'après une première interaction (catalogue léger).
 * - Un glissement n'ouvre jamais la fiche ; un simple appui, si.
 * - Le défilement vertical de la page reste possible (touch-action: pan-y).
 * - « Réduire les animations » : changement de photo sans glissade animée.
 *
 * Ce crochet donne les écouteurs à poser sur la zone qui reçoit le
 * doigt (sur la carte du catalogue, c'est la carte entière car le lien la recouvre).
 */
import { useRef, useState } from 'react';
import type { PointerEvent as PointerEventReact, MouseEvent as MouseEventReact } from 'react';
import { usePrefereMoinsDAnimations } from './usePrefereMoinsDAnimations';

const SEUIL_PX = 45;
const SEUIL_VITESSE = 0.45; // px/ms : un petit geste rapide suffit
export const DUREE_MS = 260;

export function useGlissementPhotos(nombre: number, index: number, changer: (i: number) => void) {
  const reduit = usePrefereMoinsDAnimations();
  const [dx, setDx] = useState(0);
  const [anime, setAnime] = useState(false);
  const [voisinsCharges, setVoisinsCharges] = useState(false);
  const zoneRef = useRef<HTMLDivElement>(null);
  const geste = useRef<{ x: number; y: number; t: number; id: number; horizontal: boolean | null } | null>(null);
  const bloquerClic = useRef(false);
  const actif = nombre > 1;

  const dansLaZone = (x: number, y: number) => {
    const r = zoneRef.current?.getBoundingClientRect();
    return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  };

  const terminer = (sens: -1 | 0 | 1) => {
    const largeur = zoneRef.current?.clientWidth ?? 300;
    if (sens === 0 || reduit) {
      if (sens !== 0) changer((index + sens + nombre) % nombre);
      setAnime(!reduit);
      setDx(0);
      return;
    }
    setAnime(true);
    setDx(-sens * largeur);
    window.setTimeout(() => {
      setAnime(false);
      setDx(0);
      changer((index + sens + nombre) % nombre);
    }, DUREE_MS);
  };

  const ecouteurs = {
    onPointerDown: (e: PointerEventReact<HTMLElement>) => {
      bloquerClic.current = false;
      if (!actif || (e.pointerType === 'mouse' && e.button !== 0) || !dansLaZone(e.clientX, e.clientY)) return;
      setVoisinsCharges(true);
      geste.current = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId, horizontal: null };
    },
    onPointerMove: (e: PointerEventReact<HTMLElement>) => {
      const g = geste.current;
      if (!g || g.id !== e.pointerId) return;
      const ecartX = e.clientX - g.x;
      const ecartY = e.clientY - g.y;
      if (g.horizontal === null) {
        if (Math.abs(ecartX) < 8 && Math.abs(ecartY) < 8) return;
        g.horizontal = Math.abs(ecartX) > Math.abs(ecartY);
        if (!g.horizontal) { geste.current = null; return; } // défilement vertical : on laisse faire
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      }
      setAnime(false);
      setDx(ecartX);
    },
    onPointerUp: (e: PointerEventReact<HTMLElement>) => {
      const g = geste.current;
      geste.current = null;
      if (!g || g.id !== e.pointerId || !g.horizontal) return;
      bloquerClic.current = true; // le relâchement d'un glissement n'ouvre pas la fiche
      const ecart = e.clientX - g.x;
      const vitesse = Math.abs(ecart) / Math.max(1, performance.now() - g.t);
      terminer(Math.abs(ecart) > SEUIL_PX || vitesse > SEUIL_VITESSE ? (ecart < 0 ? 1 : -1) : 0);
    },
    onPointerCancel: () => {
      if (geste.current?.horizontal) terminer(0);
      geste.current = null;
    },
    onClickCapture: (e: MouseEventReact<HTMLElement>) => {
      if (bloquerClic.current) {
        bloquerClic.current = false;
        e.preventDefault();
        e.stopPropagation();
      }
    },
    onPointerEnter: () => { if (actif) setVoisinsCharges(true); },
  };

  return { zoneRef, ecouteurs, dx, anime, voisinsCharges: voisinsCharges && actif, setVoisinsCharges };
}

