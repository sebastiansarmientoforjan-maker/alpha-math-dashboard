/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        alpha: {
          // Alpha Gold Palette (Marca Principal)
          gold: '#D4AF37',       // Oro oficial
          'gold-light': '#F3D250',
          'gold-dim': 'rgba(212, 175, 55, 0.15)', // Fondos sutiles
          
          // Alpha Navy/Dark Palette (Fondos)
          navy: '#0C2D48',       // Azul marino profundo
          'navy-light': '#144a75',
          'navy-bg': '#050b14',  // Fondo principal (reemplaza el negro)
          
          // Semantic Colors (Botones)
          action: '#D4AF37',     
          'action-hover': '#B5952F'
        }
      },
      backgroundImage: {
        'alpha-gradient': 'linear-gradient(135deg, #0C2D48 0%, #050b14 100%)',
      }
    },
  },
  plugins: [],
}
