# Design System — CARIBBEAN ONE

_Authoritative reference. Agents may NOT invent UI patterns outside `@caribbean/design-system` tokens and `@caribbean/ui` components. See AGENTS.md Mandate 5._

## 1. Design Language

**Caribbean + premium + modern + technology-forward. Editorial, warm, energetic, international.**

Explicitly prohibited: flag spam, palm-tree graphics, cheap turquoise gradients, tourist-brochure imagery, stereotypical tropical styling.

## 2. Token Architecture (`packages/design-system`)

```
design-tokens
  ├── color      (primitive palette → semantic tokens: surface, text, action, feedback)
  ├── typography (scale, weights, line heights; display/editorial serif + functional sans pairing)
  ├── spacing    (4pt base grid)
  ├── radii      (sharp editorial corners; generous on media)
  ├── elevation  (flat-first; depth via layering, not heavy shadows)
  ├── motion     (durations, easings; reduced-motion variants mandatory)
  └── locale     (RTL-ready layout tokens, i18n-aware truncation)
```

Semantic color intent (light + dark): `surface/canvas`, `surface/raised`, `text/primary`, `text/muted`, `action/primary`, `action/secondary`, `feedback/success|warning|danger|info`. Dark mode is first-class, not an inversion filter.

## 3. Component Hierarchy

```
Tokens → Primitives (Button, Input, Avatar, Badge, Chip…) →
Patterns (FeedCard, PostComposer, StoryRail, ProfileHeader…) →
Pages → Applications (web, mobile, admin, moderation, studios)
```

Required pattern library: buttons, forms, cards, navigation, modals/sheets, tables, charts, avatars, media components, video components, creator components, payment components (amount displays MUST use locale-aware currency formatting; never float math).

## 4. Accessibility (WCAG 2.2 AA — part of Definition of Done)

- Keyboard navigation, visible focus management, logical tab order.
- Screen-reader semantics: labels, roles, announcements for async updates.
- Color contrast ≥ 4.5:1 body / 3:1 large text & UI components; never color-only state.
- Reduced motion honored via motion tokens.
- Touch targets ≥ 44×44 pt (mobile).
- Dynamic type support on mobile.

## 5. Localization

- 6 launch locales: `en`, `es`, `fr`, `ht`, `nl`, `pap`. No hard-coded strings — translation keys only.
- Layouts must tolerate ±30% string length; date/number/currency via `Intl`.
- Content translation (user-generated) is a CaribAI product feature, distinct from UI localization.

## 6. Mobile-Specific Rules

- Native-feel navigation: Home, Explore, Create (+), Communities, Messages.
- Design for mid-range Android first (performance budget applies to design choices: image placeholders, lightweight motion).
- Offline/poor-connectivity states are designed states, not error pages.
