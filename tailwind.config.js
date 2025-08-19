// Tailwind v4 config (ESM). Il progetto ha "type":"module" quindi usiamo export default.
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        card: "var(--color-card)",
        'card-foreground': "var(--color-card-foreground)",
        popover: "var(--color-popover)",
        'popover-foreground': "var(--color-popover-foreground)",
        primary: "var(--color-primary)",
        'primary-foreground': "var(--color-primary-foreground)",
        secondary: "var(--color-secondary)",
        'secondary-foreground': "var(--color-secondary-foreground)",
        muted: "var(--color-muted)",
        'muted-foreground': "var(--color-muted-foreground)",
        accent: "var(--color-accent)",
        'accent-foreground': "var(--color-accent-foreground)",
        destructive: "var(--color-destructive)",
        'destructive-foreground': "var(--color-destructive-foreground)",
        border: "var(--color-border)",
        input: "var(--color-input)",
        ring: "var(--color-ring)",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
}