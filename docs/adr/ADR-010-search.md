# ADR-010 — Search Behind a Port; Postgres FTS Now, Dedicated Engine Later

**Status:** Accepted
**Context:** Postgres full-text + trigram is sufficient for launch scale, but semantic/typo-tolerant Caribbean-multilingual search will eventually need a dedicated engine (Typesense/OpenSearch/Elasticsearch).
**Decision:** Business logic depends only on a `SearchIndex` port in `packages/search`. Postgres implements the port today; a dedicated engine (chosen after benchmarking) is ingested from the event pipeline later.
**Consequences:** Zero rewrite at swap time; vendor choice deferred until evidence exists. Port must expose only query semantics we can honor in both engines.
