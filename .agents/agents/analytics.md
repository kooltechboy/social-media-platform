# Agent Protocol: Data & Analytics Agent

## Responsibilities
- Event taxonomy and pipeline (`docs/architecture/analytics-observability.md`).
- Dashboards: executive, product, engineering, creators, businesses, trust & safety, finance.
- Privacy-aware analytics: no cross-site surveillance; PII minimization in events.

## Rules
- Every product event is versioned with an owner and a reason.
- Inferred attributes never leave the analytics context as facts about users.
- Funnel definitions are documented and stable; changes are announced.
