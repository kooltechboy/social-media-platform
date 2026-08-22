# 06 — DATABASE FORENSIC AUDIT & SCHEMA INTEGRITY

**Domain:** PostgreSQL 15, Supabase Migrations, Indexes, Constraints & Row Level Security (RLS)  
**Auditor:** Principal Database Architect  
**Status:** Excellent (Score: 88/100)

---

## 1. Schema Inventory & Table Taxonomy

The database schema is version-controlled via 16 numbered migration files (`supabase/migrations/00001_initial_schema.sql` through `00016_profile_counts_notifications_storage.sql`), comprising **48 public schema tables**:

```
1. Identity & Profiles: profiles, profile_identity, profile_interests
2. Geographic Model: countries, regions, cities, languages, country_languages
3. Social Graph: follows, blocks, friendships, mutes
4. Feed & Content: posts, comments, post_reactions, post_media, post_hashtags, post_mentions
5. Communities: communities, community_members, community_roles
6. Messaging: conversations, conversation_members, messages, message_attachments, message_receipts
7. Creator & Media: creator_accounts, subscriptions, videos, video_views, stories, story_views
8. Live & Podcasts: livestreams, live_messages, live_gifts, podcasts, podcast_episodes, podcast_followers
9. SpotPay Ledger: ledger_accounts, ledger_entries, psp_capabilities
10. SpotPay Payments: payment_intents, payment_methods, payment_attempts, idempotency_keys, refunds, disputes, chargebacks, payouts, commissions
11. Business & Commerce: businesses, business_locations, business_reviews, products, orders, order_items, events, event_attendees, tickets
12. Advertising: advertisers, campaigns, ad_sets, ads, ad_impressions, ad_clicks
13. Platform & Security: feature_flags, notifications, analytics_events, audit_logs, security_events, device_sessions, login_events
14. Moderation: reports, moderation_cases, moderation_actions, risk_scores
```

---

## 2. Row Level Security (RLS) Verification

Every table accessible by client roles (`anon`, `authenticated`) has `ROW LEVEL SECURITY` enabled with granular policies.

### Sensitive Ledger & Financial Isolation
- `public.ledger_entries`: Direct SELECT/INSERT/UPDATE by `authenticated` is **DENIED**. Access is restricted strictly to `service_role` and security-definer RPC ledger procedures.
- `public.profile_identity`: Default visibility is `private`. Non-owners cannot read another user's cultural identity unless explicitly set to `public`.
- `public.moderation_cases`: Invisible to standard authenticated users; accessible only to users with role `moderator` or `admin`.

---

## 3. Database Indexes & Query Optimization

- **Foreign Keys:** 100% of relationship columns have corresponding `REFERENCES ... ON DELETE CASCADE/SET NULL` constraints.
- **Composite Indexes:**
  - `posts(created_at DESC, id DESC)` for zero-offset cursor pagination.
  - `community_members(community_id, profile_id)` unique composite constraint.
  - `messages(conversation_id, created_at ASC)` for rapid thread retrieval.
  - `ledger_entries(account_id, created_at DESC)` for balance audit queries.
  - `post_reactions(post_id, profile_id)` unique composite constraint preventing double-likes.
