export const siteConfig = {
  name: 'SVM Ride',
  description: 'Spécialiste du deux-roues en Île-de-France',
  adresse:
    "77 Rue d'Argenteuil - Asnières sur Seine (sans rendez-vous).\nSur rendez-vous sur nos points de vente en Ile de France. \nHoraires: \nMardi - Samedi : 9h-18h \nLundi : Sur rendez-vous",
  contact: {
    email: 'contact@svmride.com',
    phone: '01 84 19 01 74',
    instagram: '@svm_ride',
    instagramUrl: 'https://instagram.com/svm_ride',
  },
  baseUrl: 'https://svmride.netlify.app',
  ogImage: '/og-image.jpg',
} as const;

export const navLinks = [
  { href: '/', label: 'Accueil' },
  { href: '/vehicules', label: 'Nos Véhicules' },
  { href: '/reprises', label: 'Reprises' },
  { href: '/financement', label: 'Financement' },
  { href: '/recherche-personnalisee', label: 'Recherche personnalisée' },

] as const;
