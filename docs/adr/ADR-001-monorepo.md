# ADR-001 — pnpm + Turborepo Monorepo

**Status:** Accepted
**Context:** Web, mobile, admin, moderation, and studios share design tokens, types, API contracts, and domain logic. Multi-repo would duplicate abstractions and drift.
**Decision:** Single pnpm workspace + Turborepo. `apps/*` deployables, `packages/*` (`@caribbean/*`) shared libraries. Packages are created only when a domain has real logic — no empty placeholder packages.
**Consequences:** One CI pipeline gates all apps; package boundaries enforced by review (Chief Architect). Dependency graph must stay acyclic.
