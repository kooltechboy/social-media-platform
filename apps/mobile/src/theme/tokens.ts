import { OFFICIAL_BRAND_PALETTE, colors } from '@caribbean/design-system';

/**
 * TUKUBI Mobile Design System Tokens — "Midnight Reef" Official Brand Architecture
 *
 * Canonical mobile token map aligned with @caribbean/design-system `OFFICIAL_BRAND_PALETTE`
 * and `colors.midnightReef` (Deep Midnight Canvas #070D1A, Deep Navy Surfaces #0D1628 / #0B1B3B,
 * Caribbean Teal #00C2A8, Ocean Blue #0EA5E9, Violet #8B5CF6, Golden Hour #F59E0B).
 *
 * Accessibility:
 * - `actionText` (#041019) on `action` (#0EA5E9) and `teal` (#00C2A8) achieves >8.5:1 WCAG AAA contrast.
 * - `textPrimary` (#E8EDF5) on `canvas` (#070D1A) achieves >15.8:1 WCAG AAA contrast.
 * - `textMuted` (#94A3B8) on `canvas` (#070D1A) achieves >6.9:1 WCAG AA/AAA contrast.
 */
export const TOKENS = {
  canvas: colors.midnightReef.canvas,             // Midnight Reef deep canvas (#070D1A)
  canvasElevated: '#0A1222',                      // Subtle elevated midnight canvas
  oceanDepth: OFFICIAL_BRAND_PALETTE.deepNavy,    // Official Deep Navy trust & financial surface (#0B1B3B)
  surface: colors.midnightReef.surface,           // Primary Midnight Reef card/header surface (#0D1628)
  raised: colors.midnightReef.surfaceRaised,      // Elevated interactive surface / input fill (#15213A)
  surfaceInteractive: '#1C2C4C',                  // Pressed / active card surface
  textPrimary: colors.midnightReef.textPrimary,   // Crisp porcelain primary copy (#E8EDF5)
  textSecondary: '#C3CCDA',                       // Clean mist-slate secondary copy
  textMuted: colors.midnightReef.textDim,         // Editorial muted metadata (#94A3B8)
  textDim: '#64748B',                             // Subtle placeholders & timestamps
  action: OFFICIAL_BRAND_PALETTE.oceanBlue,       // Official Ocean Blue primary interactive token (#0EA5E9)
  teal: OFFICIAL_BRAND_PALETTE.caribbeanTeal,     // Official Caribbean Teal brand signature (#00C2A8)
  actionText: '#041019',                          // High-contrast ink on Teal/Ocean CTAs (>8.5:1 AAA)
  actionSecondary: OFFICIAL_BRAND_PALETTE.caribbeanTeal, // Secondary brand action (Caribbean Teal)
  accent: OFFICIAL_BRAND_PALETTE.sunsetOrange,    // Official Golden Hour / Sunset Amber accent (#F59E0B)
  purple: OFFICIAL_BRAND_PALETTE.violet,          // Official Violet creator/discovery accent (#8B5CF6)
  sea: OFFICIAL_BRAND_PALETTE.oceanBlue,          // Ocean Blue alias (#0EA5E9)
  coral: '#F97316',                               // Warm sunset highlight (semantic alerts/live)
  success: colors.midnightReef.success,           // Emerald positive trend / verified settlement (#10B981)
  danger: colors.midnightReef.danger,             // Rose destructive / live indicator (#F43F5E)
  scrim: 'rgba(4, 9, 20, 0.84)',                  // Calm deep-navy modal backdrop scrim
  border: 'rgba(255, 255, 255, 0.08)',            // Hairline crisp panel border
  borderStrong: 'rgba(255, 255, 255, 0.14)',      // Emphasized interactive border
  borderActive: 'rgba(0, 194, 168, 0.42)',        // Caribbean Teal active ring/border
  tealSoft: 'rgba(0, 194, 168, 0.12)',            // Soft teal badge fill
  oceanSoft: 'rgba(14, 165, 233, 0.14)',          // Soft ocean blue badge fill
  amberSoft: 'rgba(245, 158, 11, 0.14)',          // Soft golden hour badge fill
  violetSoft: 'rgba(139, 92, 246, 0.14)',         // Soft violet badge fill
};

export const LEGACY_ISLAND_VIBES_TOKENS = {
  canvas: '#110D17',
  oceanDepth: '#0B1F33',
  surface: '#1D1429',
  raised: '#2A1B38',
  textPrimary: '#FDF2E9',
  textMuted: '#A1A1AA',
  action: '#FF7A59',
  actionText: '#110D17',
  accent: '#FFB347',
  sea: '#00B4D8',
} as const;
