/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#0F172A",
          azure: "#0284C7",
          gold: "#F59E0B",
          emerald: "#059669",
          obsidian: "#090D16"
        }
      }
    },
  },
  plugins: [],
}
