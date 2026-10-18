/**
 * Studio Design — éditeur : 10 couleurs globales, lisibilité (WCAG AA),
 * exceptions par section, style (arrondis, ombres) et états des composants.
 * L'aperçu immédiat à droite suit chaque changement.
 */
import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown, Crosshair, Eye, Pencil, Sparkles, Wand2 } from 'lucide-react';
import {
  controlerTheme, correction, couleursDuTheme, ROLES, SECTIONS, STYLE, variablesDuTheme, variablesSection,
  type CleRole, type CleSection, type ReglageSection, type Resultat, type Section, type ThemeConfig,
} from '../../../config/design';
import { ChampCouleur, PastilleContraste } from './ChampCouleur';
import { STYLE_NIVEAU } from './outils';
import { Miniature } from './Miniature';

export interface Session {
  id: string;
  nom: string;
  predefini: boolean;
  statut: string;
  origineNom: string | null;
  /** Configuration enregistrée (point de départ des ↺) */
  base: ThemeConfig;
  config: ThemeConfig;
}

interface Props {
  session: Session;
  onCouleur: (role: CleRole, hex: string) => void;
  onSection: (cle: CleSection, reglage: ReglageSection, hex: string | null) => void;
  onSectionGlobale: (cle: CleSection) => void;
  onStyle: (cle: (typeof STYLE)[number]['cle'], valeur: string) => void;
  onRenommer: () => void;
  onVoirSurLeSite: (zone: CleSection | null) => void;
}

/** Variable affichée comme valeur héritée d'un réglage de section */
function variableHeritee(s: Section, r: ReglageSection): string {
  if (s.cle === 'boutons') return r === 'texte' ? 'sur-bouton' : 'bleu';
  switch (r) {
    case 'fond': return s.sombre ? 'noir-profond' : ROLES.find((x) => x.cle === s.fond[0])!.variable;
    case 'titres': return s.sombre ? 'inverse' : 'noir';
    case 'texte': return s.sombre ? 'inverse-84' : 'gris-texte';
    case 'accent': return 'or';
    case 'bouton': return 'bleu';
    default: return 'bordure';
  }
}

