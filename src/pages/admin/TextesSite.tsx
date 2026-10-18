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
import { ArrowDown, ArrowUp, Eye, History, List, Loader2, MousePointerClick, Plus, RotateCcw, Search, Trash2, Type, X } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { ApercuPage } from '../../components/admin/ApercuPage';
import { supabase } from '../../lib/supabase';
import { appliquerTextes } from '../../lib/textes';
import { CLE_TEXTES, lireNombre, normaliserTextes, PAGES_TEXTES, SEO_PAGES, texte, TEXTES, type DefTexte, type PageTextes, type Textes } from '../../config/textes';
import {
  cleElement, cleIcone, cleOrdre, elementDeCle, LISTES, LISTES_PAR_ID, lireOrdre, NOMS_ICONES, nouvelId, type ListeDef,
} from '../../config/textes-listes';
import { ICONES, NOMS_FR } from '../../config/icones';
import { cleMasquee, sectionMasquable, SECTIONS_MASQUABLES } from '../../config/textes-sections';
import type { ActionListe } from '../../lib/edition';

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
/** Définition d'un texte, y compris ceux des éléments ajoutés aux listes */
function defDe(cle: string): DefTexte | undefined {
  if (TEXTES[cle]) return TEXTES[cle];
  const e = elementDeCle(cle);
  return e ? { cle, libelle: e.champ.libelle, defaut: e.champ.nouveau, type: e.champ.type, max: e.champ.max } : undefined;
}
/** Page et section d'un texte (éléments ajoutés : ceux de leur liste) */
function ouDe(cle: string): { page: PageTextes; section: string } | undefined {
  if (OU[cle]) return OU[cle];
  const e = elementDeCle(cle) ?? (() => {
    const l = LISTES.find((x) => cle.startsWith(`${x.id}.`));
    return l ? { liste: l } : null;
  })();
  const page = e && PAGES.find((p) => p.cle === e.liste.page);
  return page && e ? { page, section: e.liste.section } : undefined;
}
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const pluriel = (l: ListeDef) => (l.element.endsWith('s') ? l.element : `${l.element}s`);
/** Liste modulable d'une section du registre */
const listeDe = (page: string, section: string) => LISTES.find((l) => l.page === page && l.section === section);

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
    .filter((k) => afficher(a, k) !== afficher(b, k))
    .map((k) => ({ cle: k, libelle: libelleComplet(k), avant: afficher(a, k), apres: afficher(b, k) }))
    .filter((d) => d.avant !== d.apres);
}

/** Valeur lisible d'une clé : texte, liste des éléments (ordre) ou nom d'icône */
function afficher(t: Textes, cle: string): string {
  const l = LISTES.find((x) => cle === cleOrdre(x));
  if (l) {
    const ids = lireOrdre(l, t[cle]) ?? l.ids;
    return `${ids.length} ${pluriel(l)} : ${ids.map((id, i) => `${i + 1}. ${texte(t, cleElement(l, id, l.champs[0].nom)) || '(sans titre)'}`).join(' · ')}`;
  }
  if (cle.endsWith('.icone')) {
    const li = LISTES.find((x) => cle.startsWith(`${x.id}.`));
    const id = li ? cle.slice(li.id.length + 1).split('.')[0] : '';
    const nom = t[cle] ?? li?.icones?.[id] ?? li?.iconeNouveau ?? '';
    return NOMS_FR[nom] ?? nom;
  }
  if (cle.endsWith('.masquee')) return t[cle] === 'oui' ? 'Masquée' : 'Affichée';
  const def = TEXTES[cle];
  if (def?.type === 'nombre') return `${(t[cle] ?? def.defaut).replace('.', ',')} ${def.nombre?.unite ?? ''}`.trim();
  return texte(t, cle);
}

