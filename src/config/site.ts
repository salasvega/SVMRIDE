/** Un showroom ; `note` facultative (ex. « sur rendez-vous ») affichée sous l'adresse */
export interface Showroom {
  name: string;
  address: string;
  postalCode: string;
  city: string;
  fullAddress: string;
  mapsUrl: string;
  note?: string;
}

const showrooms: Showroom[] = [
  {
    name: 'Chaville',
    address: '310 Avenue Roger Salengro',
    postalCode: '92370',
    city: 'Chaville',
    fullAddress: '310 Avenue Roger Salengro, 92370 Chaville',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=310+Avenue+Roger+Salengro+92370+Chaville',
  },
];

export const siteConfig = {
  name: 'SVM Ride',
  description: 'Spécialiste du deux-roues en Île-de-France',
  showrooms,
  /** Ancienne valeur : le siège se modifie désormais dans l'admin (« Édition du site », bloc Société) */
  siegeSocial: '3 Rue Émile Verhaeren, 92210 Saint-Cloud',
  adresse:
    "310 Avenue Roger Salengro, 92370 Chaville\nSur rendez-vous sur nos points de vente en Ile de France.\nHoraires:\nMardi - Samedi : 9h-18h\nLundi : Sur rendez-vous",
  contact: {
    email: 'contact@svmride.com',
    phone: '01 84 19 01 74',
    instagram: '@svm_ride',
    instagramUrl: 'https://instagram.com/svm_ride',
  },
  baseUrl: 'https://svmride.com',
  ogImage: '/og-image.jpg',
} as const;

export const navLinks = [
  { href: '/', label: 'Accueil' },
  { href: '/vehicules', label: 'Nos Véhicules' },
  { href: '/reprises', label: 'Reprises' },
  { href: '/vendre-ma-moto', label: 'Dépôt-vente' },
  { href: '/financement', label: 'Financement' },
  { href: '/recherche-personnalisee', label: 'Recherche personnalisée' },

] as const;
