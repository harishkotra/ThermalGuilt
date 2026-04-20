import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        abyss: "#09111f",
        plasma: "#f9532d",
        frost: "#61d3ff",
        ember: "#ff7f50",
        mint: "#7ef6c8"
      },
      boxShadow: {
        ghost: "0 0 60px rgba(97, 211, 255, 0.25)",
        shame: "0 0 50px rgba(249, 83, 45, 0.25)"
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" }
        },
        pulseheat: {
          "0%, 100%": { opacity: "0.7", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" }
        }
      },
      animation: {
        drift: "drift 4s ease-in-out infinite",
        pulseheat: "pulseheat 1.4s ease-in-out infinite"
      }
    }
  },
  plugins: []
} satisfies Config;
