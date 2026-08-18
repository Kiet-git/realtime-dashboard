import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        deep: "#0B0F14",
        panel: "#121820",
        raised: "#1A222C",
        edge: "#232C38",
        ink: "#E4EAF0",
        muted: "#6B7785",
        phosphor: "#3DDC97",
        amber: "#F0A93C",
        crimson: "#EF5B5B",
        cyan: "#4FC3F7",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.02) inset, 0 0 0 1px #232C38",
      },
      keyframes: {
        pulseline: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        flashin: {
          "0%": { opacity: "0", transform: "translateY(-4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        pulseline: "pulseline 1.6s ease-in-out infinite",
        flashin: "flashin 0.25s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
