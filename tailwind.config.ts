import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "school-primary": "#1B4F72",
        "school-primary-light": "#2471A3",
        "school-accent": "#D4AC0D",
        "school-accent-light": "#F0D95B",
        "school-surface": "#f7f7f5",
        "school-border": "#e0e0e0",
        "school-text": "#1a1a1a",
        "school-text-soft": "#6b6b6b",
        "school-text-muted": "#9ca3af",
        "school-error": "#E85454",
        "school-success": "#4ADE80",
      },
      fontFamily: {
        sans: ["DM Sans", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        blink: "blink 1s step-end infinite",
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { transform: "translateY(8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
