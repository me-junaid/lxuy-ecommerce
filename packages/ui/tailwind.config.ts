import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    '../../apps/web/src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        luxury: {
          gold: '#C5A880',
          dark: '#111111',
          cream: '#FDFBF7',
          charcoal: '#1A1A1A',
          silver: '#E5E5E5',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'sans-serif'],
        serif: ['var(--font-serif)', 'Playfair Display', 'serif'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      letterSpacing: {
        luxury: '0.15em',
        widest: '0.25em',
      },
    },
  },
  plugins: [],
};

export default config;
