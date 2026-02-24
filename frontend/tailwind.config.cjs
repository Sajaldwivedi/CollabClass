/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["system-ui", "ui-sans-serif", "sans-serif"]
      },
      colors: {
        background: "hsl(222.2 84% 4.9%)",
        foreground: "hsl(210 40% 98%)",
        muted: {
          DEFAULT: "hsl(215 20.2% 65.1%)",
          foreground: "hsl(217.9 10.6% 64.9%)"
        },
        card: {
          DEFAULT: "hsl(222.2 84% 4.9%)",
          foreground: "hsl(210 40% 98%)"
        },
        border: "hsl(217.2 32.6% 17.5%)",
        ring: "hsl(222.2 84% 4.9%)",
        primary: {
          DEFAULT: "hsl(221 83% 53%)",
          foreground: "hsl(210 40% 98%)"
        },
        secondary: {
          DEFAULT: "hsl(262 83% 60%)",
          foreground: "hsl(210 40% 98%)"
        },
        accent: {
          DEFAULT: "hsl(142 76% 45%)",
          foreground: "hsl(222.2 47.4% 11.2%)"
        },
        destructive: {
          DEFAULT: "hsl(0 84.2% 60.2%)",
          foreground: "hsl(210 40% 98%)"
        }
      },
      boxShadow: {
        "soft-xl":
          "0 24px 60px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(148, 163, 184, 0.15)"
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem"
      }
    }
  },
  plugins: []
};
