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
          gold: '#d4af37',
          blue: '#2d4a5a',
          'blue-light': '#3d5a6a',
        }
      }
    },
  },
  plugins: [],
}
