/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        "car-move": "carMove 2.5s linear infinite",
        "pulse-soft": "pulseSoft 3s ease-in-out infinite",
      },
      keyframes: {
        carMove: {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(120%)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.25", transform: "scale(1)" },
          "50%": { opacity: "0.15", transform: "scale(0.8)" },
        },
      },
    },
  },
  plugins: [],
};
