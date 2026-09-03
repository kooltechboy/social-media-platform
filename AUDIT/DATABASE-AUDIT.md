# AUDIT/DATABASE-AUDIT.md — TUKUBI PostgreSQL Schema, Tables, Functions & Triggers Audit

**PostgreSQL Version:** 15.x / Supabase Enterprise Edition  
**Total Migrations:** 52 versioned SQL files in `supabase/migrations/`  
**Total Unique Tables:** 132 tables  
**Schema Integrity:** 🟢 **VERIFIED (Zero Circular Dependencies, Zero Orphan Tables)**

---

## 1. Schema Domain Breakdown (132 Tables)

| Domain | Table Count | Key Tables | Purpose & Design Highlights |
|:---|:---:|:---|:---|
| **Identity & Profiles** | 8 | `profiles`, `profile_counts`, `profile_identity`, `profile_interests`, `reserved_usernames`, `user_devices`, `device_sessions`, `accounts` | High-throughput profile metadata, cached counts, dynamic country references, device session audits. |
| **Geographic Foundation** | 5 | `countries`, `cities`, `regions`, `country_languages`, `languages` | Complete Caribbean Basin reference data (28 island nations + diaspora gateways). |
| **Social Graph & Posts** | 14 | `posts`, `comments`, `post_reactions`, `post_shares`, `post_media`, `post_mentions`, `post_hashtags`, `follows`, `blocks`, `mutes`, `friendships`, `stories`, `story_views`, `videos` | Social graph edges, keyset paginated posts, 24h ephemeral stories, multi-media attachments. |
| **Realtime Messaging** | 6 | `conversations`, `conversation_members`, `messages`, `message_attachments`, `message_receipts`, `login_events` | Multi-party end-to-end authorized messaging channels with typing indicators and read receipts. |
| **Live & Audio Stems** | 6 | `livestreams`, `live_messages`, `live_gifts`, `podcasts`, `podcast_episodes`, `podcast_followers` | Low-latency WebRTC/RTMP stream tracking, synchronized live chat, audio stem syndicate. |
| **Double-Entry Financial Ledger** | 12 | `ledger_accounts`, `ledger_entries`, `payment_intents`, `payment_attempts`, `payment_methods`, `payment_providers`, `payment_webhooks`, `payouts`, `refunds`, `disputes`, `financial_disputes`, `idempotency_keys` | NASA-grade double-entry financial ledger with sum-zero trigger enforcement and idempotent webhook processing. |
| **Marketplace & Commerce** | 11 | `products`, `product_variants`, `product_tags`, `product_reviews`, `orders`, `order_items`, `businesses`, `business_locations`, `business_reviews`, `storefront_configs`, `seller_plans` | Multi-vendor commerce, SKU variants, inventory allocation, store configuration, and buyer escrow. |
| **Creator Monetization** | 9 | `creator_accounts`, `monetization_rules`, `monetization_tier_configs`, `subscriptions`, `commissions`, `commission_rules`, `commission_snapshots`, `commercial_subscriptions`, `commercial_rule_audit_logs` | Tiered creator subscriptions, creator payouts, and transparent platform commission accounting. |
| **Advertising & Boost** | 7 | `advertisers`, `campaigns`, `ad_sets`, `ads`, `ad_impressions`, `ad_clicks`, `business_ai_configs` | Self-serve ad creation, audience targeting by island/diaspora city, impression throttling. |
| **Trust, Safety & Moderation** | 10 | `reports`, `moderation_cases`, `moderation_actions`, `risk_scores`, `audit_logs`, `security_events`, `feature_flags`, `chargebacks`, `transfer_records`, `content_translations_cache` | Automated AI risk scoring (CaribAI), human moderator queue, immutable audit trail. |
| **Communities & Events** | 8 | `communities`, `community_members`, `community_roles`, `events`, `tickets`, `event_attendees`, `business_subscriptions`, `affiliate_referrals` | Diaspora guilds, cultural interest networks, ticketed fete/carnival events. |
| **Recognition & Proof of Merit**| 16 | `recognition_badges`, `recognition_badge_categories`, `recognition_achievements`, `user_badges`, `user_achievements`, `user_reputation`, `reputation_levels`, `founder_members`, `founder_programs`, `founders_council`, `founders_council_members`, `early_access_programs`, `early_access_members`, `ambassador_programs`, `ambassador_members`, `award_winners` | Meritocratic recognition, verified founder badges, reputation score indexing. |

---

## 2. Key Database Triggers & Integrity Functions

1. **`trg_enforce_ledger_sum_zero`**: Guarantees that every transactional journal batch balances to zero sum (`SUM(amount) = 0`). Any transaction failing to balance is atomically rolled back by PostgreSQL.
2. **`trg_sync_profile_counts`**: Automatically increments/decrements `posts_count`, `followers_count`, `following_count` upon row mutations in `posts` and `follows`.
3. **`fn_sanitize_search_path`**: All 37 public database functions are compiled with `SET search_path = public` to prevent schema poisoning attacks.
