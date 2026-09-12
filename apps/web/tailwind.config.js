/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      screens: {
        '3xl': '1600px',
        '4xl': '1920px',
        '5xl': '2560px',
      },
      spacing: {
        'sidebar': '260px',
        'sidebar-collapsed': '72px',
        'rail': '340px',
      },
      maxWidth: {
        'content-text': '760px',
        'app-lg': '1800px',
        'app-xl': '2200px',
        'app-ultra': '2800px',
      },
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
