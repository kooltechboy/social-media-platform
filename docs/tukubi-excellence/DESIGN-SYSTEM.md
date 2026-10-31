# TUKUBI — Caribbean Futurism Design System
## Document Reference: TUKUBI-EXCELLENCE-DS-001

### 1. Visual Philosophy: "Caribbean Futurism & Midnight Reef"
TUKUBI (*The Caribbean Connected. Born in the Caribbean. Built for the World.*) merges the warmth, vitality, and bioluminescent vibrancy of the Caribbean archipelago with the technological discipline and elegance of modern high-performance interfaces.

The aesthetic standard:
- **Sophisticated & Expensive:** Deep oceanic canvas (`#070D1A`), high-refraction glassmorphism, and subtle border highlights.
- **Warm & Culturally Authentic:** Accents drawn from Caribbean sunrises, coral reefs, turquoise seas, and golden hour twilights.
- **Accessible & High-Performance:** WCAG 2.2 AA compliant contrast ratios ($\ge 4.5:1$ on text), zero layout shifts, and minimum 44px touch targets.

---

### 2. Canonical Color Palette (Source of Truth)

```
┌────────────────────────────────────────────────────────────────────────┐
│                      TUKUBI BRAND PALETTE                              │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ Token             │ Hex Code          │ Cultural & Semantic Purpose    │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ caribbeanTeal     │ #00C2A8           │ Primary Action & Verified Brand│
│ oceanBlue         │ #0EA5E9           │ Secondary Interactive Accent   │
│ violet            │ #8B5CF6           │ Cultural, Creator & Sounds     │
│ sunsetOrange      │ #F59E0B           │ Golden Hour, Alerts & Events   │
│ deepNavy          │ #0B1B3B           │ Elevated Surfaces & Cards      │
│ sand              │ #F8FAFC           │ Primary Headline Text          │
│ canvasDark        │ #070D1A           │ Midnight Reef Background       │
│ oceanDepth        │ #0B1F33           │ Financial & Trust Surfaces     │
│ mist              │ #94A3B8           │ Subtitle & Supporting Text     │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

---

### 3. Typography Scale & Hierarchy

- **Display & Headings:** `font-display` (Cal Sans / Inter Bold), `-0.02em` letter-spacing, tight leading.
  - Page Titles: `text-2xl` to `text-3xl` (`24px`–`30px`, font-bold, `#F8FAFC`).
  - Section Headers: `text-base` to `text-lg` (`16px`–`18px`, font-semibold, `#F8FAFC`).
- **Body & Interface Copy:** `font-sans` (Inter / system fallback), optimal readability.
  - Body Text: `text-sm` (`14px`, line-height `1.5`, `#E8EDF5`).
  - Secondary Copy: `text-xs` (`12px`, line-height `1.4`, `#94A3B8`).
  - Badges & Footers: `text-[10px]` to `text-[11px]`, font-medium, tracking-wide.

---

### 4. Elevation, Radii & Glass Surfaces

- **Borders:** `border-white/[0.08]` for subtle resting separation, `border-white/[0.16]` on hover.
- **Glassmorphic Panels:** `bg-[#0D1628]/95 backdrop-blur-2xl` for dialogs and sheets.
- **Border Radii:**
  - Pills & Badges: `rounded-full`.
  - Buttons & Form Inputs: `rounded-xl` (`12px`).
  - Cards & Containers: `rounded-2xl` (`16px`).
  - Modal Sheets & Drawers: `rounded-t-3xl` (`24px`).

---

### 5. Mobile Component Hierarchy & Ergonomics

1. **Top App Bar (`AppHeader`):**
   - Fixed height with published `--app-header-h` CSS variable.
   - Houses Logo, Search, Notifications (`Bell` with live unread badge), Direct Messages (`MessageSquare` with live unread badge), and Drawer Menu (`Menu`).
2. **Bottom Navigation (`MobileNav` & Expo `Tab.Navigator`):**
   - 5-destination bottom navigation:
     1. `Home` (`/`)
     2. `Discover` (`/explore`)
     3. `Create` (Flush-Integrated Teal $\to$ Ocean gradient pill)
     4. `Shots` (`/shorts`)
     5. `Profile` (`/profile/[username]` or `/login`)
   - Guaranteed minimum $44 \times 44\text{px}$ touch targets.
   - Safe-area inset bottom padding (`h-safe-b`).
