import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--bg)",
        foreground: "var(--ink)",
        bg2: "var(--bg2)",
        bg3: "var(--bg3)",
        muted: "var(--muted)",
        rule: "var(--rule)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        accent2: "var(--accent2)",
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "theme-icon-in": "theme-icon-in 0.25s ease-out",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(100%)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "theme-icon-in": {
          from: { opacity: "0", transform: "scale(0.8) rotate(-90deg)" },
          to: { opacity: "1", transform: "scale(1) rotate(0deg)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
