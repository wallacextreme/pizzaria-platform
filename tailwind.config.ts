import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        pizza: {
          terracotta: "#E0533C",
          "terracotta-dark": "#C83E27",
          basil: "#2E7D32",
          "basil-light": "#388E3C",
          gold: "#F59E0B",
          "gold-dark": "#D97706",
          crust: "#D97706",
          charcoal: "#121214",
          "charcoal-card": "#1A1A1E",
          "charcoal-hover": "#24242A",
          border: "#2A2A30",
          cream: "#FDFBF7",
          "cream-muted": "#E5DEC9",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-outfit)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
