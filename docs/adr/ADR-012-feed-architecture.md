# ADR-012 — Multi-Mode Feed with Ranking Introduced Behind Flags

**Status:** Accepted
**Context:** A naive `ORDER BY created_at` feed cannot scale or serve Caribbean relevance; but engagement-only ranking recreates incumbent pathologies and is a big-bang risk.
**Decision:** Ship cursor-paginated Following/Latest/Communities modes first. Phase 4 introduces a ranking service (relationship + recency + quality + community/geographic/Caribbean Graph relevance + safety signals) behind `new_feed_algorithm` with A/B evaluation. Objective function: meaningful engagement + satisfaction + healthy communities — not raw engagement. Users always have feed-mode choice.
**Consequences:** Early users get predictable feeds; ranking arrives with evidence and a kill switch. Hybrid fan-out strategy decided by scale evidence (documented as future ADR).
