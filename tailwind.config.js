/** @type {import('tailwindcss').Config} */
// Direction artistique « premium sobre » : les valeurs se règlent dans src/index.css (:root).
const token = (name) => `rgb(var(--${name}-rgb) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        noir: { DEFAULT: token('noir'), profond: token('noir-profond') },
        gris: token('gris-texte'),
        bleu: { DEFAULT: token('bleu'), vif: token('bleu-vif'), hover: token('bleu-hover') },
        or: { DEFAULT: token('or'), texte: token('or-texte'), clair: token('or-clair') },
        fond: token('fond'),
        bordure: token('bordure'),
        champ: token('champ'),
        // Alias historiques, utilisés dans tout le site et l'admin
        brand: { DEFAULT: token('bleu'), dark: token('bleu-hover'), light: token('bleu-clair') },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['Oswald', 'Impact', 'Arial Narrow', 'sans-serif'],
      },
      boxShadow: {
        bleu: '0 6px 16px rgba(10, 79, 214, 0.35)',
        'bleu-fort': '0 8px 22px rgba(10, 79, 214, 0.42)',
        carte: '0 1px 2px rgba(17, 17, 17, 0.04), 0 4px 14px rgba(17, 17, 17, 0.04)',
        vehicule: '0 8px 24px rgba(0, 0, 0, 0.08)',
        'vehicule-fort': '0 14px 32px rgba(0, 0, 0, 0.12)',
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
