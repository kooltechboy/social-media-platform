---
title: "ARCHITECTURE_DECISION_RECORDS — Key Technical Decisions (ADR-013 to ADR-017)"
type: adr-index
status: verified
owner: Chief Architect
created: 2026-10-28
updated: 2026-10-28
tags:
  - tukubi
  - adr
  - architecture-decisions
related:
  - "[[TUKUBI Engineering Intelligence]]"
  - "[[02 Architecture/SYSTEM_ARCHITECTURE]]"
---

# ARCHITECTURE_DECISION_RECORDS — TUKUBI

> Historical ADRs (`ADR-001` through `ADR-012`) reside in `docs/adr/`. The records below document the key architectural decisions enacted during the **TUKUBI: Giant Among Giants** engineering transformation.

---

## ADR-013: Server-Computed Ad Spend & Double-Entry Ledger Settlement

- **Status:** Accepted & Implemented (`2026-10-28`)
- **Context:** In migration `00114`, `public.record_ad_impression_and_spend` accepted a client-supplied `p_cost_minor` parameter and mutated `campaigns.spent_amount_minor` directly without writing double-entry ledger entries. Additionally, `TransactionLedgerService.recordSettledTransaction` skipped `ledger_entries` when `recipientId` was `null` (platform-direct payments such as `AD_PAYMENT`).
- **Decision:**
  1. Restrict `record_ad_impression_and_spend` execution to `service_role` (`00115_security_ads_and_rpc_hardening.sql`).
  2. Compute impression cost server-side from `ad_sets.bid_amount_minor` (`GREATEST(1, ROUND(bid_amount_minor / 1000.0))`), enforce `moderation_status = 'approved'`, deduplicate impressions per viewer within a 5-minute window, and write paired debit/credit rows to `public.ledger_entries`.
  3. Extend `TransactionLedgerService` and create `public.fund_campaign_from_intent` so platform-direct payments (`payerId` present, `recipientId = null`) always generate balanced double-entry `ledger_entries` using deterministic platform clearing and revenue accounts.
- **Consequences:** Eliminates client-side spend tampering, guarantees idempotent PayPal capture/webhook reconciliation via `settle_intent_${intent.id}`, and satisfies `AGENTS.md` Rule 3 across all ad transactions.

---

## ADR-014: Unified Post & Video RLS with Trigger-Enforced Column Immutability

- **Status:** Accepted & Implemented (`2026-10-28`)
- **Context:** PostgreSQL `UPDATE` RLS policies regulate row visibility and post-update predicates, but cannot natively restrict individual column mutations (such as a user updating their own `videos.view_count` or an advertiser updating `campaigns.moderation_status = 'approved'`). Furthermore, parallel `00108` migrations had overwritten `public.posts` policies.
- **Decision:**
  1. Reconcile `public.posts` RLS into a single unified set of policies (`posts_select_policy`, `posts_insert_policy`, `posts_update_policy`, `posts_delete_policy`) supporting personal, community, and Page roles (`can_manage_page`).
  2. Attach `BEFORE UPDATE` triggers (`enforce_campaign_and_ad_security` on `campaigns`/`ads` and `enforce_video_immutable_fields` on `videos`) that reject mutations to financial, moderation, or engagement counter columns unless `current_user IN ('postgres', 'service_role')` or `is_staff_or_ad_moderator(auth.uid())`.
- **Consequences:** Prevents privilege escalation and metric spoofing via direct PostgREST client calls while preserving clean RLS policy definitions.

---

## ADR-015: Dedicated `video_saves` & `video_shares` Tables for Shorts

- **Status:** Accepted & Implemented (`2026-10-28`)
- **Context:** TUKUBI Shorts and Reels are stored in `public.videos`, whereas `saved_posts` and `post_shares` enforce foreign-key references to `public.posts(id)`. Saving or sharing a Short previously failed foreign-key constraints unless a matching `posts.id` existed.
- **Decision:** Create `public.video_saves` and `public.video_shares` with foreign keys to `public.videos(id)` and strict RLS policies in `00115_security_ads_and_rpc_hardening.sql`, updating `saveShortAction`, `unsaveShortAction`, and `recordShortShareAction` in `apps/web/src/lib/media/short-actions.ts`.
- **Consequences:** Shorts bookmarks and share telemetry persist reliably with full referential integrity.

---

## ADR-016: SSR Cookie + Database Dual-Persistence for `Island Vibes` & `Island Daylight` Themes

- **Status:** Accepted & Implemented (`2026-10-28`)
- **Context:** Design tokens for `Island Daylight` existed in `@caribbean/design-system` and `apps/web/src/app/globals.css`, but `/settings` only rendered a static dark-mode card and `layout.tsx` hardcoded `data-theme="island-vibes"`.
- **Decision:** Update `updateThemeAction` (`apps/web/src/lib/settings/settings-actions.ts`) to accept `'island-vibes' | 'island-daylight'`, persist to `profiles.theme_preference`, and set an HTTP cookie `tukubi_theme`. Update `apps/web/src/app/layout.tsx` to resolve the active theme on the server (avoiding FOUC) and update `settings-view.tsx` to switch `document.documentElement.dataset.theme` immediately on click.
- **Consequences:** Zero-flash SSR theme rendering and instant client-side switching between `Island Vibes` (dark) and `Island Daylight` (light) with WCAG 2.2 AAA contrast.

---

## ADR-017: Deterministic AST/Regex Codebase Knowledge Graph Generator

- **Status:** Accepted & Implemented (`2026-10-28`)
- **Context:** Multi-agent engineering teams require an accurate, up-to-date map of workspace dependencies, routes, server actions, and database migrations without sending proprietary code to external SaaS indexers.
- **Decision:** Implement a zero-network local generator (`scripts/code-intelligence/generate-codebase-graph.js`) that scans `apps/*`, `packages/*`, `apps/web/src/**`, and `supabase/migrations/*` to produce `TUKUBI Engineering Intelligence/03 Codebase Intelligence/graph.json`.
- **Consequences:** Fast (`< 2s`), reproducible, local-first code intelligence graph integrated directly into the Obsidian vault.
