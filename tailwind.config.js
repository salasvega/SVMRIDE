/** @type {import('tailwindcss').Config} */
// Direction artistique : les valeurs se règlent dans src/index.css (:root) et dans le Studio Design (admin).
const token = (name) => `rgb(var(--${name}-rgb) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        noir: { DEFAULT: token('noir'), profond: token('noir-profond') },
        gris: token('gris-texte'),
        bleu: { DEFAULT: token('bleu'), vif: token('bleu-vif'), hover: token('bleu-hover') },
        lien: token('lien'),
        'sur-bouton': token('sur-bouton'),
        or: { DEFAULT: token('or'), texte: token('or-texte'), clair: token('or-clair'), voile: token('or-voile'), 'voile-leger': token('or-voile-leger') },
        fond: token('fond'),
        surface: token('surface'),
        bordure: token('bordure'),
        champ: token('champ'),
        // Textes atténués sur fond clair (part du texte principal)
        doux: { 68: token('doux-68'), 64: token('doux-64'), 62: token('doux-62'), 58: token('doux-58') },
        // Textes sur fond sombre (part du blanc sur la couleur primaire)
        inverse: {
          DEFAULT: token('inverse'),
          91: token('inverse-91'), 88: token('inverse-88'), 84: token('inverse-84'), 74: token('inverse-74'),
          66: token('inverse-66'), 53: token('inverse-53'), 52: token('inverse-52'),
        },
        // Alias historiques, utilisés dans tout le site et l'admin
        brand: { DEFAULT: token('bleu'), dark: token('bleu-hover'), light: token('bleu-clair') },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['Oswald', 'Impact', 'Arial Narrow', 'sans-serif'],
      },
      // Ombres et arrondis réglables dans le Studio Design (variables de src/index.css)
      boxShadow: {
        bleu: 'var(--ombre-bleu)',
        'bleu-fort': 'var(--ombre-bleu-fort)',
        carte: 'var(--ombre-carte)',
        vehicule: 'var(--ombre-vehicule)',
        'vehicule-fort': 'var(--ombre-vehicule-fort)',
      },
      borderRadius: {
        bouton: 'var(--rayon-bouton)',
        carte: 'var(--rayon-carte)',
        'carte-moto': 'var(--rayon-carte-moto)',
      },
      backgroundImage: {
        'degrade-or': 'var(--degrade-or)',
      },
      transitionDuration: {
        180: '180ms',
      },
    },
  },
  plugins: [],
};
