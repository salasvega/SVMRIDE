/**
 * Aperçu d'une page du vrai site dans un cadre de l'admin, avec des textes
 * pas encore enregistrés (envoyés au cadre par message, jamais publiés).
 * Le texte en cours de modification est entouré et montré.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import type { MessageApercu } from '../../lib/theme';
import type { FondAccueil } from '../../config/medias';

export function ApercuPage({ chemin, textes, repere = null, fond, legende = 'Les changements apparaissent ici tout de suite ; les visiteurs les verront après « Enregistrer ».', hauteurMax = 720 }: {
  chemin: string;
  /** Textes à montrer (absent : textes du site) */
  textes?: Record<string, string>;
  repere?: string | null;
  /** Fond de l'accueil à montrer (absent : celui du site ; null : image d'origine) */
  fond?: FondAccueil | null;
  legende?: string;
  hauteurMax?: number;
}) {
  const boite = useRef<HTMLDivElement>(null);
  const cadre = useRef<HTMLIFrameElement>(null);
  const [place, setPlace] = useState(400);
  const [appareil, setAppareil] = useState<'ordinateur' | 'mobile'>('ordinateur');
  const largeur = appareil === 'ordinateur' ? 1280 : 390;
  const hauteur = Math.round(Math.min(hauteurMax, Math.max(380, window.innerHeight - 250)));

  useEffect(() => {
    const el = boite.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setPlace(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const envoyer = useCallback(() => {
    const w = cadre.current?.contentWindow;
    if (!w) return;
    if (textes) w.postMessage({ type: 'svm-apercu-textes', textes } satisfies MessageApercu, window.location.origin);
    if (fond !== undefined) w.postMessage({ type: 'svm-apercu-fond', fond } satisfies MessageApercu, window.location.origin);
    w.postMessage({ type: 'svm-apercu-repere', texte: repere } satisfies MessageApercu, window.location.origin);
  }, [textes, repere, fond]);

  useEffect(() => {
    envoyer();
    const ecouter = (e: MessageEvent<MessageApercu>) => {
      if (e.origin === window.location.origin && e.source === cadre.current?.contentWindow && e.data?.type === 'svm-apercu-pret') envoyer();
    };
    window.addEventListener('message', ecouter);
    return () => window.removeEventListener('message', ecouter);
  }, [envoyer]);

  const echelle = Math.min(1, place / largeur);
  const bouton = (actif: boolean) =>
    `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${actif ? 'bg-[#111111] text-white' : 'text-[#444444] hover:bg-[#F5F5F5]'}`;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[#111111]">Aperçu en direct</p>
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
        <div className="mx-auto overflow-hidden rounded-xl border-2 border-[#D1D5DB] bg-white" style={{ width: largeur * echelle, height: hauteur }}>
          <iframe
            key={`${chemin}-${largeur}`}
            ref={cadre}
            title="Aperçu de la page avec les textes en cours"
            src={`${chemin}?apercu=1`}
            onLoad={envoyer}
            style={{ width: largeur, height: hauteur / echelle, transform: `scale(${echelle})`, transformOrigin: '0 0', border: 0 }}
          />
        </div>
      </div>
      {legende && <p className="text-xs text-[#666666]">{legende}</p>}
    </div>
  );
}
