# Intelligence Architecture: CaribAI, Search & Feed — TUKUBI

## 1. CaribAI (AI OS)

Internal AI layer via `packages/ai` — **OpenRouter multi-model routing** (ADR-011): model-agnostic abstraction; no hard-coded provider; free-tier-first model selection with fallbacks.

**Capabilities (phased):** semantic search & Ask Caribbean, recommendations signals, translation (en↔es, fr, ht, nl, pap — Papiamento/Papiamentu), transcription & auto-captions, content summarization, creator tools (show notes, chapters), moderation assistance, spam/scam/fraud detection, business assistance.

**Safety rules (THREAT-MODEL.md §5):** prompt-injection defenses (system/user separation, tool allow-lists), no PII in third-party prompts, grounded retrieval answers with citations, inference never presented as fact about people/businesses.

## 2. Ask Caribbean (AI Search)

Natural-language queries ("What Caribbean events are happening in Miami this weekend?") searched across people, posts, communities, businesses, events, podcasts, videos, creators, marketplace, locations — answered via retrieval + synthesis with source links. Behind `ai_search_enabled` feature flag (Phase 8).

## 3. Search Architecture (ADR-010)

- **Now:** PostgreSQL full-text + trigram search behind a `SearchIndex` port/interface in `packages/search` (Phase 2).
- **Later:** dedicated engine (Typesense/OpenSearch/Elasticsearch) chosen **after benchmarking**, ingested from the event pipeline (Postgres → index). Business logic never talks to a search vendor directly — only the port.

## 4. Feed Architecture (ADR-012)

```
Content → Event Pipeline → Feature Generation → Candidate Retrieval
  → Ranking → Safety Filtering → Personalization → Feed
```

**Ranking signals:** relationship strength, recency, engagement, content quality, creator/community affinity, geographic relevance, **Caribbean Graph relevance**, language, negative feedback, safety signals.

**Objective function:** meaningful engagement + user satisfaction + healthy communities — **not raw engagement**. Users get algorithm control via feed modes:

| Mode | Behavior |
| :--- | :--- |
| For You | AI-ranked (flagged rollout) |
| Following | subscription chronology |
| Friends | friend graph only |
| Caribbean | region-wide graph-weighted |
| Local | nearby/community |
| Communities | community-scoped |
| Latest | strict chronological |

**Implementation path:** Phase 2 ships Following/Latest/Communities as cursor-paginated queries (never `OFFSET`); ranking service introduced Phase 4 behind `new_feed_algorithm` flag with A/B evaluation; Redis-cached candidate sets.
