/**
 * Textes du site : Page Contact.
 * Registre : voir src/config/textes-outils.ts (conventions) et src/config/textes.ts.
 */
import { entete, type PageTextes } from '../textes-outils.ts';

export const PAGES_CONTACT: PageTextes[] = [
  { cle: 'contact', libelle: 'Contact', description: 'Page de contact et du showroom.', chemin: '/contact', sections: [entete('contact', 'Contactez-nous', 'Nous sommes à votre écoute')] },
];
