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
          twilight: '#110D17',        // Deep Twilight Base (Island Vibes night sky)
          dusk: '#1D1429',            // Warm Dusk Surface 
          sunsetPlum: '#2A1B38',      // Deep Plum Raised Surface
          sunriseCoral: '#FF7A59',    // Vibrant Sunrise Coral
          goldenHour: '#FFB347',      // Warm Golden Hour
          caribbeanSea: '#00B4D8',    // Beautiful Tropical Sea
          sandstone: '#FDF2E9',       // Warm Sandstone Text/White
          sunsetPurple: '#8B5CF6',    // Deep Sunset Purple
          oceanSurge: '#0284C7',      // Deep Ocean Blue Accent
          palmGreen: '#10B981',       // Tropical Emerald Green
          amberGlow: '#F59E0B',       // Amber Glow
        },
        islandVibes: {
          canvas: '#110D17',
          surface: '#1D1429',
          surfaceRaised: '#2A1B38',
          surfaceOpaque: '#161022',
          surfaceElevated: '#1D1429',
          surfaceCard: 'rgba(22, 16, 34, 0.94)',
          surfaceHeader: 'rgba(17, 13, 23, 0.92)',
          surfaceGlass: 'rgba(17, 13, 23, 0.70)',
          border: 'rgba(255, 255, 255, 0.10)',
          borderHover: 'rgba(255, 122, 89, 0.40)',
          primary: '#FF7A59',
          secondary: '#8B5CF6',
          accent: '#FFB347',
          sea: '#00B4D8',
          textPrimary: '#FDF2E9',
          textMuted: '#A1A1AA',
          textDim: '#71717A',
          success: '#10B981',
          warning: '#FFB347',
          danger: '#F43F5E',
        },
      },
      boxShadow: {
        'glow-coral': '0 0 25px -5px rgba(255, 122, 89, 0.4)',
        'glow-gold': '0 0 25px -5px rgba(255, 179, 71, 0.4)',
        'glow-sea': '0 0 25px -5px rgba(0, 180, 216, 0.4)',
        'glow-purple': '0 0 25px -5px rgba(139, 92, 246, 0.4)',
      },
      fontSize: {
        'desktop-post': ['1.0625rem', { lineHeight: '1.6' }],
        'desktop-nav': ['1rem', { lineHeight: '1.5' }],
        'desktop-meta': ['0.875rem', { lineHeight: '1.4' }],
        'desktop-title': ['1.875rem', { lineHeight: '1.25' }],
      },
      minHeight: {
        'touch-target': '44px',
        'control-sm': '38px',
        'control-md': '44px',
        'control-lg': '48px',
      }
    },
  },
  plugins: [],
}
