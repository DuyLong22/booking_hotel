/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563EB",
          light: "#EFF6FF",
          dark: "#1D4ED8",
        },
        secondary: {
          DEFAULT: "#0EA5E9",
          light: "#F0F9FF",
          dark: "#0369A1",
        },
        accent: {
          DEFAULT: "#F59E0B",
          light: "#FEF3C7",
          dark: "#B45309",
        },
        background: "#F8FAFC",
        card: "#FFFFFF",
        border: "#E2E8F0",
      },
      borderRadius: {
        'premium': '12px',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
