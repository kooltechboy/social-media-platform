# ADR-005 — Cloudflare R2/Stream Object Storage + CDN for Media

**Status:** Accepted
**Context:** Photos, video, podcast audio, and livestream recordings must never be served from application servers. Egress economics matter at social scale.
**Decision:** Upload → R2/Stream → processing (transcode, thumbnails, captions) → CDN → user. Signed, expiring URLs for private media; lifecycle policies for ephemeral content.
**Consequences:** Provider abstraction at the storage interface so a future move is not a rewrite. Media processing runs async via the event pipeline.
