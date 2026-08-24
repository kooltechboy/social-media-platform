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
          twilight: "#110D17",
          sandstone: "#FDF2E9",
          sunriseCoral: "#FF7A59",
          goldenHour: "#FFB347",
          caribbeanSea: "#00B4D8",
          sunsetPurple: "#8B5CF6"
        }
      }
    },
  },
  plugins: [],
}
