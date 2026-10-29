---
title: "REA_REVERSE_ENGINEERING_REPORT — Reverse Engineering & Reference Architecture Analysis"
type: reverse-engineering
status: verified
owner: Reverse Engineering Investigator
created: 2026-10-28
updated: 2026-10-28
tags:
  - tukubi
  - reverse-engineering
  - rea
  - reference-architecture
related:
  - "[[TUKUBI Engineering Intelligence]]"
  - "[[05 Feature Inventory/FEATURE_INVENTORY]]"
---

# REA_REVERSE_ENGINEERING_REPORT — TUKUBI

## 1. Reverse Engineering Methodology & Safety Validation

In accordance with Section 7 of the TUKUBI Master Engineering Prompt:
- Reverse engineering was performed exclusively via static AST/source inspection, schema/migration lineage tracing, and runtime contract verification inside the authorized repository (`https://github.com/kooltechboy/social-media-platform`).
- Zero third-party proprietary layouts, copyrighted assets, or unreviewed external scripts were copied or executed.

---

## 2. Reference Architecture Translation Matrix

| Reference Pattern | Industry Benchmark Lesson | TUKUBI Caribbean-First Implementation |
|---|---|---|
| **Unified Multi-Actor Feed** | Seamless interleaving of personal posts, Page updates, community discussions, and clearly labeled Sponsored cards with cursor/offset pagination and batch engagement hydration. | Implemented in `apps/web/src/lib/feed/load-feed.ts` and `hydrate-posts.ts`. Hydrates `post_likes`, `saved_posts`, `post_media`, and `businesses` Page identity in a single batch without N+1 queries. |
| **Vertical Short-Form Video (`Shorts`)** | Instant scroll-snap (`100dvh`), `IntersectionObserver` active-card detection, `AudioManager` single-player concurrency lock, 2-second minimum view duration threshold, and 1-click Sound Remix. | Implemented in `apps/web/src/components/shorts/shorts-feed-viewer.tsx` and `short-card.tsx`, backed by `videos`, `video_views`, `video_comments`, `video_saves`, and `video_shares`. |
| **Universal Identity Switching (Personal vs. Page)** | Creators and merchants manage Pages (`business`, `creator`, `media`, `event_organizer`) without logging out of their personal account. | Implemented in `apps/web/src/components/identity-switcher.tsx`, `universal-composer.tsx`, and `create-short-modal.tsx` with server-side RBAC enforcement (`can_manage_page`). |
| **Self-Serve Ad Auction & Moderation Gate** | Self-serve campaign wizard (`draft -> pending_review -> approved -> active`), server-computed CPM billing, 5-minute viewer impression deduplication, and transparent `"Sponsored"` disclosure. | Implemented in `packages/advertising/`, `apps/web/src/lib/advertising/actions.ts`, and `supabase/migrations/00115_security_ads_and_rpc_hardening.sql`. |
| **Rich Direct & Business Messaging** | Real-time delivery, optimistic client message IDs, reactions, reply quotes, voice notes, and optional AI Business Concierge with clear bot attribution. | Implemented in `apps/web/src/components/message-thread.tsx` and `apps/web/src/lib/messaging/actions.ts`. |
| **Universal Link Intelligence & Embed Playback** | Multi-domain URL normalization, tracking param removal, OpenGraph / oEmbed retrieval, official iframe sandboxing (`allow-scripts allow-same-origin allow-presentation`), and graceful non-destructive fallbacks. | Implemented in `@caribbean/media` (`content-resolver/`), `universal-composer.tsx`, `page-post-composer.tsx`, and `rich-media-player.tsx`. |

---

## 3. Product Benchmark Reverse Engineering & Adaptation

### A. Facebook Benchmark (Social Graph, Sharing & Link Previews)
- **Observed Reference Mechanics:** Meta strips tracking params (`fbclid`, `utm_*`), renders rich link previews with 1.91:1 Open Graph hero cards, enables inline embedded video playback via official plugins (`plugins/video.php`), and provides graceful link cards with title, description, and domain badge when embedding is disabled.
- **TUKUBI Adaptation:** Hardened `FacebookProvider` in `@caribbean/media`. Parses video IDs and post IDs, generates official plugin embeds (`facebook.com/plugins/video.php` and `post.php`), provides deterministic author/title cards, and whitelists Facebook origins in `rich-media-player.tsx`.

### B. Instagram Benchmark (Creator Visuals & Reels)
- **Observed Reference Mechanics:** Instagram enforces strict walled-garden access while exposing official oEmbed and iframe embed endpoints (`instagram.com/p/:id/embed/` and `reel/:id/embed/`). Reels utilize vertical 9:16 aspect ratios with overlaid sound attribution.
- **TUKUBI Adaptation:** Hardened `InstagramProvider` in `@caribbean/media`. Dynamically classifies posts (1:1 image) vs. Reels (9:16 vertical video), generates official embed URLs, and provides fallback cards to view on Instagram when content is private or deleted.

### C. TikTok Benchmark (Vertical Video Discovery & Controls)
- **Observed Reference Mechanics:** Vertical scroll snapping with video ID extraction (`tiktok.com/@user/video/:id`), official embed player (`tiktok.com/embed/v2/:id`), and graceful fallback when oEmbed endpoints are challenged by anti-bot rate limits.
- **TUKUBI Adaptation:** Upgraded `TikTokProvider` in `@caribbean/media`. Robust regex extraction of video IDs and usernames from standard and short (`vt.tiktok.com`) URLs. Provides deterministic playable embed and responsive 9:16 layout.

### D. YouTube Benchmark (High-Performance Video Playback)
- **Observed Reference Mechanics:** YouTube embeds (`youtube-nocookie.com/embed/:id`), Shorts support, playlist embedding (`videoseries?list=PL...`), timestamp seeking (`&start=...`), and channel discovery (`/@handle`).
- **TUKUBI Adaptation:** Enhanced `YouTubeProvider` in `@caribbean/media`. Supports videos, Shorts (9:16), playlists, and channel handles. PostMessage error trapping trapped in `rich-media-player.tsx` (codes 101/150) to seamlessly switch to fallback cards.

### E. HumHub Benchmark (Modular Extensibility)
- **Observed Reference Mechanics:** Strict separation between core publishing primitives, media resolvers, and presentation components.
- **TUKUBI Adaptation:** Maintained modular provider adapter architecture (`BaseContentProvider`, `ContentResolverEngine`, `ssrf-guard`). Any future provider can be plugged in by implementing `ContentProvider` without modifying the core publishing pipeline.

### F. Mastodon Benchmark (Timeline Integrity & Resilient Fallbacks)
- **Observed Reference Mechanics:** Unfurl caching, strict SSRF boundaries, private IP blocking, and guaranteed timeline rendering resilience (an unresolvable or deleted external link never crashes the timeline or post).
- **TUKUBI Adaptation:** Hardened SSRF guard with RFC 1918 IPv4/IPv6 blocking, DNS rebinding prevention, 4-second timeout, 2MB size cap, and safe HTML entity decoding. Extracted media URLs are validated before being rendered in the client or optimized by Next.js.

