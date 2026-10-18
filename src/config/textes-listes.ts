/**
 * Listes modulables du site (admin « Textes du site ») : étapes, atouts,
 * services, avantages, questions fréquentes. Le propriétaire peut ajouter,
 * supprimer et réordonner les éléments, et choisir l'icône des cartes.
 * Module pur, partagé avec la fonction Netlify « seo ».
 *
 * Tout est rangé dans le réglage « textes » (objet clé → texte) :
 *  - « <liste>.ordre » : identifiants des éléments affichés, dans l'ordre,
 *    séparés par des virgules (absent : éléments d'origine) ;
 *  - textes d'un élément : la clé d'origine pour les éléments d'origine
 *    (ex. « vendre.faq.3.question »), « <liste>.<id>.<champ> » pour les
 *    éléments ajoutés (id « x » + 4 caractères, ex. « vendre.faq.xk3p9.question ») ;
 *  - « <liste>.<id>.icone » : nom de l'icône choisie (listes à icônes).
 * Un identifiant ne change jamais : déplacer un élément garde ses textes.
 */

export interface ChampListe {
  nom: string;
  libelle: string;
  type: 'ligne' | 'paragraphe' | 'lien';
  max: number;
  /** Texte d'un élément ajouté, à remplacer par le propriétaire */
  nouveau: string;
}

export interface ListeDef {
  /** Identifiant, préfixe des clés des éléments ajoutés */
  id: string;
  /** Page et section du registre où la liste se modifie */
  page: string;
  section: string;
  /** « étape », « question »… (au singulier) et son article : « une étape » */
  element: string;
  feminin: boolean;
  /** Éléments d'origine, dans l'ordre */
  ids: string[];
  champs: ChampListe[];
  /** Clé d'un texte d'un élément d'origine (par défaut « <liste>.<id>.<champ> ») */
  cleOrigine?: (id: string, champ: string) => string;
  /** Icônes d'origine (listes à icônes) */
  icones?: Record<string, string>;
  /** Icône d'un élément ajouté */
  iconeNouveau?: string;
  /** Éléments à présentation particulière (ex. Alma) : déplaçables et supprimables, pas reproductibles */
  speciaux?: string[];
  min: number;
  max: number;
}

const titreTexte = (quoi: string, maxTitre = 50, maxTexte = 240): ChampListe[] => [
  { nom: 'titre', libelle: 'Titre', type: 'ligne', max: maxTitre, nouveau: `Nouveau ${quoi}` },
  { nom: 'texte', libelle: 'Texte', type: 'paragraphe', max: maxTexte, nouveau: 'Décrivez-le en une ou deux phrases.' },
];

export const LISTES: ListeDef[] = [
  {
    id: 'accueil.vente', page: 'accueil', section: 'Vente de véhicules d’occasion', element: 'atout', feminin: false,
    ids: ['atout1', 'atout2', 'atout3', 'atout4'], champs: titreTexte('point fort', 50, 200),
    icones: { atout1: 'Shield', atout2: 'Users', atout3: 'Award', atout4: 'CheckCircle' }, iconeNouveau: 'Star', min: 1, max: 8,
  },
  {
    id: 'accueil.reprise', page: 'accueil', section: 'Reprise de votre véhicule', element: 'atout', feminin: false,
    ids: ['atout1', 'atout2', 'atout3', 'atout4'], champs: titreTexte('point fort', 50, 200),
    icones: { atout1: 'Clock', atout2: 'Award', atout3: 'CheckCircle', atout4: 'Shield' }, iconeNouveau: 'Star', min: 1, max: 8,
  },
  {
    id: 'accueil.services', page: 'accueil', section: 'Services', element: 'service', feminin: false,
    ids: ['service1', 'service2', 'service3'],
    champs: [
      { nom: 'titre', libelle: 'Titre', type: 'ligne', max: 40, nouveau: 'Nouveau service' },
      { nom: 'texte', libelle: 'Texte', type: 'paragraphe', max: 240, nouveau: 'Décrivez ce service en une ou deux phrases.' },
      { nom: 'lien', libelle: 'Texte du lien', type: 'ligne', max: 30, nouveau: 'En savoir plus →' },
      { nom: 'adresse', libelle: 'Adresse du lien', type: 'lien', max: 300, nouveau: '/contact' },
    ],
    cleOrigine: (id, champ) => `accueil.${id}.${champ}`, min: 1, max: 6,
  },
  {
    id: 'accueil.pourquoi', page: 'accueil', section: 'Pourquoi nous choisir ?', element: 'point', feminin: false,
    ids: ['point1', 'point2', 'point3'], champs: titreTexte('point', 50, 200),
    icones: { point1: 'Star', point2: 'Shield', point3: 'Users' }, iconeNouveau: 'ThumbsUp', min: 1, max: 6,
  },
  {
    id: 'reprises.etapes', page: 'reprises', section: 'Comment ça marche ?', element: 'étape', feminin: true,
    ids: ['1', '2', '3', '4'], champs: titreTexte('étape').map((c) => (c.nom === 'titre' ? { ...c, nouveau: 'Nouvelle étape' } : c)), min: 2, max: 8,
  },
  {
    id: 'recherche.etapes', page: 'recherche', section: 'Un service sur-mesure', element: 'étape', feminin: true,
    ids: ['1', '2', '3', '4'], champs: titreTexte('étape').map((c) => (c.nom === 'titre' ? { ...c, nouveau: 'Nouvelle étape' } : c)), min: 2, max: 8,
  },
  {
    id: 'vendre.etapes', page: 'vendre', section: 'Comment ça marche ?', element: 'étape', feminin: true,
    ids: ['1', '2', '3', '4', '5'], champs: titreTexte('étape').map((c) => (c.nom === 'titre' ? { ...c, nouveau: 'Nouvelle étape' } : c)), min: 2, max: 8,
  },
  {
    id: 'vendre.avantages', page: 'vendre', section: 'Pourquoi confier votre moto à SVM Ride ?', element: 'avantage', feminin: false,
    ids: ['1', '2', '3', '4'], champs: titreTexte('avantage'),
    icones: { 1: 'BadgeEuro', 2: 'CalendarCheck', 3: 'ShieldCheck', 4: 'Eye' }, iconeNouveau: 'Star', min: 1, max: 8,
  },
  {
    id: 'vendre.faq', page: 'vendre', section: 'Questions fréquentes', element: 'question', feminin: true,
    ids: ['1', '2', '3', '4', '5', '6', '7'],
    champs: [
      { nom: 'question', libelle: 'Question', type: 'ligne', max: 120, nouveau: 'Nouvelle question ?' },
      { nom: 'reponse', libelle: 'Réponse', type: 'paragraphe', max: 600, nouveau: 'Écrivez la réponse ici.' },
    ],
    min: 1, max: 15,
  },
  {
    id: 'financement.avantages', page: 'financement', section: 'Pourquoi financer avec nous ?', element: 'avantage', feminin: false,
    ids: ['1', '2', '3', '4', '5'], champs: titreTexte('avantage', 70, 200),
    icones: { 1: 'CheckCircle', 2: 'CheckCircle', 3: 'CheckCircle', 4: 'CheckCircle', 5: 'CheckCircle' }, iconeNouveau: 'CheckCircle',
    speciaux: ['3'], min: 1, max: 8,
  },
];

