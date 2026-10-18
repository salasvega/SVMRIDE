/**
 * Textes du site modifiables dans l'admin (page « Textes du site », et le nom
 * et l'accroche dans « Infos du site »). Module pur, partagé avec la fonction
 * Netlify « seo » (titres Google, nom du site).
 *
 * Chaque texte a une valeur d'origine (celle du site) ; seuls les textes
 * changés sont enregistrés (réglage « textes » de site_reglages, objet
 * clé → texte). « {nom} » est remplacé par le nom du site.
 */

export const CLE_TEXTES = 'textes';

export interface DefTexte {
  cle: string;
  libelle: string;
  defaut: string;
  /** Une ligne (titre, bouton) ou un paragraphe */
  type?: 'ligne' | 'paragraphe' | 'lien';
  max?: number;
  aide?: string;
}

export interface SectionTextes {
  titre: string;
  aide?: string;
  textes: DefTexte[];
}

export interface PageTextes {
  cle: string;
  libelle: string;
  description: string;
  /** Page du site montrée dans l'aperçu (null : pas d'aperçu) */
  chemin: string | null;
  sections: SectionTextes[];
}

const L = (cle: string, libelle: string, defaut: string, aide?: string, max = 90): DefTexte => ({ cle, libelle, defaut, type: 'ligne', max, aide });
const P = (cle: string, libelle: string, defaut: string, aide?: string, max = 420): DefTexte => ({ cle, libelle, defaut, type: 'paragraphe', max, aide });

const atouts = (prefixe: string, liste: [string, string][], quoi = 'Atout'): DefTexte[] =>
  liste.flatMap(([titre, texte], i) => [
    L(`${prefixe}${i + 1}.titre`, `${quoi} ${i + 1} : titre`, titre, undefined, 50),
    P(`${prefixe}${i + 1}.texte`, `${quoi} ${i + 1} : texte`, texte, undefined, 200),
  ]);

const entete = (page: string, titre: string, intro?: string): SectionTextes => ({
  titre: 'En-tête de la page',
  textes: [L(`${page}.titre`, 'Titre', titre, undefined, 70), ...(intro !== undefined ? [P(`${page}.intro`, 'Introduction', intro)] : [])],
});

const seo = (chemin: string, slug: string, titre: string, description: string, aideDescription?: string): SectionTextes => ({
  titre: `Page ${chemin}`,
  textes: [
    L(`seo.${slug}.titre`, 'Titre dans Google', titre, 'Idéalement 50 à 60 caractères.', 70),
    P(`seo.${slug}.description`, 'Description dans Google', description, aideDescription ?? 'Idéalement 120 à 160 caractères.', 180),
  ],
});

