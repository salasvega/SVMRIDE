/**
 * Studio Design — aperçu du vrai site dans un cadre, avec un thème qui n'est
 * pas publié : le brouillon est envoyé au cadre par message et n'existe que
 * dans cet onglet. Ordinateur / tablette / mobile, choix de la page,
 * avant / après et côte à côte.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Columns2, Eye, Monitor, Rocket, Smartphone, Tablet } from 'lucide-react';
import type { CleSection, ThemeConfig } from '../../../config/design';
import type { MessageApercu } from '../../../lib/theme';
import { slugExemple } from '../../../lib/studioDesign';
import { PAGE_DE_ZONE } from './outils';

const APPAREILS = [
  { cle: 'ordinateur', libelle: 'Ordinateur', largeur: 1280, icone: Monitor },
  { cle: 'tablette', libelle: 'Tablette', largeur: 820, icone: Tablet },
  { cle: 'mobile', libelle: 'Mobile', largeur: 390, icone: Smartphone },
] as const;


function Cadre({ config, chemin, largeur, zone, titre }: { config: ThemeConfig | null; chemin: string; largeur: number; zone: CleSection | null; titre: string }) {
  const boite = useRef<HTMLDivElement>(null);
  const cadre = useRef<HTMLIFrameElement>(null);
  const [place, setPlace] = useState(800);
  const hauteur = Math.round(Math.min(760, Math.max(480, window.innerHeight - 260)));

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
    w.postMessage({ type: 'svm-apercu', config } satisfies MessageApercu, window.location.origin);
    w.postMessage({ type: 'svm-apercu-zone', zone } satisfies MessageApercu, window.location.origin);
  }, [config, zone]);

  useEffect(() => {
    envoyer();
    const ecouter = (e: MessageEvent<MessageApercu>) => {
      if (e.origin === window.location.origin && e.source === cadre.current?.contentWindow && e.data?.type === 'svm-apercu-pret') envoyer();
    };
    window.addEventListener('message', ecouter);
    return () => window.removeEventListener('message', ecouter);
  }, [envoyer]);

  const echelle = Math.min(1, place / largeur);
  return (
    <div ref={boite} className="w-full">
      <div className="mx-auto overflow-hidden rounded-xl border-2 border-[#D1D5DB] bg-white shadow-sm" style={{ width: largeur * echelle, height: hauteur }}>
        <iframe
          ref={cadre}
          title={titre}
          src={`${chemin}?apercu=1`}
          onLoad={envoyer}
          style={{ width: largeur, height: hauteur / echelle, transform: `scale(${echelle})`, transformOrigin: '0 0', border: 0 }}
        />
      </div>
    </div>
  );
}

interface Props {
  /** Thème regardé (brouillon, thème de la bibliothèque ou version) */
  config: ThemeConfig;
  titre: string;
  /** Thème actuellement en ligne (« Avant ») */
  enLigne: ThemeConfig | null;
  zone: CleSection | null;
  onPublier?: () => void;
  publiable: boolean;
}

