/**
 * Informations légales de la société (mentions légales et contrats de dépôt-vente).
 *
 * Modifiables dans l'admin, onglet « Infos du site », bloc « Société » : réglage
 * « societe » de la table site_reglages. Chaque nouveau contrat en garde une copie
 * (les contrats déjà créés ou signés ne changent jamais). Le même format est repris
 * dans supabase/functions/_shared/depot-contrat.ts (societeContrat).
 *
 * SOCIETE_DEFAUT : valeurs de secours (celles du 17/10/2026).
 */

export interface Societe {
  /** Raison sociale : « SVM RIDE » */
  raison_sociale: string;
  /** Forme juridique : « SAS » */
  forme: string;
  /** Capital social, facultatif : « 1 000 € » */
  capital: string;
  /** SIRET du siège, 14 chiffres, mis en forme « 988 004 719 00015 » */
  siret: string;
  /** « RCS Nanterre » */
  rcs: string;
  /** N° de TVA intracommunautaire, facultatif */
  tva: string;
  siege: string;
  directeur_publication: string;
  /** Assureur du garage (contrat, article 9) */
  assureur: string;
  /** Médiateur de la consommation (obligatoire dès qu'il est désigné) */
  mediateur_nom: string;
  mediateur_site: string;
  mediateur_adresse: string;
}

export const CLE_SOCIETE = 'societe';

export const SOCIETE_DEFAUT: Societe = {
  raison_sociale: 'SVM RIDE',
  forme: 'SAS',
  capital: '',
  siret: '988 004 719 00015',
  rcs: 'RCS Nanterre',
  tva: '',
  siege: '3 Rue Émile Verhaeren, 92210 Saint-Cloud',
  directeur_publication: 'M. Mattia SARAVIA',
  assureur: 'AXA',
  mediateur_nom: '',
  mediateur_site: '',
  mediateur_adresse: '',
};

const texte = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');

/** 14 chiffres, ou null */
export const chiffresSiret = (s: string) => {
  const c = s.replace(/\s/g, '');
  return /^\d{14}$/.test(c) ? c : null;
};
export const formaterSiret = (s: string) => {
  const c = chiffresSiret(s);
  return c ? `${c.slice(0, 3)} ${c.slice(3, 6)} ${c.slice(6, 9)} ${c.slice(9)}` : s.trim();
};
/** « 988 004 719 » (les 9 premiers chiffres du SIRET) */
export const siren = (s: Societe) => formaterSiret(s.siret).slice(0, 11);

/** Clé de contrôle des numéros SIRET (algorithme de Luhn) : alerte seulement, certaines exceptions existent */
export function siretPlausible(s: string): boolean {
  const c = chiffresSiret(s);
  if (!c) return false;
  let somme = 0;
  for (let i = 0; i < 14; i++) {
    let n = Number(c[13 - i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    somme += n;
  }
  return somme % 10 === 0;
}

/** Texte du médiateur pour les contrats et les mentions légales (vide si aucun) */
export const texteMediateur = (s: Societe) =>
  s.mediateur_nom ? [s.mediateur_nom, s.mediateur_site, s.mediateur_adresse].filter(Boolean).join(' – ') : '';

/** Valeur lue en base → informations complètes (ce qui manque reprend la valeur de secours) */
export function normaliserSociete(v: unknown): Societe {
  const d = SOCIETE_DEFAUT;
  if (!v || typeof v !== 'object') return d;
  const o = v as Partial<Record<keyof Societe, unknown>>;
  const siret = texte(o.siret, 20);
  const facultatif = (k: keyof Societe, max: number) => (typeof o[k] === 'string' ? texte(o[k], max) : d[k]);
  return {
    raison_sociale: texte(o.raison_sociale, 80) || d.raison_sociale,
    forme: texte(o.forme, 40) || d.forme,
    capital: facultatif('capital', 40),
    siret: chiffresSiret(siret) ? formaterSiret(siret) : d.siret,
    rcs: texte(o.rcs, 60) || d.rcs,
    tva: facultatif('tva', 20),
    siege: texte(o.siege, 160) || d.siege,
    directeur_publication: texte(o.directeur_publication, 80) || d.directeur_publication,
    assureur: texte(o.assureur, 80) || d.assureur,
    mediateur_nom: facultatif('mediateur_nom', 120),
    mediateur_site: facultatif('mediateur_site', 120),
    mediateur_adresse: facultatif('mediateur_adresse', 160),
  };
}
