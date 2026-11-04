# TUKUBI — Operation Giant: Implementation Backlog
## Comprehensive Engineering Backlog & Prioritization Matrix
### Version 1.0 | November 2026 | Production Engineering Governance

---

## 1. Executive Summary & Prioritization Methodology

This implementation backlog translates the findings of **OPERATION GIANT** into an actionable, evidence-based engineering roadmap for **TUKUBI — The Caribbean Connected**. Every initiative is scored using the standardized **RICE framework** (Reach, Impact, Confidence, Effort) and categorized into four strict priority tiers:

$$\text{RICE Score} = \frac{\text{Reach} \times \text{Impact} \times \text{Confidence}}{\text{Effort}}$$

- **Reach:** Estimated users/transactions affected per month (scale 1 to 10; 10 = 100% of platform traffic).
- **Impact:** Strategic impact on system reliability, user trust, monetization, or retention (3 = Massive, 2 = High, 1 = Medium, 0.5 = Low).
- **Confidence:** Architectural certainty based on existing codebase evidence and prototypes (1.0 = High, 0.8 = Medium, 0.5 = Low).
- **Effort:** Estimated engineering team person-weeks (1 to 10).

### Priority Tiers:
- **P0: Immediate Pre-Launch Hardening:** Must be resolved before opening platform access to public Caribbean and diaspora cohorts.
- **P1: Post-Launch Stabilization (Days 1–14):** Rapid enhancements to observability, caching, edge routing, and automated dispute resolution.
- **P2: Growth & Monetization Acceleration (Days 15–60):** Expansion of regional payment rails, live streaming transcoders, and advanced creator tools.
- **P3: Next-Generation Capabilities (Quarterly Roadmap):** Decentralized federation, mesh offline sync for hurricane seasons, and spatial Caribbean audio.

---

## 2. P0: Immediate Pre-Launch Hardening (Blockers Before Public Launch)

### Item P0-01: Multi-Region Edge Replication for Read Queries
- **ID:** `GIANT-P0-01`
- **Owner Role:** Principal Database Architect (`.agents/agents/database.md`) / SRE (`.agents/agents/devops.md`)
- **Problem Statement:** Caribbean island users frequently experience 180ms–350ms latency when connecting to primary US-East PostgreSQL databases over single subsea fiber cables.
- **Proposed Solution:** Deploy Supabase Read Replicas in `sao-paulo-1` (South America / Southern Caribbean) and `us-east-1` (Northern Caribbean / Florida), with Cloudflare Hyperdrive / Prisma Accelerate connection pooling for automatic read routing.
- **RICE Scoring:**
  - Reach: 9.0 (All island users)
  - Impact: 2.5 (Substantial latency drop)
  - Confidence: 0.95
  - Effort: 2.0 person-weeks
  - **RICE Score: 10.69**
- **Affected Services:** `@caribbean/database`, Supabase PostgreSQL, Edge Middleware.
- **Acceptance Criteria:**
  - *Given* a user in Port-au-Prince or Bridgetown querying their home feed,
  - *When* the edge server queries read-only profile, feed, or sound metadata,
  - *Then* the query resolves via the nearest regional replica in $\le 60\text{ms}$ with zero stale data leakage on user-authored mutations.
- **Security & Compliance:** Replica connections secured via TLS 1.3 with mTLS connection certificate rotation.

---

### Item P0-02: Automated Dead-Letter Queue (DLQ) & Alerting for Payment Webhooks
- **ID:** `GIANT-P0-02`
- **Owner Role:** Payments & Financial Architect (`.agents/agents/payments.md`)
- **Problem Statement:** If a webhook from Stripe, PayPal, or WiPay experiences a temporary network partition or server error, failed webhook retries might be dropped without an automated alert, delaying ledger settlement.
- **Proposed Solution:** Implement an idempotent Redis/Upstash DLQ with exponential backoff retries (1m, 5m, 15m, 1h) and immediate PagerDuty/Slack alerting when any payment reconciliation retries fail after 3 attempts.
- **RICE Scoring:**
  - Reach: 5.0 (All paying users/creators)
  - Impact: 3.0 (Zero monetary discrepancies)
  - Confidence: 1.0
  - Effort: 1.5 person-weeks
  - **RICE Score: 10.00**
