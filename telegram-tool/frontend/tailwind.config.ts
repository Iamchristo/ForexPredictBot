import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0b0e14",
        surface: "#11151f",
        border: "#1f2533",
        accent: "#3b82f6",
        gold: "#d4af37",
        success: "#22c55e",
        danger: "#ef4444",
      },
    },
  },
  plugins: [],
};

export default config;
