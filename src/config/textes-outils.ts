/**
 * Outils du registre des textes du site (src/config/textes.ts et
 * src/config/textes-pages/*.ts). Module pur, partagé avec la fonction Netlify
 * « seo » (imports avec l'extension .ts).
 *
 * Conventions :
 *  - une page du registre = une page de l'admin « Textes du site » ; ses
 *    sections suivent l'ordre d'affichage sur le site ;
 *  - clé = « <page>.<section>.<élément> » en minuscules, sans accents
 *    (ex. « reprises.etapes.1.titre ») ; une clé ne change jamais une fois en
 *    ligne (les textes enregistrés y sont rattachés) ;
 *  - valeur d'origine = le texte exact affiché aujourd'hui ;
 *  - « {nom} » = nom du site ; « {n} », « {prix}»… = valeurs calculées par la
 *    page (t(cle, { n: 3 })), à garder telles quelles dans le texte.
 */

export interface DefTexte {
  cle: string;
  libelle: string;
  defaut: string;
  /** Une ligne (titre, bouton), un paragraphe, une adresse de lien, ou un nombre (valeur de calcul) */
  type?: 'ligne' | 'paragraphe' | 'lien' | 'nombre';
  /** Nombre : bornes, décimales et unité affichée */
  nombre?: { min: number; max: number; decimales: number; unite: string };
  /** Autre texte modifiable dans la même bulle d'édition (ex. la valeur du taux sous son intitulé) */
  lie?: string;
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

/** Texte d'une ligne (titre, bouton, libellé) */
export const L = (cle: string, libelle: string, defaut: string, aide?: string, max = 90): DefTexte => ({ cle, libelle, defaut, type: 'ligne', max, aide });
/** Paragraphe */
export const P = (cle: string, libelle: string, defaut: string, aide?: string, max = 420): DefTexte => ({ cle, libelle, defaut, type: 'paragraphe', max, aide });
/** Adresse de lien (page du site « /contact » ou « https://… ») */
export const U = (cle: string, libelle: string, defaut: string, aide?: string): DefTexte => ({ cle, libelle, defaut, type: 'lien', max: 300, aide });

/** Nombre utilisé dans un calcul (ex. taux du simulateur), enregistré avec un point décimal */
export const N = (cle: string, libelle: string, defaut: number, nombre: { min: number; max: number; decimales: number; unite: string }, aide?: string): DefTexte =>
  ({ cle, libelle, defaut: String(defaut), type: 'nombre', max: 10, nombre, aide });

/** Série de cartes « titre + texte » numérotées : <prefixe>1.titre, <prefixe>1.texte… */
export const atouts = (prefixe: string, liste: [string, string][], quoi = 'Atout', maxTitre = 50, maxTexte = 200): DefTexte[] =>
  liste.flatMap(([titre, texte], i) => [
    L(`${prefixe}${i + 1}.titre`, `${quoi} ${i + 1} : titre`, titre, undefined, maxTitre),
    P(`${prefixe}${i + 1}.texte`, `${quoi} ${i + 1} : texte`, texte, undefined, maxTexte),
  ]);

/** En-tête d'une page : titre et introduction (clés <page>.titre et <page>.intro) */
export const entete = (page: string, titre: string, intro?: string): SectionTextes => ({
  titre: 'En-tête de la page',
  textes: [L(`${page}.titre`, 'Titre', titre, undefined, 70), ...(intro !== undefined ? [P(`${page}.intro`, 'Introduction', intro)] : [])],
});