- **Affected Services:** `apps/web/app/api/payments/webhooks/`, `@caribbean/payments`, Redis.
- **Acceptance Criteria:**
  - *Given* an incoming Stripe/PayPal webhook payload with a valid signature,
  - *When* downstream database connectivity experiences a transient 500ms timeout,
  - *Then* the payload is safely enqueued in the Redis DLQ, an audit event is logged, and the webhook endpoint responds with `202 Accepted` to prevent provider suspension.
- **Security & Compliance:** Full cryptographic HMAC signature verification before DLQ ingestion; no raw PAN or sensitive cardholder data logged.

---

### Item P0-03: Real-Time Content Moderation Escalation & CSAM Hash Screening
- **ID:** `GIANT-P0-03`
- **Owner Role:** Trust & Safety Engineer (`.agents/agents/trust-safety.md`) / AppSec (`.agents/agents/security.md`)
- **Problem Statement:** User-uploaded imagery and videos must comply with international child safety standards and regional hate-speech regulations before syndication to discovery streams.
- **Proposed Solution:** Integrate PhotoDNA / PDQ hashing pipeline in Supabase Storage webhook triggers before marking media files as `active` in `media_assets`. Auto-quarantine matches with automated regulatory escalation.
- **RICE Scoring:**
  - Reach: 8.0 (All uploaded media)
  - Impact: 3.0 (Legal compliance, user safety)
  - Confidence: 0.9
  - Effort: 2.5 person-weeks
  - **RICE Score: 8.64**
- **Affected Services:** `@caribbean/media-publishing`, `apps/web/lib/media/storage.ts`, `moderation_reports`.
- **Acceptance Criteria:**
  - *Given* an image upload to `tukubi-media` storage bucket,
  - *When* the edge worker processes the initial media chunk,
  - *Then* perceptual hashes are matched against prohibited safety databases within $\le 400\text{ms}$; offending assets are immediately zeroed and reported to the moderation escalation queue.
- **Security & Compliance:** Compliance with NCMEC reporting mandates and regional Caribbean cybercrime legislation.

---

## 3. P1: Post-Launch Stabilization (Days 1–14)

### Item P1-01: Incremental Static Regeneration (ISR) for Cultural & Event Pages
- **ID:** `GIANT-P1-01`
- **Owner Role:** Staff Frontend Engineer (`.agents/agents/frontend.md`)
- **Problem Statement:** High-volume public marketing, island nation culture guides, and carnival calendar pages are currently server-rendered per request, creating unnecessary database query volume during peak event surges.
- **Proposed Solution:** Apply Next.js 15 App Router `revalidateTag` and `stale-while-revalidate` (ISR 60s) caching on all country directories, diaspora hub guides, and carnival calendars.
- **RICE Scoring:**
  - Reach: 8.0 (Public visitors & search crawlers)
  - Impact: 2.0 (Massive server load reduction)
  - Confidence: 1.0
  - Effort: 1.0 person-week
  - **RICE Score: 16.00**
- **Affected Services:** `apps/web/app/(marketing)/`, `apps/web/app/events/`.
- **Acceptance Criteria:**
  - *Given* an unauthenticated visitor loading `/explore/countries/jm` (Jamaica Hub),
  - *When* 10,000 concurrent requests arrive,
  - *Then* 99.8% of requests are served directly from the Vercel Edge Cache with $\le 45\text{ms}$ TTFB.
- **Security & Compliance:** Excludes all user-private session cookies from the cache key.

---

