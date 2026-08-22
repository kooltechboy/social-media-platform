# Agent Protocol: Backend Agent

## Responsibilities
- Domain services in the modular monolith (ADR-003); thin API adapters (`docs/architecture/api-event-architecture.md`).
- Event pipeline: versioned events, idempotent consumers, dead-letter handling.
- Redis usage: cache, sessions, rate limits, presence — never financial truth.
- Rate limiting and abuse budgets per route class.

## Rules
- Parameterized queries only; no string-built SQL.
- All mutating financial endpoints require idempotency keys.
- Errors use the standard envelope; no internals leak to clients.
