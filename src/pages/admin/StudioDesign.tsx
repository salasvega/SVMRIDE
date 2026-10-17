/**
 * Admin — Studio Design : identité visuelle du site public.
 *
 * Mes thèmes (bibliothèque), Personnaliser (couleurs, sections, style,
 * lisibilité), Aperçu du site (vrai site dans un cadre, rien n'est publié) et
 * Historique (versions publiées, restauration).
 * Rien ne change pour les visiteurs avant « Publier le thème ».
 * Données : src/lib/studioDesign.ts ; règles : src/config/design.ts.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, History, LayoutGrid, Loader2, MonitorSmartphone, Palette as IconePalette, Rocket, SlidersHorizontal, X } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  controlerTheme, couleursDuTheme, deriveesPour, STYLE, themeComplet,
  type CleRole, type CleSection, type ReglageSection, type ThemeConfig,
} from '../../config/design';
import {
  chargerStudio, creerTheme, messageErreur, modifierTheme, publierTheme, restaurerVersion, supprimerTheme,
  type Publication, type ThemeEnLigne, type ThemeLigne,
} from '../../lib/studioDesign';
import { appliquerThemePublie } from '../../lib/theme';
import { OngletThemes, Statut } from '../../components/admin/studio/OngletThemes';
import { OngletPersonnaliser, type Session } from '../../components/admin/studio/OngletPersonnaliser';
import { OngletApercu } from '../../components/admin/studio/OngletApercu';
import { OngletHistorique } from '../../components/admin/studio/OngletHistorique';
import { STYLE_NIVEAU } from '../../components/admin/studio/outils';

type Onglet = 'themes' | 'personnaliser' | 'apercu' | 'historique';
const ONGLETS: { cle: Onglet; libelle: string; court: string; icone: typeof LayoutGrid }[] = [
  { cle: 'themes', libelle: 'Mes thèmes', court: 'Thèmes', icone: LayoutGrid },
  { cle: 'personnaliser', libelle: 'Personnaliser', court: 'Personnaliser', icone: SlidersHorizontal },
  { cle: 'apercu', libelle: 'Aperçu du site', court: 'Aperçu', icone: MonitorSmartphone },
  { cle: 'historique', libelle: 'Historique', court: 'Historique', icone: History },
];

const complet = themeComplet;
const empreinte = (t: ThemeConfig) => JSON.stringify(complet(t));

type Modale =
  | { type: 'publier'; id: string; nom: string; config: ThemeConfig }
  | { type: 'restaurer'; p: Publication }
  | { type: 'supprimer'; t: ThemeLigne }
  | { type: 'renommer'; t: { id: string; nom: string; description: string } }
  | { type: 'nouveau' }
  | { type: 'quitter'; suite: () => void };

interface Apercu {
  config: ThemeConfig;
  titre: string;
  action: { type: 'theme'; t: ThemeLigne } | { type: 'version'; p: Publication } | null;
}

function Fenetre({ titre, children, actions, onFermer }: { titre: string; children: React.ReactNode; actions: React.ReactNode; onFermer: () => void }) {
  useEffect(() => {
    const echap = (e: KeyboardEvent) => e.key === 'Escape' && onFermer();
    window.addEventListener('keydown', echap);
    return () => window.removeEventListener('keydown', echap);
  }, [onFermer]);
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="studio-modale">
      <div className="my-auto w-full max-w-lg shrink-0 overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-[#E5E5E5] px-5 py-4">
          <h2 id="studio-modale" className="text-lg font-bold text-[#111111]">{titre}</h2>
          <button type="button" onClick={onFermer} aria-label="Fermer" className="rounded-lg p-1 text-[#666666] hover:bg-[#F5F5F5]"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3 px-5 py-4 text-sm text-[#444444]">{children}</div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-[#E5E5E5] bg-[#F9F9F9] px-5 py-3">{actions}</div>
      </div>
    </div>
  );
}

const btnSecondaire = 'rounded-xl border border-[#D1D5DB] bg-white px-4 py-2.5 text-sm font-semibold text-[#111111] hover:border-[#111111] disabled:opacity-40';
const btnPrincipal = 'inline-flex items-center gap-2 rounded-xl bg-[#111111] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40';

export function StudioDesign() {
  const [params, setParams] = useSearchParams();
  const onglet = (ONGLETS.some((o) => o.cle === params.get('onglet')) ? params.get('onglet') : 'themes') as Onglet;
  const [themes, setThemes] = useState<ThemeLigne[] | null>(null);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [enLigne, setEnLigne] = useState<ThemeEnLigne | null>(null);
  const [erreur, setErreur] = useState('');
  const [message, setMessage] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [apercu, setApercu] = useState<Apercu | null>(null);
  const [zone, setZone] = useState<CleSection | null>(null);
  const [modale, setModale] = useState<Modale | null>(null);
  const [occupe, setOccupe] = useState(false);

  const allerA = useCallback((o: Onglet) => {
    setParams((p) => { const n = new URLSearchParams(p); n.set('onglet', o); return n; }, { replace: true });
    window.scrollTo({ top: 0 });
  }, [setParams]);

  const charger = useCallback(async () => {
    try {
      const d = await chargerStudio();
      setThemes(d.themes);
      setPublications(d.publications);
      setEnLigne(d.enLigne);
      setErreur('');
      return d;
    } catch {
      setErreur('Impossible de charger le Studio Design. Vérifiez que vous êtes connecté avec un compte administrateur.');
      return null;
    }
  }, []);
  useEffect(() => { charger(); }, [charger]);

  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => setMessage(''), 7000);
    return () => window.clearTimeout(t);
  }, [message]);

  const modifie = !!session && empreinte(session.config) !== empreinte(session.base);
  useEffect(() => {
    if (!modifie) return;
    const avertir = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', avertir);
    return () => window.removeEventListener('beforeunload', avertir);
  }, [modifie]);

  const actifId = enLigne?.theme_id ?? null;

  const ouvrir = useCallback((t: ThemeLigne) => {
    const base = complet(t.config);
    setSession({ id: t.id, nom: t.nom, predefini: t.predefini, statut: t.statut, origineNom: t.origine_id ? themes?.find((x) => x.id === t.origine_id)?.nom ?? null : null, base, config: base });
    setApercu(null);
    allerA('personnaliser');
  }, [themes, allerA]);

  /** Change de thème en cours, après confirmation s'il reste des modifications */
  const ouvrirAvecGarde = (t: ThemeLigne) => {
    if (modifie && session?.id !== t.id) setModale({ type: 'quitter', suite: () => ouvrir(t) });
    else if (session?.id === t.id) allerA('personnaliser');
    else ouvrir(t);
  };

  // Onglet Personnaliser sans thème ouvert : le thème actif
  useEffect(() => {
    if (onglet !== 'personnaliser' || session || !themes?.length) return;
    ouvrir(themes.find((t) => t.id === actifId) ?? themes[0]);
  }, [onglet, session, themes, actifId, ouvrir]);

  const majConfig = (f: (c: ThemeConfig) => ThemeConfig) => setSession((s) => (s ? { ...s, config: f(s.config) } : s));
  const onCouleur = (role: CleRole, hex: string) =>
    setSession((s) => {
      if (!s) return s;
      const couleurs = { ...couleursDuTheme(s.config), [role]: hex };
      return { ...s, config: { ...s.config, couleurs, derivees: deriveesPour(couleurs, s.base) } };
    });
  const onSection = (cle: CleSection, reglage: ReglageSection, hex: string | null) =>
    majConfig((c) => {
      const r = { ...(c.sections?.[cle] ?? {}) };
      if (hex) r[reglage] = hex;
      else delete r[reglage];
      return { ...c, sections: { ...c.sections, [cle]: r } };
    });
  const onSectionGlobale = (cle: CleSection) =>
    majConfig((c) => { const sections = { ...c.sections }; delete sections[cle]; return { ...c, sections }; });
  const onStyle = (cle: (typeof STYLE)[number]['cle'], valeur: string) => majConfig((c) => ({ ...c, style: { ...c.style, [cle]: valeur } }));

  /** Enregistre le thème en cours (copie s'il est prédéfini) et renvoie son identifiant */
  const enregistrer = async (): Promise<string | null> => {
    if (!session || !themes) return null;
    setOccupe(true);
    try {
      const config = complet(session.config);
      let ligne: ThemeLigne;
      if (session.predefini) {
        let nom = `${session.nom} – personnalisé`;
        for (let i = 2; themes.some((t) => t.nom === nom); i++) nom = `${session.nom} – personnalisé ${i}`;
        ligne = await creerTheme({ nom, description: `Créé à partir de ${session.nom}.`, config, statut: 'brouillon', origine_id: session.id });
      } else {
        ligne = await modifierTheme(session.id, { config, statut: 'brouillon' });
      }
      setSession({ id: ligne.id, nom: ligne.nom, predefini: false, statut: ligne.statut, origineNom: session.predefini ? session.nom : session.origineNom, base: config, config });
      await charger();
      setMessage(session.predefini ? `Vos changements sont enregistrés dans « ${ligne.nom} ».` : 'Brouillon enregistré.');
      return ligne.id;
    } catch (e) {
      setErreur(messageErreur(e, "L'enregistrement a échoué. Réessayez."));
      return null;
    } finally {
      setOccupe(false);
    }
  };

  const publierSession = async () => {
    if (!session) return;
    const id = modifie ? await enregistrer() : session.id;
    if (id) setModale({ type: 'publier', id, nom: modifie && session.predefini ? `${session.nom} – personnalisé` : session.nom, config: complet(session.config) });
  };

  const executer = async (action: () => Promise<void>, echec: string) => {
    setOccupe(true);
    try {
      await action();
      setModale(null);
    } catch (e) {
      setErreur(messageErreur(e, echec));
      setModale(null);
    } finally {
      setOccupe(false);
    }
  };

  const ouvrirApercu = (a: Apercu) => {
    setApercu(a);
    setZone(null);
    allerA('apercu');
  };

  const cibleApercu: Apercu | null = apercu ?? (session
    ? { config: session.config, titre: `${session.nom}${modifie ? ' (modifications non enregistrées)' : ''}`, action: null }
    : enLigne ? { config: enLigne.config, titre: enLigne.nom, action: null } : null);

  const publierDepuisApercu = () => {
    const a = cibleApercu?.action;
    if (!a) publierSession();
    else if (a.type === 'theme') setModale({ type: 'publier', id: a.t.id, nom: a.t.nom, config: a.t.config });
    else setModale({ type: 'restaurer', p: a.p });
  };
  const apercuPubliable = cibleApercu?.action?.type === 'version'
    ? cibleApercu.action.p.version !== enLigne?.version
    : cibleApercu?.action?.type === 'theme' ? cibleApercu.action.t.id !== actifId : !!session && (modifie || session.id !== actifId);

  return (
    <AdminLayout>
      <div className={`space-y-6 ${onglet === 'personnaliser' && session ? 'pb-28' : 'pb-10'}`}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-[#111111]">
              <IconePalette className="h-7 w-7" aria-hidden="true" /> Studio Design
            </h1>
            <p className="mt-1 max-w-3xl text-[#666666]">
              Couleurs et style du site. Essayez un thème, ajustez-le et prévisualisez-le : rien ne change pour les visiteurs avant « Publier le thème ».
            </p>
          </div>
          {enLigne && (
            <p className="rounded-xl border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#444444]">
              En ligne : <strong className="text-[#111111]">{enLigne.nom}</strong> <span className="text-[#888888]">· V{enLigne.version}</span>
            </p>
          )}
        </div>

        <nav className="-mx-1 flex gap-1 overflow-x-auto border-b-2 border-[#E5E5E5] px-1" role="tablist" aria-label="Studio Design">
          {ONGLETS.map((o) => (
            <button key={o.cle} type="button" role="tab" aria-selected={onglet === o.cle}
              onClick={() => { if (o.cle === 'apercu') { setApercu(null); setZone(null); } allerA(o.cle); }}
              className={`-mb-0.5 inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${onglet === o.cle ? 'border-[#B8902F] text-[#111111]' : 'border-transparent text-[#666666] hover:text-[#111111]'}`}>
              <o.icone className="h-4 w-4" aria-hidden="true" /> <span className="hidden sm:inline">{o.libelle}</span><span className="sm:hidden">{o.court}</span>
              {o.cle === 'personnaliser' && modifie && <span className="h-2 w-2 rounded-full bg-amber-500" aria-label="modifications non enregistrées" />}
            </button>
          ))}
        </nav>

        {erreur && (
          <p className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {erreur}
            <button type="button" onClick={() => setErreur('')} aria-label="Fermer"><X className="h-4 w-4" /></button>
          </p>
        )}

        {!themes ? (
          !erreur && <p className="flex items-center gap-2 text-[#666666]"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Chargement…</p>
        ) : onglet === 'themes' ? (
          <OngletThemes themes={themes} actifId={actifId} a={{
            onPrevisualiser: (t) => ouvrirApercu({ config: t.config, titre: t.nom, action: { type: 'theme', t } }),
            onUtiliser: ouvrirAvecGarde,
            onPublier: (t) => setModale({ type: 'publier', id: t.id, nom: t.nom, config: t.config }),
            onDupliquer: (t) => executer(async () => {
              const n = await creerTheme({ nom: `Copie de ${t.nom}`.slice(0, 60), description: t.description, config: complet(t.config), statut: 'enregistre', origine_id: t.id });
              await charger();
              setMessage(`« ${n.nom} » a été ajouté à la bibliothèque.`);
            }, 'La copie a échoué.'),
            onRenommer: (t) => setModale({ type: 'renommer', t }),
            onStatut: (t, statut) => executer(async () => {
              await modifierTheme(t.id, { statut });
              if (session?.id === t.id) setSession({ ...session, statut });
              await charger();
              setMessage(statut === 'archive' ? `« ${t.nom} » est archivé.` : `« ${t.nom} » est dans la bibliothèque.`);
            }, 'Le changement a échoué.'),
            onSupprimer: (t) => setModale({ type: 'supprimer', t }),
            onNouveau: () => setModale({ type: 'nouveau' }),
          }} />
        ) : onglet === 'personnaliser' ? (
          session ? (
            <OngletPersonnaliser session={session} onCouleur={onCouleur} onSection={onSection} onSectionGlobale={onSectionGlobale} onStyle={onStyle}
              onRenommer={() => setModale({ type: 'renommer', t: { id: session.id, nom: session.nom, description: themes.find((t) => t.id === session.id)?.description ?? '' } })}
              onVoirSurLeSite={(z) => { setApercu(null); setZone(z); allerA('apercu'); }} />
          ) : null
        ) : onglet === 'apercu' ? (
          cibleApercu && (
            <OngletApercu config={cibleApercu.config} titre={cibleApercu.titre} enLigne={enLigne?.config ?? null} zone={zone}
              onPublier={publierDepuisApercu} publiable={apercuPubliable} />
          )
        ) : (
          <OngletHistorique publications={publications} versionEnLigne={enLigne?.version ?? null}
            onPrevisualiser={(p) => ouvrirApercu({ config: p.config, titre: `V${p.version} · ${p.theme_nom}`, action: { type: 'version', p } })}
            onRestaurer={(p) => setModale({ type: 'restaurer', p })} />
        )}
      </div>

      {onglet === 'personnaliser' && session && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E5E5E5] bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-6 lg:px-8">
            <p className="hidden min-w-0 items-center gap-2 text-sm text-[#444444] sm:flex">
              <Statut actif={session.id === actifId && !modifie} statut={modifie ? 'brouillon' : (session.statut as ThemeLigne['statut'])} predefini={session.predefini} />
              <span className="truncate">{modifie ? <strong className="text-[#111111]">Modifications non enregistrées</strong> : session.nom}</span>
            </p>
            <div className="flex flex-1 justify-end gap-2 sm:flex-none">
              {modifie && (
                <button type="button" onClick={() => setSession({ ...session, config: session.base })} className={`${btnSecondaire} px-3 sm:px-4`} disabled={occupe}>Annuler</button>
              )}
              <button type="button" onClick={enregistrer} disabled={!modifie || occupe} className={`${btnSecondaire} px-3 sm:px-4 ${modifie ? '' : 'hidden sm:block'}`}>
                Enregistrer<span className="hidden sm:inline"> le brouillon</span>
              </button>
              <button type="button" onClick={publierSession} disabled={occupe || (!modifie && session.id === actifId)} className={`${btnPrincipal} px-3 sm:px-5`}>
                {occupe ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Rocket className="h-4 w-4" aria-hidden="true" />} Publier<span className="hidden sm:inline"> le thème</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className="fixed left-1/2 top-20 z-[60] w-[min(92vw,520px)] -translate-x-1/2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900 shadow-lg" role="status">
          {message}
        </div>
      )}

      {modale && (
        <Modales modale={modale} occupe={occupe} enLigne={enLigne} themes={themes ?? []} actifId={actifId}
          onFermer={() => !occupe && setModale(null)}
          onPublier={(m) => executer(async () => {
            const v = await publierTheme(m.id);
            appliquerThemePublie(m.config);
            await charger();
            if (session?.id === m.id) setSession((s) => (s ? { ...s, statut: 'enregistre' } : s));
            setMessage(`« ${m.nom} » est publié (V${v}). Il apparaît sur tout le site d'ici une minute.`);
          }, 'La publication a échoué.')}
          onRestaurer={(p) => executer(async () => {
            const v = await restaurerVersion(p.version);
            appliquerThemePublie(p.config);
            await charger();
            setMessage(`La V${p.version} (« ${p.theme_nom} ») est de nouveau en ligne (V${v}).`);
          }, 'La restauration a échoué.')}
          onSupprimer={(t) => executer(async () => {
            await supprimerTheme(t.id);
            if (session?.id === t.id) setSession(null);
            await charger();
            setMessage(`« ${t.nom} » est supprimé.`);
          }, 'La suppression a échoué.')}
          onRenommer={(id, nom, description) => executer(async () => {
            await modifierTheme(id, { nom, description });
            if (session?.id === id) setSession({ ...session, nom });
            await charger();
            setMessage('Nom enregistré.');
          }, 'Ce nom n’a pas pu être enregistré.')}
          onNouveau={(nom, base) => executer(async () => {
            const t = await creerTheme({ nom, description: `Créé à partir de ${base.nom}.`, config: complet(base.config), statut: 'brouillon', origine_id: base.id });
            const d = await charger();
            const ligne = d?.themes.find((x) => x.id === t.id) ?? t;
            const cfg = complet(ligne.config);
            setSession({ id: ligne.id, nom: ligne.nom, predefini: false, statut: ligne.statut, origineNom: base.nom, base: cfg, config: cfg });
            allerA('personnaliser');
            setMessage(`« ${nom} » est créé : personnalisez-le.`);
          }, 'La création a échoué.')}
          onQuitter={(m) => { setModale(null); m.suite(); }}
        />
      )}
    </AdminLayout>
  );
}