### Item P1-02: PWA Push Notification Re-engagement Pipeline
- **ID:** `GIANT-P1-02`
- **Owner Role:** Senior Mobile Principal (`.agents/agents/mobile.md`)
- **Problem Statement:** Web mobile users who install TUKUBI to their home screen on Android and iOS 16.4+ currently lack background web push notifications for direct messages and event reminders.
- **Proposed Solution:** Implement Web Push API with VAPID key pairs and Service Worker push listeners in `apps/web/public/sw.js` and `@caribbean/notifications`.
- **RICE Scoring:**
  - Reach: 7.0 (Mobile web users)
  - Impact: 2.5 (35% increase in Day 7 retention)
  - Confidence: 0.95
  - Effort: 1.5 person-weeks
  - **RICE Score: 11.08**
- **Affected Services:** `apps/web/public/sw.js`, `apps/web/src/components/pwa/`, `@caribbean/notifications`.
- **Acceptance Criteria:**
  - *Given* a user has granted push notification permissions,
  - *When* another user sends a direct message or tips their post while the app is closed,
  - *Then* an encrypted web push notification appears in the device system tray with sound and Caribbean badge within $\le 1.5\text{s}$.
- **Security & Compliance:** User notification preferences granularly controllable; Rule 8 cultural privacy respected.

---

### Item P1-03: Real-Time Typing Indicators & Ephemeral Presence in Direct Messages
- **ID:** `GIANT-P1-03`
- **Owner Role:** Backend Principal (`.agents/agents/backend.md`)
- **Problem Statement:** Direct messaging currently delivers messages in real-time, but lacks typing indicators and online presence state, making conversations feel asynchronous.
- **Proposed Solution:** Utilize Supabase Realtime Broadcast and Presence channels with low-overhead client throttle (1.5s heartbeats) for typing state.
- **RICE Scoring:**
  - Reach: 6.5 (Messaging users)
  - Impact: 1.5 (Enhanced conversational responsiveness)
  - Confidence: 1.0
  - Effort: 1.0 person-week
  - **RICE Score: 9.75**
- **Affected Services:** `apps/web/app/messages/`, `@caribbean/realtime`.
- **Acceptance Criteria:**
  - *Given* two users in an active chat room,
  - *When* User A begins typing in the composer,
  - *Then* User B sees "User A is typing..." with smooth animated dots; the indicator disappears automatically if typing ceases for $\ge 3\text{s}$.
- **Security & Compliance:** Presence state does not expose physical GPS or exact user coordinates.

---

## 4. P2: Growth & Monetization Acceleration (Days 15–60)

### Item P2-01: Native WiPay & Jam-Dex Digital Currency Integration
- **ID:** `GIANT-P2-01`
- **Owner Role:** Payments & Financial Architect (`.agents/agents/payments.md`)
- **Problem Statement:** Caribbean creators and small merchants face high cross-border processing fees when forced to settle via USD/EUR rails; local Caribbean fiat and CBDC (e.g. Bank of Jamaica Jam-Dex) offer lower friction.
- **Proposed Solution:** Implement native WiPay Caribbean gateway adapter with JMD, TTD, BBD, and XCD settlement directly into creator bank accounts and double-entry ledgers.
- **RICE Scoring:**
  - Reach: 6.0 (Caribbean regional merchants)
  - Impact: 2.5 (Core financial moat)
  - Confidence: 0.85
  - Effort: 3.0 person-weeks
  - **RICE Score: 4.25**
- **Affected Services:** `@caribbean/payments`, `apps/web/app/api/payments/wipay/`.
- **Acceptance Criteria:**
  - *Given* a Jamaican creator listing event tickets in JMD,
  - *When* a local customer checks out using WiPay / Jam-Dex QR,
  - *Then* the transaction settles in integer minor units (cents) into the double-entry escrow ledger with zero exchange rate loss.
- **Security & Compliance:** PCI-DSS Level 1 compliant redirect/iframe handling; cryptographic IPN callback validation.

---

