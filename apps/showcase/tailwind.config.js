/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#171A2B',
        paper: '#FBF8F2',
        teal: '#1F6F5C',
        brick: '#B23A3A',
        violet: { 500: '#6B3FE0', 600: '#5A2FD1', 100: '#EFE9FC' },
        magenta: '#B23A8E',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      backgroundImage: {
        'violet-gradient': 'linear-gradient(135deg, #6B3FE0 0%, #B23A8E 100%)',
      },
    },
  },
  plugins: [],
};