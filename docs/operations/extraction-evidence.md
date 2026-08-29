# Service Extraction Evidence — TUKUBI

Companion to ADR-003 (modular monolith with extraction boundaries). Services are extracted **only** when evidence in this file justifies it. Each extraction requires a new ADR.

## Thresholds for triggering extraction
- Sustained p95 above budget for 7+ days after index/cache optimization, OR
- Domain load profile destabilizes other domains (noisy neighbor), OR
- Independent scaling requirement (e.g., live chat fan-out during Carnival-scale events).

## Evidence log

| Date | Domain | Signal | Observation | Action |
| :--- | :--- | :--- | :--- | :--- |
| 2026-08-20 | — | Baseline | No production traffic yet; monolith retained | None — monitor |

## Candidate order (per architecture docs)
1. `media processing` — CPU-bound transcoding, natural first extraction
2. `messaging` — long-lived connections, different availability class
3. `feed ranking` — compute-heavy, cache-friendly
4. `search indexing` — batch pipeline, independent failure domain
5. `notifications fan-out` — bursty, queue-backed already
6. `payments/webhooks` — provider-coupled, compliance isolation
7. `analytics ingestion` — write-heavy, partitioned table growth
