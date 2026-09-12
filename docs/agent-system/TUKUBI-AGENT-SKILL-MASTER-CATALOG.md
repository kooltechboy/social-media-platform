# TUKUBI Antigravity Agent Skill & Agent Master Catalog

**System:** TUKUBI Caribbean Digital Ecosystem  
**Target Environment:** Antigravity 2.0 (Google DeepMind) + Universal Cross-Agent Portability (Claude Code, OpenAI/Codex, Gemini CLI, Cursor, OpenCode)  
**Governance Standard:** NASA-grade Software Architecture & Fortune-100 Security (`AGENTS.md`)  
**Status:** Active Production Blueprint  

---

## Executive Summary & System Philosophy

Rather than treating AI agents as simple autocomplete tools or dumping thousands of unvetted GitHub repositories into Antigravity, TUKUBI operates an **Enterprise Agent Operating System (TUKUBI Agent OS)**. 

The universal **Agent Skills Specification** (centered around self-contained directories with `SKILL.md`, metadata frontmatter, reference docs, and sandboxed scripts) enables complete portability across **Antigravity**, **Claude Code**, **Codex**, and **Gemini CLI**.

This Master Catalog establishes:
1. **Verified Repository Sources**: The authoritative list of primary, secondary, and specialized skill repositories.
2. **Evaluation & Security Scoring Engine**: A 10-dimension evaluation rubric enforcing the *Zero-Trust Skill Gate*.
3. **P0 / P1 / P2 Tiering**: Immediate production installations versus approved toolbox assets.
4. **16 TUKUBI Native Agents & Subagents**: Domain-specialized personas matching TUKUBI's multi-layered architecture (Social, Creator Hub, Marketplace, Payments, CaribAI, Supabase RLS).
5. **Universal Portability Directory Structure**: Multi-agent configuration sync (`.agents/skills`, `.claude/skills`, `.gemini/skills`).

---

## 1. Master Repository Directory

| Tier | Repository / Source | Scope / Ecosystem | Primary Capabilities & TUKUBI Value | License |
| :--- | :--- | :--- | :--- | :--- |
| 🥇 **Foundational** | `anthropics/skills` | Official Anthropic Reference | Gold-standard SKILL.md specs, document manipulation (PDF, DOCX, XLSX, PPTX), frontend design, MCP patterns, prompt engineering, systematic debugging. | MIT |
| 🥇 **Foundational** | `sickn33/antigravity-awesome-skills` (AAS) | Antigravity Community Standard | 600–2,000+ indexed skills, universal `.agent/skills` installers, multi-agent adapters, workflow automations. | MIT / Apache 2.0 |
| 🥇 **Foundational** | `openai/skills` & `openai/codex` | Official OpenAI | Codex workflows, structured tool use, code generation patterns, legacy-to-modern plugin migration specs. | MIT |
| 🥇 **Foundational** | `saudeglobal/awesome-agent-skills2026` | Multi-Vendor Aggregator | 1,000+ cross-vendor skills aggregating Anthropic, Google, Stripe, Cloudflare, Vercel, Trail of Bits, Sentry, Expo, and fal.ai. | Curated Open Source |
| 🥈 **Engineering** | `vercel-labs/agent-skills` & `vercel/ai` | Official Vercel / Next.js | Next.js 15 App Router, React 19 Server Components, bundle optimization, Vercel AI SDK, fluid compute tuning. | MIT |
| 🥈 **Engineering** | `supabase/agent-skills` & Supabase Best Practices | Official Supabase | PostgreSQL schema design, bulletproof Row Level Security (RLS), Edge Functions, PgBouncer pooling, Realtime subscriptions, pgvector. | Apache 2.0 |
| 🥈 **Engineering** | `expo/skills` | Official Expo & React Native | Universal React Native, Expo Router, NativeWind/Tailwind v4, EAS build/deploy, push notifications, offline cache. | MIT |
| 🥈 **Engineering** | `microsoft/playwright` | Official Microsoft Playwright | End-to-end browser automation, regression testing, mobile viewport emulation, visual screenshot diffing, session state testing. | Apache 2.0 |
| 🥈 **Security** | `trailofbits/agent-skills` | Premier Security Research | Threat modeling, static AST analysis, smart contract / cryptographic verification, dependency supply-chain auditing, secure coding rules. | Apache 2.0 |
| 🥈 **Security** | `OWASP/CheatSheetSeries` & `sergiodxa/agent-skills` | Industry Standard AppSec | OWASP Top 10, API Security Top 10, session management, CSRF/XSS sanitization, rate limiting, RLS audit templates. | CC-BY-SA 4.0 |
| 🥈 **Payments** | `stripe/agent-skills` | Official Stripe Developer | Payment intents, Webhook signature verification, recurring subscriptions, Stripe Connect marketplace payouts, dispute handling. | Apache 2.0 |
| 🥈 **Payments** | `paypal/paypal-rest-api-sdk` | Official PayPal Developer | PayPal Checkout, vaulting, orders v2, webhooks, dispute resolution, marketplace escrows. | Apache 2.0 |
| 🥈 **Observability** | `getsentry/agent-skills` | Official Sentry | Production error tracing, distributed span analysis, breadcrumb inspection, regression alert triaging, release health. | MIT |
| 🥈 **Infrastructure** | `cloudflare/skills` | Official Cloudflare | Cloudflare Workers, R2 object storage, Cloudflare Stream (video transcoding), CDN caching, WAF rules, DDoS mitigation. | Apache 2.0 |
| 🥈 **Design & UI** | `google/stitch` & `google-deepmind/generative_ui` | Google Labs / DeepMind | Generative UI widgets, design-to-code pipelines, high-fidelity interactive component generation, responsive tokens. | Apache 2.0 |
| 🥈 **Methodology** | `obra/superpowers` | Agentic Engineering Excellence | Test-Driven Development (TDD), Systematic Debugging, Brainstorming, Code Review, Subagent Delegation, Verification-before-completion. | MIT |
| 🥉 **Research** | `open-agent-craft/awesome-agent-skills` | Curated Collection | Cross-tool recipes for Claude Code, Codex, Cursor, Antigravity, and MCP integrations. | MIT |
| 🥉 **Research** | `scienceaix/agentskills` | Research & Discovery Catalog | Academic papers, agent performance benchmarks, LLM code-generation datasets, agentic reasoning benchmarks. | Academic / MIT |

