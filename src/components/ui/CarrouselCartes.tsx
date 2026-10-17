/**
 * Carrousel de cartes sans boutons de commande (demande du 17/10/2026) :
 * 1 carte et le début de la suivante sur téléphone, 2 sur tablette, 3 sur ordinateur.
 * - avance seul (5 s par défaut) et revient au début ;
 * - glisser au doigt ou à la souris, flèches du clavier quand le focus est dedans,
 *   points pour savoir où l'on est (et y aller) ;
 * - pause au survol, au focus, pendant un glissement, hors écran, et 8 s après
 *   chaque action de l'utilisateur ; « réduire les animations » : pas d'avance seule ;
 * - s'il y a assez de place pour tout montrer, simple rangée, sans commandes.
 * Les cartes hors champ sont inertes (ni focus, ni lecteur d'écran).
 */
import { Children, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent as KeyboardEventReact, PointerEvent as PointerEventReact, ReactNode } from 'react';
import { usePrefereMoinsDAnimations } from '../../hooks/usePrefereMoinsDAnimations';

const SEUIL_PX = 45;
const SEUIL_VITESSE = 0.45; // px/ms
const REPOS_APRES_ACTION_MS = 8000;

export function CarrouselCartes({
  children,
  libelle,
  libelleCarte = 'élément',
  intervalle = 5000,
}: {
  children: ReactNode;
  libelle: string;
  libelleCarte?: string;
  intervalle?: number;
}) {
  const cartes = Children.toArray(children);
  const n = cartes.length;
  const reduit = usePrefereMoinsDAnimations();
  const fenetreRef = useRef<HTMLDivElement>(null);
  const pisteRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [parVue, setParVue] = useState(1);
  const [annonce, setAnnonce] = useState('');
  const geste = useRef<{ x: number; y: number; t: number; dx: number; id: number; horizontal: boolean | null } | null>(null);
  const bloquerClic = useRef(false);
  const survol = useRef(false);
  const focusDedans = useRef(false);
  const visible = useRef(true);
  const repriseA = useRef(0);

  const max = Math.max(0, n - parVue);
  const statique = n <= parVue;

  // Nombre de cartes entières visibles : variable CSS --par-vue (1, 2 ou 3 selon la largeur)
  useLayoutEffect(() => {
    const el = fenetreRef.current;
    if (!el) return;
    const lire = () => setParVue(parseInt(getComputedStyle(el).getPropertyValue('--par-vue'), 10) || 1);
    lire();
    const ro = new ResizeObserver(lire);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => { if (index > max) setIndex(max); }, [index, max]);

  // Décalage de la carte i, sans laisser de vide à droite après la dernière
  const decalage = useCallback((i: number) => {
    const piste = pisteRef.current;
    const fenetre = fenetreRef.current;
    const carte = piste?.children[i] as HTMLElement | undefined;
    if (!piste || !fenetre || !carte) return 0;
    return Math.max(0, Math.min(carte.offsetLeft, piste.scrollWidth - fenetre.clientWidth));
  }, []);

  const placer = useCallback(
    (anime: boolean, extra = 0) => {
      const piste = pisteRef.current;
      if (!piste) return;
      if (statique) {
        piste.style.transition = 'none';
        piste.style.transform = '';
        return;
      }
      piste.style.transition = anime && !reduit ? 'transform 550ms cubic-bezier(.22,.61,.36,1)' : 'none';
      piste.style.transform = `translate3d(${-decalage(index) + extra}px,0,0)`;
    },
    [decalage, index, reduit, statique],
  );

  useLayoutEffect(() => { placer(true); }, [placer, parVue]);

  // Pause hors écran
  useEffect(() => {
    const el = fenetreRef.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => { visible.current = e.isIntersecting; });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Avance automatique
  useEffect(() => {
    if (reduit || statique) return;
    const t = window.setInterval(() => {
      if (survol.current || focusDedans.current || geste.current || !visible.current || Date.now() < repriseA.current) return;
      if (document.hidden) return;
      setIndex((i) => (i >= max ? 0 : i + 1));
    }, intervalle);
    return () => window.clearInterval(t);
  }, [reduit, statique, max, intervalle]);

  const aller = (i: number) => {
    const cible = i > max ? 0 : i < 0 ? max : i;
    repriseA.current = Date.now() + REPOS_APRES_ACTION_MS;
    setIndex(cible);
    setAnnonce(`${libelleCarte} ${cible + 1} sur ${n}`);
  };

  // Glisser (un geste vertical laisse défiler la page)
  const auPointerDown = (e: PointerEventReact<HTMLDivElement>) => {
    bloquerClic.current = false;
    if (statique || (e.pointerType === 'mouse' && e.button !== 0)) return;
    geste.current = { x: e.clientX, y: e.clientY, t: performance.now(), dx: 0, id: e.pointerId, horizontal: null };
  };
  const auPointerMove = (e: PointerEventReact<HTMLDivElement>) => {
    const g = geste.current;
    if (!g || g.id !== e.pointerId) return;
    const ex = e.clientX - g.x;
    const ey = e.clientY - g.y;
    if (g.horizontal === null) {
      if (Math.abs(ex) < 8 && Math.abs(ey) < 8) return;
      g.horizontal = Math.abs(ex) > Math.abs(ey);
      if (!g.horizontal) { geste.current = null; return; }
      fenetreRef.current?.setPointerCapture(e.pointerId);
    }
    // Résistance aux extrémités
    const auBord = (index === 0 && ex > 0) || (index === max && ex < 0);
    g.dx = auBord ? ex / 3 : ex;
    placer(false, g.dx);
  };
  const finGlisser = (e: PointerEventReact<HTMLDivElement>) => {
    const g = geste.current;
    if (!g || g.id !== e.pointerId) return;
    geste.current = null;
    if (!g.horizontal) return;
    bloquerClic.current = true;
    const vitesse = Math.abs(g.dx) / Math.max(1, performance.now() - g.t);
    const sens = Math.abs(g.dx) > SEUIL_PX || vitesse > SEUIL_VITESSE ? (g.dx < 0 ? 1 : -1) : 0;
    if (sens && !(index === max && sens > 0) && !(index === 0 && sens < 0)) aller(index + sens);
    else {
      repriseA.current = Date.now() + REPOS_APRES_ACTION_MS;
      placer(true);
    }
  };

  const auClavier = (e: KeyboardEventReact<HTMLDivElement>) => {
    if (statique) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); aller(index + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); aller(index - 1); }
  };

  return (
    <div
      role="region"
      aria-roledescription="carrousel"
      aria-label={libelle}
      onKeyDown={auClavier}
      onFocus={() => { focusDedans.current = true; }}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) focusDedans.current = false; }}
    >
      <div
        ref={fenetreRef}
        className={`overflow-clip -my-3 py-3 [--par-vue:1] sm:[--par-vue:2] lg:[--par-vue:3] ${statique ? '' : 'touch-pan-y cursor-grab active:cursor-grabbing'}`}
        onPointerEnter={(e) => { if (e.pointerType === 'mouse') survol.current = true; }}
        onPointerLeave={(e) => { if (e.pointerType === 'mouse') survol.current = false; }}
        onPointerDown={auPointerDown}
        onPointerMove={auPointerMove}
        onPointerUp={finGlisser}
        onPointerCancel={finGlisser}
        onClickCapture={(e) => {
          if (bloquerClic.current) {
            bloquerClic.current = false;
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onDragStart={(e) => e.preventDefault()}
      >
        <div ref={pisteRef} className="flex gap-5 md:gap-6 will-change-transform">
          {cartes.map((carte, i) => {
            const horsChamp = !statique && (i < index || i >= index + parVue) && !(index === max && i >= max);
            return (
              <div
                key={i}
                role="group"
                aria-roledescription={libelleCarte}
                aria-label={`${i + 1} sur ${n}`}
                aria-hidden={horsChamp || undefined}
                {...(horsChamp ? { inert: '' } : {})}
                className="shrink-0 basis-[85%] sm:basis-[calc((100%-1.25rem)/2)] md:basis-[calc((100%-1.5rem)/2)] lg:basis-[calc((100%-3rem)/3)] select-none"
              >
                {carte}
              </div>
            );
          })}
        </div>
      </div>

      {!statique && (
        <div className="mt-5 flex justify-center gap-1.5" role="group" aria-label={`Choisir ${libelleCarte === 'élément' ? "l'élément" : `la ${libelleCarte}`} affiché${libelleCarte === 'élément' ? '' : 'e'}`}>
          {Array.from({ length: max + 1 }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => aller(i)}
              aria-label={`Afficher ${libelleCarte === 'élément' ? "l'élément" : `la ${libelleCarte}`} ${i + 1}`}
              aria-current={i === index || undefined}
              className="group/point flex h-6 items-center px-1"
            >
              <span
                className={`block h-1.5 rounded-full transition-[width,background-color] duration-300 motion-reduce:transition-none ${
                  i === index ? 'w-6 bg-or' : 'w-1.5 bg-champ group-hover/point:bg-gris/50'
                }`}
              />
            </button>
          ))}
        </div>
      )}
      <p className="sr-only" aria-live="polite">{annonce}</p>
    </div>
  );
}
