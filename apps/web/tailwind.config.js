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
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'Inter', 'sans-serif'],
      },
      // Mature typographic weight scale (ADR-UI-002 "Midnight Reef"):
      // the legacy UI leaned on font-black (900) for small labels, which reads
      // loud / juvenile. Weights are re-mapped centrally so every surface calms down
      // without touching thousands of call sites.
      fontWeight: {
        extrabold: '650',
        black: '700',
      },
      colors: {
        brand: {
          // ── Official TUKUBI identity (packages/design-system OFFICIAL_BRAND_PALETTE) ──
          caribbeanTeal: '#00C2A8',   // Signature teal (logo mark)
          oceanBlue: '#0EA5E9',       // Official ocean blue (interactive)
          deepNavy: '#0B1B3B',        // Official deep navy
          ink: '#060B16',             // Midnight ink — deepest canvas
          porcelain: '#E8EDF5',       // Primary text on dark
          mist: '#94A3B8',            // Secondary text on dark

          // ── Legacy semantic names, re-pointed to the "Midnight Reef" palette ──
          // Names are kept so 6,000+ existing call sites inherit the new identity.
          twilight: '#070D1A',        // Canvas (was purple twilight #110D17)
          dusk: '#0D1628',            // Surface (was #1D1429)
          sunsetPlum: '#15213A',      // Raised surface (was #2A1B38)
          oceanDepth: '#0B1B3B',      // Trust & financial surface
          sunriseCoral: '#F2775A',    // Refined sunset coral — warm accent, used sparingly
          emberCoral: '#C2410C',      // Light-Mode Accessible Deep Ember Coral
          goldenHour: '#F4AE45',      // Golden hour amber (official sunset orange family)
          caribbeanSea: '#0EA5E9',    // Primary interactive accent = official ocean blue
          deepSea: '#0E7490',         // Light-Mode Accessible Deep Sea Cyan
          sandstone: '#E8EDF5',       // Primary text (cool porcelain, was warm #FDF2E9)
          sunsetPurple: '#8B5CF6',    // Official violet
          oceanSurge: '#0284C7',      // Deep Ocean Blue Accent
          palmGreen: '#10B981',       // Tropical Emerald Green
          amberGlow: '#F59E0B',       // Official sunset orange
        },
        islandVibes: {
          canvas: '#070D1A',
          surface: '#0D1628',
          surfaceRaised: '#15213A',
          surfaceTrust: '#0B1B3B',
          surfaceOpaque: '#0B1424',
          surfaceElevated: '#0D1628',
          surfaceCard: 'rgba(11, 19, 35, 0.92)',
          surfaceHeader: 'rgba(7, 13, 26, 0.88)',
          surfaceGlass: 'rgba(9, 16, 30, 0.72)',
          border: 'rgba(148, 163, 184, 0.12)',
          borderHover: 'rgba(14, 165, 233, 0.35)',
          primary: '#0EA5E9',
          onPrimary: '#04101F',
          secondary: '#00C2A8',
          accent: '#F4AE45',
          sea: '#0EA5E9',
          textPrimary: '#E8EDF5',
          textMuted: '#A7B3C5',
          textDim: '#94A3B8',
          success: '#10B981',
          warning: '#FFB347',
          danger: '#F43F5E',
        },
        islandDaylight: {
          canvas: '#FFFDF9',
          surface: '#FFFFFF',
          surfaceRaised: '#F4EFE6',
          surfaceTrust: '#0B1F33',
          primary: '#C2410C',
          primaryBright: '#FF7A59',
          onPrimary: '#FFFFFF',
          secondary: '#0E7490',
          textPrimary: '#18181B',
          textMuted: '#52525B',
          textDim: '#52525B',
        },
      },
      boxShadow: {
        // Glows are intentionally subtle in the mature identity
        'glow-coral': '0 0 24px -8px rgba(242, 119, 90, 0.30)',
        'glow-gold': '0 0 24px -8px rgba(244, 174, 69, 0.30)',
        'glow-sea': '0 0 24px -8px rgba(14, 165, 233, 0.35)',
        'glow-purple': '0 0 24px -8px rgba(139, 92, 246, 0.30)',
        'panel': '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 12px 32px -16px rgba(0,0,0,0.65)',
        'panel-lg': '0 1px 0 0 rgba(255,255,255,0.05) inset, 0 24px 48px -24px rgba(0,0,0,0.75)',
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
