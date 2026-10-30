# TUKUBI Official Brand Identity Guide & Specification
**The Caribbean Connected • Born in the Caribbean. Built for the World.**

---

## 1. Brand Essence & Source of Truth

The approved TUKUBI brand identity represents Caribbean Futurism — bridging the warmth, vitality, and brilliance of the Caribbean with world-class engineering, digital sovereignty, and global connectivity.

- **Brand Name:** TUKUBI (Always capitalized in official lockups).
- **Official Tagline:** "The Caribbean Connected."
- **Creative Source of Truth:** Approved master concept (`media_1793323302123_b3aab962.jpg`).

---

## 2. Official Brand Palette

The TUKUBI color system is derived directly from Caribbean natural phenomena: morning teal waters, mid-day ocean depths, twilight purple skies, and glowing sunset horizons.

| Color Name | Hex Code | RGB | HSL | Primary Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Caribbean Teal** | `#00C2A8` | `0, 194, 168` | `172°, 100%, 38%` | Symbol crossbar, primary action buttons, active states, verification badges |
| **Ocean Blue** | `#0EA5E9` | `14, 165, 233` | `199°, 89%, 48%` | Symbol upper ribbon, primary links, secondary accents |
| **Violet** | `#8B5CF6` | `139, 92, 246` | `258°, 90%, 66%` | Symbol ribbon body, Creator Hub surfaces, ambient glows |
| **Sunset Orange** | `#F59E0B` | `245, 158, 11` | `38°, 92%, 50%` | Symbol ribbon tail, golden hour alerts, highlights |
| **Deep Navy** | `#0B1B3B` | `11, 27, 59` | `220°, 69%, 14%` | App icon background, dark canvas, primary typography on light mode |
| **Sand** | `#F8FAFC` | `248, 250, 252` | `210°, 40%, 98%` | High-contrast typography on dark mode, clean light surfaces |

---

## 3. Brand Asset Family

All vector and raster assets are centrally located in `@caribbean/design-system` (`packages/design-system/brand/`) and distributed across all ecosystem applications.

### A. Primary Horizontal Logo
- `tukubi-logo.svg` (Full-color symbol + Deep Navy wordmark + tagline for light backgrounds)
- `tukubi-logo-dark.svg` (Full-color symbol + Pure White wordmark + tagline for dark backgrounds)
- `tukubi-logo-white.svg` (Pure white silhouette for monochrome reversed applications)
- `tukubi-logo-monochrome.svg` (Deep Navy / Charcoal silhouette for print or single-color media)
- `tukubi-logo-compact.svg` (Streamlined horizontal lockup for tight desktop/mobile headers)

### B. Standalone Brand Symbol
- `tukubi-symbol.svg` (Full-color vector with 3D ribbon fold and 3 splash fronds)
- `tukubi-symbol-white.svg` (White silhouette)
- `tukubi-symbol-monochrome.svg` (Monochrome silhouette)
- `tukubi-emblem.png` (High-density raster emblem with anti-aliasing)

### C. Mobile Application Icon
- `tukubi-app-icon.svg` & `tukubi-app-icon-1024.png` (512px and 1024px squircle with Deep Navy container)
- `tukubi-adaptive-foreground.png` & `tukubi-adaptive-background.png` (Android adaptive icon assets)

### D. Platform & Browser Icons
- `favicon.ico` (Multi-resolution 16px, 32px, 48px standard browser icon)
- `favicon.svg` (Scalable vector favicon for modern browsers)
- `favicon.png` (32px standard PNG favicon)
- `apple-touch-icon.png` (180x180 iOS home screen icon)
- `icon-192.png` & `icon-512.png` (PWA standard installation icons)
- `icon-maskable-192.png` & `icon-maskable-512.png` (PWA adaptive maskable icons)

### E. Social & Metadata
- `tukubi-og-card.png` (1200x630 OpenGraph / Twitter card featuring the official identity and Caribbean Futurism glows)

---

## 4. Clear Space & Minimum Sizing

### Clear Space Rule
Maintain a clear margin surrounding the logo equal to at least half the height of the symbol (`0.5 * H`). No text, graphics, borders, or page edges may intrude into this zone.

### Minimum Sizes
- **Horizontal Logo (with tagline):** Minimum height `28px` (digital) / `10mm` (print).
- **Horizontal Logo (without tagline / compact):** Minimum height `20px` (digital) / `7mm` (print).
- **Standalone Symbol:** Minimum size `16px × 16px` (digital).

---

## 5. Inviolable Brand Rules

1. **Never alter the symbol geometry:** The stylized T mark, folded ribbon contour, and 3 radiating splash fronds are mathematically locked.
2. **Never substitute generic letterforms:** The TUKUBI wordmark uses calibrated geometric vector paths.
3. **Preserve the official tagline:** "The Caribbean Connected." must never be replaced with colloquial or unauthorized taglines.
4. **Maintain contrast ratios:** Always ensure minimum WCAG 2.2 AA contrast (4.5:1 for normal text, 3:1 for large text and UI components).
5. **No arbitrary recoloring:** Never render the symbol in unapproved color combinations. Use the full-color mark, the pure white mark on dark, or the monochrome mark on light.
