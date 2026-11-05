import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ── Design Token System ───────────────────────────── */
        // Lime Spark — success, active, action, AI activity
        lime: {
          DEFAULT: "#B8E62E",
          50: "#F5FBE5",
          100: "#EBF7CC",
          200: "#D7EF99",
          300: "#C3E766",
          400: "#B8E62E",
          500: "#9ACC1A",
          600: "#7AA314",
          700: "#5A7A0F",
          800: "#3B510A",
          900: "#1B2805",
        },
        // Graphite — dark foundation, navigation, code surfaces
        graphite: {
          DEFAULT: "#1E2028",
          50: "#E8E8EA",
          100: "#D1D1D5",
          200: "#A3A3AB",
          300: "#757581",
          400: "#474757",
          500: "#30323C",
          600: "#282A32",
          700: "#1E2028",
          800: "#16171D",
          900: "#0E0F13",
          950: "#0A0A0D",
        },
        // Emerald Ink — deep analytical / AI surfaces
        emerald: {
          DEFAULT: "#0A3D2E",
          50: "#E6F2EE",
          100: "#CCE5DD",
          200: "#99CBBB",
          300: "#66B199",
          400: "#339777",
          500: "#0F5C44",
          600: "#0D4D3A",
          700: "#0A3D2E",
          800: "#072E23",
          900: "#041F17",
        },
        // Champagne — warnings, attention, important findings
        champagne: {
          DEFAULT: "#F5DEB3",
          50: "#FEFCF7",
          100: "#FCF5E8",
          200: "#F9EDD1",
          300: "#F7E5BA",
          400: "#F5DEB3",
          500: "#EEC882",
          600: "#E7B251",
          700: "#D99A25",
          800: "#A8771C",
          900: "#775514",
        },
        // Royal Iris — AI intelligence, agent states, reasoning
        iris: {
          DEFAULT: "#7B5EA7",
          50: "#F2EEF7",
          100: "#E5DDEF",
          200: "#CBBBDF",
          300: "#B199CF",
          400: "#9777BF",
          500: "#7B5EA7",
          600: "#634B8A",
          700: "#4B396A",
          800: "#33274A",
          900: "#1C152A",
        },
        // Signal Blue — telemetry, traces, infrastructure
        signal: {
          DEFAULT: "#3B82F6",
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
        },
        // Porcelain — light background, content surfaces
        porcelain: {
          DEFAULT: "#F5F5F0",
          50: "#FFFFFF",
          100: "#FAFAF8",
          200: "#F5F5F0",
          300: "#ECECE4",
          400: "#E0E0D6",
          500: "#D4D4C8",
          600: "#B8B8AA",
          700: "#9C9C8C",
          800: "#7A7A6E",
          900: "#585850",
        },
        // Severity colors
        severity: {
          critical: "#EF4444",
          high: "#F59E0B",
          medium: "#3B82F6",
          low: "#6B7280",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "Consolas",
          "Monaco",
          "monospace",
        ],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgb(0 0 0 / 0.03)",
        card: "0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        elevated: "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
        panel: "0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)",
      },
      borderRadius: {
        lg: "0.625rem",
        md: "0.4375rem",
        sm: "0.3125rem",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-in": "slideIn 0.3s ease-out",
        "slide-up": "slideUp 0.2s ease-out",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
