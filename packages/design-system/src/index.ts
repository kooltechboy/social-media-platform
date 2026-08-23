// Design Tokens for ANTILIA Visual Language

export const colors = {
  brand: {
    primary: '#0F172A',         // Volcanic Charcoal Header / Text Primary
    accent: '#0284C7',          // Azure Premium Accent
    limestoneWhite: '#F8FAFC',  // Limestone White
    oceanDepth: '#031525',      // Deep Ocean Canvas
    surfaceDark: '#070B12',     // Abyss Canvas
    surfaceSlate: '#0F172A',    // Volcanic Card Surface
    surfaceRaised: '#1E293B',   // Volcanic Card Raised
  },
  gradients: {
    antiliaAmbient: 'linear-gradient(135deg, #070B12 0%, #0F172A 50%, #031525 100%)',
    abyssGlow: 'radial-gradient(circle at 80% 20%, rgba(2, 132, 199, 0.15), transparent 40%)',
    volcanicGlow: 'radial-gradient(circle at 20% 80%, rgba(15, 23, 42, 0.5), transparent 40%)',
  },
  neutral: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  }
};

export const typography = {
  fontFamily: {
    heading: 'Plus Jakarta Sans, sans-serif',
    body: 'Inter, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  }
};

export const radii = {
  sm: '0.5rem',   // 8px
  md: '0.75rem',  // 12px
  lg: '1rem',     // 16px
  xl: '1.5rem',   // 24px
  '2xl': '2rem',  // 32px
  full: '9999px',
};

export const elevations = {
  flat: 'none',
  card: '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
  glowAzure: '0 0 25px -5px rgba(2, 132, 199, 0.3)',
  glowEmerald: '0 0 25px -5px rgba(5, 150, 105, 0.3)',
  glowGold: '0 0 25px -5px rgba(245, 158, 11, 0.3)',
};

