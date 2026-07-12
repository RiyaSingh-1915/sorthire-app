import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B1020",
        paper: "#F6F4EF",
        surface: {
          DEFAULT: "rgba(255,255,255,0.06)",
          light: "rgba(11,16,32,0.04)",
        },
        signal: {
          DEFAULT: "#6C5CE7",
          soft: "#8B7EF0",
        },
        apply: {
          DEFAULT: "#1FB574",
          soft: "#173B2C",
        },
        skip: {
          DEFAULT: "#F0455C",
          soft: "#3B1720",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backdropBlur: { xs: "2px" },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0,0,0,0.28)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
