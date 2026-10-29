---
name: obsidian-engineering-intelligence
description: "Manage, query, and update the TUKUBI Engineering Intelligence Obsidian vault. Ensures persistent project memory, visual knowledge graphs, architecture documentation, and decision tracking across all engineering sessions. Use after completing significant changes, investigations, or architecture decisions."
---

# Obsidian Engineering Intelligence & Persistent Memory — Directive

This skill governs the persistent knowledge management and architecture documentation layer for TUKUBI within the local Obsidian vault located at:
`c:\Users\Owner\Desktop\social media platform\TUKUBI Engineering Intelligence`

Obsidian complements—never replaces—the authoritative source code, PostgreSQL database migrations, automated tests, or machine AST tools like Graphify.

---

## 1. Vault Architecture & Domain Map

The vault is organized into 16 standardized domain directories:

| Directory | Scope & Authoritative Documents |
| :--- | :--- |
| `00 Dashboard/` | `PROJECT_DASHBOARD.md`, `PRODUCT_MATURITY_SCORECARD.md`, `TECHNICAL_DEBT_REGISTER.md`, `IMPLEMENTATION_ROADMAP.md` |
| `01 Product and Brand/` | `PROJECT_CONTEXT.md` (TUKUBI Identity, Island Vibes theme, Caribbean Futurism) |
| `02 Architecture/` | `SYSTEM_ARCHITECTURE.md` (Monorepo boundaries, Next.js 15 App Router, Supabase backend) |
| `03 Codebase Intelligence/` | `CODEBASE_MAP.md` + AST graph exports (`graph.json`) |
| `04 Reverse Engineering/` | `REA_REVERSE_ENGINEERING_REPORT.md` (Empirical reference architecture deconstructions) |
| `05 Feature Inventory/` | `FEATURE_INVENTORY.md` (18 route groups, 17 mobile screens, verification statuses) |
| `06 Database and APIs/` | `DATA_MODEL.md` (115 migrations), `API_AND_INTEGRATIONS.md` |
| `07 Security and Privacy/` | `SECURITY_THREAT_MODEL.md` (OWASP mitigations, RLS policies, identity privacy) |
| `08 UI UX and Accessibility/` | `UI_UX_AND_ACCESSIBILITY_AUDIT.md` (Design tokens, WCAG 2.2 AA contrast matrices) |
| `09 Social and Creator Systems/` | `SOCIAL_AND_CREATOR_WORKFLOWS.md` (Feed, Shorts, Pages, Messaging) |
| `10 Advertising and Monetization/`| `ADVERTISING_AND_PAYPAL_ARCHITECTURE.md` (PayPal Orders v2, double-entry ledger) |
| `11 Competitor Research/` | `COMPETITOR_BENCHMARKS.md` (Facebook, Instagram, TikTok, YouTube, WhatsApp benchmarks) |
| `12 Testing and QA/` | `TESTING_STRATEGY.md` (Vitest unit suites, Playwright E2E, quality gates) |
| `13 Operations and Releases/` | `ENGINEERING_CHANGELOG.md` |
| `14 Decision Records & Reports/` | `ARCHITECTURE_DECISION_RECORDS.md`, `AGENT_ASSURANCE_AND_AUDIT_REPORT.md` |
| `15 Templates/` | 10 standard markdown templates for specs, ADRs, bugs, tests, and handoffs |
| `99 Archive/` | `ARCHIVE_INDEX.md` (Superseded or historical notes) |

---

## 2. Persistent Agent Memory Protocol

Before initiating unfamiliar or high-impact work, agents must consult:
1. `00 Dashboard/PROJECT_DASHBOARD.md`
2. Relevant domain notes in `02 Architecture/`, `06 Database and APIs/`, or `07 Security and Privacy/`

After completing significant engineering work, agents must update the corresponding vault notes with:
- **WHAT CHANGED:** Concrete list of files and components touched.
- **WHY:** Business or technical rationale.
- **TESTS RUN & EVIDENCE:** Exact command executed, test counts, duration, and pass/fail status.
- **LIMITATIONS & DEBT:** Any unverified assumptions or remaining follow-up tasks.
- **COMMIT REFERENCES:** Relevant commit hashes or branch state.

---

## 3. Obsidian Linking & Visual Graph Conventions

- Use native Obsidian wikilinks `[[Folder/Note Name|Display Label]]` so notes resolve cleanly in Obsidian's native Graph View and Canvas.
- Keep Markdown clean and portable (compatible with ordinary Markdown viewers on GitHub and IDEs).
- Avoid duplication: link to existing source code paths and SQL migrations (`supabase/migrations/`) rather than copy-pasting entire schema files.
- Exclude `.obsidian/workspace*.json` and local cache files from Git tracking while keeping `.md` notes tracked.
