/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'nav': '1202px',
      },
      colors: {
        chai: {
          orange: '#ea580c',
          orangeLight: '#f97316',
          amber: '#f59e0b',
          dark: '#09090b',
          surfaceDark: '#121316',
          surfaceLight: '#fafafa',
          cardLight: '#ffffff'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'glow-orange': '0 0 25px -5px rgba(234, 88, 12, 0.35)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.3)',
      }
    },
  },
  plugins: [],
}
