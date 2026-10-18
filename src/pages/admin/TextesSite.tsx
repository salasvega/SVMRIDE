/**
 * Admin — Textes du site : tous les textes modifiables, page par page et
 * section par section, avec l'aperçu en direct du vrai site, la recherche,
 * le retour au texte d'origine et l'historique des enregistrements.
 *
 * Deux façons de modifier : la liste des champs (un clic sur un texte de
 * l'aperçu amène à son champ), ou « Modifier sur la page » : le vrai site en
 * grand, un clic sur un texte ouvre une bulle d'édition à côté de lui.
 * Registre : src/config/textes.ts ; réglage « textes » de site_reglages
 * (seuls les textes modifiés y sont gardés).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Eye, History, List, Loader2, MousePointerClick, RotateCcw, Search, Type, X } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { ApercuPage } from '../../components/admin/ApercuPage';
import { supabase } from '../../lib/supabase';
import { appliquerTextes } from '../../lib/textes';
import { CLE_TEXTES, normaliserTextes, PAGES_TEXTES, SEO_PAGES, texte, TEXTES, type DefTexte, type PageTextes, type Textes } from '../../config/textes';

interface Version {
  id: number;
  ancienne_valeur: unknown;
  nouvelle_valeur: unknown;
  par: string | null;
  fait_le: string;
}

const PAGES = PAGES_TEXTES;
/** Où se trouve chaque texte (première page qui le contient) */
const OU: Record<string, { page: PageTextes; section: string }> = {};
for (const p of PAGES) for (const s of p.sections) for (const t of s.textes) OU[t.cle] ??= { page: p, section: s.titre };
/** Textes présents sur toutes les pages (pas une page à ouvrir dans l'aperçu) */
const COMMUNES = new Set(['identite', 'annonce', 'navigation', 'pied', 'cookies', 'avis', 'fichiers']);
/** Pages du site qu'on peut ouvrir dans « Modifier sur la page » */
const PAGES_SITE = PAGES.filter((p) => p.chemin && !COMMUNES.has(p.cle));
/**
 * États d'exemple des pages (aperçu seulement, rien n'est envoyé) : messages
 * après envoi, espaces connectés, contrat à signer… pour en modifier les textes.
 */
const VARIANTES: Record<string, { libelle: string; chemin: string }[]> = {
  reprises: [{ libelle: 'après l’envoi', chemin: '/reprises?demo=envoye' }],
  vendre: [{ libelle: 'après l’envoi', chemin: '/vendre-ma-moto?demo=envoye' }],
  dossier: [
    { libelle: 'dossier ouvert (exemple)', chemin: '/financement/dossier?demo=ouvert' },
    { libelle: 'dossier envoyé (exemple)', chemin: '/financement/dossier?demo=envoye' },
  ],
  recherche: [{ libelle: 'après l’envoi', chemin: '/recherche-personnalisee?demo=envoye' }],
  contact: [{ libelle: 'après l’envoi', chemin: '/contact?demo=envoye' }],
  suivre: [{ libelle: 'espace propriétaire (exemple)', chemin: '/suivre-ma-vente?demo=connecte' }],
  signature: [
    { libelle: 'code envoyé', chemin: '/signature/apercu-code' },
    { libelle: 'avenant', chemin: '/signature/apercu-avenant-code' },
    { libelle: 'contrat signé', chemin: '/signature/apercu?demo=signe' },
  ],
};
/** Choix de la liste « Page » : chaque page, puis ses états d'exemple */
const CHOIX_PAGES = PAGES_SITE.flatMap((p) => [
  { id: p.cle, cle: p.cle, libelle: p.libelle, chemin: p.chemin as string },
  ...(VARIANTES[p.cle] ?? []).map((v, i) => ({ id: `${p.cle}:${i}`, cle: p.cle, libelle: `${p.libelle} — ${v.libelle}`, chemin: v.chemin })),
]);

