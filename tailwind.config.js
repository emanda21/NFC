/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ── Daris NFC Official Brand Palette ── */
        "primary-burgundy": {
          DEFAULT: "#3d1313",
          light:   "#4a1c1c",
          dark:    "#2a0c0c",
          deeper:  "#1a0808",
        },
        "primary-gold": {
          DEFAULT: "#d4af37",
          light:   "#e8c84a",
          muted:   "#c89f50",
          dim:     "#b8922a",
        },
        /* keep old brand alias removed; replace with new tokens */
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
      backgroundImage: {
        "burgundy-gradient":
          "linear-gradient(145deg, #3d1010 0%, #2a0c0c 50%, #1a0808 100%)",
        "gold-gradient":
          "linear-gradient(135deg, #e8c84a 0%, #d4af37 50%, #b8922a 100%)",
      },
    },
  },
  plugins: [],
};
