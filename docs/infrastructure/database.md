# TUKUBI Database Architecture & Schema Specification

**Status:** Production Baseline  
**Version:** September 2026 Master Baseline (Migrations 00001–00093)  
**Database Engine:** PostgreSQL 17.6 (x86_64-pc-linux-gnu, compiled by gcc 12.2.0)  
**Host & Topology:** Supabase Managed Cloud, AWS us-east-1  
**Total Registered Migrations:** 94  
**Public Relational Entities:** 208 Tables & Partitions  
**Extensions:** `uuid-ossp`, `pgcrypto`, `pg_trgm` (in `extensions` schema), `pg_stat_statements`  

---

## 1. Architectural Principles

1. **Strict Versioned Migration DDL:** Every table, index, function, trigger, and policy is managed exclusively via version-controlled SQL migrations in `supabase/migrations/` (`00001_initial_schema.sql` through `00093_production_infrastructure_hardening.sql`). Zero out-of-band DDL is permitted.
2. **Universal Row-Level Security (RLS):** All 208 public tables and partitions enforce RLS (`ENABLE ROW LEVEL SECURITY`). Zero public tables allow unauthenticated arbitrary access.
3. **Partition-Aware Schema:** High-throughput time-series and partitioned domains (`analytics_events`, `feed_activity_timeline`, `chat_messages`) employ range and hash partitioning to prevent table bloat and preserve linear query performance.
4. **Immutable Financial Ledger:** All wallet balances and monetary transfers are strictly derived from double-entry accounting records (`ledger_accounts`, `ledger_entries`, `ledger_transactions`). Mutable balance increments (`balance = balance + X`) are architecturally forbidden.
5. **Search Path Isolation:** All functions execute with an explicit, secure `search_path` (`SET search_path = public, extensions` or `SET search_path = public`) preventing search-path injection exploits.

---

## 2. Core Domain Schema Taxonomy

### 2.1 Identity, Profiles & Accounts
- `profiles`: Core user profile entity linked 1:1 with `auth.users.id`. Contains usernames, display names, avatar URLs, bio, Caribbean country of origin, residence country, verified status, and founder allocations.
- `founder_allocations`: Immutable record of early pioneer founder numbers (1–10,000) assigned to early Caribbean creators and diaspora leaders.
- `profile_badges`: Verified cultural, creator, community, and business badges awarded to profiles.
- `user_settings`: User privacy configurations, notification preferences, language preferences (English, Spanish, French, Haitian Creole, Papiamentu).
- `user_devices`: FCM and APNS push tokens, platform metadata, and device liveness timestamps.
- `user_blocks` & `user_mutes`: User-directed privacy and safety controls.

### 2.2 Social Graph & Publishing
- `posts`: Core social publishing entity supporting text, link attachments, media carousels, video embeds, and Caribbean audio sound attribution.
- `post_media`: Junction table linking multi-media attachments to posts with aspect ratio metadata (`9:16`, `1:1`, `4:5`, `16:9`).
- `comments`: Hierarchical threaded discussions under posts with parent-child ancestry tracking.
- `post_reactions`: Expressive emotional feedback (`like`, `love`, `caribbean_fire`, `applause`, `vibes`) enforced via check constraints.
- `post_shares`: Tracking native shares, quotes, and external syndication links.
- `relationships`: Directed social graph modeling bilateral friendships (`status = 'accepted'`) and asymmetrical creator follows.
- `hashtags` & `post_hashtags`: Trigram-indexed hashtag indexing for trending discovery.

### 2.3 Feeds & Timelines
- `feed_activity_timeline`: Range-partitioned timeline table (`feed_activity_timeline_2026_08`, `2026_09`, etc.) storing fan-out-on-write event records for high-speed chronological retrieval.
- `affinity_scores`: Asymmetric interaction affinity between users, computing edge weights for algorithmic feed ranking.
- `content_scores`: Dynamic engagement scoring aggregating velocity of reactions, shares, and watch time.

### 2.4 Realtime Messaging & RTC
- `conversations`: Group and direct messaging channels with conversation types (`direct`, `group`, `business`, `community`).
- `conversation_participants`: Membership junction with role (`owner`, `admin`, `member`), mute status, and read-receipt watermarks.
- `chat_messages`: Hash-partitioned message store (`chat_messages_p0` through `chat_messages_p7`) partitioned on `conversation_id` for optimal horizontal query distribution.
- `message_attachments`: File metadata, encrypted media URLs, voice note waveform vectors.
- `message_receipts`: Ephemeral and persistent delivery and read status per participant.
- `message_reactions`: Emoji reactions per message.
- `call_sessions` & `call_participants`: WebRTC room state, signaling tokens, and call duration logs.

