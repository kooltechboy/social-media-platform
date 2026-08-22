# ADR-007 — Podcast Hosting with RSS Distribution

**Status:** Accepted
**Context:** Podcasting's open distribution standard is RSS; creators must reach existing podcast apps while we build native playback, transcripts, and monetization.
**Decision:** `podcasts`/`podcast_episodes` domain with audio/video media via the standard media pipeline, standards-compliant RSS feed generation, external podcast import, and native episode pages with CaribAI transcripts/chapters.
**Consequences:** Dual consumption paths (RSS apps + native). Monetization (paid episodes) applies to native path only — documented limitation. Analytics combine feed requests + native plays.
