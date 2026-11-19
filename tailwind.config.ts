import type { Config } from "tailwindcss";

/**
 * Picode design tokens.
 * Colors are CSS variables (space-separated RGB channels, defined in app/globals.css)
 * so every token supports Tailwind's opacity modifier, e.g. `bg-primary/10`.
 */
const withAlpha = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx,mdx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" },
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: withAlpha("--color-primary"), // #2DD4BF — locked
          foreground: withAlpha("--color-primary-foreground"),
          soft: withAlpha("--color-primary-soft"),
          strong: withAlpha("--color-primary-strong"),
        },
        secondary: {
          DEFAULT: withAlpha("--color-secondary"), // #38BDF8 — locked
          foreground: withAlpha("--color-secondary-foreground"),
          soft: withAlpha("--color-secondary-soft"),
          strong: withAlpha("--color-secondary-strong"),
        },
        tertiary: {
          DEFAULT: withAlpha("--color-tertiary"),
          soft: withAlpha("--color-tertiary-soft"),
        },
        dark: {
          DEFAULT: withAlpha("--color-dark"),
          900: withAlpha("--color-dark-900"),
          800: withAlpha("--color-dark-800"),
        },
        background: withAlpha("--color-background"),
        surface: {
          DEFAULT: withAlpha("--color-surface"),
          muted: withAlpha("--color-surface-muted"),
          raised: withAlpha("--color-surface-raised"),
        },
        // Refined cool-neutral grayscale (slightly blue-tinted to harmonise with teal/sky).
        gray: {
          50: withAlpha("--gray-50"),
          100: withAlpha("--gray-100"),
          200: withAlpha("--gray-200"),
          300: withAlpha("--gray-300"),
          400: withAlpha("--gray-400"),
          500: withAlpha("--gray-500"),
          600: withAlpha("--gray-600"),
          700: withAlpha("--gray-700"),
          800: withAlpha("--gray-800"),
          900: withAlpha("--gray-900"),
          950: withAlpha("--gray-950"),
        },
        success: withAlpha("--color-success"),
        warning: withAlpha("--color-warning"),
        danger: withAlpha("--color-danger"),
        info: withAlpha("--color-info"),
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-outfit)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Display scale (Outfit) — fluid between the mobile and desktop sizes in the spec.
        "display-1": [
          "clamp(3rem, 1.8rem + 4.8vw, 5rem)", // 48px → 80px
          { lineHeight: "1.04", letterSpacing: "-0.035em", fontWeight: "700" },
        ],
        "display-2": [
          "clamp(2.5rem, 1.5rem + 4vw, 4.5rem)", // 40px → 72px
          { lineHeight: "1.08", letterSpacing: "-0.03em", fontWeight: "500" },
        ],
        "display-3": [
          "clamp(2.25rem, 1.4rem + 3.4vw, 4rem)", // 36px → 64px
          { lineHeight: "1.1", letterSpacing: "-0.025em", fontWeight: "500" },
        ],
        // Headings (Outfit)
        h1: ["clamp(1.875rem, 1.5rem + 1.2vw, 2.25rem)", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "700" }],
        h2: ["clamp(1.5rem, 1.3rem + 0.8vw, 1.75rem)", { lineHeight: "1.25", letterSpacing: "-0.01em", fontWeight: "600" }],
        h3: ["1.25rem", { lineHeight: "1.35", fontWeight: "600" }],
        // Body (Poppins)
        "body-xl": ["clamp(1.375rem, 1.1rem + 1vw, 1.75rem)", { lineHeight: "1.45" }],
        "body-lg": ["1.25rem", { lineHeight: "1.6" }],
        "body-md": ["1.125rem", { lineHeight: "1.6" }],
        "body-sm": ["0.875rem", { lineHeight: "1.55" }],
      },
      backgroundImage: {
        // Uses the slightly deeper "fill" stops so white labels on it stay legible (same hues).
        "gradient-primary": "linear-gradient(120deg, rgb(var(--fill-from)) 0%, rgb(var(--fill-to)) 100%)",
        "gradient-primary-soft":
          "linear-gradient(120deg, rgb(var(--color-primary) / 0.14) 0%, rgb(var(--color-secondary) / 0.14) 100%)",
        // GPU-cheap soft glows (use instead of large `blur-*` filters behind animated glass).
        "glow-primary": "radial-gradient(closest-side, rgb(var(--color-primary)), rgb(var(--color-primary) / 0))",
        "glow-secondary": "radial-gradient(closest-side, rgb(var(--color-secondary)), rgb(var(--color-secondary) / 0))",
        "glow-brand":
          "radial-gradient(closest-side, rgb(var(--color-secondary)), rgb(var(--color-primary) / 0.6) 55%, rgb(var(--color-primary) / 0))",
        "grid-faint":
          "linear-gradient(to right, rgb(var(--gray-200) / 0.6) 1px, transparent 1px), linear-gradient(to bottom, rgb(var(--gray-200) / 0.6) 1px, transparent 1px)",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15,23,42,0.04), 0 12px 36px -12px rgba(15,23,42,0.16)",
        "inner-soft": "inset 0 2px 4px 0 rgba(0,0,0,0.06)",
        float: "0 1px 3px rgba(15,23,42,0.05), 0 24px 56px -20px rgba(15,23,42,0.26)",
        glow: "0 12px 32px -12px rgb(var(--color-primary) / 0.65)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      transitionDuration: {
        DEFAULT: "300ms",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)",
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        aurora: {
          "0%, 100%": { transform: "translate3d(0,0,0) rotate(0deg) scale(1)" },
          "33%": { transform: "translate3d(6%,-4%,0) rotate(20deg) scale(1.1)" },
          "66%": { transform: "translate3d(-5%,5%,0) rotate(-15deg) scale(0.95)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "marquee-reverse": {
          from: { transform: "translateX(-50%)" },
          to: { transform: "translateX(0)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.8)", opacity: "0.7" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        spin: { to: { transform: "rotate(360deg)" } },
        "spin-reverse": { to: { transform: "rotate(-360deg)" } },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        // Jarvis assistant (components/jarvis)
        "scan-y": {
          from: { transform: "translateY(-100%)" },
          to: { transform: "translateY(100%)" },
        },
        blink: { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.2" } },
      },
      animation: {
        aurora: "aurora var(--aurora-duration, 22s) ease-in-out infinite",
        orbit: "spin var(--orbit-duration, 40s) linear infinite",
        "orbit-reverse": "spin-reverse var(--orbit-duration, 40s) linear infinite",
        shimmer: "shimmer 3s linear infinite",
        marquee: "marquee var(--marquee-duration, 40s) linear infinite",
        "marquee-reverse": "marquee-reverse var(--marquee-duration, 40s) linear infinite",
        "pulse-ring": "pulse-ring 2.4s cubic-bezier(0.22, 1, 0.36, 1) infinite",
        "scan-y": "scan-y 4s linear infinite",
        blink: "blink 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
