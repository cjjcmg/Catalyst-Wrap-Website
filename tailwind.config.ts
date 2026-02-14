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
        catalyst: {
          black: "#0A0A0A",
          dark: "#111111",
          card: "#1A1A1A",
          elevated: "#222222",
          border: "#2A2A2A",
          red: {
            DEFAULT: "#C41E3A",
            light: "#E63950",
            dark: "#9A1830",
          },
          blue: {
            DEFAULT: "#1E3A5F",
            light: "#2A5080",
            dark: "#152A45",
          },
          grey: {
            100: "#F5F5F5",
            200: "#E0E0E0",
            300: "#BDBDBD",
            400: "#9E9E9E",
            500: "#757575",
            600: "#616161",
            700: "#424242",
            800: "#303030",
          },
        },
      },
      fontFamily: {
        heading: ["var(--font-outfit)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        "fade-in": "fade-in 0.4s ease-out forwards",
        "slide-up": "slide-up 0.5s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
