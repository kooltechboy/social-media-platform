# 07_DATABASE.md — PostgreSQL Schema, Ledger, & RLS Policies

## 1. Schema Inventory
- **Core Schemas:** `profiles`, `posts`, `post_reactions`, `comments`, `follows`.
- **Media & Streaming:** `videos`, `livestreams`, `live_messages`, `live_gifts`, `podcasts`, `podcast_episodes`, `podcast_followers`.
- **Communities & Events:** `communities`, `community_members`, `events`, `event_attendees`, `cities`, `countries`.
- **Commerce & SpotPay:** `products`, `orders`, `order_items`, `ledger_accounts`, `ledger_entries`, `payment_methods`, `creator_payouts`.
- **Trust & Safety:** `content_flags`, `moderation_actions`, `appeals`, `feature_flags`.

## 2. Row Level Security Verification
- 100% of client-accessible tables enforce explicit RLS policies with `auth.uid()`.
- Financial ledger entries are append-only and cannot be altered or deleted by clients.