/** Icônes proposées pour les cartes (bibliothèque Lucide, voir src/config/icones.ts) */
export const NOMS_ICONES = [
  'Shield', 'ShieldCheck', 'BadgeCheck', 'Award', 'Trophy', 'Star', 'ThumbsUp', 'Heart', 'Smile', 'Users', 'Handshake',
  'CheckCircle', 'ClipboardCheck', 'Clock', 'Timer', 'Zap', 'Calendar', 'CalendarCheck', 'Eye', 'Search',
  'BadgeEuro', 'Euro', 'Banknote', 'PiggyBank', 'CreditCard', 'Percent', 'FileText', 'FileSignature',
  'Wrench', 'Settings', 'Gauge', 'Bike', 'Key', 'Truck', 'MapPin', 'Store', 'Phone', 'Mail', 'MessageCircle', 'Camera', 'Sparkles', 'Leaf',
] as const;

export const LISTES_PAR_ID: Record<string, ListeDef> = Object.fromEntries(LISTES.map((l) => [l.id, l]));

/** Identifiant d'un élément ajouté */
export const ID_AJOUTE = /^x[a-z0-9]{4}$/;
export const nouvelId = () => `x${Math.random().toString(36).slice(2, 6).padEnd(4, '0')}`;

/** Clé d'un texte d'un élément */
export function cleElement(l: ListeDef, id: string, champ: string): string {
  return l.cleOrigine && l.ids.includes(id) ? l.cleOrigine(id, champ) : `${l.id}.${id}.${champ}`;
}
export const cleOrdre = (l: ListeDef) => `${l.id}.ordre`;
export const cleIcone = (l: ListeDef, id: string) => `${l.id}.${id}.icone`;

/** Ordre valide (identifiants connus ou ajoutés, sans doublon, nombre permis) ; sinon null */
export function lireOrdre(l: ListeDef, v: string | undefined): string[] | null {
  if (typeof v !== 'string') return null;
  const ids = v.split(',').map((x) => x.trim()).filter(Boolean);
  if (ids.length < l.min || ids.length > l.max || new Set(ids).size !== ids.length) return null;
  return ids.every((id) => l.ids.includes(id) || ID_AJOUTE.test(id)) ? ids : null;
}

/** Liste, élément et champ d'une clé de texte d'élément (null : pas un élément de liste) */
export function elementDeCle(cle: string): { liste: ListeDef; id: string; champ: ChampListe } | null {
  for (const l of LISTES) {
    for (const id of l.ids) {
      for (const c of l.champs) if (cleElement(l, id, c.nom) === cle) return { liste: l, id, champ: c };
    }
    if (!cle.startsWith(`${l.id}.`)) continue;
    const [id, champ, ...reste] = cle.slice(l.id.length + 1).split('.');
    const c = l.champs.find((x) => x.nom === champ);
    if (c && !reste.length && ID_AJOUTE.test(id)) return { liste: l, id, champ: c };
  }
  return null;
}