/** Page du registre qui correspond à une adresse du site */
function pageDuChemin(chemin: string): PageTextes | undefined {
  return PAGES_SITE.find((p) => p.chemin === chemin)
    ?? (chemin.startsWith('/vehicules/') ? PAGES_SITE.find((p) => p.chemin?.startsWith('/vehicules/:')) : undefined)
    ?? (chemin.startsWith('/signature/') ? PAGES_SITE.find((p) => p.chemin?.startsWith('/signature/')) : undefined);
}
const sansAccent = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const court = (s: string, n = 90) => (s.length > n ? `${s.slice(0, n - 1)}…` : s || '(vide)');
const date = (iso: string) => new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Différences entre deux jeux de textes (libellés lisibles) */
function differences(a: Textes, b: Textes): { cle: string; libelle: string; avant: string; apres: string }[] {
  const cles = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...cles]
    .filter((k) => texte(a, k) !== texte(b, k) || (a[k] ?? '') !== (b[k] ?? ''))
    .map((k) => ({ cle: k, libelle: libelleComplet(k), avant: texte(a, k), apres: texte(b, k) }))
    .filter((d) => d.avant !== d.apres);
}

function libelleComplet(cle: string): string {
  for (const p of PAGES) for (const s of p.sections) {
    const t = s.textes.find((x) => x.cle === cle);
    if (t) return `${p.libelle} › ${s.titre} › ${t.libelle}`;
  }
  return cle;
}