export const PAGES_TEXTES: PageTextes[] = [
  {
    cle: 'identite',
    libelle: 'Nom et accroche',
    description: 'Nom affiché du site et phrase d’accroche de l’accueil.',
    chemin: '/',
    sections: [
      {
        titre: 'Identité',
        textes: [
          L('site.nom', 'Nom du site', 'SVM Ride', 'Affiché dans la barre du haut, le pied de page, les titres Google et les e-mails. Peut différer de la raison sociale.', 40),
          P('site.accroche', 'Phrase d’accroche', 'Votre spécialiste du deux-roues basé en Île-de-France.', 'Sous le titre de la page d’accueil.', 160),
        ],
      },
    ],
  },
  {
    cle: 'annonce',
    libelle: 'Bandeau d’annonce',
    description: 'Message en haut de toutes les pages : fermeture, promotion, événement.',
    chemin: '/',
    sections: [
      {
        titre: 'Bandeau d’annonce',
        aide: 'Laissez le message vide pour ne rien afficher.',
        textes: [
          P('annonce.texte', 'Message', '', 'Ex. « Showroom fermé du 1er au 15 août. Les demandes en ligne restent traitées. »', 180),
          L('annonce.lien_texte', 'Texte du lien (facultatif)', '', 'Ex. « En savoir plus »', 40),
          { cle: 'annonce.lien', libelle: 'Adresse du lien (facultatif)', defaut: '', type: 'lien', max: 300, aide: 'Une page du site (ex. /contact) ou une adresse complète (https://…).' },
        ],
      },
    ],
  },
  {
    cle: 'accueil',
    libelle: 'Accueil',
    description: 'Tous les textes de la page d’accueil, section par section.',
    chemin: '/',
    sections: [
      {
        titre: 'Bandeau principal',
        textes: [
          L('accueil.hero.titre', 'Titre', 'Bienvenue chez {nom}', undefined, 60),
          P('site.accroche', 'Phrase d’accroche', 'Votre spécialiste du deux-roues basé en Île-de-France.', 'Aussi modifiable dans Infos du site.', 160),
          L('accueil.hero.bouton1', 'Bouton principal', 'Voir nos véhicules', undefined, 30),
          L('accueil.hero.bouton2', 'Bouton secondaire', 'Nous contacter', undefined, 30),
        ],
      },
      {
        titre: 'Vente de véhicules d’occasion',
        textes: [
          L('accueil.vente.titre', 'Titre', 'Vente de véhicules d\'occasion', undefined, 60),
          P('accueil.vente.texte', 'Texte', 'Découvrez notre sélection de motos et scooters d\'occasion de qualité', undefined, 200),
          ...atouts('accueil.vente.atout', [
            ['Sélection vérifiée', 'Chaque véhicule est rigoureusement contrôlé et garanti'],
            ['Accompagnement', 'Conseils personnalisés pour trouver le deux-roues idéal'],
            ['Financement', 'Solutions de financement adaptées à votre budget'],
            ['Démarches simplifiées', 'Nous gérons toute la paperasse pour vous'],
          ]),
        ],
      },
      {
        titre: 'Derniers arrivages',
        textes: [
          L('accueil.arrivages.titre', 'Titre', 'Derniers arrivages', undefined, 50),
          L('accueil.arrivages.lien', 'Lien vers le catalogue', 'Voir toutes nos motos', 'Le nombre de motos en vente est ajouté automatiquement.', 40),
        ],
      },
      {
        titre: 'Explorez les marques',
        textes: [
          L('accueil.marques.titre', 'Titre', 'Explorez les marques', undefined, 50),
          P('accueil.marques.texte', 'Texte', 'Retrouvez les plus grandes marques de motos et découvrez les modèles actuellement disponibles chez {nom}.', undefined, 240),
        ],
      },
      {
        titre: 'Reprise de votre véhicule',
        textes: [
          L('accueil.reprise.titre', 'Titre', 'Reprise de votre véhicule', undefined, 60),
          P('accueil.reprise.texte', 'Texte', 'Faites reprendre votre deux-roues rapidement et au meilleur prix. Notre équipe vous propose une expertise rapide, une offre attractive, un virement immédiat et des démarches simplifiées.'),
          L('accueil.reprise.bouton', 'Bouton', 'Demande de reprise', undefined, 30),
          L('accueil.reprise.depot', 'Phrase vers le dépôt-vente', 'Vous préférez vendre au meilleur prix ?', undefined, 80),
          L('accueil.reprise.depot_lien', 'Lien vers le dépôt-vente', 'Confiez-nous votre moto en dépôt-vente', undefined, 60),
          ...atouts('accueil.reprise.atout', [
            ['Expertise rapide', 'Évaluation en moins de 24h'],
            ['Offre attractive', 'Prix juste et compétitif'],
            ['Virement immédiat', 'Paiement sécurisé rapide'],
            ['Sans contrainte', 'Démarches simplifiées'],
          ]),
        ],
      },
      {
        titre: 'Services',
        textes: [
          L('accueil.service1.titre', 'Service 1 : titre', 'Personnalisation', undefined, 40),
          P('accueil.service1.texte', 'Service 1 : texte', 'Transformez votre deux-roues selon vos envies. Échappements, kits esthétiques, selles confort et bien plus encore.', undefined, 240),
          L('accueil.service1.lien', 'Service 1 : lien', 'En savoir plus →', undefined, 30),
          L('accueil.service2.titre', 'Service 2 : titre', 'Accessoires', undefined, 40),
          P('accueil.service2.texte', 'Service 2 : texte', 'Large gamme d\'accessoires et d\'équipements pour votre sécurité et votre confort. Casques, gants, bagagerie et plus.', undefined, 240),
          L('accueil.service2.lien', 'Service 2 : lien', 'En savoir plus →', undefined, 30),
          L('accueil.service3.titre', 'Service 3 : titre', 'Entretien & Réparation', undefined, 40),
          P('accueil.service3.texte', 'Service 3 : texte', 'Service d\'entretien et de réparation pour tous types de deux-roues. Prenez rendez-vous par téléphone ou par notre formulaire de contact.', undefined, 240),
          L('accueil.service3.lien', 'Service 3 : lien', 'Prendre rendez-vous →', undefined, 30),
        ],
      },
      {
        titre: 'Pourquoi nous choisir ?',
        textes: [
          L('accueil.pourquoi.titre', 'Titre', 'Pourquoi nous choisir ?', undefined, 60),
          ...atouts('accueil.pourquoi.point', [
            ['Expertise & Passion', 'Une équipe de passionnés à votre service, avec des années d\'expérience dans le deux-roues.'],
            ['Qualité & Fiabilité', 'Des véhicules soigneusement sélectionnés et vérifiés pour votre tranquillité d\'esprit.'],
            ['Satisfaction Client', 'Votre satisfaction est notre priorité. Service personnalisé et suivi après-vente.'],
          ], 'Point'),
        ],
      },
      {
        titre: 'Avis clients',
        textes: [
          L('accueil.avis.titre', 'Titre', 'Votre confiance, notre plus belle récompense', undefined, 70),
          P('accueil.avis.texte', 'Texte', 'Découvrez ce que nos clients pensent de leur expérience chez {nom}.', undefined, 200),
        ],
      },
      {
        titre: 'Équipe',
        aide: 'Section visible si l’équipe est affichée (onglet Équipe).',
        textes: [
          L('accueil.equipe.titre', 'Titre', 'Des passionnés à votre service', undefined, 60),
          P('accueil.equipe.texte', 'Texte', 'Derrière chaque moto, il y a une équipe de passionnés à votre écoute pour vous conseiller et vous accompagner dans votre projet.', undefined, 240),
          L('accueil.equipe.bouton', 'Bouton', 'Découvrir notre équipe', undefined, 30),
        ],
      },
      {
        titre: 'Appel final',
        textes: [
          L('accueil.final.titre', 'Titre', 'Prêt à trouver votre deux-roues ?', undefined, 60),
          P('accueil.final.texte', 'Texte', 'Contactez-nous dès maintenant pour discuter de votre projet ou visiter notre showroom.', undefined, 240),
          L('accueil.final.bouton', 'Bouton', 'Nous contacter', undefined, 30),
        ],
      },
    ],
  },
  { cle: 'vehicules', libelle: 'Nos véhicules', description: 'Catalogue des motos et scooters.', chemin: '/vehicules', sections: [entete('vehicules', 'Nos Véhicules d\'Occasion')] },
  { cle: 'reprises', libelle: 'Reprises', description: 'Page de demande de reprise.', chemin: '/reprises', sections: [entete('reprises', 'Reprise de votre véhicule', 'Obtenez une estimation rapide et au meilleur prix')] },
  {
    cle: 'vendre', libelle: 'Dépôt-vente', description: 'Page « Vendre ma moto ».', chemin: '/vendre-ma-moto',
    sections: [entete('vendre', 'Vendre ma moto en dépôt-vente', 'Confiez-nous votre moto : nous la vendons pour vous, au juste prix, sans les appels, les visites ni les démarches. Estimation gratuite, paiement sous 48 h après la vente.')],
  },
  { cle: 'financement', libelle: 'Financement', description: 'Simulateur et demande de financement.', chemin: '/financement', sections: [entete('financement', 'Solutions de Financement', 'Financez votre deux-roues en toute simplicité')] },
  { cle: 'recherche', libelle: 'Recherche personnalisée', description: 'Demande de recherche sur mesure.', chemin: '/recherche-personnalisee', sections: [entete('recherche', 'Recherche Personnalisée', 'Nous trouvons le deux-roues de vos rêves')] },
  { cle: 'contact', libelle: 'Contact', description: 'Page de contact et du showroom.', chemin: '/contact', sections: [entete('contact', 'Contactez-nous', 'Nous sommes à votre écoute')] },
  {
    cle: 'equipe', libelle: 'Équipe', description: 'Page de présentation de l’équipe.', chemin: '/equipe',
    sections: [entete('equipe', 'Rencontrez l\'équipe {nom}', 'Chez {nom}, la passion de la moto se partage au quotidien. Découvrez les femmes et les hommes qui mettent leur expérience et leur savoir-faire au service de votre prochain projet moto.')],
  },
  {
    cle: 'suivre', libelle: 'Suivre ma vente', description: 'Espace des propriétaires en dépôt-vente.', chemin: '/suivre-ma-vente',
    sections: [entete('suivre', 'Suivre ma vente', 'Vous nous avez confié votre moto en dépôt-vente ? Suivez ici chaque étape de la vente. Connectez-vous avec l\'adresse e-mail de votre contrat : nous vous envoyons un code, sans mot de passe.')],
  },
  {
    cle: 'pied', libelle: 'Pied de page', description: 'Bas de toutes les pages.', chemin: '/',
    sections: [{ titre: 'Pied de page', textes: [P('pied.description', 'Phrase sous le nom', 'Spécialiste du deux-roues en Île-de-France', undefined, 200)] }],
  },
  {
    cle: 'seo', libelle: 'Référencement Google', description: 'Titre et description de chaque page dans les résultats de recherche.', chemin: null,
    sections: [
      seo('Accueil', 'accueil', '{nom} – Motos et scooters d\'occasion à Chaville (92)', 'Motos et scooters d\'occasion contrôlés et garantis à Chaville (92). Reprise de votre deux-roues, financement et recherche sur mesure en Île-de-France.'),
      seo('Nos véhicules', 'vehicules', 'Motos et scooters d\'occasion à vendre | {nom}', 'Toutes nos motos et scooters d\'occasion à vendre près de Paris : véhicules contrôlés, garantis et au juste prix. Showroom à Chaville (92), Île-de-France.'),
      seo('Reprises', 'reprises', 'Reprise de moto et scooter au meilleur prix | {nom}', 'Faites reprendre votre moto ou votre scooter au meilleur prix : estimation sous 24 h, offre attractive, virement immédiat. {nom}, Chaville (92).'),
      seo('Dépôt-vente', 'vendre', 'Vendre ma moto en dépôt-vente | {nom}', 'Confiez votre moto à {nom} : réponse sous 48 h ouvrées, nous gérons l\'annonce, les visites et la vente, vous êtes payé sous 48 h. Chaville (92).'),
      seo('Financement', 'financement', 'Financement moto et scooter d\'occasion | {nom}', 'Financez votre moto ou scooter d\'occasion : simulation gratuite, réponse rapide, paiement en 3x, 4x ou 10x par carte avec Alma. {nom}, Chaville (92).'),
      seo('Recherche personnalisée', 'recherche', 'Recherche personnalisée de moto ou scooter | {nom}', 'Vous cherchez un modèle précis ? Confiez-nous votre recherche : nous trouvons la moto ou le scooter qui vous correspond, selon vos critères et votre budget.'),
      seo('Contact', 'contact', 'Contact et showroom à Chaville | {nom}', '', 'Vide : description automatique avec l’adresse, le téléphone et les horaires (Infos du site).'),
      seo('Équipe', 'equipe', 'Notre équipe : des passionnés de moto à Chaville | {nom}', 'Rencontrez l\'équipe {nom} : Mattia et des passionnés de deux-roues pour vous conseiller dans l\'achat, la reprise ou le dépôt-vente de votre moto.'),
    ],
  },
];