function libelleComplet(cle: string): string {
  for (const p of PAGES) for (const s of p.sections) {
    const t = s.textes.find((x) => x.cle === cle);
    if (t) return `${p.libelle} › ${s.titre} › ${t.libelle}`;
  }
  const sm = SECTIONS_MASQUABLES.find((x) => cleMasquee(x.id) === cle);
  if (sm) return `${PAGES.find((p) => p.cle === sm.page)?.libelle ?? sm.page} › ${sm.libelle} › Affichage de la section`;
  const l = LISTES.find((x) => cle.startsWith(`${x.id}.`));
  const ou = ouDe(cle);
  if (l && ou) {
    if (cle === cleOrdre(l)) return `${ou.page.libelle} › ${ou.section} › Liste des ${pluriel(l)}`;
    const e = elementDeCle(cle);
    if (cle.endsWith('.icone')) return `${ou.page.libelle} › ${ou.section} › ${majuscule(l.element)} : icône`;
    if (e) return `${ou.page.libelle} › ${ou.section} › ${majuscule(l.element)} ${l.feminin ? 'ajoutée' : 'ajouté'} : ${e.champ.libelle.toLowerCase()}`;
  }
  return cle;
}

/** Nombre saisi hors des bornes ou illisible */
const nombreInvalide = (def: DefTexte | undefined, v: string) => {
  if (def?.type !== 'nombre' || !def.nombre) return false;
  const n = lireNombre(v);
  return n === null || n < def.nombre.min || n > def.nombre.max;
};
/** Champ d'un nombre (valeur de calcul : taux…) */
function ChampNombre({ def, valeur, onChange, onFocus, compact = false }: { def: DefTexte; valeur: string; onChange: (v: string) => void; onFocus?: () => void; compact?: boolean }) {
  const id = `t-${def.cle}`;
  const b = def.nombre!;
  const invalide = nombreInvalide(def, valeur);
  const modifie = lireNombre(valeur) !== lireNombre(def.defaut);
  return (
    <div className={compact ? 'mt-3 border-t border-[#EEEEEE] pt-2.5' : 'py-3'}>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold text-[#111111]">
          {def.libelle}
          {modifie && !invalide && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">Modifié</span>}
        </label>
        {modifie && (
          <button type="button" onClick={() => onChange(def.defaut)} className="inline-flex items-center gap-1 text-xs font-semibold text-[#444444] hover:text-[#111111]">
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Valeur d'origine
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input id={id} value={valeur.replace('.', ',')} inputMode="decimal" onFocus={onFocus} onChange={(e) => onChange(e.target.value.replace(',', '.').replace(/[^\d.]/g, ''))}
          aria-invalid={invalide} aria-describedby={`${id}-aide`}
          className={`w-28 rounded-xl border-2 px-3 py-2 text-right text-[15px] tabular-nums text-[#111111] focus:outline-none ${invalide ? 'border-red-400' : modifie ? 'border-amber-300 focus:border-[#111111]' : 'border-[#D1D5DB] focus:border-[#111111]'}`} />
        <span className="text-sm font-semibold text-[#444444]">{b.unite}</span>
      </div>
      <p id={`${id}-aide`} className="mt-1 text-xs text-[#666666]">
        {invalide
          ? <span className="text-red-700">Indiquez un nombre entre {b.min.toLocaleString('fr-FR')} et {b.max.toLocaleString('fr-FR')} (ex. 6,9).</span>
          : <>{def.aide}{modifie && <span className="block">Origine : {def.defaut.replace('.', ',')} {b.unite}</span>}</>}
      </p>
    </div>
  );
}

function Champ({ def, valeur, onChange, onFocus }: { def: DefTexte; valeur: string; onChange: (v: string) => void; onFocus: () => void }) {
  if (def.type === 'nombre' && def.nombre) return <ChampNombre def={def} valeur={valeur} onChange={onChange} onFocus={onFocus} />;
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

/** Choix de l'icône d'une carte (bulle ou liste) */
function ChoixIcone({ valeur, onChoix }: { valeur: string; onChoix: (nom: string) => void }) {
  return (
    <div className="grid grid-cols-7 gap-1" role="radiogroup" aria-label="Icône">
      {NOMS_ICONES.map((nom) => {
        const Icone = ICONES[nom];
        const actif = nom === valeur;
        return (
          <button key={nom} type="button" role="radio" aria-checked={actif} title={NOMS_FR[nom]} aria-label={NOMS_FR[nom]} onClick={() => onChoix(nom)}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${actif ? 'border-[#111111] bg-[#111111] text-white' : 'border-transparent text-[#444444] hover:border-[#D1D5DB] hover:bg-[#F5F5F5]'}`}>
            <Icone className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

/** Bulle des outils d'un élément de liste (choix de l'icône, confirmation de suppression) */
function BulleOutil({ type, liste, nom, icone, onIcone, onSupprimer, onFermer }: {
  type: 'icone' | 'supprimer'; liste: ListeDef; nom: string; icone: string;
  onIcone: (nom: string) => void; onSupprimer: () => void; onFermer: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[#D1D5DB] bg-white p-3 shadow-[0_12px_40px_rgba(0,0,0,0.22)]" role="dialog"
      aria-label={type === 'icone' ? 'Choisir l’icône' : 'Supprimer'} onKeyDown={(e) => { if (e.key === 'Escape') onFermer(); }}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-[#111111]">{type === 'icone' ? `Icône : ${nom}` : `Supprimer ${liste.feminin ? 'cette' : 'cet'} ${liste.element} ?`}</p>
        <button type="button" onClick={onFermer} className="rounded-full p-1 text-[#666666] hover:bg-[#F5F5F5]" aria-label="Fermer (Échap)"><X className="h-4 w-4" /></button>
      </div>
      {type === 'icone' ? (
        <ChoixIcone valeur={icone} onChoix={(n) => { onIcone(n); onFermer(); }} />
      ) : (
        <>
          <p className="text-sm text-[#444444]">« {nom} » sera retiré{liste.feminin ? 'e' : ''} de la page après « Enregistrer ». Vous pourrez revenir en arrière depuis l’historique.</p>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={onFermer} className="rounded-lg border border-[#D1D5DB] px-3 py-1.5 text-xs font-semibold text-[#111111]">Annuler</button>
            <button type="button" autoFocus onClick={onSupprimer} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">Supprimer</button>
          </div>
        </>
      )}
    </div>
  );
}

/** Liste modulable dans la vue Liste : éléments, ordre, icônes, ajout et suppression */
function EditeurListe({ liste: l, ids, valeur, textesSection, onChange, onFocus, onAction, onIcone, onOrigine, modifiee }: {
  liste: ListeDef; ids: string[]; valeur: (cle: string) => string; textesSection: DefTexte[];
  onChange: (cle: string, v: string) => void; onFocus: (cle: string) => void;
  onAction: (action: ActionListe, id: string) => void; onIcone: (id: string, nom: string) => void; onOrigine: () => void; modifiee: boolean;
}) {
  const [aSupprimer, setASupprimer] = useState<string | null>(null);
  const [iconeOuverte, setIconeOuverte] = useState<string | null>(null);
  const bouton = 'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#D1D5DB] text-[#111111] hover:border-[#111111] disabled:cursor-not-allowed disabled:opacity-30';
  return (
    <div className="space-y-3 pb-4">
      {ids.map((id, i) => {
        const special = !!l.speciaux?.includes(id);
        const champs: DefTexte[] = special
          ? textesSection.filter((t) => t.cle.startsWith(`${l.id}.${id}.`))
          : l.champs.map((c) => defDe(cleElement(l, id, c.nom))).filter((d): d is DefTexte => !!d);
        const nom = valeur(cleElement(l, id, l.champs[0].nom)) || `${majuscule(l.element)} ${i + 1}`;
        const icone = valeur(cleIcone(l, id)) || l.icones?.[id] || l.iconeNouveau || 'Star';
        const Icone = ICONES[icone as keyof typeof ICONES] ?? ICONES.Star;
        return (
          <div key={id} className="rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] px-3 pt-2.5 md:px-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-bold text-[#111111]">
                {l.icones && !special && <Icone className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />}
                {majuscule(l.element)} {i + 1}
                {special && <span className="rounded-full bg-[#EEF2FF] px-2 py-0.5 text-[10px] font-semibold text-[#3730A3]">présentation particulière</span>}
              </p>
              <div className="flex items-center gap-1">
                <button type="button" className={bouton} disabled={i === 0} onClick={() => onAction('monter', id)} aria-label={`Monter ${l.element} ${i + 1}`} title="Monter"><ArrowUp className="h-4 w-4" /></button>
                <button type="button" className={bouton} disabled={i === ids.length - 1} onClick={() => onAction('descendre', id)} aria-label={`Descendre ${l.element} ${i + 1}`} title="Descendre"><ArrowDown className="h-4 w-4" /></button>
                {l.icones && !special && (
                  <button type="button" className={`${bouton} w-auto px-2 text-xs font-semibold`} onClick={() => setIconeOuverte(iconeOuverte === id ? null : id)} aria-expanded={iconeOuverte === id}>Icône</button>
                )}
                {aSupprimer === id ? (
                  <span className="ml-1 inline-flex items-center gap-1 text-xs">
                    <button type="button" onClick={() => { setASupprimer(null); onAction('supprimer', id); }} className="rounded-lg bg-red-600 px-2.5 py-1.5 font-semibold text-white">Supprimer</button>
                    <button type="button" onClick={() => setASupprimer(null)} className="rounded-lg border border-[#D1D5DB] bg-white px-2.5 py-1.5 font-semibold">Annuler</button>
                  </span>
                ) : (
                  <button type="button" className={`${bouton} hover:border-red-600 hover:text-red-700`} disabled={ids.length <= l.min} onClick={() => setASupprimer(id)}
                    aria-label={`Supprimer ${l.element} ${i + 1}`} title={ids.length <= l.min ? `Au moins ${l.min} ${l.min > 1 ? pluriel(l) : l.element}` : 'Supprimer'}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            {iconeOuverte === id && (
              <div className="mt-2 rounded-xl border border-[#E5E5E5] bg-white p-2">
                <ChoixIcone valeur={icone} onChoix={(n) => { onIcone(id, n); setIconeOuverte(null); }} />
              </div>
            )}
            <div className="divide-y divide-[#EEEEEE]">
              {champs.map((d) => (
                <Champ key={d.cle} def={d} valeur={valeur(d.cle)} onChange={(v) => onChange(d.cle, v)} onFocus={() => onFocus(d.cle)} />
              ))}
            </div>
            {aSupprimer === id && <p className="pb-2 text-xs text-red-700">« {nom} » sera retiré{l.feminin ? 'e' : ''} après « Enregistrer ».</p>}
          </div>
        );
      })}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => onAction('ajouter', ids[ids.length - 1])} disabled={ids.length >= l.max}
          className="inline-flex items-center gap-1.5 rounded-xl border-2 border-dashed border-[#9CA3AF] px-3 py-2 text-sm font-semibold text-[#111111] hover:border-[#111111] disabled:cursor-not-allowed disabled:opacity-40">
          <Plus className="h-4 w-4" aria-hidden="true" /> Ajouter {l.feminin ? 'une' : 'un'} {l.element}
        </button>
        <span className="text-xs text-[#666666]">{ids.length} {ids.length > 1 ? pluriel(l) : l.element} · de {l.min} à {l.max}</span>
        {modifiee && (
          <button type="button" onClick={onOrigine} className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-[#444444] hover:text-[#111111]">
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Revenir à la liste d’origine
          </button>
        )}
      </div>
    </div>
  );
}

/** Bulle d'édition posée à côté du texte cliqué (« Modifier sur la page ») */
function BulleTexte({ def, valeur, onChange, onFermer, onListe, lie }: {
  def: DefTexte; valeur: string; onChange: (v: string) => void; onFermer: () => void; onListe: () => void;
  /** Texte lié modifiable dans la même bulle (ex. valeur du taux) */
  lie?: { def: DefTexte; valeur: string; onChange: (v: string) => void };
}) {
  const champ = useRef<HTMLTextAreaElement>(null);
  const ou = ouDe(def.cle);
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
      {lie && <ChampNombre compact def={lie.def} valeur={lie.valeur} onChange={lie.onChange} />}
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
  const [outil, setOutil] = useState<{ type: 'icone' | 'supprimer'; liste: string; id: string } | null>(null);
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
  const lienInvalide = Object.entries(modifs).some(([k, v]) => (defDe(k)?.type === 'lien' && v.trim() !== '' && !/^(\/[^\s]*|https:\/\/[^\s]+)$/.test(v.trim())) || nombreInvalide(TEXTES[k], v));
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

  // Listes modulables : ordre, ajout, suppression, icônes (enregistrés avec les textes)
  const ordreDe = (l: ListeDef) => lireOrdre(l, valeur(cleOrdre(l))) ?? l.ids;
  const actionListe = (action: ActionListe, listeId: string, id: string) => {
    const l = LISTES_PAR_ID[listeId];
    if (!l) return;
    const ids = [...ordreDe(l)];
    const i = ids.indexOf(id);
    if (i < 0) return;
    if (action === 'icone' || (action === 'supprimer' && vue === 'page' && outil?.type !== 'supprimer')) {
      setActif(null);
      setOutil({ type: action, liste: listeId, id });
      return;
    }
    if (action === 'monter' && i > 0) [ids[i - 1], ids[i]] = [ids[i], ids[i - 1]];
    else if (action === 'descendre' && i < ids.length - 1) [ids[i + 1], ids[i]] = [ids[i], ids[i + 1]];
    else if (action === 'supprimer' && ids.length > l.min) ids.splice(i, 1);
    else if (action === 'ajouter' && ids.length < l.max) {
      let nid = nouvelId();
      while (ids.includes(nid)) nid = nouvelId();
      ids.splice(i + 1, 0, nid);
      setModifs((m) => ({ ...m, [cleOrdre(l)]: ids.join(','), ...Object.fromEntries(l.champs.map((c) => [cleElement(l, nid, c.nom), c.nouveau])) }));
      setOutil(null);
      const premier = cleElement(l, nid, l.champs[0].nom);
      setActif(premier);
      if (vue === 'liste') setAFocaliser(premier);
      return;
    } else return;
    setOutil(null);
    setModifs((m) => ({ ...m, [cleOrdre(l)]: ids.join(',') }));
  };
  const basculerSection = (id: string, masquer: boolean) => setModifs((m) => ({ ...m, [cleMasquee(id)]: masquer ? 'oui' : '' }));
  const changerIcone = (l: ListeDef, id: string, nom: string) => setModifs((m) => ({ ...m, [cleIcone(l, id)]: nom }));
  const origineListe = (l: ListeDef) => setModifs((m) => ({
    ...m,
    [cleOrdre(l)]: l.ids.join(','),
    ...Object.fromEntries(l.ids.filter((id) => l.icones?.[id]).map((id) => [cleIcone(l, id), l.icones![id]])),
  }));
  const listeModifiee = (l: ListeDef) => ordreDe(l).join(',') !== l.ids.join(',') || l.ids.some((id) => l.icones && valeur(cleIcone(l, id)) && valeur(cleIcone(l, id)) !== l.icones[id]);

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
              edition={{ actif, tous, utiliser, onClic: (cle) => { setOutil(null); setActif(cle); }, onListe: actionListe, onSection: basculerSection }}
              legende="Un clic sur le texte d’un lien ou d’un bouton le modifie : pour changer de page ou avancer dans un formulaire, utilisez la liste « Page » ou « Utiliser la page ». Les visiteurs verront les changements après « Enregistrer »."
              bulle={outil && LISTES_PAR_ID[outil.liste] ? (() => {
                const l = LISTES_PAR_ID[outil.liste];
                const n = ordreDe(l).indexOf(outil.id) + 1;
                return (
                  <BulleOutil type={outil.type} liste={l} nom={valeur(cleElement(l, outil.id, l.champs[0].nom)) || `${majuscule(l.element)} ${n}`}
                    icone={valeur(cleIcone(l, outil.id)) || l.icones?.[outil.id] || l.iconeNouveau || 'Star'}
                    onIcone={(nom) => changerIcone(l, outil.id, nom)} onSupprimer={() => actionListe('supprimer', outil.liste, outil.id)} onFermer={() => setOutil(null)} />
                );
              })() : actif && defDe(actif) ? (
                <BulleTexte def={defDe(actif)!} valeur={valeur(actif)} onChange={(v) => maj(actif, v)} onFermer={() => setActif(null)}
                  lie={defDe(actif)?.lie && TEXTES[defDe(actif)!.lie!] ? (() => { const cl = defDe(actif)!.lie!; return { def: TEXTES[cl], valeur: valeur(cl), onChange: (v: string) => setModifs((m) => ({ ...m, [cl]: v })) }; })() : undefined}
                  onListe={() => { const ou = ouDe(actif); if (ou) setPageCle(ou.page.cle); setVue('liste'); setAFocaliser(actif); }} />
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
                    {(() => {
                      const sm = sectionMasquable(p.cle, s.titre);
                      const masquee = !!sm && valeur(cleMasquee(sm.id)) === 'oui';
                      return (
                        <>
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h2 className={`text-lg font-bold ${masquee ? 'text-[#888888]' : 'text-[#111111]'}`}>{q ? `${p.libelle} › ${s.titre}` : s.titre}</h2>
                            {sm && (
                              <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#111111]">
                                <span className={masquee ? 'text-[#888888]' : ''}>{masquee ? 'Section masquée' : 'Section affichée'}</span>
                                <input type="checkbox" role="switch" className="peer sr-only" checked={!masquee} onChange={(e) => basculerSection(sm.id, !e.target.checked)}
                                  aria-label={`Afficher la section « ${sm.libelle} » sur le site`} />
                                <span aria-hidden="true" className={`relative inline-flex h-6 w-11 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#111111] peer-focus-visible:ring-offset-2 ${masquee ? 'bg-[#D1D5DB]' : 'bg-[#111111]'}`}>
                                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${masquee ? 'translate-x-0.5' : 'translate-x-[22px]'}`} />
                                </span>
                              </label>
                            )}
                          </div>
                          {masquee && <p className="mt-1 rounded-lg bg-[#F5F5F5] px-3 py-2 text-sm text-[#555555]">Cette section n’apparaît plus sur le site. Ses textes restent modifiables et réapparaîtront si vous l’affichez de nouveau.</p>}
                        </>
                      );
                    })()}
                    {s.aide && <p className="text-sm text-[#666666]">{s.aide}</p>}
                    {(() => {
                      const l = !q ? listeDe(p.cle, s.titre) : undefined;
                      const focus = (cle: string) => { if (p.chemin && p.cle !== pageCle) setPageCle(p.cle); setActif(cle); setMontrer((n) => n + 1); };
                      const dansListe = (cle: string) => !!l && (elementDeCle(cle)?.liste.id === l.id || l.ids.some((id) => cle.startsWith(`${l.id}.${id}.`)));
                      return (
                        <>
                          <div className="divide-y divide-[#EEEEEE]">
                            {s.textes.filter((t) => !dansListe(t.cle)).map((t) => (
                              <Champ key={t.cle} def={t} valeur={valeur(t.cle)} onChange={(v) => maj(t.cle, v)} onFocus={() => focus(t.cle)} />
                            ))}
                          </div>
                          {l && (
                            <EditeurListe liste={l} ids={ordreDe(l)} valeur={valeur} textesSection={s.textes} onChange={maj} onFocus={focus}
                              onAction={(a, id) => actionListe(a, l.id, id)} onIcone={(id, nom) => changerIcone(l, id, nom)} onOrigine={() => origineListe(l)} modifiee={listeModifiee(l)} />
                          )}
                        </>
                      );
                    })()}
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
                <ApercuPage chemin={cheminApercu} textes={courants} edition={{ actif, montrer, onClic: allerAuChamp, onListe: actionListe, onSection: basculerSection }}
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
            {apercuMobile && <div className="mt-3"><ApercuPage chemin={cheminApercu} textes={courants} edition={{ actif, montrer, onClic: allerAuChamp, onListe: actionListe, onSection: basculerSection }} /></div>}
          </div>
        )}
      </div>

      {(nonEnregistres || lienInvalide) && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E5E5E5] bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            {lienInvalide ? (
              <p className="text-sm text-red-700" role="alert">Une valeur est invalide (adresse de lien ou nombre) : corrigez-la pour enregistrer.</p>
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
