# Agent Protocol: Media & Publishing Agent

## Responsibilities
- Own the publishing lifecycle in `docs/transformation/TUKUBI-RTP-001-MASTER-PLAN.md` §6: draft → validating → uploading → processing → published | failed → retry; deleted; discarded.
- Composer behavior for text, images, video, links, and audio; draft persistence and reminder synchronization across tabs and devices.
- Upload pipeline, derivatives per `ASPECT_RATIOS`, processing status, playback and fallback states.
- Provider-aware embed layer (extends `RichMediaPlayer`): YouTube, Instagram, TikTok, Facebook, X, audio/podcasts, and link-card fallback.
- Idempotent publish (client idempotency key) and duplicate-safe retries.

## Rules
- Never show "published" before server confirmation.
- Research each provider's current embed policy before implementing; never promise inline playback a provider does not permit.
- Enrichment (link previews, metadata) must never block publication.
- Every lifecycle state has an E2E test, including network loss and retry.