### Item P2-02: HLS Adaptive Bitrate (ABR) Video Transcoding Engine
- **ID:** `GIANT-P2-02`
- **Owner Role:** Media & Publishing Engineer (`.agents/agents/media-publishing.md`)
- **Problem Statement:** High-resolution Shorts and creator videos (1080p60) cause buffering on variable 3G/4G cellular connections across the Caribbean islands.
- **Proposed Solution:** Implement automated HLS ABR ladder (360p, 480p, 720p, 1080p) transcoding triggered on upload via Cloudflare Stream / AWS MediaConvert with byte-range MP4 fallback.
- **RICE Scoring:**
  - Reach: 8.5 (All video viewers)
  - Impact: 2.0 (Zero video stalls, 40% bandwidth savings)
  - Confidence: 0.9
  - Effort: 3.5 person-weeks
  - **RICE Score: 4.37**
- **Affected Services:** `@caribbean/media-publishing`, `apps/web/lib/media/`.
- **Acceptance Criteria:**
  - *Given* a creator uploads a 4K 60fps video file,
  - *When* the processing job completes,
  - *Then* a Master `.m3u8` playlist is generated; client players automatically step down to 480p on congested cellular connections without frame drops.
- **Security & Compliance:** Signed video playback URLs preventing unauthorized hotlinking.

---

### Item P2-03: Creator Tip Jar & Community Subscriptions Engine
- **ID:** `GIANT-P2-03`
- **Owner Role:** Product Strategist / Staff Backend Engineer
- **Problem Statement:** Creators need direct recurring revenue from fan communities (e.g. exclusive carnival mas band sneak peeks, music tutorials, cooking classes).
- **Proposed Solution:** Deploy recurring subscription tiers ($5, $15, $50/mo) integrated into the double-entry ledger with automatic monthly renewal and billing dispute management.
- **RICE Scoring:**
  - Reach: 5.0 (Active creators and superfans)
  - Impact: 2.5 (Platform monetization)
  - Confidence: 0.95
  - Effort: 2.5 person-weeks
  - **RICE Score: 4.75**
- **Affected Services:** `@caribbean/payments`, `@caribbean/communities`, `apps/web/app/creator/`.
- **Acceptance Criteria:**
  - *Given* a fan subscribing to a creator's Tier 2 community channel,
  - *When* the recurring monthly billing interval triggers,
  - *Then* the payment engine charges the saved card/wallet, posts double-entry ledger records, and preserves channel access with automated receipts.
- **Security & Compliance:** App Store & Google Play in-app purchase compliance on mobile apps via Payment Policy Engine.

---

## 5. P3: Next-Generation Capabilities (Quarterly Roadmap)

### Item P3-01: Hurricane Mesh & Offline Emergency Hub
- **ID:** `GIANT-P3-01`
- **Owner Role:** Chief Architect (`.agents/agents/chief-architect.md`) / Mobile Principal
- **Problem Statement:** During Atlantic hurricane seasons, island subsea cables and cellular towers frequently suffer outages, cutting communities off from vital aid and family status updates.
- **Proposed Solution:** Integrate peer-to-peer Bluetooth Low Energy (BLE) and Wi-Fi Direct mesh synchronization into the Universal Expo mobile application, allowing local neighbor-to-neighbor emergency messages and check-ins without cellular internet.
- **RICE Scoring:**
  - Reach: 4.0 (Island users during disasters)
  - Impact: 3.0 (Life-saving Caribbean resilience)
  - Confidence: 0.75
  - Effort: 6.0 person-weeks
  - **RICE Score: 1.50**
- **Affected Services:** `apps/mobile/`, `@caribbean/offline-sync`.
- **Acceptance Criteria:**
  - *Given* complete cellular connectivity loss during a storm,
  - *When* a user marks themselves "Safe" in the mobile app,
  - *Then* the status propagates hop-by-hop across nearby BLE devices within 500 meters until reaching a satellite uplink station.
- **Security & Compliance:** Cryptographically signed messages; anti-spam relay limits.

---

### Item P3-02: Spatial Caribbean Audio & Steelpan Sound Synthesizer
- **ID:** `GIANT-P3-02`
- **Owner Role:** Media Streaming Engineer / UI/UX Director
- **Problem Statement:** Caribbean music production is deeply sonic and multi-layered (Soca basslines, Calypso percussion, Reggae dub reverbs, Steelpan harmonics).
- **Proposed Solution:** Build Web Audio API soundboard and Web Spatial Audio player for immersive listening rooms in TUKUBI Live and Sounds pillars.
- **RICE Scoring:**
  - Reach: 4.5 (Music enthusiasts & producers)
  - Impact: 1.5 (Brand differentiation)
  - Confidence: 0.85
  - Effort: 4.0 person-weeks
  - **RICE Score: 1.43**
