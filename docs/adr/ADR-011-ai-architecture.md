# ADR-011 — Provider-Agnostic AI via OpenRouter (CaribAI)

**Status:** Accepted
**Context:** AI needs span translation (en/es/fr/ht/nl/pap), moderation assistance, semantic search, transcription, and creator tools. Single-provider lock-in is fragile; Caribbean-language quality varies by model.
**Decision:** `packages/ai` routes through OpenRouter with a multi-model abstraction: per-task model selection, free-tier-first routing with fallbacks, and a provider-agnostic interface so direct provider integrations can be added later.
**Consequences:** Model swaps are configuration. Prompt-injection defenses and no-PII-in-prompt rules apply at the abstraction layer (THREAT-MODEL.md §5). Quality per Caribbean language tracked per model.
