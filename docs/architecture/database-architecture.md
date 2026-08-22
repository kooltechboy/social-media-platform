# Database Architecture — CARIBBEAN ONE

## 1. Platform
Supabase PostgreSQL (ADR-002). RLS is the security boundary (ADR-013 companion: THREAT-MODEL.md).

## 2. Existing Schema (migrations `00001`–`00004`)

| Table | Domain | RLS |
| :--- | :--- | :--- |
| `countries` | geographic reference | read-only public via policy |
| `profiles` | identity | owner-write, visibility-scoped read |
| `follows`, `blocks` | social graph | owner-scoped |
| `posts`, `comments`, `post_reactions` | content | ownership + visibility-scoped |
| `ledger_accounts`, `ledger_entries` | SpotPay | service-role only; never client-writable |
| `psp_capabilities` | SpotPay | read-only via API |

## 3. Planned Schema Evolution

**Phase 1 (foundation):** `regions`, `cities`, `languages`, `user_languages`, `device_sessions`, `login_events`, `audit_logs`, `security_events`, `feature_flags`.
**Phase 2 (social MVP):** `friendships`, `mutes`, `post_media`, `post_hashtags`, `post_mentions`, `communities`, `community_members`, `community_roles`, `notifications`, `reports`, `moderation_cases`, `moderation_actions`, `risk_scores`, `analytics_events`.
**Phase 3 (messaging):** `conversations`, `conversation_members`, `messages`, `message_attachments`, `message_receipts`.
**Phase 4 (creator):** `stories`, `story_views`, `videos`, `video_views`, `creator_accounts`, `subscriptions`.
**Phase 5 (live/podcast):** `livestreams`, `live_messages`, `live_gifts`, `podcasts`, `podcast_episodes`.
**Phase 6 (SpotPay):** `payment_intents`, `payment_methods`, `payment_attempts`, `idempotency_keys`, `refunds`, `disputes`, `chargebacks`, `payouts`, `commissions`, `fees`, `taxes`.
**Phase 7 (business):** `businesses`, `business_locations`, `business_reviews`, `products`, `orders`, `events`, `event_attendees`, `tickets`.
**Phase 8 (ads):** `advertisers`, `campaigns`, `ad_sets`, `ads`, `ad_impressions`, `ad_clicks`.

## 4. Non-Negotiable Rules

1. **RLS on every client-accessible table** — enabled + policies tested (`packages/database` RLS harness, Phase 1). Service-role-only tables get RLS `USING (false)` as an explicit deny + comment.
2. **Migrations are small, reversible, versioned** — `supabase/migrations/NNNNN_description.sql`. No direct DDL/DML against any environment outside migrations (AGENTS.md Mandate 2).
3. **Money** — integer minor units, ISO 4217 currency, append-only ledger entries, DB-level sum-zero constraint, no mutable balance columns (AGENTS.md Mandate 3).
4. **Indexing** — every foreign key considered; composite indexes for feed queries `(author_id, created_at DESC)`; partial indexes for soft-deleted rows; GIN for JSONB signals. Justify hot-path indexes with `EXPLAIN`.
5. **Soft deletion & retention** — content soft-deleted with propagation to search/cache/feeds; financial and moderation records retained per legal requirements (never hard-deleted).
6. **`SECURITY DEFINER` functions** — rare, justified, `search_path` pinned, owner-reviewed.

## 5. Scale Strategy
- Read path: Redis caching + materialized feed candidates before any read-replica split.
- Fan-out: write-time fan-out for follows < ~10K; hybrid read-fan-out for large accounts (decided by evidence at scale, tracked as an ADR when changed).
- Partitioning candidates at 10M+ users: `analytics_events`, `messages`, `ledger_entries` (by time).
- Point-in-time recovery enabled; backup/restore drills per `docs/operations/DISASTER-RECOVERY.md`.