- **Affected Services:** `@caribbean/media-publishing`, `apps/web/app/sounds/`.
- **Acceptance Criteria:**
  - *Given* a user wearing headphones in a live listening room,
  - *When* an artist performs with multi-track stems,
  - *Then* spatial binaural rendering places instruments dynamically around the 3D soundstage.
- **Security & Compliance:** High-efficiency Opus audio compression with zero copyright bypass.

---

## 6. Implementation Prioritization Summary Matrix

| Rank | ID | Title | Priority | Reach | Impact | Confidence | Effort (Wks) | RICE Score | Owner |
|---|---|---|---|---|---|---|---|---|---|
| **1** | `GIANT-P1-01` | ISR Caching for Cultural/Event Hubs | **P1** | 8.0 | 2.0 | 1.00 | 1.0 | **16.00** | Frontend Principal |
| **2** | `GIANT-P1-02` | PWA Web Push Notification Pipeline | **P1** | 7.0 | 2.5 | 0.95 | 1.5 | **11.08** | Mobile Principal |
| **3** | `GIANT-P0-01` | Multi-Region DB Read Replication | **P0** | 9.0 | 2.5 | 0.95 | 2.0 | **10.69** | Database Architect |
| **4** | `GIANT-P0-02` | DLQ & Alerting for Payment Webhooks | **P0** | 5.0 | 3.0 | 1.00 | 1.5 | **10.00** | Payments Architect |
| **5** | `GIANT-P1-03` | Real-Time DM Presence & Typing State | **P1** | 6.5 | 1.5 | 1.00 | 1.0 | **9.75** | Backend Principal |
| **6** | `GIANT-P0-03` | PhotoDNA/PDQ Media Safety Scanner | **P0** | 8.0 | 3.0 | 0.90 | 2.5 | **8.64** | Trust & Safety |
| **7** | `GIANT-P2-03` | Creator Subscriptions & Tip Jar | **P2** | 5.0 | 2.5 | 0.95 | 2.5 | **4.75** | Staff Backend |
| **8** | `GIANT-P2-02` | HLS ABR Video Transcoding Pipeline | **P2** | 8.5 | 2.0 | 0.90 | 3.5 | **4.37** | Media Engineer |
| **9** | `GIANT-P2-01` | Native WiPay / Jam-Dex Caribbean Rails | **P2** | 6.0 | 2.5 | 0.85 | 3.0 | **4.25** | Payments Architect |
| **10** | `GIANT-P3-01` | Hurricane Mesh & Offline Emergency Hub | **P3** | 4.0 | 3.0 | 0.75 | 6.0 | **1.50** | Chief Architect |
| **11** | `GIANT-P3-02` | Spatial Caribbean Audio Synthesizer | **P3** | 4.5 | 1.5 | 0.85 | 4.0 | **1.43** | Media Streaming |

---

## 7. Quality Assurance & Rollout Governance

Each backlog item must transition through the inviolable 7-stage quality lifecycle defined in `docs/operation-giant/release-readiness.md`:
1. **Design & Threat Model:** ADR signed off by Chief Architect and AppSec.
2. **Schema & Migration:** Reversible migration SQL in `supabase/migrations/` with zero direct DDL.
3. **Unit & RLS Testing:** Vitest unit tests and PostgreSQL RLS verification tests written before code.
4. **End-to-End Verification:** Automated Playwright browser tests verifying both desktop (1440px) and mobile viewport (390px) behavior.
5. **Double-Entry Ledger Invariance:** Verified zero un-balanced transactions for all financial code paths.
6. **Zero-Mock Verification:** Verified clean empty/hydrated states without hardcoded mock arrays.
7. **Release Readiness Certification:** Staged canary deployment with instant rollback strategy.
