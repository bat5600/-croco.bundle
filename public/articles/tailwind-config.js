/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./articles/**/*.html",
    "./articles/**/*.js"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', "sans-serif"],
        display: ['"Plus Jakarta Sans"', "sans-serif"],
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
          900: "#064e3b",
        },
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(to right, #f1f5f9 1px, transparent 1px), linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)",
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme("colors.slate.600"),
            maxWidth: "none",
            p: {
              marginTop: "1.25em",
              marginBottom: "1.25em",
              lineHeight: "1.8",
              fontSize: "1.125rem",
            },
            "h2, h3, h4": {
              color: theme("colors.slate.900"),
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontWeight: "800",
              scrollMarginTop: "100px",
            },
            li: {
              marginTop: "0.5em",
              marginBottom: "0.5em",
            },
            strong: {
              color: theme("colors.slate.900"),
              fontWeight: "700",
            },
          },
        },
      }),
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
