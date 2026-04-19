/* eslint-env node */
// CJS mirror of src/tailwind-preset.ts for consumption by Tailwind's
// synchronous config loader in Next.js. Keep in sync with src/tailwind-preset.ts.
// Values derive from the M3 darkColors palette in src/colors.ts.

module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#ADC6FF",
          container: "#4B8EFF",
          onContainer: "#00285C",
        },
        secondary: {
          DEFAULT: "#E9B3FF",
          container: "#7D01B1",
          onContainer: "#E5A9FF",
        },
        tertiary: {
          DEFAULT: "#47E266",
          container: "#00A73E",
          onContainer: "#00320D",
        },
        surface: {
          DEFAULT: "#131313",
          container: "#201F1F",
          containerHigh: "#2A2A2A",
          onSurface: "#E5E2E1",
        },
        text: {
          primary: "#E5E2E1",
          secondary: "#C1C6D7",
          muted: "#8B90A0",
        },
        semantic: {
          success: "#8AE5A8",
          warning: "#FFD580",
          danger: "#FF9AA2",
        },
        stroke: {
          subtle: "rgba(173, 198, 255, 0.2)",
        },
      },
      spacing: {
        0: "0rem",
        1: "0.25rem",
        2: "0.5rem",
        3: "0.75rem",
        4: "1rem",
        6: "1.5rem",
        8: "2rem",
        10: "2.5rem",
        12: "3rem",
        16: "4rem",
        20: "5rem",
        24: "6rem",
      },
      borderRadius: {
        none: "0rem",
        sm: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.5rem",
        full: "9999px",
      },
      fontFamily: {
        display: ["Manrope", "Segoe UI", "sans-serif"],
        body: ["Inter", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        "glow-primary":
          "0 0 24px rgba(173, 198, 255, 0.35), 0 0 48px rgba(173, 198, 255, 0.2)",
        "glow-secondary":
          "0 0 24px rgba(233, 179, 255, 0.35), 0 0 48px rgba(233, 179, 255, 0.2)",
        "glow-success":
          "0 0 24px rgba(138, 229, 168, 0.35), 0 0 48px rgba(138, 229, 168, 0.2)",
        "glow-warning":
          "0 0 24px rgba(255, 213, 128, 0.35), 0 0 48px rgba(255, 213, 128, 0.2)",
        "glow-danger":
          "0 0 24px rgba(255, 154, 162, 0.35), 0 0 48px rgba(255, 154, 162, 0.2)",
      },
      backgroundImage: {
        "mesh-primary":
          "radial-gradient(circle at 20% 20%, rgba(173,198,255,0.35), transparent 45%), radial-gradient(circle at 80% 0%, rgba(233,179,255,0.25), transparent 40%), radial-gradient(circle at 50% 100%, rgba(108,255,129,0.2), transparent 50%)",
        "mesh-dusk":
          "radial-gradient(circle at 15% 15%, rgba(233,179,255,0.3), transparent 40%), radial-gradient(circle at 85% 10%, rgba(173,198,255,0.3), transparent 45%), radial-gradient(circle at 50% 90%, rgba(255,213,128,0.18), transparent 55%)",
      },
    },
  },
  plugins: [],
};