---

## 2. The 10-Dimension Evaluation & Security Scoring Engine

Every incoming skill is evaluated across a 100-point rubric before being allowed into the TUKUBI production environment.

```
Total Score = ∑ (Dimension Score [1–10]) -> Max 100
```

| Dimension | Weight | Criteria for 10/10 | Failure Mode (Auto-Block) |
| :--- | :---: | :--- | :--- |
| **1. TUKUBI Relevance** | 10 | Directly accelerates Caribbean social, creator, marketplace, or payment architecture. | Irrelevant desktop utility or unrelated tech stack (e.g. Ruby on Rails, legacy PHP). |
| **2. Technical Rigor** | 10 | Follows strict TypeScript, modern ESM, declarative configurations, deterministic outputs. | Hallucinated imports, outdated APIs, lack of error handling. |
| **3. Security & Sandboxing** | 10 | Read-only by default; explicit permission prompts; zero shell wildcards; no hardcoded credentials. | Arbitrary `rm -rf`, unvalidated shell inputs, network phone-home hooks, obfuscated payloads. |
| **4. Maintenance & Freshness** | 10 | Updated within the last 90 days; compatible with Next.js 15, React 19, Supabase 2026. | Deprecated libraries, unmaintained for >1 year without updates. |
| **5. Official Authority** | 10 | Authored/maintained by official vendor (Anthropic, Supabase, Vercel, Cloudflare, Expo, Stripe). | Anonymous unverified GitHub forks with zero track record or stars. |
| **6. Antigravity Compatibility** | 10 | Fully functional with Antigravity tool calling, task management, subagent delegation, and artifact generation. | Assumes proprietary unsupported CLI wrappers that break in Antigravity. |
| **7. Claude Portability** | 10 | Adheres to Anthropic `SKILL.md` frontmatter standard (`name`, `description`, `parameters`). | Incompatible proprietary prompt wrappers. |
| **8. OpenAI / Codex Portability** | 10 | Schema can be parsed into OpenAI function calling or standard tool definitions. | Non-standard syntax. |
| **9. Gemini / Multimodal Ready** | 10 | Supports multimodal asset passing (UI screenshots, video frames, design mockups). | Text-only strict limitations on visual inspection tasks. |
| **10. Licensing & IP** | 10 | Permissive open source (MIT, Apache 2.0, BSD-3-Clause). | AGPL-3.0 copyleft taint or proprietary restrictive licenses. |

### Classification Tiers:
- **P0 (Score 85–100):** Mission-Critical Core — Permanently active in `.agents/skills`.
- **P1 (Score 70–84):** Approved Specialist Toolbox — Loaded on-demand by dedicated subagents.
- **P2 (Score 50–69):** Reference / Educational Catalog — Documented in docs for pattern extraction.
- **BLOCKED (Score <50 or Security Flag):** Blacklisted immediately.

---

## 3. Curated TUKUBI Skill Arsenal (P0 & P1)

