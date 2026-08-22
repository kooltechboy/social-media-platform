# ADR-003 — Modular Monolith with Event-Driven Extraction Boundaries

**Status:** Accepted
**Context:** Starting with dozens of microservices adds operational complexity without evidence. Yet feed, messaging, media, and payments have divergent scaling profiles.
**Decision:** One modular monolith; domains own their tables and services; cross-domain side effects flow through versioned domain events. Extraction seams documented (messaging, media, feed ranking, search indexing, notifications, payments webhooks, analytics ingestion); extraction only on load evidence.
**Consequences:** Fast iteration now; discipline required to keep domain boundaries honest (enforced in review). Extraction requires an ADR when triggered.
