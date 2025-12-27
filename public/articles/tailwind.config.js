/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./public/**/*.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        brand: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b"
        }
      }
    },
    typography: {
      sm: {
        css: {
          fontSize: "0.8rem"
        }
      }
    }
  },
  plugins: [require("@tailwindcss/typography")]
};
