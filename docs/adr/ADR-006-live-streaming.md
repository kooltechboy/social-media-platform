# ADR-006 — Managed Live Streaming Ingestion

**Status:** Accepted
**Context:** Live video cannot transit the application server; transcoding and fan-out are specialized infrastructure.
**Decision:** RTMPS/WebRTC ingestion into Cloudflare Stream (or equivalent managed provider); app server only issues signed ingest/playback capabilities and manages stream state (scheduled, followers-only, subscriber-only). Live chat via Supabase Realtime shards; viewer counts via Redis; gifts via SpotPay ledger.
**Consequences:** Provider abstraction kept thin; degrade-to-chat-off mode under load. Provider choice revisited with evidence.
