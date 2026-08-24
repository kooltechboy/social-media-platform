# Creator, Live & Podcast Architecture — ANTILIA

## 1. Creator OS

**Creator profiles** upgrade from `profiles` with `creator_accounts` (verification, categories, payout linkage in Phase 6). Creator Studio (`apps/creator-studio`, Phase 4): Dashboard, Content, Videos, Shorts, Stories, Live, Podcasts, Subscribers, Analytics, Revenue, Payouts, Settings.

**Monetization surfaces** (all ledger-settled via SpotPay): tips, live gifts, subscriptions ($2.99/$4.99/$9.99 tiers), paid communities, paid podcasts/episodes, paid events, advertising revenue share, marketplace sales. Revenue dashboard reports Gross → Fees → Taxes/Withholding → Net → Available/Pending/Paid Out.

## 2. Short-Form Video (Reels) & Long-Form Video

Reels are a **dedicated system**, not embedded posts: vertical video, swipe navigation, autoplay, captions, audio, effects, reactions, analytics, monetization.

```
Upload → Object Storage (R2) → Processing (transcode, thumbnails, captions)
  → CDN (Cloudflare Stream/CDN) → Player
```

Long-form: channels, episodes/playlists, chapters, captions/transcripts (CaribAI), premieres, recording replays.

## 3. Live Streaming

```
Creator (mobile camera / desktop / RTMPS ingest)
  → Live Ingestion → Transcoding → CDN → Viewers
  (chat via Realtime; gifts via SpotPay ledger; moderation via trust-safety pipeline)
```

- **Never stream through the application server.** Ingestion goes to Cloudflare Stream (or equivalent) with the app server only issuing signed capabilities and managing state.
- Features: scheduled/public/followers-only/subscriber-only streams, co-hosts, live chat w/ moderation, pinned comments, polls, gifts, tips, replays with auto-captions.
- Concurrency strategy: chat via Realtime channels with sharding; viewer counts via Redis counters; degrade gracefully (chat-off mode) under load.

## 4. Podcast Platform

**Data model:** `podcasts` (show, cover, description, host, RSS feed URL), `podcast_episodes` (audio/video, season, show notes, chapters, transcript, publish/schedule), `podcast_followers`, analytics events.

**Distribution:** standards-compliant RSS feed generation; external podcast import; episode pages with transcript, related creators, subscribe, support.

**Monetization:** free/paid podcasts, subscriber-only & bonus episodes, tips, sponsorships, advertising, memberships, live podcast events.

**Analytics:** downloads, plays, completion rate, retention curves, geographic audience, episode performance, revenue.

## 5. Implementation Phasing
Reels/Stories/Studio → Phase 4. Live + podcasts → Phase 5. Full creator monetization + payouts → Phase 6. See `docs/IMPLEMENTATION-ROADMAP.md`.
