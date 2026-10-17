/**
 * Coordonnées de SVM Ride : contact, showroom et horaires.
 *
 * Modifiables dans l'admin, onglet « Infos du site » (depuis le 17/10/2026) :
 * elles sont enregistrées dans la table Supabase `site_reglages` (clé
 * « coordonnees ») et lues par le site (src/lib/coordonnees.ts), par la fonction
 * Netlify « seo » (données pour Google) et par les fonctions Supabase qui
 * envoient les e-mails.
 *
 * COORDONNEES_DEFAUT : valeurs de secours si la base ne répond pas (celles du
 * 17/10/2026). Ce fichier ne dépend de rien d'autre : il est aussi utilisé par
 * la fonction Netlify « seo ».
 */

export type ModeJour = 'ouvert' | 'rdv' | 'ferme';
export interface Plage {
  /** « 09:00 » */
  de: string;
  /** « 18:00 » */
  a: string;
}
export interface Jour {
  mode: ModeJour;
  /** Une ou deux plages (pause du midi) quand le showroom est ouvert */
  plages: Plage[];
}

export interface Coordonnees {
  /** Affiché tel quel : « 01 84 19 01 74 » */
  telephone: string;
  /** E-mail affiché sur le site et dans les e-mails */
  email: string;
  /** Adresse qui reçoit les demandes envoyées depuis le site */
  email_reception: string;
  /** Pseudo Instagram, sans @ : « svm_ride » (vide : pas d'Instagram affiché) */
  instagram: string;
  showroom: {
    nom: string;
    adresse: string;
    code_postal: string;
    ville: string;
    /** Précision facultative sous l'adresse (ex. « sur rendez-vous ») */
    note: string;
  };
  /** 7 jours, du lundi au dimanche */
  horaires: Jour[];
  /** Précision facultative sous les horaires */
  horaires_note: string;
}

export const CLE_COORDONNEES = 'coordonnees';

export const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const;
const JOURS_SCHEMA = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const journee = (): Jour => ({ mode: 'ouvert', plages: [{ de: '09:00', a: '18:00' }] });

export const COORDONNEES_DEFAUT: Coordonnees = {
  telephone: '01 84 19 01 74',
  email: 'contact@svmride.com',
  email_reception: 'contact@svmride.com',
  instagram: 'svm_ride',
  showroom: {
    nom: 'Chaville',
    adresse: '310 Avenue Roger Salengro',
    code_postal: '92370',
    ville: 'Chaville',
    note: '',
  },
  horaires: [
    { mode: 'rdv', plages: [] },
    journee(), journee(), journee(), journee(), journee(),
    { mode: 'ferme', plages: [] },
  ],
  horaires_note: 'Sur rendez-vous à notre showroom de Chaville',
};

// ---------------------------------------------------------------------------
// Contrôles (utilisés par l'admin et à la lecture)
// ---------------------------------------------------------------------------
const texte = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
export const HEURE = /^([01]\d|2[0-3]):[0-5]\d$/;
export const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

/** Chiffres d'un numéro français : « 0184190174 », ou null s'il n'est pas valable */
export function chiffresTelephone(t: string): string | null {
  let c = t.replace(/[\s.\-()]/g, '');
  if (c.startsWith('+33')) c = `0${c.slice(3)}`;
  else if (c.startsWith('0033')) c = `0${c.slice(4)}`;
  return /^0[1-9]\d{8}$/.test(c) ? c : null;
}
/** « 01 84 19 01 74 » */
export const formaterTelephone = (t: string) => {
  const c = chiffresTelephone(t);
  return c ? c.replace(/(\d{2})(?=\d)/g, '$1 ') : t.trim();
};
/** Lien d'appel : « tel:+33184190174 » */
export const lienTelephone = (t: string) => {
  const c = chiffresTelephone(t);
  return c ? `tel:+33${c.slice(1)}` : `tel:${t.replace(/[^\d+]/g, '')}`;
};
/** Format international pour Google : « +33184190174 » */
export const telephoneInternational = (t: string) => {
  const c = chiffresTelephone(t);
  return c ? `+33${c.slice(1)}` : t.replace(/[^\d+]/g, '');
};

/** « svm_ride » à partir de « @svm_ride » ou d'une adresse instagram.com/svm_ride */
export function pseudoInstagram(v: string): string {
  const s = v.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').replace(/[/?#].*$/, '');
  return /^[A-Za-z0-9._]{1,30}$/.test(s) ? s : '';
}
export const lienInstagram = (pseudo: string) => `https://instagram.com/${pseudo}`;

export const adresseComplete = (c: Coordonnees) =>
  `${c.showroom.adresse}, ${c.showroom.code_postal} ${c.showroom.ville}`;
