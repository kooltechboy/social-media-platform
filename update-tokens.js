const fs = require('fs');

const designTokensPath = 'packages/design-system/src/index.ts';
let tokens = // Design Tokens for TUKUBI Visual Language (Caribbean Sunrise & Sunset)

export const colors = {
  brand: {
    twilight: '#110D17',        // Deep Twilight Base (replaces Volcanic)
    dusk: '#1D1429',            // Warm Dusk Surface 
    sunriseCoral: '#FF7A59',    // Vibrant Sunrise Coral
    goldenHour: '#FFB347',      // Warm Golden Hour
    caribbeanSea: '#00B4D8',    // Beautiful Tropical Sea
    sandstone: '#FDF2E9',       // Warm Sandstone Text/White
    sunsetPurple: '#8B5CF6',    // Deep Sunset Purple
  },
  gradients: {
    tukubiAmbient: 'linear-gradient(135deg, #110D17 0%, #1D1429 50%, #2A1B38 100%)',
    sunriseGlow: 'radial-gradient(circle at 80% 20%, rgba(255, 122, 89, 0.2), transparent 40%)',
    goldenGlow: 'radial-gradient(circle at 20% 80%, rgba(255, 179, 71, 0.15), transparent 40%)',
    oceanGlow: 'radial-gradient(circle at 50% 50%, rgba(0, 180, 216, 0.15), transparent 50%)',
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
};
\;

fs.writeFileSync(designTokensPath, tokens, 'utf8');

const tailwindConfigPaths = [
  'apps/web/tailwind.config.js',
  'apps/admin/tailwind.config.js',
  'apps/moderation/tailwind.config.js'
];

for (const p of tailwindConfigPaths) {
  let content = fs.readFileSync(p, 'utf8');
  content = content.replace(/volcanic: "[^"]+",/g, 'twilight: "#110D17",');
  content = content.replace(/limestone: "[^"]+",/g, 'sandstone: "#FDF2E9",');
  content = content.replace(/ocean: "[^"]+",/g, 'sunriseCoral: "#FF7A59",');
  content = content.replace(/azure: "[^"]+",/g, 'goldenHour: "#FFB347",');
  content = content.replace(/abyss: "[^"]+",/g, 'caribbeanSea: "#00B4D8",');
  content = content.replace(/raised: "[^"]+"/g, 'sunsetPurple: "#8B5CF6"');
  fs.writeFileSync(p, content, 'utf8');
}
console.log('Tokens updated');