/** Tous les textes, par clé (un texte présent sur deux pages n'est compté qu'une fois) */
export const TEXTES: Record<string, DefTexte> = Object.fromEntries(
  PAGES_TEXTES.flatMap((p) => p.sections.flatMap((s) => s.textes)).map((t) => [t.cle, t]),
);

/** Pages du site dont le référencement peut être modifié (chemin → clé seo) */
export const SEO_PAGES: Record<string, string> = {
  '/': 'accueil', '/vehicules': 'vehicules', '/reprises': 'reprises', '/vendre-ma-moto': 'vendre',
  '/financement': 'financement', '/recherche-personnalisee': 'recherche', '/contact': 'contact', '/equipe': 'equipe',
};

export type Textes = Record<string, string>;

/** Caractères de contrôle retirés (sauf tabulation et retour à la ligne) */
const sansControle = (v: string) =>
  Array.from(v).filter((c) => { const n = c.charCodeAt(0); return n === 9 || n === 10 || (n >= 32 && n !== 127); }).join('');
const nettoyer = (v: string, max: number) => sansControle(v.replace(/\r\n?/g, '\n')).trim().slice(0, max);
const LIEN = /^(\/[^\s]*|https:\/\/[^\s]+)$/;

/** Garde les seuls textes connus, nettoyés et limités ; ignore les valeurs identiques à l'origine */
export function normaliserTextes(brut: unknown): Textes {
  const sortie: Textes = {};
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) return sortie;
  for (const [cle, v] of Object.entries(brut as Record<string, unknown>)) {
    const def = TEXTES[cle];
    if (!def || typeof v !== 'string') continue;
    const propre = nettoyer(v, def.max ?? 420);
    if (def.type === 'lien' && propre && !LIEN.test(propre)) continue;
    if (propre !== def.defaut) sortie[cle] = propre;
  }
  return sortie;
}

/** Nom du site (texte « site.nom ») */
export const nomSite = (t: Textes) => (t['site.nom']?.trim() || TEXTES['site.nom'].defaut);

/**
 * Texte final d'une clé : la version modifiée, sinon celle d'origine ; un texte
 * vidé reprend l'origine (sauf ceux qui sont vides à l'origine : annonce…).
 */
export function texte(t: Textes, cle: string): string {
  const def = TEXTES[cle];
  const brut = t[cle];
  const v = brut !== undefined && (brut.trim() || !def?.defaut) ? brut : def?.defaut ?? '';
  return cle === 'site.nom' ? v : v.split('{nom}').join(nomSite(t));
}

/** Remplace le nom d'origine par le nom du site (titres, descriptions, données Google) */
export function avecNom(s: string, t: Textes): string {
  const nom = nomSite(t);
  return nom === 'SVM Ride' ? s : s.split('SVM Ride').join(nom);
}
