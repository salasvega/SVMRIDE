/**
 * Carrousel des avis : 1 carte (mobile), 2 (tablette) ou 3 (ordinateur) à la fois.
 * - avance seul toutes les 6 s et revient au début (boucle), glissement animé discret ;
 * - glisser au doigt ou à la souris, boutons précédent / pause / suivant, points,
 *   flèches du clavier quand le focus est dans le carrousel ;
 * - pause au survol, au focus clavier, hors écran et pendant la lecture d'un avis ;
 * - « réduire les animations » : pas d'avance automatique ni de glissement animé ;
 * - peu d'avis (pas plus que la place disponible) : cartes centrées, sans commandes.
 * Les cartes hors champ sont inertes (ni focus, ni lecteur d'écran).
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent as KeyboardEventReact, PointerEvent as PointerEventReact } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, X } from 'lucide-react';
import type { Avis } from '../../lib/avis/types';
import { usePrefereMoinsDAnimations } from '../../hooks/usePrefereMoinsDAnimations';
import { CarteAvis } from './CarteAvis';
import { formatDate } from '../../lib/avis/format';
import { Etoiles } from './Etoiles';
import { LogoGoogle } from './LogoGoogle';

const INTERVALLE_MS = 6000;
const SEUIL_GLISSER = 50;

export function CarrouselAvis({ avis, demo = false }: { avis: Avis[]; demo?: boolean }) {
  const reduit = usePrefereMoinsDAnimations();
  const fenetreRef = useRef<HTMLDivElement>(null);
  const pisteRef = useRef<HTMLDivElement>(null);
  const dialogueRef = useRef<HTMLDialogElement>(null);

  const [index, setIndex] = useState(0);
  const [parVue, setParVue] = useState(1);
  const [enPause, setEnPause] = useState(false);
  const [survol, setSurvol] = useState(false);
  const [focusDedans, setFocusDedans] = useState(false);
  const [visible, setVisible] = useState(true);
  const [enLecture, setEnLecture] = useState<Avis | null>(null);
  const [annonce, setAnnonce] = useState('');
  const glisse = useRef<{ x: number; dx: number; actif: boolean; id: number } | null>(null);
  const bloquerClic = useRef(false);

  const n = avis.length;
  const max = Math.max(0, n - parVue);
  const statique = n <= parVue;

  // Nombre de cartes visibles : variable CSS --par-vue (1, 2 ou 3 selon la largeur)
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

  const decalage = useCallback(
    (i: number) => {
      const carte = pisteRef.current?.children[i] as HTMLElement | undefined;
      return carte ? carte.offsetLeft : 0;
    },
    []
  );

  const placer = useCallback(
    (anime: boolean, extra = 0) => {
      const piste = pisteRef.current;
      if (!piste) return;
      piste.style.transition = anime && !reduit ? 'transform 600ms cubic-bezier(.22,.61,.36,1)' : 'none';
      piste.style.transform = `translate3d(${-decalage(index) + extra}px,0,0)`;
    },
    [decalage, index, reduit]
  );

  useLayoutEffect(() => { placer(true); }, [placer, parVue]);

  // Pause hors écran
  useEffect(() => {
    const el = fenetreRef.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Avance automatique
  const auto = !reduit && !statique && !enPause && !survol && !focusDedans && !enLecture && visible;
  useEffect(() => {
    if (!auto) return;
    const t = window.setInterval(() => setIndex((i) => (i >= max ? 0 : i + 1)), INTERVALLE_MS);
    return () => window.clearInterval(t);
  }, [auto, max]);

  const aller = (i: number) => {
    const cible = i > max ? 0 : i < 0 ? max : i; // boucle
    setIndex(cible);
    setAnnonce(`Avis ${cible + 1} à ${Math.min(n, cible + parVue)} sur ${n}`);
  };

  // Glisser
  const auPointerDown = (e: PointerEventReact<HTMLDivElement>) => {
    if (statique || (e.pointerType === 'mouse' && e.button !== 0)) return;
    bloquerClic.current = false;
    glisse.current = { x: e.clientX, dx: 0, actif: false, id: e.pointerId };
  };
  const auPointerMove = (e: PointerEventReact<HTMLDivElement>) => {
    const g = glisse.current;
    if (!g || g.id !== e.pointerId) return;
    g.dx = e.clientX - g.x;
    if (!g.actif && Math.abs(g.dx) > 8) {
      g.actif = true;
      fenetreRef.current?.setPointerCapture(e.pointerId);
    }
    if (g.actif) placer(false, g.dx);
  };
  const finGlisser = (e: PointerEventReact<HTMLDivElement>) => {
    const g = glisse.current;
    if (!g || g.id !== e.pointerId) return;
    glisse.current = null;
    if (!g.actif) return;
    bloquerClic.current = true;
    if (g.dx <= -SEUIL_GLISSER) aller(index + 1);
    else if (g.dx >= SEUIL_GLISSER) aller(index - 1);
    else placer(true);
  };

  const auClavier = (e: KeyboardEventReact<HTMLDivElement>) => {
    if (statique) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); aller(index + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); aller(index - 1); }
  };

  // Lecture d'un avis complet (fenêtre modale native : focus piégé, Échap pour fermer)
  useEffect(() => {
    const d = dialogueRef.current;
    if (!d) return;
    if (enLecture && !d.open) d.showModal?.();
    if (!enLecture && d.open) d.close();
  }, [enLecture]);

  const bouton =
    'inline-flex h-10 w-10 items-center justify-center rounded-full border border-champ bg-surface text-noir transition-colors duration-180 hover:border-or hover:text-or-texte';

  return (
    <div
      role="region"
      aria-roledescription="carrousel"
      aria-label="Avis clients"
      onKeyDown={auClavier}
      onFocus={() => setFocusDedans(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusDedans(false); }}
    >
      <div
        ref={fenetreRef}
        className={`overflow-clip [--par-vue:1] md:[--par-vue:2] lg:[--par-vue:3] ${statique ? '' : 'touch-pan-y cursor-grab active:cursor-grabbing'}`}
        onPointerEnter={(e) => { if (e.pointerType === 'mouse') setSurvol(true); }}
        onPointerLeave={(e) => { if (e.pointerType === 'mouse') setSurvol(false); }}
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
      >
        <div
          ref={pisteRef}
          className={`flex gap-5 md:gap-6 py-2 will-change-transform ${statique ? 'justify-center' : ''}`}
        >
          {avis.map((a, i) => {
            const horsChamp = !statique && (i < index || i >= index + parVue);
            return (
              <div
                key={a.id}
                role="group"
                aria-roledescription="avis"
                aria-label={`${i + 1} sur ${n}`}
                aria-hidden={horsChamp || undefined}
                {...(horsChamp ? { inert: '' } : {})}
                className="shrink-0 basis-full md:basis-[calc((100%-1.5rem)/2)] lg:basis-[calc((100%-3rem)/3)] select-none"
              >
                <CarteAvis avis={a} demo={demo} onLireLaSuite={setEnLecture} />
              </div>
            );
          })}
        </div>
      </div>

      {!statique && (
        <div className="mt-6 flex flex-col-reverse items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex flex-wrap justify-center gap-1.5" role="group" aria-label="Choisir les avis affichés">
            {Array.from({ length: max + 1 }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => aller(i)}
                aria-label={`Afficher à partir de l'avis ${i + 1}`}
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
          <div className="flex items-center gap-2">
            <button type="button" className={bouton} onClick={() => aller(index - 1)} aria-label="Avis précédents">
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            {!reduit && (
              <button
                type="button"
                className={bouton}
                onClick={() => setEnPause((p) => !p)}
                aria-label={enPause ? 'Reprendre le défilement des avis' : 'Mettre en pause le défilement des avis'}
                aria-pressed={enPause}
              >
                {enPause ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
              </button>
            )}
            <button type="button" className={bouton} onClick={() => aller(index + 1)} aria-label="Avis suivants">
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <p className="sr-only" aria-live="polite">{annonce}</p>

      <dialog
        ref={dialogueRef}
        onClose={() => setEnLecture(null)}
        onClick={(e) => { if (e.target === e.currentTarget) setEnLecture(null); }}
        aria-labelledby="avis-lecture-titre"
        className="w-[min(92vw,560px)] rounded-2xl border border-bordure bg-surface p-0 text-left shadow-vehicule backdrop:bg-noir-profond/60"
      >
        {enLecture && (
          <div className="p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p id="avis-lecture-titre" className="font-semibold text-noir">{enLecture.auteur}</p>
                <p className="text-xs text-gris">
                  {enLecture.dateLibelle ?? <time dateTime={enLecture.publieLe}>{formatDate(enLecture.publieLe)}</time>}
                </p>
              </div>
              <button type="button" onClick={() => setEnLecture(null)} className={bouton} aria-label="Fermer l'avis">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <Etoiles note={enLecture.note} className="mt-4" />
            <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-gris">{enLecture.texte}</p>
            <p className="mt-6 flex items-center gap-1.5 text-xs text-gris">
              <LogoGoogle taille={14} decoratif />
              {demo ? 'Avis de démonstration' : 'Publié sur Google'}
            </p>
          </div>
        )}
      </dialog>
    </div>
  );
}
