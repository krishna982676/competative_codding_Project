/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        cyanDeep: "#0f766e",
        sand: "#f8f5ef",
        amberSoft: "#f8c98d"
      },
      fontFamily: {
        display: ["Syne", "sans-serif"],
        body: ["Manrope", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"]
      },
      boxShadow: {
        panel: "0 16px 44px rgba(15, 23, 42, 0.14)"
      },
      keyframes: {
        riseIn: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        riseIn: "riseIn 450ms ease-out"
      }
    }
  },
  plugins: []
};
