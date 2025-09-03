/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}", "./src/components/figma/ui/**/*.{ts,tsx}", "./src/components/ui/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /* usa direttamente i token CSS (HEX/OKLCH/HSL…) */
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        popover: "var(--popover)",
        "popover-foreground": "var(--popover-foreground)",
        primary: "var(--primary)",
        "primary-foreground": "var(--primary-foreground)",
        secondary: "var(--secondary)",
        "secondary-foreground": "var(--secondary-foreground)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        accent: "var(--accent)",
        "accent-foreground": "var(--accent-foreground)",
        destructive: "var(--destructive)",
        "destructive-foreground": "var(--destructive-foreground)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        overlay: "var(--color-overlay)",
      },
      borderRadius: {
        lg: "var(--radius, 0.5rem)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        xs: ["var(--text-xs)", { lineHeight: "var(--leading-xs)" }],
        sm: ["var(--text-sm)", { lineHeight: "var(--leading-sm)" }],
        base: ["var(--text-base)", { lineHeight: "var(--leading-base)" }],
        lg: ["var(--text-lg)", { lineHeight: "var(--leading-lg)" }],
        xl: ["var(--text-xl)", { lineHeight: "var(--leading-xl)" }],
        "2xl": ["var(--text-2xl)", { lineHeight: "var(--leading-2xl)" }],
        "3xl": ["var(--text-3xl)", { lineHeight: "var(--leading-3xl)" }],
        "4xl": ["var(--text-4xl)", { lineHeight: "var(--leading-4xl)" }],
      },
      container: {
        center: true,
        padding: "1rem",
        screens: { sm: "640px", md: "768px", lg: "1024px", xl: "1280px", "2xl": "1440px" },
      },
      spacing: {
        gutter: "1rem", /* gutter base Figma */
        "gutter-lg": "1.5rem", /* gutter grande */
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-default)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
        card: "var(--shadow-card)",
      },
    },
  },
  // Ensure dynamically-generated classes used by the design system aren't purged.
  // Patterns cover shadow tokens, typography sizes, spacing gutters and font weights.
  safelist: [
    'font-normal',
    'font-medium',
    'font-semibold',
    'font-bold',
    { pattern: /shadow-(xs|sm|DEFAULT|md|lg|xl|2xl|card)/ },
    { pattern: /text-(xs|sm|base|lg|xl|2xl|3xl|4xl)/ },
    { pattern: /gap-(?:gutter|gutter-lg|\d+)/ },
    { pattern: /p(?:x|y|t|b|l|r)?-(?:gutter|gutter-lg|\d+)/ },
    { pattern: /bg-(?:primary|secondary|muted|accent|card|popover)/ },
    { pattern: /text-(?:primary|secondary|muted|accent|card|popover)-foreground/ },
  ],
  plugins: [],
}