function Champ({ def, valeur, onChange, onFocus }: { def: DefTexte; valeur: string; onChange: (v: string) => void; onFocus: () => void }) {
  const id = `t-${def.cle}`;
  const modifie = valeur !== def.defaut;
  const max = def.max ?? 420;
  const lienInvalide = def.type === 'lien' && valeur.trim() !== '' && !/^(\/[^\s]*|https:\/\/[^\s]+)$/.test(valeur.trim());
  const commun = {
    id,
    value: valeur,
    maxLength: max,
    onFocus,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    className: `w-full rounded-xl border-2 px-3 py-2 text-[15px] text-[#111111] focus:outline-none ${lienInvalide ? 'border-red-400' : modifie ? 'border-amber-300 focus:border-[#111111]' : 'border-[#D1D5DB] focus:border-[#111111]'}`,
    'aria-describedby': `${id}-aide`,
  };
  return (
    <div className="py-3">
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold text-[#111111]">
          {def.libelle}
          {modifie && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">Modifié</span>}
        </label>
        {modifie && (
          <button type="button" onClick={() => onChange(def.defaut)} className="inline-flex items-center gap-1 text-xs font-semibold text-[#444444] hover:text-[#111111]">
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Texte d'origine
          </button>
        )}
      </div>
      {def.type === 'paragraphe' ? (
        <textarea {...commun} rows={Math.min(6, Math.max(2, Math.ceil(valeur.length / 70)))} className={`${commun.className} resize-y leading-relaxed`} />
      ) : (
        <input {...commun} type={def.type === 'lien' ? 'url' : 'text'} inputMode={def.type === 'lien' ? 'url' : undefined} />
      )}
      <div id={`${id}-aide`} className="mt-1 flex flex-wrap justify-between gap-x-3 text-xs text-[#666666]">
        <span>
          {lienInvalide ? <span className="text-red-700">Adresse invalide : une page du site (/contact) ou une adresse https://…</span> : def.aide}
          {modifie && def.defaut && <span className="block">Origine : « {court(def.defaut, 140)} »</span>}
        </span>
        <span className={valeur.length > max * 0.9 ? 'font-semibold text-amber-800' : ''}>{valeur.length}/{max}</span>
      </div>
    </div>
  );
}

/** Aperçu d'un résultat Google (onglet Référencement) */
function ApercuGoogle({ titre, description, chemin }: { titre: string; description: string; chemin: string }) {
  return (
    <div className="mt-1 rounded-xl border border-[#E5E5E5] bg-white p-3 font-[arial,sans-serif]">
      <p className="text-xs text-[#4D5156]">svmride.com{chemin === '/' ? '' : chemin.replace(/\//g, ' › ').replace(/^ › /, ' › ')}</p>
      <p className="truncate text-lg leading-snug text-[#1A0DAB]">{titre}</p>
      <p className="line-clamp-2 text-sm text-[#4D5156]">{description}</p>
    </div>
  );
}

/** Bulle d'édition posée à côté du texte cliqué (« Modifier sur la page ») */
function BulleTexte({ def, valeur, onChange, onFermer, onListe }: {
  def: DefTexte; valeur: string; onChange: (v: string) => void; onFermer: () => void; onListe: () => void;
}) {
  const champ = useRef<HTMLTextAreaElement>(null);
  const ou = OU[def.cle];
  const max = def.max ?? 420;
  const modifie = valeur !== def.defaut;
  useEffect(() => {
    const el = champ.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    el.setSelectionRange(el.value.length, el.value.length);
  }, [def.cle]);
  useEffect(() => {
    const el = champ.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [valeur, def.cle]);
  return (
    <div className="rounded-2xl border border-[#D1D5DB] bg-white p-3 shadow-[0_12px_40px_rgba(0,0,0,0.22)]" role="dialog" aria-label={`Modifier : ${def.libelle}`}
      onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); onFermer(); } }}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          {ou && <p className="truncate text-[11px] text-[#666666]">{ou.page.libelle} › {ou.section}</p>}
          <p className="text-sm font-semibold text-[#111111]">
            {def.libelle}
            {modifie && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">Modifié</span>}
          </p>
        </div>
        <button type="button" onClick={onFermer} className="rounded-full p-1 text-[#666666] hover:bg-[#F5F5F5]" aria-label="Fermer (Échap)">
          <X className="h-4 w-4" />
        </button>
      </div>
      <textarea ref={champ} value={valeur} maxLength={max} rows={1} aria-label={def.libelle}
        onChange={(e) => onChange(def.type === 'paragraphe' ? e.target.value : e.target.value.replace(/\n/g, ' '))}
        onKeyDown={(e) => { if (e.key === 'Enter' && def.type !== 'paragraphe') { e.preventDefault(); onFermer(); } }}
        className={`w-full resize-none rounded-xl border-2 px-3 py-2 text-[15px] leading-relaxed text-[#111111] focus:outline-none ${modifie ? 'border-amber-300 focus:border-[#111111]' : 'border-[#D1D5DB] focus:border-[#111111]'}`} />
      <div className="mt-1 flex items-start justify-between gap-3 text-[11px] text-[#666666]">
        <span className="min-w-0">
          {def.aide && <span className="block">{def.aide}</span>}
          {modifie && def.defaut && <span className="block truncate">Origine : « {def.defaut} »</span>}
        </span>
        <span className={valeur.length > max * 0.9 ? 'font-semibold text-amber-800' : ''}>{valeur.length}/{max}</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={onListe} className="text-xs font-semibold text-[#444444] underline underline-offset-2 hover:text-[#111111]">Voir dans la liste</button>
        <div className="flex gap-2">
          {modifie && (
            <button type="button" onClick={() => onChange(def.defaut)} className="inline-flex items-center gap-1 rounded-lg border border-[#D1D5DB] px-2.5 py-1.5 text-xs font-semibold text-[#111111] hover:border-[#111111]">
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Texte d'origine
            </button>
          )}
          <button type="button" onClick={onFermer} className="rounded-lg bg-[#111111] px-3 py-1.5 text-xs font-semibold text-white">OK</button>
        </div>
      </div>
    </div>
  );
}

export function TextesSite() {
  const [enregistres, setEnregistres] = useState<Textes | null>(null);
  const [modifs, setModifs] = useState<Textes>({});
  const [pageCle, setPageCle] = useState('accueil');
  const [recherche, setRecherche] = useState('');
  const [vue, setVue] = useState<'liste' | 'page'>(() => (new URLSearchParams(window.location.search).get('vue') === 'page' ? 'page' : 'liste'));
  const [actif, setActif] = useState<string | null>(null);
  const [montrer, setMontrer] = useState(0);
  const [tous, setTous] = useState(false);
  const [cheminCadre, setCheminCadre] = useState('/');
  const [cheminVu, setCheminVu] = useState('/');
  const [choix, setChoix] = useState('accueil');
  const [utiliser, setUtiliser] = useState(false);
  const [slugVehicule, setSlugVehicule] = useState<string | null>(null);
  const [aFocaliser, setAFocaliser] = useState<string | null>(null);
  const navPages = useRef<HTMLElement>(null);
  const [historique, setHistorique] = useState<Version[]>([]);
  const [erreur, setErreur] = useState('');
  const [message, setMessage] = useState('');
  const [confirmation, setConfirmation] = useState<{ cible: Textes; titre: string } | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [apercuMobile, setApercuMobile] = useState(false);

  const charger = useCallback(async () => {
    const [{ data, error }, { data: h }] = await Promise.all([
      supabase.from('site_reglages').select('valeur').eq('cle', CLE_TEXTES).maybeSingle(),
      supabase.from('site_reglages_historique').select('id, ancienne_valeur, nouvelle_valeur, par, fait_le').eq('cle', CLE_TEXTES).order('fait_le', { ascending: false }).limit(15),
    ]);
    if (error) {
      setErreur('Impossible de charger les textes. Vérifiez que vous êtes connecté avec un compte administrateur.');
      return;
    }
    setEnregistres(normaliserTextes(data?.valeur));
    setHistorique((h as Version[]) ?? []);
  }, []);
  useEffect(() => { charger(); }, [charger]);

  // Fiche véhicule dans l'aperçu : le premier véhicule du catalogue
  useEffect(() => {
    supabase.from('vehicles').select('slug').not('slug', 'is', null).order('created_at', { ascending: false }).limit(1)
      .then(({ data }) => setSlugVehicule((data as { slug: string }[] | null)?.[0]?.slug ?? null));
  }, []);
  const resoudre = useCallback((chemin: string) => (chemin.includes(':premier') ? (slugVehicule ? `/vehicules/${slugVehicule}` : '/vehicules') : chemin), [slugVehicule]);

  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => setMessage(''), 7000);
    return () => window.clearTimeout(t);
  }, [message]);

  /** Textes en cours (enregistrés + modifications non enregistrées) */
  const courants = useMemo(() => normaliserTextes({ ...Object.fromEntries(Object.entries(TEXTES).map(([k, d]) => [k, d.defaut])), ...enregistres, ...modifs }), [enregistres, modifs]);
  const valeur = (cle: string) => modifs[cle] ?? enregistres?.[cle] ?? TEXTES[cle]?.defaut ?? '';
  const changements = useMemo(() => (enregistres ? differences(enregistres, courants) : []), [enregistres, courants]);
  // (calculé sur la saisie brute : la normalisation écarte déjà les adresses invalides)
  const lienInvalide = Object.entries(modifs).some(([k, v]) => TEXTES[k]?.type === 'lien' && v.trim() !== '' && !/^(\/[^\s]*|https:\/\/[^\s]+)$/.test(v.trim()));
  const nonEnregistres = changements.length > 0;

  useEffect(() => {
    if (!nonEnregistres) return;
    const avertir = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', avertir);
    return () => window.removeEventListener('beforeunload', avertir);
  }, [nonEnregistres]);

  const maj = (cle: string, v: string) => {
    setModifs((m) => ({ ...m, [cle]: v }));
    setActif(cle);
  };

  const page = PAGES.find((p) => p.cle === pageCle) ?? PAGES[0];
  const q = sansAccent(recherche.trim());
  const resultats: { page: PageTextes; sections: PageTextes['sections'] }[] = q
    ? PAGES.map((p) => ({
        page: p,
        sections: p.sections
          .map((s) => ({ ...s, textes: s.textes.filter((t) => [t.libelle, t.defaut, valeur(t.cle), s.titre, p.libelle].some((x) => sansAccent(x).includes(q))) }))
          .filter((s) => s.textes.length),
      })).filter((r) => r.sections.length)
    : [{ page, sections: page.sections }];
  const nbModifies = (p: PageTextes) => new Set(p.sections.flatMap((s) => s.textes).filter((t) => enregistres?.[t.cle] !== undefined).map((t) => t.cle)).size;
  const cheminApercu = resoudre(page.chemin ?? '/');

  // Clic sur un texte de l'aperçu (vue liste) : sa page et son champ
  const allerAuChamp = useCallback((cle: string) => {
    const ou = OU[cle];
    if (!ou) return;
    setRecherche('');
    if (!COMMUNES.has(ou.page.cle) || !page.chemin) setPageCle(ou.page.cle);
    setActif(cle);
    setAFocaliser(cle);
  }, [page.chemin]);
  useEffect(() => {
    if (!aFocaliser) return;
    const el = document.getElementById(`t-${aFocaliser}`);
    if (!el) return;
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    el.focus({ preventScroll: true });
    setAFocaliser(null);
  }, [aFocaliser, pageCle, vue]);

  const ouvrirPage = (id: string) => {
    const o = CHOIX_PAGES.find((x) => x.id === id);
    if (!o) return;
    const c = resoudre(o.chemin);
    setChoix(id);
    setCheminCadre(c);
    setCheminVu(c.split('?')[0]);
    setActif(null);
  };
  // Navigation dans le cadre (mode « Utiliser la page ») : la liste suit
  const surNavigation = useCallback((chemin: string) => {
    setCheminVu(chemin);
    setChoix((id) => {
      const o = CHOIX_PAGES.find((x) => x.id === id);
      if (o && pageDuChemin(o.chemin.split('?')[0])?.cle === pageDuChemin(chemin)?.cle) return id;
      return pageDuChemin(chemin)?.cle ?? '';
    });
  }, []);
  const passerEnVue = (v: 'liste' | 'page') => {
    setVue(v);
    if (v === 'page') {
      const c = page.chemin && !COMMUNES.has(page.cle) ? resoudre(page.chemin) : '/';
      setChoix(page.chemin && !COMMUNES.has(page.cle) ? page.cle : 'accueil');
      setCheminCadre(c);
      setCheminVu(c);
      window.setTimeout(() => document.getElementById('barre-edition')?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 60);
    } else if (actif) setAFocaliser(actif);
  };
  const pageVue = pageDuChemin(cheminVu);

  const pret = enregistres !== null;
  // Sur mobile, la liste des pages défile : garder la page choisie visible (sans faire défiler la page)
  useEffect(() => {
    const nav = navPages.current;
    const actif = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !actif || nav.scrollWidth <= nav.clientWidth) return;
    nav.scrollLeft = Math.max(0, actif.offsetLeft - nav.clientWidth / 2 + actif.offsetWidth / 2);
  }, [pageCle, pret]);

  const enregistrer = async (cible: Textes) => {
    setEnvoi(true);
    setErreur('');
    const valeurPropre = normaliserTextes(cible);
    const { error } = await supabase.from('site_reglages').upsert({ cle: CLE_TEXTES, valeur: valeurPropre });
    setEnvoi(false);
    setConfirmation(null);
    if (error) {
      setErreur("L'enregistrement a échoué. Réessayez.");
      return;
    }
    appliquerTextes(valeurPropre);
    setModifs({});
    await charger();
    setMessage('Textes enregistrés. Ils apparaissent sur le site d’ici une minute (tout de suite pour vous).');
  };

  const listeConfirmation = confirmation && enregistres ? differences(enregistres, normaliserTextes(confirmation.cible)) : [];

  return (
    <AdminLayout>
      <div className={`space-y-6 ${nonEnregistres || lienInvalide ? 'pb-28' : 'pb-10'}`}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-[#111111]"><Type className="h-7 w-7" aria-hidden="true" /> Textes du site</h1>
            <p className="mt-1 max-w-3xl text-[#666666]">
              Modifiez les titres, les phrases et les boutons du site, page par page, et voyez le résultat en direct. « {'{nom}'} » est remplacé par le nom du site.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <div className="inline-flex rounded-xl border-2 border-[#D1D5DB] bg-white p-1" role="group" aria-label="Façon de modifier">
            <button type="button" onClick={() => passerEnVue('liste')} aria-pressed={vue === 'liste'}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold ${vue === 'liste' ? 'bg-[#111111] text-white' : 'text-[#444444] hover:bg-[#F5F5F5]'}`}>
              <List className="h-4 w-4" aria-hidden="true" /> Liste
            </button>
            <button type="button" onClick={() => passerEnVue('page')} aria-pressed={vue === 'page'}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold ${vue === 'page' ? 'bg-[#111111] text-white' : 'text-[#444444] hover:bg-[#F5F5F5]'}`}>
              <MousePointerClick className="h-4 w-4" aria-hidden="true" /> Modifier sur la page
            </button>
          </div>
          {vue === 'liste' && <label className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888888]" aria-hidden="true" />
            <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher un texte…" aria-label="Rechercher un texte"
              className="w-full rounded-xl border-2 border-[#D1D5DB] bg-white py-2.5 pl-9 pr-9 text-sm focus:border-[#111111] focus:outline-none" />
            {recherche && (
              <button type="button" onClick={() => setRecherche('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#666666]" aria-label="Effacer la recherche">
                <X className="h-4 w-4" />
              </button>
            )}
          </label>}
          </div>
        </div>

        {message && <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900" role="status">{message}</p>}
        {erreur && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{erreur}</p>}

        {!enregistres ? (
          !erreur && <p className="flex items-center gap-2 text-[#666666]"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Chargement…</p>
        ) : vue === 'page' ? (
          <div className="space-y-3">
            <div id="barre-edition" className="flex scroll-mt-20 flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border-2 border-[#D1D5DB] bg-white px-3 py-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-[#111111]">
                Page
                <select value={choix} onChange={(e) => ouvrirPage(e.target.value)}
                  className="rounded-lg border-2 border-[#D1D5DB] bg-white px-2 py-1.5 text-sm font-medium focus:border-[#111111] focus:outline-none">
                  {!choix && <option value="">{pageVue?.libelle ?? cheminVu}</option>}
                  {CHOIX_PAGES.map((o) => <option key={o.id} value={o.id}>{o.libelle}</option>)}
                </select>
              </label>
              <div className="inline-flex rounded-lg border-2 border-[#D1D5DB] p-0.5 text-sm" role="group" aria-label="Un clic dans la page sert à">
                <button type="button" onClick={() => setUtiliser(false)} aria-pressed={!utiliser}
                  className={`rounded-md px-2.5 py-1 font-semibold ${!utiliser ? 'bg-[#111111] text-white' : 'text-[#444444] hover:bg-[#F5F5F5]'}`}>Modifier les textes</button>
                <button type="button" onClick={() => { setUtiliser(true); setActif(null); }} aria-pressed={utiliser}
                  className={`rounded-md px-2.5 py-1 font-semibold ${utiliser ? 'bg-[#111111] text-white' : 'text-[#444444] hover:bg-[#F5F5F5]'}`}>Utiliser la page</button>
              </div>
              {!utiliser && (
                <label className="flex items-center gap-2 text-sm text-[#444444]">
                  <input type="checkbox" checked={tous} onChange={(e) => setTous(e.target.checked)} className="h-4 w-4 accent-[#111111]" />
                  Montrer tous les textes modifiables
                </label>
              )}
              <p className="text-xs text-[#666666] lg:ml-auto">
                {utiliser
                  ? 'La page fonctionne normalement (boutons « Suivant », onglets…) ; rien n’est envoyé depuis l’aperçu. Revenez à « Modifier les textes » pour cliquer sur un texte.'
                  : 'Survolez un texte puis cliquez pour le modifier. Les textes communs (menu, pied de page) se modifient sur n’importe quelle page.'}
              </p>
            </div>
            <ApercuPage
              plein
              chemin={cheminCadre}
              textes={courants}
              hauteurMax={1400}
              onNavigation={surNavigation}
              edition={{ actif, tous, utiliser, onClic: (cle) => setActif(cle) }}
              legende="Un clic sur le texte d’un lien ou d’un bouton le modifie : pour changer de page ou avancer dans un formulaire, utilisez la liste « Page » ou « Utiliser la page ». Les visiteurs verront les changements après « Enregistrer »."
              bulle={actif && TEXTES[actif] ? (
                <BulleTexte def={TEXTES[actif]} valeur={valeur(actif)} onChange={(v) => maj(actif, v)} onFermer={() => setActif(null)}
                  onListe={() => { const ou = OU[actif]; if (ou) setPageCle(ou.page.cle); setVue('liste'); setAFocaliser(actif); }} />
              ) : null}
            />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[200px_minmax(0,1fr)_400px] 2xl:grid-cols-[220px_minmax(0,1fr)_480px]">
            {/* Pages */}
            <nav ref={navPages} aria-label="Pages" className={`${q ? 'opacity-50' : ''} -mx-1 flex gap-1 overflow-x-auto px-1 lg:sticky lg:top-24 lg:mx-0 lg:flex-col lg:self-start lg:overflow-visible lg:px-0`}>
              {PAGES.map((p) => {
                const n = nbModifies(p);
                const actif = !q && p.cle === page.cle;
                return (
                  <button key={p.cle} type="button" onClick={() => { setRecherche(''); setPageCle(p.cle); setActif(null); }} aria-current={actif ? 'page' : undefined}
                    className={`flex shrink-0 items-center justify-between gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${actif ? 'bg-[#111111] text-white' : 'text-[#444444] hover:bg-white hover:text-[#111111]'}`}>
                    {p.libelle}
                    {n > 0 && <span className={`rounded-full px-1.5 text-[11px] font-bold ${actif ? 'bg-white/20' : 'bg-amber-100 text-amber-900'}`} title={`${n} texte(s) modifié(s)`}>{n}</span>}
                  </button>
                );
              })}
            </nav>

            {/* Champs */}
            <div className="min-w-0 space-y-5">
              {q && resultats.length === 0 && <p className="rounded-xl border-2 border-dashed border-[#D1D5DB] px-4 py-8 text-center text-sm text-[#666666]">Aucun texte ne correspond à « {recherche} ».</p>}
              {!q && <p className="text-sm text-[#666666]">{page.description}</p>}
              {resultats.map(({ page: p, sections }) =>
                sections.map((s) => (
                  <section key={`${p.cle}-${s.titre}`} className="rounded-xl border-2 border-[#D1D5DB] bg-white px-4 pt-3 md:px-5">
                    <h2 className="text-lg font-bold text-[#111111]">{q ? `${p.libelle} › ${s.titre}` : s.titre}</h2>
                    {s.aide && <p className="text-sm text-[#666666]">{s.aide}</p>}
                    <div className="divide-y divide-[#EEEEEE]">
                      {s.textes.map((t) => (
                        <Champ key={t.cle} def={t} valeur={valeur(t.cle)} onChange={(v) => maj(t.cle, v)} onFocus={() => { if (p.chemin && !COMMUNES.has(p.cle)) setPageCle(p.cle); else if (p.chemin && p.cle !== pageCle) setPageCle(p.cle); setActif(t.cle); setMontrer((n) => n + 1); }} />
                      ))}
                    </div>
                    {p.cle === 'seo' && (() => {
                      const slug = s.textes[0].cle.split('.')[1];
                      return (
                        <div className="pb-4">
                          <ApercuGoogle
                            titre={texte(courants, `seo.${slug}.titre`)}
                            description={texte(courants, `seo.${slug}.description`) || 'Description automatique (adresse, téléphone, horaires).'}
                            chemin={Object.entries(SEO_PAGES).find(([, v]) => v === slug)?.[0] ?? '/'}
                          />
                        </div>
                      );
                    })()}
                  </section>
                )),
              )}

              {!q && historique.length > 0 && (
                <section className="rounded-xl border-2 border-[#D1D5DB] bg-white p-4 md:p-5">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-[#111111]"><History className="h-5 w-5" aria-hidden="true" /> Historique</h2>
                  <ul className="mt-2 divide-y divide-[#EEEEEE]">
                    {historique.map((v) => {
                      const d = differences(normaliserTextes(v.ancienne_valeur), normaliserTextes(v.nouvelle_valeur));
                      return (
                        <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                          <span className="min-w-0">
                            <span className="font-semibold text-[#111111]">{date(v.fait_le)}</span>
                            <span className="text-[#666666]"> · {d.length} texte{d.length > 1 ? 's' : ''}{v.par ? ` · ${v.par}` : ''}</span>
                            <span className="block truncate text-xs text-[#666666]">{d.slice(0, 3).map((x) => x.libelle.split(' › ').pop()).join(', ')}{d.length > 3 ? '…' : ''}</span>
                          </span>
                          <button type="button" disabled={nonEnregistres} title={nonEnregistres ? 'Enregistrez ou annulez d’abord vos modifications' : undefined}
                            onClick={() => setConfirmation({ cible: normaliserTextes(v.ancienne_valeur), titre: 'Revenir aux textes d’avant ?' })}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#D1D5DB] px-3 py-1.5 font-semibold text-[#111111] hover:border-[#111111] disabled:opacity-40">
                            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Revenir à avant
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
            </div>

            {/* Aperçu */}
            <aside className="hidden xl:block xl:sticky xl:top-24 xl:self-start">
              {page.chemin || q ? (
                <ApercuPage chemin={cheminApercu} textes={courants} edition={{ actif, montrer, onClic: allerAuChamp }}
                  legende="Cliquez sur un texte de l’aperçu pour aller à son champ. Les visiteurs verront les changements après « Enregistrer »." />
              ) : (
                <p className="rounded-xl border-2 border-dashed border-[#D1D5DB] p-4 text-sm text-[#666666]">Aperçu des résultats Google sous chaque page, à gauche.</p>
              )}
            </aside>
          </div>
        )}

        {enregistres && vue === 'liste' && page.chemin && (
          <div className="xl:hidden">
            <button type="button" onClick={() => setApercuMobile((a) => !a)} aria-expanded={apercuMobile}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-[#111111] bg-white px-4 py-2.5 text-sm font-semibold text-[#111111]">
              <Eye className="h-4 w-4" aria-hidden="true" /> {apercuMobile ? 'Masquer l’aperçu' : 'Voir l’aperçu de la page'}
            </button>
            {apercuMobile && <div className="mt-3"><ApercuPage chemin={cheminApercu} textes={courants} edition={{ actif, montrer, onClic: allerAuChamp }} /></div>}
          </div>
        )}
      </div>

      {(nonEnregistres || lienInvalide) && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E5E5E5] bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            {lienInvalide ? (
              <p className="text-sm text-red-700" role="alert">Une adresse de lien est invalide : corrigez-la pour enregistrer.</p>
            ) : (
              <p className="text-sm text-[#444444]"><strong className="text-[#111111]">{changements.length} texte{changements.length > 1 ? 's' : ''}</strong> non enregistré{changements.length > 1 ? 's' : ''}</p>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => { setModifs({}); setActif(null); }} className="rounded-xl border border-[#D1D5DB] bg-white px-4 py-2.5 text-sm font-semibold text-[#111111] hover:border-[#111111]">Annuler</button>
              <button type="button" disabled={lienInvalide} onClick={() => setConfirmation({ cible: courants, titre: 'Enregistrer ces textes ?' })}
                className="rounded-xl bg-[#111111] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {confirmation && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="textes-confirm">
          <div className="my-auto w-full max-w-lg shrink-0 overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-[#E5E5E5] px-5 py-4"><h2 id="textes-confirm" className="text-lg font-bold text-[#111111]">{confirmation.titre}</h2></div>
            <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
              {listeConfirmation.length === 0 ? (
                <p className="text-sm text-[#666666]">Aucun changement par rapport aux textes actuels.</p>
              ) : (
                <ul className="space-y-3 text-sm">
                  {listeConfirmation.map((x) => (
                    <li key={x.cle}>
                      <p className="font-semibold text-[#111111]">{x.libelle}</p>
                      <p className="text-[#888888] line-through">{court(x.avant, 160)}</p>
                      <p className="text-[#111111]">{court(x.apres, 160)}</p>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-4 text-xs text-[#666666]">Visible sur le site d’ici une minute. Chaque enregistrement est gardé dans l’historique.</p>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#E5E5E5] bg-[#F9F9F9] px-5 py-3">
              <button type="button" onClick={() => setConfirmation(null)} disabled={envoi} className="rounded-xl border border-[#D1D5DB] bg-white px-4 py-2.5 text-sm font-semibold text-[#111111]">Annuler</button>
              <button type="button" onClick={() => enregistrer(confirmation.cible)} disabled={envoi || listeConfirmation.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-[#111111] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40">
                {envoi && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
