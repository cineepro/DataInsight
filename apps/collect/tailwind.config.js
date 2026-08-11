//apps/collect/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#171A2B',
        marigold: { 500: '#E2A63B', 600: '#C98F27' },
        teal: '#1F6F5C',
        brick: '#B23A3A',
        ticket: '#FBF8F2',
        // alias conservé pour que les classes déjà écrites (bg-brand-600...) héritent de la nouvelle couleur
        brand: { 500: '#E2A63B', 600: '#C98F27' },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};