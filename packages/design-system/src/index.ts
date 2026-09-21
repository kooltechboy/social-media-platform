// Design Tokens for TUKUBI Visual Language (Island Vibes / Caribbean Sunrise & Sunset)

export const DEFAULT_THEME = 'island-vibes' as const;

export const colors = {
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
    name: 'Island Vibes',
    id: 'island-vibes',
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
  gradients: {
    tukubiAmbient: 'linear-gradient(135deg, #110D17 0%, #1D1429 50%, #2A1B38 100%)',
    islandVibesHeader: 'linear-gradient(135deg, #00B4D8 0%, #FFB347 50%, #FF7A59 100%)',
    sunriseGlow: 'radial-gradient(circle at 80% 20%, rgba(255, 122, 89, 0.2), transparent 40%)',
    goldenGlow: 'radial-gradient(circle at 20% 80%, rgba(255, 179, 71, 0.15), transparent 40%)',
    oceanGlow: 'radial-gradient(circle at 50% 50%, rgba(0, 180, 216, 0.15), transparent 50%)',
    islandSunset: 'linear-gradient(to bottom, rgba(24, 10, 36, 0.35) 0%, rgba(24, 10, 36, 0.10) 25%, rgba(24, 10, 36, 0.25) 60%, rgba(17, 13, 23, 0.75) 100%)',
  },
  neutral: {
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
    950: '#09090B',
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
  sm: '0.5rem',   
  md: '0.75rem',  
  lg: '1rem',     
  xl: '1.5rem',   
  '2xl': '2rem',  
  full: '9999px',
};

export const elevations = {
  flat: 'none',
  card: '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
  glowCoral: '0 0 25px -5px rgba(255, 122, 89, 0.4)',
  glowGold: '0 0 25px -5px rgba(255, 179, 71, 0.4)',
  glowSea: '0 0 25px -5px rgba(0, 180, 216, 0.4)',
  glowPurple: '0 0 25px -5px rgba(139, 92, 246, 0.4)',
};

export const desktopTokens = {
  typography: {
    display: '2.25rem',         // 36px
    pageTitle: '2rem',          // 32px
    sectionHeading: '1.625rem', // 26px
    cardHeading: '1.25rem',     // 20px
    bodyLarge: '1.125rem',      // 18px
    body: '1.0625rem',          // 17px (~16-18px target)
    bodySmall: '0.9375rem',     // 15px (~14-16px target)
    navigation: '1rem',         // 16px (~15-17px target)
    button: '1rem',             // 16px (~15-17px target)
    label: '0.9375rem',         // 15px (~14-16px target)
    input: '1rem',              // 16px (~15-17px target)
    metadata: '0.875rem',       // 14px (~13-15px target)
    caption: '0.875rem',        // 14px (~13-14px target)
    helperText: '0.8125rem',    // 13px
  },
  icons: {
    primaryNav: '24px',         // 22–26px
    secondaryNav: '22px',       // 20–24px
    action: '22px',             // 20–24px
    postAction: '22px',         // 20–24px
    header: '24px',             // 22–26px
    buttonIcon: '20px',         // 20–24px
    utility: '18px',            // 18–20px
    avatarAdjacent: '22px',     // 20–24px
  },
  controls: {
    minTarget: '44px',
    inputHeight: '46px',
    buttonHeightSm: '38px',
    buttonHeightMd: '44px',
    buttonHeightLg: '50px',
    iconTextGap: '8px',         // 6–10px
  },
};

export const ASPECT_RATIOS = {
  feedDefault: '4 / 5',
  square: '1 / 1',
  landscape: '16 / 9',
  camera: '4 / 3',
  cameraPortrait: '3 / 4',
  reels: '9 / 16',
  cover: '16 / 5',
} as const;

export const RECOMMENDED_MEDIA_DIMENSIONS = {
  feedDefault: { width: 1080, height: 1350 },
  square: { width: 1080, height: 1080 },
  landscape: { width: 1920, height: 1080 },
  camera: { width: 1440, height: 1080 },
  cameraPortrait: { width: 1080, height: 1440 },
  reels: { width: 1080, height: 1920 },
  avatar: { width: 512, height: 512 },
  cover: { width: 1920, height: 600 },
} as const;


