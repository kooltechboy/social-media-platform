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
          volcanic: "#0F172A",
          limestone: "#F8FAFC",
          ocean: "#031525",
          azure: "#0284C7",
          abyss: "#070B12",
          raised: "#1E293B"
        }
      }
    },
  },
  plugins: [],
}
