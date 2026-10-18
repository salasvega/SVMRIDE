/**
 * Textes du site : Titres et descriptions Google.
 * Registre : voir src/config/textes-outils.ts (conventions) et src/config/textes.ts.
 */
import { L, P, type PageTextes, type SectionTextes } from '../textes-outils.ts';

const seo = (chemin: string, slug: string, titre: string, description: string, aideDescription?: string): SectionTextes => ({
  titre: `Page ${chemin}`,
  textes: [
    L(`seo.${slug}.titre`, 'Titre dans Google', titre, 'Idéalement 50 à 60 caractères.', 70),
    P(`seo.${slug}.description`, 'Description dans Google', description, aideDescription ?? 'Idéalement 120 à 160 caractères.', 180),
  ],
});

export const PAGES_SEO: PageTextes[] = [
  {
  cle: 'seo', libelle: 'Référencement Google', description: 'Titre et description de chaque page dans les résultats de recherche.', chemin: null,
  sections: [
    seo('Accueil', 'accueil', '{nom} – Motos et scooters d\'occasion à Chaville (92)', 'Motos et scooters d\'occasion contrôlés et garantis à Chaville (92). Reprise de votre deux-roues, financement et recherche sur mesure en Île-de-France.'),
    seo('Nos véhicules', 'vehicules', 'Motos et scooters d\'occasion à vendre | {nom}', 'Toutes nos motos et scooters d\'occasion à vendre près de Paris : véhicules contrôlés, garantis et au juste prix. Showroom à Chaville (92), Île-de-France.'),
    seo('Reprises', 'reprises', 'Reprise de moto et scooter au meilleur prix | {nom}', 'Faites reprendre votre moto ou votre scooter au meilleur prix : estimation sous 24 h, offre attractive, virement immédiat. {nom}, Chaville (92).'),
    seo('Dépôt-vente', 'vendre', 'Vendre ma moto en dépôt-vente | {nom}', 'Confiez votre moto à {nom} : réponse sous 48 h ouvrées, nous gérons l\'annonce, les visites et la vente, vous êtes payé sous 48 h. Chaville (92).'),
    seo('Financement', 'financement', 'Financement moto et scooter d\'occasion | {nom}', 'Financez votre moto ou scooter d\'occasion : simulation gratuite, réponse rapide, paiement en 3x, 4x ou 10x par carte avec Alma. {nom}, Chaville (92).'),
    seo('Recherche personnalisée', 'recherche', 'Recherche personnalisée de moto ou scooter | {nom}', 'Vous cherchez un modèle précis ? Confiez-nous votre recherche : nous trouvons la moto ou le scooter qui vous correspond, selon vos critères et votre budget.'),
    seo('Contact', 'contact', 'Contact et showroom à Chaville | {nom}', '', 'Vide : description automatique avec l’adresse, le téléphone et les horaires (Édition du site).'),
    seo('Équipe', 'equipe', 'Notre équipe : des passionnés de moto à Chaville | {nom}', 'Rencontrez l\'équipe {nom} : Mattia et des passionnés de deux-roues pour vous conseiller dans l\'achat, la reprise ou le dépôt-vente de votre moto.'),
  ],
},
];
