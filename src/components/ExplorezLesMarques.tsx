/**
 * Accueil : « Explorez les marques ».
 *
 * Carrousel en boucle infinie, sans dépendance :
 * - défilement automatique lent (requestAnimationFrame + translate3d, donc fluide) ;
 * - glisser au doigt ou à la souris (avec inertie), molette horizontale du pavé tactile ;
 * - pas de boutons (demande du 17/10) : glisser, flèches du clavier entre les marques ;
 * - défilement continu, sans arrêt (demande de Mattia, 17/10) : pas de pause au survol ;
 *   après un glissement, la molette ou le clavier, il reprend tout seul 2,5 s plus tard.
 *   Seuls le focus clavier (pour pouvoir choisir une marque) et la section hors écran
 *   le suspendent ;
 * - « réduire les animations » (réglage du système) : aucun défilement automatique.
 *
 * La boucle utilise trois copies de la liste ; seule celle du milieu est lisible
 * par les lecteurs d'écran et atteignable au clavier (les deux autres sont aria-hidden
 * et hors tabulation), il n'y a donc pas de liens en double.
 *
 * Données : liste des marques dans src/config/marques.ts ; stock lu une seule fois
 * au chargement (useStockMarques). Marques en stock d'abord, puis les autres, chaque
 * groupe par ordre alphabétique. Si Supabase ne répond pas : ordre alphabétique, sans pastille.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FocusEvent as FocusEventReact, KeyboardEvent as KeyboardEventReact, PointerEvent as PointerEventReact } from 'react';
import { Link } from 'react-router-dom';
import { MARQUES, marqueParId, nomMarque, urlLogo } from '../config/marques';
import { useStockMarques } from '../hooks/useStockMarques';
import { usePrefereMoinsDAnimations } from '../hooks/usePrefereMoinsDAnimations';
import { Section } from './ui/Section';
import { Container } from './ui/Container';

const VITESSE = 30; // px par seconde : lent, pour reconnaître chaque marque
const REPRISE_MS = 2500;
const SEUIL_GLISSER = 6; // px avant de considérer qu'on glisse (et non qu'on clique)

interface Element {
  id: string;
  nom: string;
  logo?: string;
  enStock: boolean;
}

const triFr = (a: Element, b: Element) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' });

export function ExplorezLesMarques() {
  const { pret, enStock, nomsCatalogue } = useStockMarques();
  const reduit = usePrefereMoinsDAnimations();

  // Classement calculé une fois les données arrivées (jamais pendant l'interaction)
  const elements = useMemo<Element[]>(() => {
    const liste: Element[] = MARQUES.filter((m) => m.actif).map((m) => ({
      id: m.id,
      nom: m.nom,
      logo: urlLogo(m.logo),
      enStock: !!enStock?.has(m.id),
    }));
    // Une marque en stock absente de la liste est ajoutée automatiquement
    enStock?.forEach((id) => {
      if (!marqueParId(id) && id) {
        liste.push({ id, nom: nomMarque(nomsCatalogue.get(id)), enStock: true });
      }
    });
    return [...liste.filter((e) => e.enStock).sort(triFr), ...liste.filter((e) => !e.enStock).sort(triFr)];
  }, [enStock, nomsCatalogue]);

  const nbEnStock = elements.filter((e) => e.enStock).length;

  // ---- Mécanique du carrousel (tout en refs : aucun rendu React à chaque image) ----
  const fenetreRef = useRef<HTMLDivElement>(null);
  const pisteRef = useRef<HTMLDivElement>(null);
  const groupeRef = useRef<HTMLUListElement>(null);
  const liensRef = useRef<(HTMLAnchorElement | null)[]>([]);

  const position = useRef(0); // décalage en px depuis le début de la piste
  const largeurGroupe = useRef(0);
  const focusDedans = useRef(false);
  const visible = useRef(true);
  const repriseA = useRef(0); // horodatage avant lequel on reste en pause
  const glisse = useRef<{ x: number; depart: number; actif: boolean; id: number; derniers: { t: number; x: number }[] } | null>(null);
  const inertie = useRef(0); // vitesse résiduelle après un lancer (px/s)
  const animation = useRef<{ de: number; vers: number; debut: number; duree: number } | null>(null);
  const bloquerClic = useRef(false);

  const [actif, setActif] = useState(0); // marque qui reçoit la tabulation (tabindex itinérant)

  const appliquer = () => {
    if (pisteRef.current) pisteRef.current.style.transform = `translate3d(${-position.current}px,0,0)`;
  };

  /** Ramène la position dans la copie du milieu ; renvoie le décalage appliqué. */
  const recentrer = () => {
    const L = largeurGroupe.current;
    if (!L || focusDedans.current) return 0;
    let d = 0;
    while (position.current - d >= 2 * L) d += L;
    while (position.current - d < L) d -= L;
    position.current -= d;
    return d;
  };

  const mesurer = useCallback(() => {
    const L = groupeRef.current?.offsetWidth ?? 0;
    if (!L) return;
    const avant = largeurGroupe.current;
    largeurGroupe.current = L;
    position.current = avant ? L + (position.current - avant) % avant : L;
    recentrer();
    appliquer();
  }, []);

  useEffect(() => {
    mesurer();
    const ro = new ResizeObserver(mesurer);
    if (groupeRef.current) ro.observe(groupeRef.current);
    return () => ro.disconnect();
  }, [mesurer, elements]);

  // Un focus clavier ne doit jamais faire défiler la section elle-même (navigateurs sans overflow: clip)
  useEffect(() => {
    const section = fenetreRef.current?.closest('section');
    if (!section) return;
    const annuler = () => { if (section.scrollLeft) section.scrollLeft = 0; };
    section.addEventListener('scroll', annuler);
    return () => section.removeEventListener('scroll', annuler);
  }, []);

  // Pause quand la section n'est pas à l'écran
  useEffect(() => {
    const el = fenetreRef.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => { visible.current = e.isIntersecting; });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Boucle d'animation
  useEffect(() => {
    let raf = 0;
    let avant = performance.now();
    const image = (t: number) => {
      const dt = Math.min(t - avant, 64) / 1000;
      avant = t;
      const a = animation.current;
      if (a) {
        const p = Math.min(1, (t - a.debut) / a.duree);
        position.current = a.de + (a.vers - a.de) * (1 - Math.pow(1 - p, 3));
        if (p >= 1) animation.current = null;
      } else if (!glisse.current?.actif && Math.abs(inertie.current) > 5) {
        position.current += inertie.current * dt;
        inertie.current *= Math.pow(0.04, dt); // freinage progressif
      } else {
        inertie.current = 0;
        const enAttente =
          reduit || focusDedans.current || glisse.current || !visible.current || t < repriseA.current;
        if (!enAttente) position.current += VITESSE * dt;
      }
      if (!animation.current) recentrer();
      appliquer();
      raf = requestAnimationFrame(image);
    };
    raf = requestAnimationFrame(image);
    return () => cancelAnimationFrame(raf);
  }, [reduit]);

  const differerReprise = () => { repriseA.current = Math.max(repriseA.current, performance.now() + REPRISE_MS); };
  /** Le visiteur a pris la main : le défilement automatique reprend peu après. */
  const arreterAuto = differerReprise;

  const allerA = (cible: number) => {
    inertie.current = 0;
    if (reduit) {
      position.current = cible;
      animation.current = null;
    } else {
      animation.current = { de: position.current, vers: cible, debut: performance.now(), duree: 450 };
    }
    arreterAuto();
  };

  // Molette horizontale (pavé tactile) : écouteur non passif pour bloquer le retour arrière du navigateur
  useEffect(() => {
    const el = fenetreRef.current;
    if (!el) return;
    const roue = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      animation.current = null;
      inertie.current = 0;
      position.current += e.deltaX;
      arreterAuto();
    };
    el.addEventListener('wheel', roue, { passive: false });
    return () => el.removeEventListener('wheel', roue);
  }, []);

  // Glisser (doigt ou souris)
  const auPointerDown = (e: PointerEventReact<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    bloquerClic.current = false;
    animation.current = null;
    inertie.current = 0;
    glisse.current = { x: e.clientX, depart: position.current, actif: false, id: e.pointerId, derniers: [{ t: performance.now(), x: e.clientX }] };
  };
  const auPointerMove = (e: PointerEventReact<HTMLDivElement>) => {
    const g = glisse.current;
    if (!g || g.id !== e.pointerId) return;
    const dx = e.clientX - g.x;
    if (!g.actif) {
      if (Math.abs(dx) < SEUIL_GLISSER) return;
      g.actif = true;
      fenetreRef.current?.setPointerCapture(e.pointerId);
    }
    position.current = g.depart - dx;
    g.depart -= recentrer();
    const t = performance.now();
    g.derniers.push({ t, x: e.clientX });
    while (g.derniers.length > 2 && t - g.derniers[0].t > 100) g.derniers.shift();
  };
  const finGlisser = (e: PointerEventReact<HTMLDivElement>) => {
    const g = glisse.current;
    if (!g || g.id !== e.pointerId) return;
    if (g.actif) {
      bloquerClic.current = true; // le relâchement ne doit pas ouvrir la marque
      const premier = g.derniers[0];
      const dt = (performance.now() - premier.t) / 1000;
      if (!reduit && dt > 0) inertie.current = Math.max(-2500, Math.min(2500, -(e.clientX - premier.x) / dt));
      arreterAuto();
    }
    glisse.current = null;
    differerReprise();
  };

  // Clavier : une seule marque dans la tabulation, flèches pour passer aux autres
  const focaliser = (i: number) => {
    const n = elements.length;
    liensRef.current[((i % n) + n) % n]?.focus({ preventScroll: true });
  };
  const auClavier = (e: KeyboardEventReact<HTMLAnchorElement>, i: number) => {
    const cibles: Record<string, number> = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: elements.length - 1 };
    if (e.key in cibles) {
      e.preventDefault();
      focaliser(cibles[e.key]);
    }
  };
  const auFocus = (i: number) => {
    setActif(i);
    const lien = liensRef.current[i];
    // Seul le focus clavier suspend le défilement (un clic ou un glissement à la souris
    // donne aussi le focus au lien, sans que le visiteur veuille arrêter le carrousel)
    focusDedans.current = !!lien?.matches(':focus-visible');
    if (!focusDedans.current) return;
    const vue = fenetreRef.current;
    const piste = pisteRef.current;
    if (!lien || !vue || !piste) return;
    const item = lien.parentElement as HTMLElement;
    // Position de la marque dans la piste (les deux rectangles incluent le décalage courant)
    const gauche = item.getBoundingClientRect().left - piste.getBoundingClientRect().left;
    const visibleDeja = gauche >= position.current + 24 && gauche + item.offsetWidth <= position.current + vue.clientWidth - 24;
    if (!visibleDeja) allerA(gauche - (vue.clientWidth - item.offsetWidth) / 2);
  };
  const auBlur = (e: FocusEventReact<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      focusDedans.current = false;
      differerReprise();
    }
  };

  const tuile = (el: Element, i: number, clone: boolean) => (
    <Link
      to={`/vehicules?brand=${encodeURIComponent(el.id)}`}
      ref={clone ? undefined : (n) => { liensRef.current[i] = n; }}
      tabIndex={clone ? -1 : i === actif ? 0 : -1}
      onKeyDown={clone ? undefined : (e) => auClavier(e, i)}
      onFocus={clone ? undefined : () => auFocus(i)}
      draggable={false}
      className="group/marque block rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bleu-vif/60 select-none"
    >
      <span className="flex h-[92px] md:h-[100px] flex-col items-center justify-center rounded-2xl border border-bordure bg-white px-4 shadow-carte transition-[transform,box-shadow,border-color] duration-200 group-hover/marque:-translate-y-1 group-hover/marque:border-or/60 group-hover/marque:shadow-vehicule group-focus-visible/marque:border-or/60 motion-reduce:transition-none motion-reduce:group-hover/marque:translate-y-0">
        {el.logo ? (
          <img src={el.logo} alt={el.nom} className="max-h-10 max-w-[120px] object-contain" loading="lazy" draggable={false} />
        ) : (
          <span className="titre-display text-center text-[17px] md:text-[19px] leading-[1.1] tracking-[0.04em] text-noir [text-wrap:balance] transition-colors duration-200 group-hover/marque:text-or-texte">
            {el.nom}
          </span>
        )}
      </span>
      <span className="flex h-8 items-end justify-center">
        {el.enStock && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-or bg-noir-profond px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-or-clair" aria-hidden="true" />
            En stock
          </span>
        )}
      </span>
    </Link>
  );

  const groupe = (clone: boolean, cle: string) => {
    const classes = 'flex shrink-0 gap-3 md:gap-4 pr-3 md:pr-4';
    const items = elements.map((el, i) => (
      <li key={`${cle}-${el.id}`} className="w-[136px] sm:w-[152px] md:w-[168px] shrink-0">
        {tuile(el, i, clone)}
      </li>
    ));
    return clone ? (
      <ul key={cle} className={classes} aria-hidden="true">{items}</ul>
    ) : (
      <ul key={cle} ref={groupeRef} className={classes} aria-label="Marques">{items}</ul>
    );
  };

  return (
    <Section background="gray" className="!py-12 md:!py-16 overflow-clip">
      <Container>
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="titre-section filet-apres mb-5">Explorez les marques</h2>
            <p className="text-base md:text-lg text-gris leading-relaxed">
              Retrouvez les plus grandes marques de motos et découvrez les modèles actuellement disponibles chez SVM Ride.
            </p>
          </div>
        </div>
      </Container>

      <div
        ref={fenetreRef}
        role="region"
        aria-roledescription="carrousel"
        aria-label={`Marques de motos${pret && enStock ? `, ${nbEnStock} en stock en premier` : ''}. Flèches gauche et droite pour passer d'une marque à l'autre.`}
        className="relative overflow-clip cursor-grab touch-pan-y active:cursor-grabbing [mask-image:linear-gradient(90deg,transparent,#000_5%,#000_95%,transparent)]"
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
        onBlur={auBlur}
      >
        <div
          ref={pisteRef}
          className={`flex w-max py-2 will-change-transform transition-opacity duration-500 motion-reduce:transition-none ${pret ? 'opacity-100' : 'opacity-0'}`}
          aria-busy={!pret}
        >
          {groupe(true, 'avant')}
          {groupe(false, 'milieu')}
          {groupe(true, 'apres')}
        </div>
      </div>

      <Container>
        <p className="mt-4 text-xs text-gris/80">
          Les noms de marques cités appartiennent à leurs propriétaires respectifs ; leur présence n'implique aucun partenariat avec les constructeurs.
        </p>
      </Container>
    </Section>
  );
}
