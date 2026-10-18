/**
 * Sections qu'on peut masquer ou afficher (admin « Textes du site »). Module
 * pur, partagé avec la fonction Netlify « seo ».
 *
 * Réglage « textes » : « <section>.masquee » = « oui » (absent : affichée).
 * L'en-tête des pages et les formulaires ne sont jamais masquables.
 */

export interface SectionMasquable {
  id: string;
  /** Page et section du registre où se trouve l'interrupteur */
  page: string;
  section: string;
  /** Nom affiché (« Explorez les marques ») */
  libelle: string;
}

const S = (id: string, page: string, section: string, libelle = section): SectionMasquable => ({ id, page, section, libelle });

export const SECTIONS_MASQUABLES: SectionMasquable[] = [
  S('accueil.vente', 'accueil', 'Vente de véhicules d’occasion'),
  S('accueil.arrivages', 'accueil', 'Derniers arrivages'),
  S('accueil.marques', 'accueil', 'Explorez les marques'),
  S('accueil.reprise', 'accueil', 'Reprise de votre véhicule'),
  S('accueil.services', 'accueil', 'Services'),
  S('accueil.pourquoi', 'accueil', 'Pourquoi nous choisir ?'),
  S('accueil.avis', 'accueil', 'Avis clients'),
  S('accueil.equipe', 'accueil', 'Équipe'),
  S('accueil.final', 'accueil', 'Appel final'),
  S('vendre.suivi', 'vendre', 'Votre moto est déjà chez nous ?'),
  S('vendre.etapes', 'vendre', 'Comment ça marche ?'),
  S('vendre.avantages', 'vendre', 'Pourquoi confier votre moto à SVM Ride ?', 'Pourquoi nous confier votre moto ?'),
  S('vendre.faq', 'vendre', 'Questions fréquentes'),
  S('reprises.etapes', 'reprises', 'Comment ça marche ?'),
  S('recherche.service', 'recherche', 'Un service sur-mesure'),
  S('financement.simulateur', 'financement', 'Simulateur de crédit'),
  S('financement.avantages', 'financement', 'Pourquoi financer avec nous ?'),
  S('equipe.collaborateurs', 'equipe', 'À vos côtés au quotidien'),
  S('equipe.final', 'equipe', 'Un projet moto ? Parlons-en'),
];

export const SECTIONS_PAR_ID: Record<string, SectionMasquable> = Object.fromEntries(SECTIONS_MASQUABLES.map((s) => [s.id, s]));
export const cleMasquee = (id: string) => `${id}.masquee`;
/** Section masquable d'une section du registre */
export const sectionMasquable = (page: string, section: string) => SECTIONS_MASQUABLES.find((s) => s.page === page && s.section === section);