export function OngletApercu({ config, titre, enLigne, zone, onPublier, publiable }: Props) {
  const [appareil, setAppareil] = useState<(typeof APPAREILS)[number]['cle']>('ordinateur');
  const [mode, setMode] = useState<'apres' | 'avant' | 'cote'>('apres');
  const [slug, setSlug] = useState<string | null>(null);
  const zonePage = zone ? PAGE_DE_ZONE[zone] : undefined;
  const [page, setPage] = useState<string>(zonePage ?? '/');
  useEffect(() => {
    slugExemple().then(setSlug);
  }, []);
  useEffect(() => {
    if (zone) setPage(PAGE_DE_ZONE[zone] ?? '/');
  }, [zone]);

  const pages = [
    { chemin: '/', libelle: 'Accueil' },
    { chemin: '/vehicules', libelle: 'Nos véhicules' },
    ...(slug ? [{ chemin: 'fiche', libelle: 'Fiche moto' }] : []),
    { chemin: '/vendre-ma-moto', libelle: 'Vendre ma moto' },
    { chemin: '/financement', libelle: 'Financement' },
    { chemin: '/equipe', libelle: 'Équipe' },
    { chemin: '/contact', libelle: 'Contact' },
  ];
  const chemin = page === 'fiche' ? (slug ? `/vehicules/${slug}` : '/vehicules') : page;
  const largeur = APPAREILS.find((a) => a.cle === appareil)!.largeur;
  const bouton = (actif: boolean) =>
    `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${actif ? 'bg-[#111111] text-white' : 'text-[#444444] hover:bg-[#F5F5F5]'}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-3">
        <p className="flex items-center gap-2 text-sm text-amber-900">
          <Eye className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span><strong>Aperçu, non publié</strong> · {titre}. Les visiteurs voient toujours le thème en ligne.</span>
        </p>
        {onPublier && (
          <button type="button" onClick={onPublier} disabled={!publiable}
            className="inline-flex items-center gap-2 rounded-xl bg-[#111111] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
            <Rocket className="h-4 w-4" aria-hidden="true" /> Publier le thème
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border-2 border-[#D1D5DB] bg-white p-2">
        <div className="flex gap-1" role="group" aria-label="Appareil">
          {APPAREILS.map((a) => (
            <button key={a.cle} type="button" onClick={() => setAppareil(a.cle)} className={bouton(appareil === a.cle)} aria-pressed={appareil === a.cle}>
              <a.icone className="h-4 w-4" aria-hidden="true" /> <span className="hidden sm:inline">{a.libelle}</span>
            </button>
          ))}
        </div>
        <span className="hidden h-6 w-px bg-[#E5E5E5] sm:block" />
        <label className="flex items-center gap-2 text-sm text-[#444444]">
          Page
          <select value={page} onChange={(e) => setPage(e.target.value)} className="rounded-lg border-2 border-[#D1D5DB] bg-white px-2 py-1.5 text-sm font-medium text-[#111111]">
            {pages.map((p) => <option key={p.chemin} value={p.chemin}>{p.libelle}</option>)}
          </select>
        </label>
        <span className="hidden h-6 w-px bg-[#E5E5E5] sm:block" />
        <div className="flex gap-1" role="group" aria-label="Comparaison">
          <button type="button" onClick={() => setMode('avant')} className={bouton(mode === 'avant')} aria-pressed={mode === 'avant'}>Avant</button>
          <button type="button" onClick={() => setMode('apres')} className={bouton(mode === 'apres')} aria-pressed={mode === 'apres'}>Après</button>
          <button type="button" onClick={() => setMode('cote')} className={`${bouton(mode === 'cote')} hidden lg:inline-flex`} aria-pressed={mode === 'cote'}>
            <Columns2 className="h-4 w-4" aria-hidden="true" /> Côte à côte
          </button>
        </div>
      </div>

      {mode === 'cote' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-semibold text-[#666666]">Avant : thème en ligne</p>
            <Cadre key={`a-${chemin}-${largeur}`} config={enLigne} chemin={chemin} largeur={largeur} zone={zone} titre="Aperçu du site avec le thème en ligne" />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-[#111111]">Après : {titre}</p>
            <Cadre key={`b-${chemin}-${largeur}`} config={config} chemin={chemin} largeur={largeur} zone={zone} titre={`Aperçu du site avec ${titre}`} />
          </div>
        </div>
      ) : (
        <Cadre key={`${chemin}-${largeur}`} config={mode === 'avant' ? enLigne : config} chemin={chemin} largeur={largeur} zone={zone}
          titre={mode === 'avant' ? 'Aperçu du site avec le thème en ligne' : `Aperçu du site avec ${titre}`} />
      )}
      <p className="text-xs text-[#666666]">
        Vous pouvez cliquer dans le site comme un visiteur. Les formulaires de l'aperçu fonctionnent réellement : évitez de les envoyer.
      </p>
    </div>
  );
}