export const lienMaps = (c: Coordonnees) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(adresseComplete(c)).replace(/%20/g, '+')}`;

function jourValide(v: unknown, defaut: Jour): Jour {
  if (!v || typeof v !== 'object') return defaut;
  const j = v as Partial<Jour>;
  const mode: ModeJour = j.mode === 'ouvert' || j.mode === 'rdv' || j.mode === 'ferme' ? j.mode : defaut.mode;
  const plages = (Array.isArray(j.plages) ? j.plages : [])
    .filter((p): p is Plage => !!p && HEURE.test(p.de) && HEURE.test(p.a) && p.de < p.a)
    .slice(0, 2);
  if (mode === 'ouvert' && plages.length === 0) return { mode: 'rdv', plages: [] };
  return { mode, plages: mode === 'ouvert' ? plages : [] };
}

/** Valeur lue en base → coordonnées complètes (ce qui manque ou est invalide reprend la valeur de secours) */
export function normaliserCoordonnees(v: unknown): Coordonnees {
  const d = COORDONNEES_DEFAUT;
  if (!v || typeof v !== 'object') return d;
  const o = v as Omit<Partial<Coordonnees>, 'showroom'> & { showroom?: Partial<Coordonnees['showroom']> };
  const s: Partial<Coordonnees['showroom']> = o.showroom ?? {};
  const email = texte(o.email, 120);
  const reception = texte(o.email_reception, 120);
  const tel = texte(o.telephone, 30);
  const cp = texte(s.code_postal, 5);
  return {
    telephone: chiffresTelephone(tel) ? formaterTelephone(tel) : d.telephone,
    email: EMAIL.test(email) ? email : d.email,
    email_reception: EMAIL.test(reception) ? reception : EMAIL.test(email) ? email : d.email_reception,
    instagram: typeof o.instagram === 'string' ? pseudoInstagram(o.instagram) : d.instagram,
    showroom: {
      nom: texte(s.nom, 60) || d.showroom.nom,
      adresse: texte(s.adresse, 120) || d.showroom.adresse,
      code_postal: /^\d{5}$/.test(cp) ? cp : d.showroom.code_postal,
      ville: texte(s.ville, 60) || d.showroom.ville,
      note: texte(s.note, 120),
    },
    horaires: JOURS.map((_, i) => jourValide(Array.isArray(o.horaires) ? o.horaires[i] : null, d.horaires[i])),
    horaires_note: typeof o.horaires_note === 'string' ? texte(o.horaires_note, 160) : d.horaires_note,
  };
}

// ---------------------------------------------------------------------------
// Horaires en texte
// ---------------------------------------------------------------------------
/** « 9h », « 9h30 » */
const heure = (h: string) => {
  const [hh, mm] = h.split(':');
  return `${Number(hh)}h${mm === '00' ? '' : mm}`;
};
const plagesTexte = (j: Jour) => j.plages.map((p) => `${heure(p.de)}-${heure(p.a)}`).join(', ');
const valeurJour = (j: Jour) => (j.mode === 'ouvert' ? plagesTexte(j) : j.mode === 'rdv' ? 'Sur rendez-vous' : 'Fermé');

/** Jours consécutifs aux horaires identiques regroupés, dans l'ordre de la semaine */
function groupes(h: Jour[]): { debut: number; fin: number; jour: Jour }[] {
  const g: { debut: number; fin: number; jour: Jour }[] = [];
  h.forEach((j, i) => {
    const dernier = g[g.length - 1];
    if (dernier && dernier.fin === i - 1 && valeurJour(dernier.jour) === valeurJour(j)) dernier.fin = i;
    else g.push({ debut: i, fin: i, jour: j });
  });
  return g;
}

/**
 * Lignes affichées : « Mardi - Samedi : 9h-18h », « Lundi : Sur rendez-vous »,
 * « Dimanche : Fermé ». Jours d'ouverture d'abord, puis sur rendez-vous, puis fermés.
 */
export function lignesHoraires(h: Jour[]): string[] {
  const rang: Record<ModeJour, number> = { ouvert: 0, rdv: 1, ferme: 2 };
  return groupes(h)
    .sort((a, b) => rang[a.jour.mode] - rang[b.jour.mode] || a.debut - b.debut)
    .map((g) => `${g.debut === g.fin ? JOURS[g.debut] : `${JOURS[g.debut]} - ${JOURS[g.fin]}`} : ${valeurJour(g.jour)}`);
}

/** Pour une phrase : « ouvert du mardi au samedi de 9 h à 18 h » (null si jamais ouvert) */
export function phraseHoraires(h: Jour[]): string | null {
  const ouverts = groupes(h).filter((g) => g.jour.mode === 'ouvert');
  if (!ouverts.length) return null;
  const h2 = (x: string) => heure(x).replace('h', ' h ').replace(/ $/, '').trim();
  const parties = ouverts.map((g) => {
    const jours = g.debut === g.fin ? `le ${JOURS[g.debut].toLowerCase()}` : `du ${JOURS[g.debut].toLowerCase()} au ${JOURS[g.fin].toLowerCase()}`;
    return `${jours} ${g.jour.plages.map((p) => `de ${h2(p.de)} à ${h2(p.a)}`).join(' et ')}`;
  });
  return `ouvert ${parties.join(', ')}`;
}

/** Horaires pour Google (schema.org OpeningHoursSpecification) */
export function horairesSchema(h: Jour[]) {
  const specs: { '@type': string; dayOfWeek: string[]; opens: string; closes: string }[] = [];
  h.forEach((j, i) => {
    if (j.mode !== 'ouvert') return;
    for (const p of j.plages) {
      const existant = specs.find((s) => s.opens === p.de && s.closes === p.a);
      if (existant) existant.dayOfWeek.push(JOURS_SCHEMA[i]);
      else specs.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: [JOURS_SCHEMA[i]], opens: p.de, closes: p.a });
    }
  });
  return specs;
}
