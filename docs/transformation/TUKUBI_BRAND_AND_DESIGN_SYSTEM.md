# TUKUBI Brand & Design System Governance (`TUKUBI_BRAND_AND_DESIGN_SYSTEM.md`)

**Program:** `TUKUBI-RTP-001` (Phase 1 Forensic Audit & Phase 3 Brand/Token Specification)  
**Date:** 2026-10-12  
**Owner Decision Reference:** `D-01` (*Adopt `Ocean Depth` `#0B1F33` and `Island Daylight` light theme while preserving `Island Vibes` `#110D17` as default*)  
**Scope:** `packages/design-system/src/index.ts`, `apps/web/src/app/globals.css`, `apps/web/tailwind.config.js`, `packages/ui/src/index.tsx`, `apps/mobile/src/theme/tokens.ts`

---

## 1. Brand Hierarchy & Identity Governance

- **Brand Name:** **TUKUBI**
- **Primary Tagline:** *The Caribbean Connected.*
- **Secondary Tagline:** *Born in the Caribbean. Built for the World.*
- **Visual Direction:** Warm, premium **Caribbean Futurism** — familiar enough to use immediately, distinct enough to remember. Avoid cold enterprise terminology (`"TUKUBI Ecosystem Menu"` $\to$ `"More on TUKUBI"`).

---

## 2. Dual-Theme Token Architecture (`Island Vibes` Dark Default + `Island Daylight` Light Theme + `Ocean Depth` Trust Surface)

### 2.1 Core Brand & Surface Tokens (`@caribbean/design-system`)

| Token Role | `Island Vibes` (Dark Default) | `Island Daylight` (Light Mode) | WCAG 2.2 AA Verification |
| :--- | :--- | :--- | :--- |
| **Primary Canvas** | `#110D17` (`twilight`) | `#FFFDF9` (`coconutAlabaster`) | Base canvas |
| **Elevated Card Surface** | `#1D1429` (`dusk`) | `#FFFFFF` (`pureWhite`) | Card & composer container |
| **Interactive / Hover Surface** | `#2A1B38` (`sunsetPlum`) | `#F4EFE6` (`coralSand`) | Elevated surface / chips |
| **Trust, Financial & Identity Surface** | `#0B1F33` (`oceanDepth`) | `#0B1F33` (`oceanDepth`) | `#FDF2E9` text on `#0B1F33` = **`14.8:1` (AAA)** |
| **Primary Text** | `#FDF2E9` (`sandstone`) | `#18181B` (`volcanicInk`) | `16.4:1` (Dark) / `17.4:1` (Light) — **AAA** |
| **Secondary / Muted Text** | `#B4B4BE` (`textMuted`) | `#52525B` (`warmSlate`) | `>= 5.5:1` on all surfaces — **AA** |
| **Dim / Metadata Text** | `#A1A1AA` (`textDim`, upgraded from `#71717A`) | `#52525B` (`textDim`) | `5.10:1` on Plum, `6.08:1` on Dusk, `6.95:1` on Twilight — **AA** |
| **Primary Brand Accent** | `#FF7A59` (`sunriseCoral`) | `#C2410C` (`emberCoral`) | Dark mode CTA uses `#110D17` ink (**`7.48:1` AAA**); Light mode CTA uses `#FFFFFF` ink on `#C2410C` (**`5.18:1` AA**) |
| **Secondary Brand Accent** | `#00B4D8` (`caribbeanSea`) | `#0E7490` (`deepSea`) | Dark mode uses `#110D17` ink (**`8.12:1` AAA**); Light mode uses `#FFFFFF` ink on `#0E7490` (**`5.36:1` AA**) |
| **Warm Highlight Accent** | `#FFB347` (`goldenHour`) | `#B45309` (`amber Earth`) | Dark mode uses `#110D17` ink (**`10.9:1` AAA**) |

---

## 3. Mandatory Contrast & Motion Rules

1. **Inviolable Sunrise Coral Rule:** `#FF7A59` (`sunriseCoral`) has a luminance of `0.36`, yielding only **`2.33:1`** against `#FFFFFF` (failing WCAG 2.2 AA `4.5:1`). Every button, badge, pill, or icon badge with a `#FF7A59` background across Web and Mobile **must** use `#110D17` (`text-brand-twilight` / `TOKENS.canvas`) text and icon color (`7.48:1` AAA).
2. **Retirement of `#71717A` for Body/Metadata Copy:** `islandVibes.textDim` is upgraded from `#71717A` (`2.90:1`–`3.95:1`) to `#A1A1AA` (`5.10:1`–`6.95:1`).
3. **Reduced Motion Respect:** `apps/web/src/app/globals.css` must include `@media (prefers-reduced-motion: reduce)` to disable non-essential keyframe animations and hover translations.
4. **Multilingual Text Expansion (`localeLayout`):** Buttons, tabs, and chips must allow `+30%` horizontal expansion for Spanish (`es`), French (`fr`), and Haitian Creole (`ht`) without clipping or overlapping adjacent controls.
