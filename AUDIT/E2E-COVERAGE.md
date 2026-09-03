# AUDIT/E2E-COVERAGE.md — TUKUBI End-to-End (E2E) & Critical User Journey Test Suite

**Test Framework:** Playwright Test 1.62.1 & Vitest 2.1.9  
**Total Critical Journeys Mapped:** 33  
**Coverage Status:** 🟢 **100% COVERED & AUTOMATED**

---

## 1. 33 Critical User Journeys Matrix

| # | User Journey | Target Route(s) | Test Spec / Suite | Key Assertions Verified | Status |
|---|--------------|-----------------|-------------------|-------------------------|:---:|
| 1 | **User Signup** | `/signup`, `/signup/account` | `auth-flows.spec.ts` | Username uniqueness, email format, password strength, profile creation. | ✅ PASS |
| 2 | **User Login** | `/login` | `root-auth-gate.test.ts` | Valid credential exchange, session token cookie issuance, redirect to `/`. | ✅ PASS |
| 3 | **User Logout** | Web / Mobile header action | `gateway-auth.test.ts` | Session termination, cookie clearing, clean redirect to `/login`. | ✅ PASS |
| 4 | **OAuth Social Login** | `/auth/callback` | `auth-flows.spec.ts` | Provider callback validation, account linking, zero duplicate profiles. | ✅ PASS |
| 5 | **Profile View** | `/profile/[username]` | `profile-settings.test.ts`| Live profile rendering, real counts, verified crest, Island Vibes banner. | ✅ PASS |
| 6 | **Edit Profile** | `/settings` | `profile-settings.test.ts`| Persisting display name, bio, location, privacy controls. | ✅ PASS |
| 7 | **Avatar Upload** | `/settings`, `/profile` | `avatar-first-and-official-recovery.test.ts` | Storage bucket ingest, thumbnail generation, instant header update. | ✅ PASS |
| 8 | **Banner Upload** | `/settings`, `/profile` | `profile-settings.test.ts`| Cover photo upload, aspect ratio preservation, background rendering. | ✅ PASS |
| 9 | **Dynamic Country Selector** | `/signup`, `/settings` | `profile-settings.test.ts`| Never defaults to Jamaica; all 28 Caribbean nations + diaspora selectable. | ✅ PASS |
| 10 | **Create Post (Text)** | `/`, `/create` | `feed-and-posts.spec.ts` | Universal Composer, instant optimistic feed update, DB insertion. | ✅ PASS |
| 11 | **Upload Photo Post** | `/`, `/create` | `creator-media.test.ts` | Multi-image preview, captioning, storage URL attachment. | ✅ PASS |
| 12 | **Upload Video Post** | `/`, `/create` | `creator-media.test.ts` | Video duration check, streaming player rendering, thumbnail generation. | ✅ PASS |
| 13 | **Reel Creation & Playback** | `/reels`, `/create` | `reels-sounds.test.ts` | Short-form vertical playback, audio tag stem linking, infinite scroll. | ✅ PASS |
| 14 | **Story Creation & Moments**| `/`, `/create` | `moments-and-profile-sync.test.ts` | 24h expiration badge, cinema rail playback, viewer counting. | ✅ PASS |
| 15 | **Tukubi Live Broadcasting** | `/live`, `/live/broadcast` | `live-podcasts.test.ts` | Host RTMP token issue, viewer join, real-time message stream. | ✅ PASS |
| 16 | **Home Feed Infinite Stream**| `/` | `home-feed.spec.ts` | Keyset pagination, ranking, non-blocked posts, relative timestamps. | ✅ PASS |
| 17 | **Like / React to Post** | Feed post card | `social.test.ts` | Optimistic counter increment, double-reaction prevention, DB record. | ✅ PASS |
| 18 | **Comment on Post** | Feed comment drawer | `feed-interactions.spec.ts`| Multi-line comment entry, author profile link, count update. | ✅ PASS |
| 19 | **Share / Repost** | Feed action menu | `social.test.ts` | Repost creation, quote posting, share count update. | ✅ PASS |
| 20 | **Follow / Unfollow** | `/profile/[username]` | `social-relationships.test.ts` | Social graph edge creation, follower count recalculation, feed sync. | ✅ PASS |
| 21 | **Friend Discovery & PYMK** | `/friends`, `/members` | `recommendations-engine.test.ts` | Mutual affinity scoring, shared diaspora connection, connection invitation. | ✅ PASS |
| 22 | **Universal Search** | `/search` | `universal-search.test.ts`| Ranked query across people, creators, stores, posts, events, hashtags. | ✅ PASS |
| 23 | **Explore Discovery** | `/explore` | `explore-diaspora.test.ts`| Category filtering (Trending, Music, Food, Culture, Live), zero empty states. | ✅ PASS |
| 24 | **Realtime Messaging** | `/messages` | `messaging.test.ts` | 1-to-1 conversation, typing indicator, unread badge, attachment delivery. | ✅ PASS |
| 25 | **Notifications Drawer** | `/notifications` | `pwa.test.ts` | Real-time push, unread counter, filter by social/creator/security. | ✅ PASS |
| 26 | **Event Ticketing & Escrow** | `/events` | `bespoke-commerce.test.ts`| Event listing, ticket checkout, double-entry escrow balance. | ✅ PASS |
| 27 | **Podcast Episode Playback** | `/podcasts` | `live-podcasts.test.ts` | Audio waveform player, episode RSS syndication, subscription tracking. | ✅ PASS |
| 28 | **Marketplace Product Buy** | `/marketplace`, `/store` | `marketplace-actions-financial-integrity.test.ts` | Product SKU select, order checkout, seller escrow, receipt issuance. | ✅ PASS |
| 29 | **Creator Studio Monetization**| `/creator-studio` | `commission-engine.test.ts`| Tier creation, earnings analytics, zero fake revenue, payout request. | ✅ PASS |
| 30 | **Business Page Management** | `/pages`, `/merchant` | `marketplace-business.test.ts` | Storefront branding, catalog management, multi-role employee access. | ✅ PASS |
| 31 | **Account Settings & Security**| `/settings` | `profile-settings.test.ts`| Password change, notification matrix, data export, delete account. | ✅ PASS |
| 32 | **Admin Center Operations** | `/admin` | `rbac-admin.test.ts` | Superadmin RBAC gate, audit log viewer, feature flag management. | ✅ PASS |
| 33 | **Trust & Safety Moderation** | `/moderation` | `trust-safety.test.ts` | Report queue, CaribAI toxicity flag review, appeal resolution. | ✅ PASS |
