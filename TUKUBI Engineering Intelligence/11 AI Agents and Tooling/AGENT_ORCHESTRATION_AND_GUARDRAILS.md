---
title: "AGENT_ORCHESTRATION_AND_GUARDRAILS — Multi-Agent Governance & CaribAI Architecture"
type: agent-governance
status: verified
owner: AI & Agent Systems Lead
created: 2026-10-28
updated: 2026-10-28
tags:
  - tukubi
  - agents
  - caribai
  - openrouter
  - governance
related:
  - "[[TUKUBI Engineering Intelligence]]"
  - "[[07 Security and Privacy/SECURITY_THREAT_MODEL]]"
---

# AGENT_ORCHESTRATION_AND_GUARDRAILS — TUKUBI

## 1. Engineering Multi-Agent Structure (`.agents/agents/`)

TUKUBI is governed by 17 specialized agent protocols in `.agents/agents/` (`chief-architect.md`, `security.md`, `database.md`, `payments.md`, `frontend.md`, `brand-ux.md`, `mobile.md`, `backend.md`, `media-publishing.md`, `ai.md`, `trust-safety.md`, `qa.md`, `performance.md`, `devops.md`, `analytics.md`, `product.md`, `release-manager.md`) and 5 execution workflows in `.agents/workflows/`.

### Binding Agent Guardrails
1. **Least Privilege & Approval Boundary:** Agents never execute destructive Git commands, never drop production tables, never run live real-money charges, and never commit secrets.
2. **Evidence Before Assertions:** No agent may declare a task complete without fresh output from `pnpm check:prohibited`, `pnpm typecheck`, `pnpm lint`, and `pnpm test:unit`.
3. **Obsidian & Code Graph Synchronization:** Structural changes require regenerating `TUKUBI Engineering Intelligence/03 Codebase Intelligence/graph.json` via `node scripts/code-intelligence/generate-codebase-graph.js`.

---

## 2. Product AI (`CaribAI` — `packages/ai/src/openrouter.ts`)

- **Zero-Cost Model Routing:** All product AI features (CaribAI Cultural Assistant, Dialect Caption Generator, Ad Copy Assistant, Business Messaging AI Concierge) route exclusively through verified `:free` OpenRouter models (`meta-llama/llama-3.3-70b-instruct:free`, `google/gemma-3-27b-it:free`, `mistralai/mistral-small-3.1-24b-instruct:free`).
- **Prompt Injection Defense & Disclosure:** User prompts are sanitized before model invocation, rate-limited per user, and all AI-generated messages carry explicit attribution (`message_kind: 'ai_response'`).