### Subsystem A: Core Architecture & Quality Engineering
- **`superpowers:test-driven-development`** (P0): Strict Red-Green-Refactor loop. Tests written before implementation.
- **`superpowers:systematic-debugging`** (P0): Root cause analysis before proposing patches. Prevents blind guessing.
- **`superpowers:verification-before-completion`** (P0): Enforces running automated tests, builds, and linting before declaring work done.
- **`superpowers:dispatching-parallel-agents`** (P0): Spawns isolated subagents for decoupled tasks.
- **`anthropics:code-review`** (P0): Dual-axis review (Standards vs. Spec) to ensure zero regressions.

### Subsystem B: Frontend & Design System (TUKUBI Caribbean Futurism)
- **`vercel:vercel-react-best-practices`** (P0): RSC streaming, memoization, avoiding waterfall fetches in Next.js 15.
- **`vercel:vercel-composition-patterns`** (P1): Compound component architecture, eliminating boolean prop explosion.
- **`vercel:vercel-react-view-transitions`** (P1): Smooth page transitions and shared element animations for feeds and profiles.
- **`google:generative_ui`** (P0): Rendering interactive inline artifacts, data visualizers, and UI mockups.
- **`tukubi:caribbean-design-tokens`** (P0 - Native): Enforces sunset corals (`#FF6B4A`), twilight purples (`#4A154B`), golden hour ambers (`#F59E0B`), and tropical sea blues (`#0D9488`).

### Subsystem C: Database, Storage & Ledger Safety
- **`supabase:supabase-postgres-best-practices`** (P0): Query optimization, index selection, connection pooling, deadlock prevention.
- **`tukubi:rls-policy-guardian`** (P0 - Native): Enforces non-bypassable Row Level Security on all tables accessible to clients.
- **`tukubi:double-entry-financial-ledger`** (P0 - Native): Blocks mutable balance updates (`balance = balance + X`). Enforces paired debit/credit immutable transaction records with idempotency keys.
- **`cloudflare:cloudflare-r2-stream`** (P1): Secure presigned uploads for creator reels, photos, and high-res media.

### Subsystem D: Mobile (Universal iOS & Android)
- **`expo:expo-skills`** (P0): Expo Router v4 navigation, deep linking, native module bridges.
- **`vercel:vercel-react-native-skills`** (P0): FlatList/FlashList virtualization, re-render avoidance, UI thread animations.
- **`tukubi:offline-sync-engine`** (P1 - Native): SQLite + MMKV offline caching for Caribbean bandwidth resilience.

### Subsystem E: Payments, Commerce & Creator Monetization
- **`stripe:agent-skills`** (P0): Customer sessions, subscription webhooks, connect marketplace splits.
- **`paypal:agent-skills`** (P1): PayPal checkout and dispute webhooks.
- **`tukubi:caribbean-payment-orchestrator`** (P0 - Native): Fallback routing between Stripe, WiPay, CXPay, and mobile in-app purchases (Apple/Google store compliance).

### Subsystem F: Trust, Safety & CaribAI
- **`sergiodxa:owasp-security-check`** (P0): OWASP API Top 10 automated scans.
- **`trailofbits:threat-modeling`** (P1): Formal STRIDE threat assessment on public endpoints.
- **`tukubi:carib-ai-dialect-engine`** (P0 - Native): Multilingual translation & cultural localization (English, Spanish, French, Haitian Creole, Papiamento, Jamaican Patois).
- **`tukubi:identity-privacy-engine`** (P0 - Native): Enforces strict opt-in cultural and geographic privacy per `AGENTS.md`.

---

## 4. The 16 TUKUBI Native Agents

The Antigravity ecosystem is organized into 16 specialized agents, each governed by an explicit role specification and access privileges:

```
                               ┌─────────────────────────────┐
                               │   TUKUBI CHIEF ARCHITECT    │
                               └──────────────┬──────────────┘
                                              │
         ┌───────────────────┬────────────────┼───────────────────┬───────────────────┐
         │                   │                │                   │                   │
         ▼                   ▼                ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌───────────┐ ┌─────────────────┐ ┌─────────────────┐
│ FRONTEND PRIN.  │ │  BACKEND / DBA  │ │ PAYMENTS  │ │ TRUST & SAFETY  │ │     CaribAI     │
│ (Next.js 15 UI) │ │ (Supabase/RLS)  │ │ (Ledger)  │ │ (OWASP/Privacy) │ │  (Dialect/NLP)  │
└────────┬────────┘ └────────┬────────┘ └─────┬─────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                │                │                   │
         └───────────────────┴────────────────┼────────────────┴───────────────────┘
                                              │
         ┌───────────────────┬────────────────┼───────────────────┬───────────────────┐
         │                   │                │                   │                   │
         ▼                   ▼                ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌───────────┐ ┌─────────────────┐ ┌─────────────────┐
│ MOBILE PRINC.   │ │ CREATOR PLATF.  │ │COMMERCE & │ │  SOCIAL GRAPH   │ │  QA COMMANDER   │
│  (Expo/Native)  │ │ (Video/Stream)  │ │MARKETPLACE│ │ (Feed/Messages) │ │  (Playwright)   │
└─────────────────┘ └─────────────────┘ └───────────┘ └─────────────────┘ └─────────────────┘
```

