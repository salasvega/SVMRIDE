/**
 * Aperçu d'une page du vrai site dans un cadre de l'admin, avec des textes
 * pas encore enregistrés (envoyés au cadre par message, jamais publiés).
 *
 * Édition des textes (page « Textes du site ») : les textes du cadre sont
 * repérables ; le texte en cours est entouré, un clic sur un texte est signalé
 * (onClic) et une bulle peut être posée à côté du texte en cours (bulle).
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import type { MessageApercu } from '../../lib/theme';
import type { MessageEdition, Rect } from '../../lib/edition';
import type { FondAccueil } from '../../config/medias';

export interface OptionsEdition {
  /** Texte en cours (entouré dans le cadre) */
  actif: string | null;
  /** Change à chaque demande de faire défiler le cadre jusqu'au texte en cours */
  montrer?: number;
  /** Contours de tous les textes modifiables */
  tous?: boolean;
  /** La page réagit normalement aux clics (boutons « Suivant »…), sans édition */
  utiliser?: boolean;
  onClic?: (cle: string) => void;
}

export function ApercuPage({
  chemin, textes, fond, edition, bulle, onNavigation, hauteurMax = 720, plein = false,
  legende = 'Les changements apparaissent ici tout de suite ; les visiteurs les verront après « Enregistrer ».',
}: {
  chemin: string;
  /** Textes à montrer (absent : textes du site) */
  textes?: Record<string, string>;
  /** Fond de l'accueil à montrer (absent : celui du site ; null : image d'origine) */
  fond?: FondAccueil | null;
  edition?: OptionsEdition;
  /** Bulle posée sous (ou au-dessus) du texte en cours, en coordonnées de l'aperçu */
  bulle?: ReactNode;
  /** Page affichée dans le cadre (après une navigation dans le cadre) */
  onNavigation?: (chemin: string) => void;
  legende?: string;
  hauteurMax?: number;
  /** Grand aperçu (édition sur la page) */
  plein?: boolean;
}) {
  const boite = useRef<HTMLDivElement>(null);
  const refBulle = useRef<HTMLDivElement>(null);
  const cadre = useRef<HTMLIFrameElement>(null);
  const [place, setPlace] = useState(400);
  const [appareil, setAppareil] = useState<'ordinateur' | 'mobile'>('ordinateur');
  const [position, setPosition] = useState<{ boite: Rect | null; vue: number } | null>(null);
  const largeur = appareil === 'ordinateur' ? 1280 : 390;
  const hauteur = Math.round(Math.min(hauteurMax, Math.max(380, window.innerHeight - (plein ? 190 : 250))));

  useEffect(() => {
    const el = boite.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setPlace(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const poster = useCallback((m: MessageApercu | MessageEdition) => {
    cadre.current?.contentWindow?.postMessage(m, window.location.origin);
  }, []);

  const avecEdition = !!edition;
  const actif = edition?.actif ?? null;
  const tous = !!edition?.tous;
  const utiliser = !!edition?.utiliser;
  const envoyer = useCallback(() => {
    if (textes) poster({ type: 'svm-apercu-textes', textes });
    if (fond !== undefined) poster({ type: 'svm-apercu-fond', fond });
    if (avecEdition) {
      poster({ type: 'svm-edition', actif: true, tous, utiliser });
      poster({ type: 'svm-edition-actif', cle: actif });
    }
  }, [textes, fond, avecEdition, tous, utiliser, actif, poster]);

  useEffect(() => {
    envoyer();
  }, [envoyer]);

  // Défilement du cadre jusqu'au texte en cours, à la demande
  const montrer = edition?.montrer;
  useEffect(() => {
    if (montrer && actif) poster({ type: 'svm-edition-actif', cle: actif, montrer: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [montrer]);

  const onClic = edition?.onClic;
  useEffect(() => {
    const ecouter = (e: MessageEvent<MessageApercu | MessageEdition>) => {
      if (e.origin !== window.location.origin || e.source !== cadre.current?.contentWindow) return;
      const m = e.data;
      if (m?.type === 'svm-apercu-pret') {
        envoyer();
        onNavigation?.(m.chemin);
      } else if (m?.type === 'svm-edition-clic') {
        onClic?.(m.cle);
        setPosition({ boite: m.boite, vue: 0 });
      } else if (m?.type === 'svm-edition-position') {
        setPosition({ boite: m.boite, vue: m.hauteurVue });
      }
    };
    window.addEventListener('message', ecouter);
    return () => window.removeEventListener('message', ecouter);
  }, [envoyer, onClic, onNavigation]);

  useEffect(() => {
    if (!actif) setPosition(null);
  }, [actif]);

  // La bulle qui s'ouvre reste dans la fenêtre (au-dessus de la barre d'enregistrement)
  const ouverte = !!(bulle && actif && position?.boite);
  useEffect(() => {
    if (ouverte) window.setTimeout(() => refBulle.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 30);
  }, [ouverte, actif]);

  const echelle = Math.min(1, place / largeur);
  const l = largeur * echelle;
  const bouton = (on: boolean) =>
    `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${on ? 'bg-[#111111] text-white' : 'text-[#444444] hover:bg-[#F5F5F5]'}`;

  // Bulle : sous le texte en cours, au-dessus s'il est en bas de l'aperçu
  const b = position?.boite;
  const visible = !!(bulle && actif && !utiliser && b && b.y + b.h > 0 && b.y < hauteur / echelle);
  const bas = b ? (b.y + b.h) * echelle : 0;
  const auDessus = !!b && bas > hauteur * 0.62;
  const styleBulle = b ? {
    left: Math.max(0, Math.min(l - 360, b.x * echelle)),
    ...(auDessus ? { bottom: hauteur - b.y * echelle + 10 } : { top: bas + 10 }),
  } : undefined;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[#111111]">{plein ? (utiliser ? 'La page fonctionne normalement' : 'Cliquez sur un texte pour le modifier') : 'Aperçu en direct'}</p>
        <div className="flex gap-1" role="group" aria-label="Appareil">
          <button type="button" onClick={() => setAppareil('ordinateur')} className={bouton(appareil === 'ordinateur')} aria-pressed={appareil === 'ordinateur'}>
            <Monitor className="h-3.5 w-3.5" aria-hidden="true" /> Ordinateur
          </button>
          <button type="button" onClick={() => setAppareil('mobile')} className={bouton(appareil === 'mobile')} aria-pressed={appareil === 'mobile'}>
            <Smartphone className="h-3.5 w-3.5" aria-hidden="true" /> Mobile
          </button>
        </div>
      </div>
      <div ref={boite} className="w-full">
        <div className="relative mx-auto" style={{ width: l, height: hauteur }}>
          <div className="h-full w-full overflow-hidden rounded-xl border-2 border-[#D1D5DB] bg-white">
            <iframe
              key={`${chemin}-${largeur}`}
              ref={cadre}
              title="Aperçu de la page avec les textes en cours"
              src={`${chemin}${chemin.includes('?') ? '&' : '?'}apercu=1`}
              onLoad={envoyer}
              style={{ width: largeur, height: hauteur / echelle, transform: `scale(${echelle})`, transformOrigin: '0 0', border: 0 }}
            />
          </div>
          {visible && (
            <div ref={refBulle} className="absolute z-20 w-[360px] max-w-full scroll-mb-28 scroll-mt-24" style={styleBulle}>
              {bulle}
            </div>
          )}
        </div>
      </div>
      {legende && <p className="text-xs text-[#666666]">{legende}</p>}
    </div>
  );
}
