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
        "primary": "#d4af35", // Alpha Gold
        "background-light": "#f8f7f6",
        "background-dark": "#020617", // Deep Navy
        "risk-red": "#fa4238",
        "risk-amber": "#f59e0b",
        "risk-emerald": "#10b981",
      },
      fontFamily: {
        sans: ["Space Grotesk", "sans-serif"],
        display: ["Space Grotesk", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
