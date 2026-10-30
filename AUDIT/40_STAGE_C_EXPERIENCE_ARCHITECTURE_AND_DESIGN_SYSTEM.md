# TUKUBI Responsive Experience Architecture & Caribbean Design System — Stage C

**Document Reference:** `AUDIT/40_STAGE_C_EXPERIENCE_ARCHITECTURE_AND_DESIGN_SYSTEM.md`  
**Platform Identity:** TUKUBI — *The Caribbean Connected. Born in the Caribbean. Built for the World.*  
**Date:** October 29, 2026  
**Auditor:** Principal Frontend Architect, UX/UI Lead, and Brand Experience Team

---

## 1. Visual Design Philosophy & Caribbean Futurism Design Tokens

The visual foundation of TUKUBI rejects generic corporate minimalism and dark-mode defaults. Instead, it embodies **Caribbean Futurism**—the warmth, vibrancy, and rich textures of the Caribbean islands fused with high-precision aerospace-grade interface ergonomics.

### 1.1 Core Island Vibes Design Palette (`@caribbean/design-system`)

| Token Name | Hex Code | Semantic Role | Contrast Ratio against Deep Twilight |
|---|---|---|---|
| `brand-sunriseCoral` | `#FF7A59` | Primary dynamic action, vibrant highlight, active state | 4.85:1 (AA Normal Text, AAA Large) |
| `brand-caribbeanSea` | `#00A3A6` | Oceanic trust, verification badges, links, primary CTA accents | 5.24:1 (AA Normal Text, AAA Large) |
| `brand-goldenHour` | `#FFB347` | Warm sunset amber, commerce accents, creator badges | 9.32:1 (AAA Compliant) |
| `brand-twilight` | `#110D17` | Canvas background, deep Caribbean night base | Base (0:1) |
| `brand-sandstone` | `#FDF2E9` | Primary legible body and headline typography | 17.8:1 (AAA Max Compliant) |
| `actionText` | `#110D17` | High-contrast dark text on bright coral/amber pills | 7.48:1 (AAA Compliant) |

Dual Theme Support:
1. **`island-vibes` (Default):** Deep twilight purple-blue canvas with luminous coral, sea blue, and amber ambient glows.
2. **`island-daylight`:** Bright sun-drenched sand canvas (`#FAF7F2`) with crisp oceanic cyan, vibrant terracotta, and deep obsidian typography (`#121826`).

---

## 2. Desktop Information Architecture: 3-Column Ergonomics

The desktop viewport (`>= 1024px`) implements an ergonomically tuned 3-column modular architecture:

```
+----------------------------------------------------------------------------------------------------+
|                                    TUKUBI APP HEADER (Fixed Top)                                   |
+------------------------------------+----------------------------------+----------------------------+
| LEFT COLUMN (240px - 260px)        | CENTER COLUMN (680px - 760px)    | RIGHT COLUMN (300px-340px) |
| Sticky Desktop Primary Navigation  | Independently Scrolling Feed     | Contextual Discovery Rail  |
| - Brand & Identity Switcher        | - Ephemeral Moments Cinema Rail  | - Upcoming Island Events   |
| - Home Stream (For You, Friends)   | - Universal Multi-Media Composer | - Trending Caribbean Vibes |
| - TUKUBI Shorts & Reels            | - 5-Tab Segmented Feed Controls  | - Verified Merchants       |
| - Messaging & Voice Calls          | - Universal Feed Post Stream     | - Sponsored Campaigns      |
| - Caribbean Islands Directory      | - Empty / Loading / Error States | - Suggested Cultural Graph |
| - Communities & Diaspora Hubs      |                                  |                            |
| - Sounds Lounge & Music            |                                  |                            |
| - Marketplace & Stores             |                                  |                            |
| - Cultural Events & Passes         |                                  |                            |
| - Creator Studio & Ads Manager     |                                  |                            |
+------------------------------------+----------------------------------+----------------------------+
```

### 2.1 Ergonomic Rules
- **No Scroll Traps:** The center feed scrolls the main viewport without nested overflow containers on desktop.
- **Viewport-Aware Sticky Rails:** Left navigation is sticky within the window height (`sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto scrollbar-thin`).
- **Right Rail Contextuality:** Right rail renders contextual discovery tailored to the active route (HomeRail, FeedsRail, CreatorRail).

---

## 3. Mobile & Tablet Information Architecture

