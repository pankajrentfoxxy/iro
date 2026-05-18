import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#0a1628", light: "#152238", muted: "#94a3b8" },
        saffron: "#f97316",
      },
    },
  },
  plugins: [],
};

export default config;
