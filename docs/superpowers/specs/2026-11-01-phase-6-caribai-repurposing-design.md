# Phase 6 Design Specification: CaribAI Assistant & Media Repurposing Pipeline

**Date:** 2026-11-01  
**Author:** Antigravity Architect (Autonomous Agent)  
**Governance:** TUKUBI Engineering Governance (`AGENTS.md`), Rule 7 (Never Guess / Grounded Truth), Rule 8 (Privacy of Identity).

---

## 1. Problem Statement & Architecture Goals
Caribbean creators and diaspora community leaders create rich cultural content — audio tracks, podcasts, carnival stories, artisan product features, and community updates.
However, manually adapting one piece of content into multiple formats (short-form Reels, feed carousel cards, community debate prompts, and multi-dialect translations) is time-consuming.
CaribAI solves this with:
1. **Multi-Model Free-Tier Fallback Chain:**
   - Routes through a ranked chain of free OpenRouter models (`meta-llama/llama-3.3-70b-instruct:free`, `deepseek/deepseek-r1:free`, `qwen/qwen-2.5-coder-32b-instruct:free`, `google/gemini-2.0-flash-exp:free`) with zero financial lock-in.
   - Graceful offline/deterministic fallback when network is unavailable or API key is unconfigured.
2. **Media Repurposing Pipeline Engine (`repurposing.ts`):**
   - Transforms long-form source content into:
     - Short-form Reel Script (Hook, 3-scene breakdown with visual cues, Call to Action, duration < 60s).
     - 4-Card Carousel Brief (Swipeable slides with punchy headlines).
     - Caribbean Community Question / Discussion starter.
     - Audio Voice-Note Script for broadcast channels.
3. **Caribbean Dialect Synthesis:**
   - Supports Jamaican Patois, Trinidadian Creole, Haitian Kreyòl, Dominican Spanish, and Caribbean Standard English.

---

## 2. Core Subsystems & Components

### 2.1 Model Router & Fallback Chain (`packages/ai/src/router.ts`)
- `OPENROUTER_FALLBACK_MODELS`: prioritized array of free-tier models.
- `executeWithModelFallback`: tries models in sequence on 429/503 errors before falling back to local deterministic generator.

### 2.2 Content Repurposing Engine (`packages/ai/src/repurposing.ts`)
- `repurposeContent(input: RepurposeInput): RepurposedContentBundle`
- Generates structured, validated bundles containing:
  - `reelScript`: { hook, scenes, cta, estimatedSeconds }
  - `carousel`: Array<{ slideNumber, headline, bodyText, imageIdea }>
  - `communityPrompt`: { question, debateAngles, hashtags }
  - `audioNote`: { text, suggestedTone }

---

## 3. Verification & Safety Verification
- Unit test suite: `tests/caribai-media-repurposing.test.ts`.
- Full monorepo typecheck: 31/31 packages clean.
- CI gate: 0 prohibited references.