function Bloc({ titre, sousTitre, children, droite }: { titre: string; sousTitre?: string; children: React.ReactNode; droite?: React.ReactNode }) {
  return (
    <section className="rounded-xl border-2 border-[#D1D5DB] bg-white p-4 md:p-5">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-[#111111]">{titre}</h2>
          {sousTitre && <p className="text-sm text-[#666666]">{sousTitre}</p>}
        </div>
        {droite}
      </div>
      {children}
    </section>
  );
}

export function OngletPersonnaliser({ session, onCouleur, onSection, onSectionGlobale, onStyle, onRenommer, onVoirSurLeSite }: Props) {
  const { config, base } = session;
  const couleurs = couleursDuTheme(config);
  const origine = couleursDuTheme(base);
  const vars = useMemo(() => variablesDuTheme(config), [config]);
  const resultats = useMemo(() => controlerTheme(config, vars), [config, vars]);
  const [ouverte, setOuverte] = useState<CleSection | null>(null);
  const alertes = resultats.filter((r) => r.niveau !== 'ok');

  const parRole = (role: CleRole) => resultats.filter((r) => r.controle.roles.includes(role));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="min-w-0 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-[#D1D5DB] bg-white px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#666666]">Thème en cours de modification</p>
            <p className="truncate text-lg font-bold text-[#111111]">{session.nom}</p>
            {session.origineNom && <p className="text-xs text-[#666666]">Basé sur {session.origineNom}</p>}
          </div>
          {!session.predefini && (
            <button type="button" onClick={onRenommer} className="inline-flex items-center gap-1.5 rounded-xl border border-[#D1D5DB] px-3 py-2 text-sm font-semibold text-[#111111] hover:border-[#111111]">
              <Pencil className="h-4 w-4" aria-hidden="true" /> Renommer
            </button>
          )}
        </div>
        {session.predefini && (
          <p className="flex items-start gap-2 rounded-xl border border-[#D1D5DB] bg-[#F9F9F9] px-4 py-3 text-sm text-[#444444]">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Thème prédéfini : il reste intact. Vos changements seront enregistrés dans une copie à votre nom, que vous pourrez publier.
          </p>
        )}

        <Bloc titre="Couleurs globales" sousTitre="Utilisées sur tout le site, sauf dans les sections personnalisées plus bas.">
          <div className="divide-y divide-[#EEEEEE]">
            {ROLES.map((r) => (
              <ChampCouleur key={r.cle} libelle={r.libelle} aide={r.aide} valeur={couleurs[r.cle]} origine={origine[r.cle]}
                resultats={parRole(r.cle)} onChange={(h) => onCouleur(r.cle, h)} />
            ))}
          </div>
        </Bloc>

        <Bloc titre="Lisibilité" sousTitre="Contrastes vérifiés selon les critères WCAG AA (4,5:1 pour le texte, 3:1 pour les grands textes et les éléments graphiques)."
          droite={alertes.length === 0
            ? <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-900"><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Tout est lisible</span>
            : <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-900"><AlertTriangle className="h-4 w-4" aria-hidden="true" /> {alertes.length} point{alertes.length > 1 ? 's' : ''} à revoir</span>}>
          <ul className="divide-y divide-[#EEEEEE]">
            {resultats.map((r) => (
              <LigneControle key={r.controle.cle} r={r} vars={vars}
                onCorriger={() => { const c = correction(r, couleurs, vars); onCouleur(c.role, c.couleur); }} />
            ))}
          </ul>
        </Bloc>

        <Bloc titre="Sections" sousTitre="Par défaut, chaque section suit les couleurs globales. Personnalisez-en une seule si besoin.">
          <ul className="divide-y divide-[#EEEEEE]">
            {SECTIONS.map((s) => {
              const r = config.sections?.[s.cle] ?? {};
              const n = Object.keys(r).length;
              const ouvert = ouverte === s.cle;
              const zoneVars = { ...vars, ...variablesSection(config, 'boutons', vars), ...variablesSection(config, s.cle, vars) };
              const controles = n ? controlerTheme(config, zoneVars) : [];
              const heritees = { ...vars, ...(s.cle === 'boutons' ? {} : variablesSection(config, 'boutons', vars)) };
              return (
                <li key={s.cle} className="py-1">
                  <button type="button" onClick={() => setOuverte(ouvert ? null : s.cle)} aria-expanded={ouvert}
                    className="flex w-full items-center gap-3 rounded-lg px-1 py-2.5 text-left hover:bg-[#F9F9F9]">
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-[#111111]">{s.libelle}</span>
                      <span className="block text-xs text-[#666666]">{s.aide}</span>
                    </span>
                    {n ? <span className="rounded-full bg-[#111111] px-2 py-0.5 text-xs font-semibold text-white">{n} exception{n > 1 ? 's' : ''}</span>
                      : <span className="text-xs text-[#666666]">Suit le thème global</span>}
                    {n > 0 && <PastilleContraste resultats={controles} compacte />}
                    <ChevronDown className={`h-4 w-4 shrink-0 text-[#666666] transition-transform ${ouvert ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>
                  {ouvert && (
                    <div className="mb-3 rounded-xl bg-[#F9F9F9] px-3 pb-3">
                      <div className="divide-y divide-[#EEEEEE]">
                        {s.reglages.map((g) => (
                          <ChampCouleur key={g.cle} libelle={g.libelle} valeur={r[g.cle]} heritee={heritees[variableHeritee(s, g.cle)]}
                            onChange={(h) => onSection(s.cle, g.cle, h)} onEffacer={() => onSection(s.cle, g.cle, null)} />
                        ))}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button type="button" onClick={() => onVoirSurLeSite(s.cle)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#D1D5DB] bg-white px-3 py-1.5 text-sm font-semibold text-[#111111] hover:border-[#111111]">
                          <Crosshair className="h-4 w-4" aria-hidden="true" /> Repérer sur le site
                        </button>
                        <button type="button" onClick={() => onSectionGlobale(s.cle)} disabled={!n}
                          className="rounded-lg border border-[#D1D5DB] bg-white px-3 py-1.5 text-sm font-semibold text-[#111111] hover:border-[#111111] disabled:opacity-40">
                          Revenir au thème global
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Bloc>

        <Bloc titre="Typographie" sousTitre="Polices gratuites (Google Fonts), chargées seulement si elles sont choisies.">
          <div className="space-y-5 py-1">
            <div className="rounded-xl p-4" style={{ background: vars.fond }}>
              <p style={{ fontFamily: vars['police-titres'], fontWeight: Number(vars['graisse-titres']), textTransform: vars['casse-titres'] as 'none', letterSpacing: vars['espacement-titres'], fontSize: `${28 * Number(vars['echelle-titres'])}px`, lineHeight: 1.1, color: vars.noir, fontSynthesisWeight: 'none' }}>
                Bienvenue chez SVM Ride
              </p>
              <p className="mt-2 text-[15px]" style={{ fontFamily: vars['police-texte'], color: vars['gris-texte'] }}>
                Votre spécialiste du deux-roues basé en Île-de-France : motos et scooters d'occasion contrôlés, reprise et financement.
              </p>
            </div>
            {STYLE.filter((g) => g.cle === 'police_titres' || g.cle === 'police_texte').map((g) => {
              const actuel = config.style?.[g.cle] ?? g.defaut;
              const variable = g.cle === 'police_titres' ? 'police-titres' : 'police-texte';
              return (
                <fieldset key={g.cle}>
                  <legend className="mb-2 text-sm font-semibold text-[#111111]">{g.libelle}</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {g.options.map((o) => {
                      const choisi = actuel === o.cle;
                      return (
                        <label key={o.cle} className={`cursor-pointer rounded-xl border-2 px-3 py-2.5 transition-colors ${choisi ? 'border-[#111111] bg-[#F9F9F9]' : 'border-[#D1D5DB] bg-white hover:border-[#111111]'}`}>
                          <input type="radio" name={g.cle} value={o.cle} checked={choisi} onChange={() => onStyle(g.cle, o.cle)} className="sr-only" />
                          <span className="block text-lg leading-tight text-[#111111]" style={{ fontFamily: o.variables({})[variable], fontWeight: g.cle === 'police_titres' ? 600 : 400 }}>
                            {g.cle === 'police_titres' ? 'Derniers arrivages' : 'Moto contrôlée et garantie'}
                          </span>
                          <span className="mt-1 flex items-center justify-between gap-2 text-xs text-[#666666]">
                            <span><strong className="text-[#111111]">{o.libelle}</strong> · {o.aide}</span>
                            {choisi && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#111111]" aria-hidden="true" />}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              );
            })}
            <ChoixPastilles reglages={STYLE.filter((g) => g.groupe === 'typographie' && g.cle !== 'police_titres' && g.cle !== 'police_texte')} config={config} onStyle={onStyle} />
          </div>
        </Bloc>

        <Bloc titre="Formes" sousTitre="Arrondis et profondeur des éléments.">
          <div className="space-y-4 py-1">
            <ChoixPastilles reglages={STYLE.filter((g) => g.groupe === 'formes')} config={config} onStyle={onStyle} />
            <div className="rounded-xl border border-dashed border-[#D1D5DB] px-3 py-2 text-xs text-[#666666]">
              Bientôt : espacements et animations.
            </div>
          </div>
        </Bloc>

        <Bloc titre="États des boutons, liens et champs" sousTitre="Au repos, au survol, sélectionné au clavier et désactivé, sur fond clair et sur fond sombre.">
          <EtatsComposants vars={{ ...vars, ...variablesSection(config, 'boutons', vars) }} />
        </Bloc>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="space-y-3 rounded-xl border-2 border-[#D1D5DB] bg-white p-3 lg:max-h-[calc(100vh-12.5rem)] lg:overflow-y-auto">
          <p className="text-sm font-semibold text-[#111111]">Aperçu immédiat</p>
          <Miniature config={config} className="rounded-lg border border-[#E5E5E5]" />
          <button type="button" onClick={() => onVoirSurLeSite(null)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#111111] bg-white px-4 py-2.5 text-sm font-semibold text-[#111111] hover:bg-[#F5F5F5]">
            <Eye className="h-4 w-4" aria-hidden="true" /> Voir sur le vrai site
          </button>
        </div>
      </aside>
    </div>
  );
}

function ChoixPastilles({ reglages, config, onStyle }: { reglages: typeof STYLE; config: ThemeConfig; onStyle: Props['onStyle'] }) {
  return (
    <>
      {reglages.map((g) => {
        const actuel = config.style?.[g.cle] ?? g.defaut;
        return (
          <fieldset key={g.cle}>
            <legend className="mb-2 text-sm font-semibold text-[#111111]">{g.libelle}</legend>
            <div className="flex flex-wrap gap-2">
              {g.options.map((o) => (
                <label key={o.cle} className={`cursor-pointer rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-colors ${actuel === o.cle ? 'border-[#111111] bg-[#111111] text-white' : 'border-[#D1D5DB] bg-white text-[#111111] hover:border-[#111111]'}`}>
                  <input type="radio" name={g.cle} value={o.cle} checked={actuel === o.cle} onChange={() => onStyle(g.cle, o.cle)} className="sr-only" />
                  {o.libelle}
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}
    </>
  );
}

function LigneControle({ r, vars, onCorriger }: { r: Resultat; vars: Record<string, string>; onCorriger: () => void }) {
  const s = STYLE_NIVEAU[r.niveau];
  return (
    <li className="flex flex-wrap items-center gap-3 py-2">
      <span className="flex h-8 w-14 shrink-0 items-center justify-center rounded-md border border-[#E5E5E5] text-sm font-bold"
        style={{ background: vars[r.controle.fond], color: vars[r.controle.avant] }} aria-hidden="true">Aa</span>
      <span className="min-w-0 flex-1 text-sm text-[#111111]">{r.controle.libelle}</span>
      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${s.classe}`}>
        {s.libelle} · {r.ratio.toFixed(1).replace('.', ',')}:1
      </span>
      {r.niveau !== 'ok' && (
        <button type="button" onClick={onCorriger} className="inline-flex items-center gap-1 rounded-lg bg-[#111111] px-2.5 py-1 text-xs font-semibold text-white">
          <Wand2 className="h-3.5 w-3.5" aria-hidden="true" /> Corriger
        </button>
      )}
    </li>
  );
}

/** Planche des états : couleurs réelles du thème, rendus statiques */
function EtatsComposants({ vars: v }: { vars: Record<string, string> }) {
  const bouton = (etat: 'repos' | 'survol' | 'focus' | 'desactive', fond: string) => (
    <span key={etat} className="inline-flex flex-col items-center gap-1">
      <span
        style={{
          background: etat === 'survol' ? v['bleu-hover'] : v.bleu,
          color: v['sur-bouton'],
          borderRadius: `min(${v['rayon-bouton']}, 99px)`,
          boxShadow: etat === 'desactive' ? 'none' : etat === 'survol' ? v['ombre-bleu-fort'] : v['ombre-bleu'],
          outline: etat === 'focus' ? `2px solid ${v['bleu-vif']}` : 'none',
          outlineOffset: 2,
          opacity: etat === 'desactive' ? 0.5 : 1,
        }}
        className="px-3 py-1.5 text-xs font-semibold"
      >
        Bouton
      </span>
      <span className="text-[10px]" style={{ color: fond === 'sombre' ? v['inverse-74'] : v['doux-64'] }}>
        {{ repos: 'Repos', survol: 'Survol', focus: 'Clavier', desactive: 'Désactivé' }[etat]}
      </span>
    </span>
  );
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-3 rounded-xl p-4" style={{ background: v.fond }}>
        <div className="flex flex-wrap gap-3">{(['repos', 'survol', 'focus', 'desactive'] as const).map((e) => bouton(e, 'clair'))}</div>
        <p className="text-xs" style={{ color: v['gris-texte'] }}>
          Un <span style={{ color: v.lien, fontWeight: 600 }}>lien</span> et au survol{' '}
          <span style={{ color: v.lien, fontWeight: 600, textDecoration: 'underline', textDecorationThickness: 2 }}>souligné</span>.
        </p>
        <div className="grid gap-2">
          <span className="rounded-lg px-2 py-1.5 text-xs" style={{ background: v.surface, border: `1.5px solid ${v.champ}`, color: v['doux-58'] }}>Champ au repos</span>
          <span className="rounded-lg px-2 py-1.5 text-xs" style={{ background: v.surface, border: `1.5px solid ${v.lien}`, boxShadow: `0 0 0 4px rgb(${v['lien-rgb']} / 0.15)`, color: v.noir }}>Champ sélectionné</span>
        </div>
      </div>
      <div className="space-y-3 rounded-xl p-4" style={{ background: v['noir-profond'] }}>
        <div className="flex flex-wrap gap-3">{(['repos', 'survol', 'focus', 'desactive'] as const).map((e) => bouton(e, 'sombre'))}</div>
        <p className="text-xs" style={{ color: v['inverse-84'] }}>
          Texte sur fond sombre et <span style={{ color: v['or-clair'], fontWeight: 600 }}>détail</span>.
        </p>
        <span className="inline-block rounded-xl px-3 py-1.5 text-xs font-semibold" style={{ background: v.surface, color: v.noir, border: `2px solid ${v.or}`, borderRadius: `min(${v['rayon-bouton']}, 99px)` }}>
          Bouton secondaire
        </span>
      </div>
    </div>
  );
}
