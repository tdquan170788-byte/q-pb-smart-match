import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d8ebff",
          200: "#b9dcff",
          300: "#8dc7ff",
          400: "#58a8ff",
          500: "#2f86ff",
          600: "#1466f5",
          700: "#0d50e1",
          800: "#1143b6",
          900: "#153b8f"
        }
      },
      boxShadow: {
        card: "0 8px 30px rgba(16, 24, 40, 0.08)"
      },
      borderRadius: {
        xl2: "1.25rem"
      }
    },
  },
  plugins: [],
};

export default config;