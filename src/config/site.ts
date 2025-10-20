export const siteConfig = {
  name: 'SVM Ride',
  description: 'Spécialiste du deux-roues en Île-de-France',
  contact: {
    email: 'contact@svmride.com',
    phone: '06 99 35 28 90',
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
  { href: '/financement', label: 'Financement' },
  { href: '/recherche-personnalisee', label: 'Recherche personnalisée' },

] as const;
