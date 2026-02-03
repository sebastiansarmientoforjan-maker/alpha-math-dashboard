import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ALPHA PROTOCOL DESIGN SYSTEM
        "alpha-gold": "#d4af35",
        "alpha-navy-bg": "#020617",
        "alpha-navy": "#0a0a0a",
        "alpha-navy-light": "#1e293b",
        "alpha-navy-surface": "#0f172a",
        "alpha-gold-dim": "rgba(212, 175, 53, 0.1)",
        
        "risk-red": "#fa4238",
        "risk-amber": "#f59e0b",
        "risk-emerald": "#10b981",
        
        // Legacy
        "primary": "#d4af35",
        "background-light": "#f8f7f6",
        "background-dark": "#020617",
      },
      fontFamily: {
        sans: ["Space Grotesk", "sans-serif"],
        display: ["Space Grotesk", "sans-serif"],
      },
      letterSpacing: {
        'widest': '0.15em',
        'ultra': '0.25em',
      },
      animation: {
        'ticker': 'ticker 40s linear infinite',
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translate3d(0, 0, 0)' },
          '100%': { transform: 'translate3d(-100%, 0, 0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
