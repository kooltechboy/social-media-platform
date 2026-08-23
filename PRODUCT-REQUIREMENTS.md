# Product Requirements — ANTILIA

> **North Star:** The digital home of the Caribbean and its global diaspora.
> Not "Facebook for the Caribbean" — a five-system ecosystem: Antilia Social, Antilia Graph, Antilia Studio, Business OS, Antilia AI, unified by SpotPay by Antilia.

## 1. Problem Statement

Caribbean people and the diaspora (est. 40M+ globally incl. 10M+ in the US, Canada, UK, Europe) are spread across generic global platforms that:
- have no model of Caribbean identity, culture, or diaspora relationships;
- bury Caribbean content under global engagement algorithms;
- fragment discovery of Caribbean businesses, events, creators, and music;
- offer creators and businesses no economically coherent regional ecosystem.

## 2. Target Users (Personas)

| Persona | Location | Needs |
| :--- | :--- | :--- |
| **Maria** (diaspora anchor) | Born Kingston, lives Brooklyn | Jamaican creators, Brooklyn Caribbean events, Kingston news, nearby Caribbean restaurants, family content. |
| **Dwayne** (creator) | Port of Spain | Monetize soca content; subscriptions, tips, live gifts; analytics; payouts to TT. |
| **Ana** (business owner) | Santo Domingo | Business profile, menu/photos, bookings, messaging, ads targeting DR + diaspora in NY. |
| **Kofi** (community builder) | Toronto | "Jamaicans in Toronto" community: posts, events, moderation, eventually paid membership. |
| **Leah** (student) | Bridgetown | Free, fast, mobile-first social + discovery; Carnival, events, music. |

## 3. Product Pillars (Priority Order for MVP)

1. **Identity & Caribbean Graph** — profiles with optional country/island/city/parish/language/diaspora connections; privacy-controlled.
2. **Social** — posts, photos, comments, reactions, follows/friends, feed (multi-mode), search, notifications.
3. **Communities** — public/private/invite-only groups with moderation.
4. **Messaging** — DMs, group chats, media (Phase 3).
5. **Creator OS** — creator profiles, reels, stories, live, podcasts, subscriptions, tips, payouts (phased).
6. **Business OS** — business profiles, reviews, offers, bookings, advertising (phased).
7. **SpotPay** — wallet, payment orchestration, capability matrix, compliant store routing.
8. **CaribAI** — Ask Caribbean search, translation (en/es/fr/ht/nl/pap), recommendations, moderation assist.

## 4. MVP Scope (Phase 2 Exit Criteria)

- Registration/login (email + OAuth), MFA-ready, sessions.
- Profiles: avatar, bio, location (private by default), Caribbean connection, interests.
- Follow/friend, block, mute.
- Posts: text + images; comments; reactions.
- Feed modes: Following, Latest, Caribbean (curated by graph signals).
- Basic search (profiles, posts, communities).
- Communities: create/join/post/moderate.
- Notifications: in-app first.
- Basic moderation: report, queue, admin actions.
- i18n scaffold: en/es/fr/ht/nl/pap translation keys, no hard-coded strings.

**Explicitly out of MVP:** marketplace, advertising platform, live streaming, podcasts, payouts, AI search.

## 5. Key Non-Functional Requirements

| Area | Requirement |
| :--- | :--- |
| Security | RLS on every client-accessible table; OWASP; MFA/passkeys; secrets management. |
| Privacy | Caribbean identity fields optional & private by default; inferred attributes never exposed as facts; GDPR-class data export/deletion. |
| Performance | Core Web Vitals "good" on mid-range Android; feed TTI < 3s on 3G-class connections. |
| Accessibility | WCAG 2.2 AA part of Definition of Done. |
| Availability | 99.9% app tier; zero tolerance for ledger inconsistency (see PAYMENT-ARCHITECTURE.md). |
| Scale | Architect for 100M; build/deploy for 10K initial. |

## 6. Success Metrics (Launch → 12 months)

- Activation: % registrations completing profile with Caribbean connection ≥ 60%.
- Retention: D30 ≥ 25% in launch geographies.
- Density: ≥ 3 communities joined per active WAU.
- Creation: ≥ 15% WAU creating content weekly.
- Creator: 100 paid creators by month 9 (Phase 6+).

## 7. Launch Strategy (Geographic Density First)

1. **Stage 1:** Dominican Republic + DR diaspora (NY/NJ/Miami).
2. **Stage 2:** Jamaica, Trinidad & Tobago, Barbados, Bahamas, Haiti.
3. **Stage 3:** US/Canada/UK diaspora hubs at scale.
4. **Stage 4:** Global Caribbean network.

Recruit before acquiring: creators, musicians, restaurants, businesses, athletes, community leaders, universities, event organizers.

## 8. Detailed requirements

- Geographic model: see `docs/architecture/geographic-data-model.md`.
- Monetization: see `docs/architecture/monetization-model.md`.
- Payment flows: see `PAYMENT-ARCHITECTURE.md`.
- Roadmap phasing: see `docs/IMPLEMENTATION-ROADMAP.md`.