1. **`@chief-architect`**: Monorepo integrity, cross-cutting architectural decision records (ADRs), module boundaries.
2. **`@frontend-principal`**: Next.js 15 App Router, React Server Components, Tailwind v4, Caribbean Futurism design tokens.
3. **`@database-architect`**: Supabase migrations, PostgreSQL schemas, RLS policy enforcement, double-entry financial ledger safety.
4. **`@payments-engineer`**: PSP connectors (Stripe, PayPal, WiPay), webhook reconciliation, payout idempotency, App Store compliance.
5. **`@mobile-principal`**: Universal Expo React Native, offline-first sync, push notifications, 60fps gesture interactions.
6. **`@security-auditor`**: OWASP Top 10, penetration testing, secrets protection, cryptographic verification, dependency audits.
7. **`@trust-and-safety`**: Content moderation pipelines, automated report triage, anti-harassment policies, cultural identity privacy.
8. **`@carib-ai-specialist`**: OpenRouter free-tier LLM routing, Caribbean dialect translation (Creole, Papiamento, Patois), sentiment analysis.
9. **`@creator-platform-engineer`**: Video processing, Cloudflare Stream pipelines, live broadcasting, tipping, monetization splits.
10. **`@social-graph-engineer`**: High-throughput feeds, messaging sockets, friend/follow graphs, group interactions, activity notifications.
11. **`@marketplace-specialist`**: Vendor stores, inventory tracking, order fulfillment, escrow holds, dispute resolution.
12. **`@qa-commander`**: Playwright E2E browser suites, Vitest unit testing, automated visual regression, load testing.
13. **`@performance-auditor`**: Core Web Vitals, memory leak profiling, database slow query EXPLAIN plans, bundle tree-shaking.
14. **`@devops-sre`**: Vercel production deployments, Cloudflare edge routing, CI/CD GitHub Actions, automated database rollback plans.
15. **`@analytics-data-engineer`**: Event taxonomy, privacy-compliant telemetry, creator analytics dashboards, retention funnels.
16. **`@launch-commander`**: Production release checklists, smoke tests, blue-green cutover monitoring, incident escalation.

---

## 5. Directory Structure & Universal Portability Architecture

To ensure zero vendor lock-in, skills and agent configurations are synchronized across all major agent environments:

```
social media platform/
├── .agents/                    <-- Universal Agent Standard (Antigravity & OpenCode)
│   ├── agents/                 <-- 16 Role Specifications (.md)
│   ├── skills/                 <-- Curated, sandboxed SKILL.md modules
│   │   ├── superpowers/        <-- TDD, debugging, plan execution
│   │   ├── supabase/          <-- Database, RLS, Edge functions
│   │   ├── vercel/            <-- Next.js 15, RSC patterns
│   │   ├── payments/          <-- Double-entry ledger, Stripe, PayPal
│   │   └── tukubi-native/     <-- Custom Caribbean & ecosystem skills
│   └── workflows/              <-- Multi-step release and feature protocols
├── .claude/
│   └── skills/                 <-- Symlinked or mirrored from .agents/skills
├── .gemini/
│   └── skills/                 <-- Built-in Antigravity / Gemini configuration
├── docs/
│   └── agent-system/
│       ├── TUKUBI-AGENT-SKILL-MASTER-CATALOG.md
│       └── SKILL-SECURITY-GATE.md
├── skills.json                 <-- Dynamic runtime skills manifest
└── skills-lock.json            <-- Pinned SHA-256 version lockfile
```

---

## 6. Zero-Trust Skill Security Gate Protocol

Before any skill is checked into `.agents/skills` or executed by an Antigravity agent:

1. **Static AST & Content Inspection**:
   - `SKILL.md` is scanned for unescaped subshell executions (`$(...)`, backticks, `eval`, `powershell -c`, `curl | bash`).
   - Check for hardcoded API keys, JWT tokens, or external exfiltration URLs.
2. **Permission Boundary Audit**:
   - Verify that write/execution permissions are scoped strictly to the workspace directory (`c:\Users\Owner\Desktop\social media platform`).
   - Network calls must route through verified project endpoints or authorized APIs.
3. **Idempotency & Rollback Requirement**:
   - Every skill that performs file modifications must produce clean git diffs and define an explicit rollback action.
4. **Manifest Registration**:
   - The skill must be registered in `skills.json` and `docs/skills-manifest.md` with an assigned owning agent.
