---
title: "ADDY_OSMANI_AGENT_SKILLS_EVALUATION — Selective Assessment & Integration Strategy"
type: engineering-evaluation
status: verified
owner: Chief Architect & Lead AI Engineer
created: 2026-10-28
updated: 2026-10-28
tags:
  - tukubi
  - ai-agents
  - skills-evaluation
  - addy-osmani
related:
  - "[[TUKUBI Engineering Intelligence/11 AI Agents and Tooling/AGENT_ORCHESTRATION_AND_GUARDRAILS|AGENT_ORCHESTRATION_AND_GUARDRAILS]]"
  - "[[02 Architecture/SYSTEM_ARCHITECTURE]]"
---

# Addy Osmani's Agent Skills — Selective Assessment & Integration Matrix

## 1. Overview & Repository Provenance

- **Repository:** `https://github.com/addyosmani/agent-skills`
- **Author:** Addy Osmani (Senior Engineering Director, Google/Chrome)
- **License:** MIT License (Permissive open source; free to adapt and integrate)
- **Architecture:** Markdown-based agent skill specifications (`SKILL.md`) structured into lifecycle phases with explicit anti-rationalization guardrails and procedural checklists.
- **Target Harnesses:** Claude Code, Cursor, Codex, Windsurf, Google Antigravity (`agy`), and Gemini CLI.

---

## 2. Architectural Analysis: TUKUBI Protocol Compatibility

TUKUBI maintains strict engineering governance codified in `AGENTS.md` (NASA-grade architecture, versioned Supabase SQL migrations, RLS mandatory on every table, double-entry financial ledger safety, and zero TypeScript errors).

Installing third-party agent skills indiscriminately risks duplicating workflows, creating conflicting instructions, or introducing harness assumptions designed for single-agent Claude Code rather than Antigravity pair-programming.

Therefore, we apply **selective evaluation**: assess each skill against TUKUBI's current `.agents/` infrastructure, extract core engineering principles, and avoid duplicate or redundant files.

---

## 3. Skill Evaluation & Selection Matrix

| Requested Skill | Osmani Scope | Current TUKUBI Counterpart | Assessment & Decision |
| :--- | :--- | :--- | :--- |
| **`frontend-ui-engineering`** | Layout stability, CSS design tokens, responsive typography, WCAG contrast. | `.agents/skills/frontend-design`, `@caribbean/design-system` | **Adopt principles.** Enforce Caribbean Futurism design tokens (`Island Vibes` / `Island Daylight`), responsive `16:9` / `9:16` media aspect ratios, and WCAG 2.2 AA accessibility. |
| **`test-driven-development`** | Strict Red-Green-Refactor test first workflow. | `.agents/skills/test-driven-development`, `tdd` | **Already Active.** Fully integrated into TUKUBI workflow; verified in our link intelligence implementation (12 failing tests → all Green). |
| **`browser-testing-with-devtools`** | Headless browser execution, DOM validation, console error capture. | `webapp-testing`, Playwright E2E suites | **Adopted.** Used for validating iframe postMessage traps, embed playback, and fallback rendering. |
| **`debugging-and-error-recovery`** | Root cause analysis, minimal reproducible test cases. | `.agents/skills/systematic-debugging` | **Already Active.** Complemented by Tri-State separation (Observations, Inferences, Unknowns). |
| **`api-and-interface-design`** | REST/RPC design, defensive input validation, schema evolution. | `BaseContentProvider`, `@caribbean/media` type contracts | **Adopted.** Formalized in `ResolvedContentMetadata` and `SafeFetchOptions` interface contracts. |
| **`performance-optimization`** | Bundle reduction, Core Web Vitals, LRU caching, image optimization. | `vercel-optimize`, Next.js Image Optimization, memory LRU cache | **Adopted.** Implemented 7-day Supabase cache + memory LRU cache for resolved URLs (`durationMs < 50ms`). |
| **`security-and-hardening`** | SSRF prevention, input sanitization, OWASP mitigation, CSP whitelisting. | `.agents/policies/security.md`, `ssrf-guard.ts` | **Adopted.** Implemented RFC 1918 IPv4/IPv6 blocking, DNS rebinding prevention, and extracted thumbnail SSRF protection. |
| **`code-review-and-quality`** | Multi-axis review (Standards, Spec, Regression risk). | `.agents/skills/code-review`, `verification-before-completion` | **Already Active.** Enforced prior to any commit. |
| **`documentation-and-adrs`** | Architecture decision records, persistent knowledge graph updates. | `obsidian-engineering-intelligence`, `TUKUBI Engineering Intelligence/` | **Already Active.** Vault maintained with persistent memory and ADR indexes. |
| **`git-workflow-and-versioning`** | Atomic commits, worktree isolation, conventional commits. | `using-git-worktrees`, Conventional Commits | **Already Active.** Working branch `main`, verified zero uncommitted untracked pollution. |
| **`ci-cd-and-automation`** | Inviolable gates, regression test suites, zero-tolerance checks. | `check:prohibited`, `Legacy Deprecated Provider Zero-Tolerance Gate`, Turbo pipeline | **Already Active.** 214 test suites and 2,326 tests automated via Turbo/Vitest. |

---

## 4. Key Takeaways for TUKUBI Operations

1. **Anti-Rationalization Countermeasures:** Osmani's explicit table of "agent excuses" vs. "engineering realities" reinforces our `AGENTS.md` rule: *Never claim something works without testing it; never declare completion without evidence.*
2. **Platform Specificity:** Rather than pulling in vendor-specific shell scripts, TUKUBI adopts Osmani's behavioral prompts natively into Antigravity task artifacts and Obsidian records.
3. **Evidence-Driven Verification:** Work is only certified when tests pass, typechecks pass with zero errors, and Obsidian intelligence is updated.
