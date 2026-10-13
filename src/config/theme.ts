export const theme = {
  colors: {
    // Valeurs de référence : la couleur réelle se règle dans src/index.css
    primary: '#043C69',
    primaryDark: '#032A4A',
    primaryLight: '#4F8FC7',
    neutral: {
      900: '#111111',
      700: '#444444',
      500: '#777777',
      300: '#AAAAAA',
      100: '#EEEEEE',
      50: '#F9F9F9',
    },
    white: '#FFFFFF',
    black: '#000000',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
    '4xl': '64px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
} as const;