### 3.1 Mobile Viewport (`< 768px`)
- **Bottom Navigation Bar (5 Primary Touchpoints):**
  1. **Home (`/`):** Universal cultural feed with quick switcher between For You and Friends.
  2. **Shorts (`/shorts`):** Dedicated vertical short-video feed with auto-scroll snapping.
  3. **Create (`/create` or 1-tap sheet):** Instant creation trigger with Photo, Story, Reel, Short, and Live broadcasting.
  4. **Messages (`/messages`):** Real-time chats, voice notes, and audio/video calling with unread indicator badge.
  5. **Profile (`/profile/[username]`):** Cultural Passport, creator tools, follower stats, and settings gear.
- **Touch Target Standard:** Minimum 48x48px interactive touch boundaries with accessible active state feedback.
- **Safe Area Padding:** Full support for iPhone Dynamic Island, notch, and Android gesture navigation bars (`pb-[max(1rem,env(safe-area-inset-bottom))]`).

### 3.2 Tablet & Small Laptop (`768px - 1023px`)
- Compact rail navigation (72px collapsed icons with tooltip descriptors).
- Fluid center feed maximizing readable content width.
- Right rail collapses into modal discovery drawers or horizontal carousels to prevent horizontal overflow.

---

## 4. Home Feed & Universal Content Experience

### 4.1 Feed Stream Taxonomy
- **Tabs:**
  - `For You`: Algorithmic cultural mix powered by `buildRankedFeed` with Caribbean dialect affinity.
  - `Friends`: Strictly mutual accepted friendships updates (personal relationships).
  - `Following`: Unidirectional follows across creators, public figures, and verified Pages.
  - `Communities`: Island diaspora hubs and interest groups.
  - `Islands`: Geographic and territory-filtered feed.
- **Composer Multi-Type Capabilities:**
  - Plain text with mentions (`@username`) and hashtags (`#carnival`, `#socamusic`).
  - Single and multi-photo carousel with aspect-ratio containment.
  - Native video upload with automated HLS transcoding via Mux/Cloudflare Stream.
  - Dedicated audio voice notes with waveform visualization.
  - Universal Link Previews & Embeds (YouTube, TikTok, Facebook, Instagram, Vimeo, Spotify, Apple Podcasts).

### 4.2 Hardened Media & Universal Content Engine
- **SSRF Defense:** URL pre-flight DNS inspection blocking private IP ranges (`127.0.0.1`, `10.0.0.0/8`, `192.168.0.0/16`, `169.254.169.254`, AWS/GCP metadata endpoints).
- **CSP Compliance:** Sandboxed iframe containers for official oEmbeds with zero arbitrary inline scripts.
- **Fail-Safe Fallbacks:** Deterministic rich preview cards when oEmbed endpoints are restricted, rate-limited, or offline.

---

## 5. TUKUBI Shorts & Reels Experience Architecture

- **Dedicated Layout:** 9:16 vertical video container with snap-scrolling on mobile and responsive centered cinema theater on desktop.
- **Audio Attribution:** Seamless sound lounge linking to original sound creator with 1-tap "Use This Sound" action.
- **Engagement Primitives:**
  - Multi-type reactions with floating particle animations.
  - Sliding comments drawer with threaded replies without interrupting video playback.
  - Creator follow pill with instant optimistic update.
  - Report short modal wired to trust & safety queue (`moderation_cases`).
- **Performance Budget:** Dynamic pre-buffering limited to 1 next short to conserve mobile bandwidth in island territories.

---

## 6. Architecture Decision Records (ADRs) Index for Stage C/D

- **ADR-015: Date of Birth Collection & Minor Protection Architecture in Signup**
  - *Context:* Compliance with Dominican Republic Law 136-03 and COPPA requires verifiable age gating.
  - *Decision:* Collect DOB during step 3 (`/signup/account`), calculate age tier, trigger minor protections automatically in DB trigger `trg_calculate_profile_age_tier`.
- **ADR-016: Immutable Legal Consent Records & Version Tracking**
  - *Context:* Compliance with Law 126-02 and Law 172-13 requires proving electronic consent.
  - *Decision:* Create `legal_consent_records` with document versioning, timestamp, IP country, and separate marketing consent.
- **ADR-017: True Account Erasure Pipeline with Financial Retention Exceptions**
  - *Context:* Balancing GDPR Art. 17 / DR Law 172-13 right to erasure with statutory financial transaction retention.
  - *Decision:* Create `account_deletion_requests` with 30-day grace period; decouple and retain double-entry ledger entries anonymously while purging personal data.
- **ADR-018: 1-Tap Mobile Bottom Tab Navigation with Shorts Prominence**
  - *Context:* Providing familiar, instant navigation for Caribbean mobile users aligned with TikTok, Instagram, and Facebook paradigms.
  - *Decision:* Establish 5-tab bar (Home, Shorts, Create, Messages, Profile) with touch-optimized targets.
