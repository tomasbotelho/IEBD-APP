/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        pine: {
          50: "#f5f5f5",
          100: "#ebebeb",
          200: "#d4d4d4",
          500: "#171717",
          600: "#0a0a0a",
          700: "#000000"
        },
        sand: {
          50: "#ffffff",
          100: "#fafafa",
          200: "#e7e7e7"
        },
        coral: {
          500: "#525252",
          600: "#262626"
        },
        ink: {
          700: "#2a2a2a",
          900: "#050505"
        }
      },
      fontFamily: {
        display: ["'Barlow Condensed'", "ui-sans-serif", "system-ui"],
        body: ["Manrope", "ui-sans-serif", "system-ui"]
      },
      boxShadow: {
        card: "0 18px 60px rgba(0, 0, 0, 0.08)"
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top left, rgba(255,255,255,0.14), transparent 34%), linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))"
      }
    }
  },
  plugins: []
};