### 2.5 Pages & Businesses
- `businesses`: Entity table representing Pages and verified businesses. Contains trade name, registration number, category, contact data, physical island addresses, verification tier, and operational hours.
- `business_members`: RBAC junction mapping profiles to businesses with roles (`owner`, `admin`, `editor`, `moderator`, `analyst`).
- `business_categories`: Hierarchical taxonomy of Caribbean commerce (e.g., Hospitality, Agriculture, Tech, Artisanal, Culinary).
- `business_reviews`: Customer ratings, verified purchase badges, and merchant responses.

### 2.6 Communities & Guilds
- `communities`: Island hubs, interest groups, cultural guilds, and diaspora circles. Supports public, private, and secret visibility.
- `community_roles`: Granular permission sets per community defining administrative powers.
- `community_members`: Membership table linking profiles to communities via `role_id UUID REFERENCES community_roles(id)`.
- `community_channels`: Topic-based discussion channels within a community.
- `community_join_requests`: Workflow table for gated and private communities requiring vetting.
- `community_rules`: Documented community standards enforced during moderation.

### 2.7 Marketplace & Social Commerce
- `marketplace_listings`: Physical and digital product catalog with Caribbean multi-currency pricing, inventory counts, and shipping parameters.
- `marketplace_categories`: Category classification optimized for regional trade.
- `marketplace_orders`: State machine tracking order progression (`pending` → `payment_held` → `confirmed` → `shipped` → `delivered` → `completed` / `disputed`).
- `order_items`: Line-item snapshots preserving price at moment of checkout.
- `carrier_tracking_events`: Ingested logistics telemetry from regional Caribbean courier services and global carriers.
- `disputes`: Dispute arbitration workflows for buyers and merchants.

### 2.8 Double-Entry Financial Ledger
- `ledger_accounts`: Chart of accounts classifying assets, liabilities, equity, revenue, and expense accounts.
- `ledger_transactions`: Atomic financial transactions with idempotency keys, currency codes, and transaction types (`marketplace_payment`, `creator_tip`, `payout`, `platform_fee`).
- `ledger_entries`: Paired debit and credit entries (`amount` signed integer in base units/cents). Enforces `sum(debit) == sum(credit)`.
- `wallets`: User-facing platform balance caches backed 1:1 by corresponding ledger liability accounts.
- `payout_requests`: Structured merchant and creator withdrawal requests to Stripe Connect or PayPal.
- `reconciliation_reports`: Automated nightly ledger balance audit reports verifying zero-sum invariance across all system accounts.

### 2.9 Caribbean Sounds & Media Pipeline
- `sounds`: Audio track catalog featuring licensed Caribbean genres (Reggae, Soca, Dancehall, Kompa, Calypso, Zouk, Bouyon, Salsa, Steelpan).
- `sound_usage`: Attribution mapping linking posts and short-form videos to audio master tracks.
- `media_assets`: Uploaded media catalog with EXIF data stripped, dimensions recorded, and storage URI verified.
- `live_streams`: Live broadcast records with ingress keys, viewer counts, and replay archives.

### 2.10 Trust, Safety & Telemetry
- `moderation_cases`: Reported content tickets with automated CaribAI risk scores and reporter details.
- `moderation_actions`: Immutable audit trail of enforcement actions taken by moderators (`content_removed`, `account_suspended`, `warning_issued`).
- `appeals`: User appeal submissions and secondary human review outcomes.
- `audit_logs`: Administrative action logs capturing IP, user agent, actor ID, and diff payloads.
- `analytics_events`: Range-partitioned telemetry records (`analytics_events_2026_01` through `2026_12`) tracking product funnels without capturing PII.

---

## 3. Indexing & Query Optimization

- **Zero Duplicate Indexes:** All redundant index pairs have been eliminated. Composite indexes are ordered by filter cardinality then sort criteria.
- **Trigram Search Acceleration:** The `pg_trgm` extension is relocated to the `extensions` schema. Trigram GIN indexes accelerate fuzzy matching on:
  - `profiles(username gin_trgm_ops)`
  - `profiles(display_name gin_trgm_ops)`
  - `businesses(name gin_trgm_ops)`
  - `communities(name gin_trgm_ops)`
  - `marketplace_listings(title gin_trgm_ops)`
- **Foreign Key Indexing:** 100% of foreign keys participating in join conditions and cascades are backed by explicit B-tree indexes to prevent table-level share locks during updates.