function Modales({ modale, occupe, enLigne, themes, actifId, onFermer, onPublier, onRestaurer, onSupprimer, onRenommer, onNouveau, onQuitter }: {
  modale: Modale;
  occupe: boolean;
  enLigne: ThemeEnLigne | null;
  themes: ThemeLigne[];
  actifId: string | null;
  onFermer: () => void;
  onPublier: (m: Extract<Modale, { type: 'publier' }>) => void;
  onRestaurer: (p: Publication) => void;
  onSupprimer: (t: ThemeLigne) => void;
  onRenommer: (id: string, nom: string, description: string) => void;
  onNouveau: (nom: string, base: ThemeLigne) => void;
  onQuitter: (m: Extract<Modale, { type: 'quitter' }>) => void;
}) {
  const [accord, setAccord] = useState(false);
  const [nom, setNom] = useState(modale.type === 'renommer' ? modale.t.nom : '');
  const [description, setDescription] = useState(modale.type === 'renommer' ? modale.t.description : '');
  const [baseId, setBaseId] = useState(actifId ?? themes[0]?.id ?? '');
  const resultats = useMemo(() => (modale.type === 'publier' ? controlerTheme(modale.config) : []), [modale]);
  const charge = occupe ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null;

  switch (modale.type) {
    case 'publier': {
      const ko = resultats.filter((r) => r.niveau === 'ko');
      const grand = resultats.filter((r) => r.niveau === 'grand');
      return (
        <Fenetre titre={`Publier « ${modale.nom} » ?`} onFermer={onFermer} actions={<>
          <button type="button" onClick={onFermer} className={btnSecondaire} disabled={occupe}>Annuler</button>
          <button type="button" onClick={() => onPublier(modale)} className={btnPrincipal} disabled={occupe || (ko.length > 0 && !accord)}>{charge ?? <Rocket className="h-4 w-4" aria-hidden="true" />} Publier le thème</button>
        </>}>
          <p>
            Il remplacera <strong className="text-[#111111]">{enLigne?.nom ?? 'le thème actuel'}</strong> sur tout le site public et sera visible par les visiteurs d'ici une minute.
            L'administration ne change pas. Vous pourrez revenir en arrière depuis l'Historique.
          </p>
          {ko.length === 0 && grand.length === 0 ? (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-green-900">Lisibilité : tous les contrôles sont réussis.</p>
          ) : (
            <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
              <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" aria-hidden="true" /> Lisibilité à vérifier</p>
              <ul className="space-y-1">
                {[...ko, ...grand].map((r) => (
                  <li key={r.controle.cle}>{r.controle.libelle} : {STYLE_NIVEAU[r.niveau].libelle.toLowerCase()} ({r.ratio.toFixed(1).replace('.', ',')}:1)</li>
                ))}
              </ul>
              {ko.length > 0 && (
                <label className="flex items-start gap-2 pt-1 font-medium">
                  <input type="checkbox" checked={accord} onChange={(e) => setAccord(e.target.checked)} className="mt-0.5" />
                  Je publie malgré les textes difficiles à lire
                </label>
              )}
            </div>
          )}
        </Fenetre>
      );
    }
    case 'restaurer': {
      const p = modale.p;
      return (
        <Fenetre titre={`Restaurer la V${p.version} ?`} onFermer={onFermer} actions={<>
          <button type="button" onClick={onFermer} className={btnSecondaire} disabled={occupe}>Annuler</button>
          <button type="button" onClick={() => onRestaurer(p)} className={btnPrincipal} disabled={occupe}>{charge} Restaurer cette version</button>
        </>}>
          <p>
            Le site reprendra les couleurs de « <strong className="text-[#111111]">{p.theme_nom}</strong> » telles que publiées le{' '}
            {new Date(p.publie_le).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}, d'ici une minute.
          </p>
          <p>Cette restauration sera ajoutée à l'historique. La bibliothèque de thèmes ne change pas.</p>
        </Fenetre>
      );
    }
    case 'supprimer':
      return (
        <Fenetre titre={`Supprimer « ${modale.t.nom} » ?`} onFermer={onFermer} actions={<>
          <button type="button" onClick={onFermer} className={btnSecondaire} disabled={occupe}>Annuler</button>
          <button type="button" onClick={() => onSupprimer(modale.t)} className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-5 py-2.5 text-sm font-semibold text-white" disabled={occupe}>{charge} Supprimer</button>
        </>}>
          <p>Le thème est retiré de la bibliothèque. Les versions déjà publiées restent dans l'historique et peuvent toujours être restaurées.</p>
        </Fenetre>
      );
    case 'renommer': {
      const ok = nom.trim().length >= 1 && nom.trim().length <= 60 && description.length <= 300;
      return (
        <Fenetre titre="Renommer le thème" onFermer={onFermer} actions={<>
          <button type="button" onClick={onFermer} className={btnSecondaire} disabled={occupe}>Annuler</button>
          <button type="button" onClick={() => onRenommer(modale.t.id, nom.trim(), description.trim())} className={btnPrincipal} disabled={occupe || !ok}>{charge} Enregistrer</button>
        </>}>
          <label className="block font-medium text-[#111111]">Nom
            <input value={nom} onChange={(e) => setNom(e.target.value)} maxLength={60} autoFocus className="mt-1 w-full rounded-xl border-2 border-[#D1D5DB] px-3 py-2 text-[#111111] focus:border-[#111111] focus:outline-none" />
          </label>
          <label className="block font-medium text-[#111111]">Description (facultatif)
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} rows={3} className="mt-1 w-full rounded-xl border-2 border-[#D1D5DB] px-3 py-2 text-[#111111] focus:border-[#111111] focus:outline-none" />
          </label>
        </Fenetre>
      );
    }
    case 'nouveau': {
      const base = themes.find((t) => t.id === baseId);
      const ok = nom.trim().length >= 1 && nom.trim().length <= 60 && !!base;
      return (
        <Fenetre titre="Nouveau thème" onFermer={onFermer} actions={<>
          <button type="button" onClick={onFermer} className={btnSecondaire} disabled={occupe}>Annuler</button>
          <button type="button" onClick={() => base && onNouveau(nom.trim(), base)} className={btnPrincipal} disabled={occupe || !ok}>{charge} Créer et personnaliser</button>
        </>}>
          <label className="block font-medium text-[#111111]">Nom du thème
            <input value={nom} onChange={(e) => setNom(e.target.value)} maxLength={60} autoFocus placeholder="Ex. Salon de la moto 2027" className="mt-1 w-full rounded-xl border-2 border-[#D1D5DB] px-3 py-2 text-[#111111] focus:border-[#111111] focus:outline-none" />
          </label>
          <label className="block font-medium text-[#111111]">Point de départ
            <select value={baseId} onChange={(e) => setBaseId(e.target.value)} className="mt-1 w-full rounded-xl border-2 border-[#D1D5DB] bg-white px-3 py-2 text-[#111111]">
              {themes.filter((t) => t.statut !== 'archive').map((t) => (
                <option key={t.id} value={t.id}>{t.nom}{t.id === actifId ? ' (actif)' : ''}</option>
              ))}
            </select>
          </label>
        </Fenetre>
      );
    }
    case 'quitter':
      return (
        <Fenetre titre="Modifications non enregistrées" onFermer={onFermer} actions={<>
          <button type="button" onClick={onFermer} className={btnSecondaire}>Continuer la modification</button>
          <button type="button" onClick={() => onQuitter(modale)} className={btnPrincipal}>Abandonner les modifications</button>
        </>}>
          <p>Le thème en cours a des changements non enregistrés. Ils seront perdus si vous ouvrez un autre thème.</p>
        </Fenetre>
      );
  }
}
