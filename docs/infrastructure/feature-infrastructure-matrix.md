# TUKUBI Feature-to-Infrastructure Traceability Matrix

**Status:** Production Baseline  
**Version:** September 2026 Master Baseline  

---

| Platform Feature | Primary App / Route | Core Monorepo Package | Database Entities | Database RPCs & Triggers | External Service / Rail |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Authentication & Onboarding** | `apps/web/app/(auth)/*`<br>`apps/mobile/src/screens/auth/*` | `@caribbean/auth` | `auth.users`<br>`public.profiles`<br>`public.user_settings` | `handle_new_user()`<br>`allocate_founder_number()` | Supabase GoTrue<br>Apple Sign-In<br>Google OAuth |
| **Chronological & Algorithmic Feeds** | `apps/web/app/(main)/feed/*`<br>`apps/mobile/src/screens/feed/*` | `@caribbean/social`<br>`@caribbean/recommendations` | `posts`<br>`feed_activity_timeline`<br>`affinity_scores` | `create_post_with_media()`<br>`fan_out_post_timeline()` | Supabase Realtime (New Posts Broadcast) |
| **Caribbean Media & Sounds** | `apps/web/app/(main)/sounds/*`<br>`apps/mobile/src/screens/sounds/*` | `@caribbean/media` | `sounds`<br>`sound_usage`<br>`media_assets` | `sync_sound_usage_count()` | Supabase Storage (`caribbean-media` S3 Bucket)<br>HLS Transcoder |
| **Messenger-Grade Chat** | `apps/web/app/(main)/messages/*`<br>`apps/mobile/src/screens/chat/*` | `@caribbean/messaging` | `conversations`<br>`conversation_participants`<br>`chat_messages_p[0-7]`<br>`message_receipts` | `send_direct_message()`<br>`touch_updated_at()` | Supabase Realtime WebSockets<br>APNS & FCM Push |
| **Voice & Video Calling** | `apps/web/app/(main)/calls/*`<br>`apps/mobile/src/screens/call/*` | `@caribbean/live` | `call_sessions`<br>`call_participants` | `initiate_call_session()`<br>`terminate_call_session()` | LiveKit WebRTC SFU / TURN Servers |
| **Pages & Businesses** | `apps/web/app/(main)/businesses/*`<br>`apps/business-studio/*` | `@caribbean/business` | `businesses`<br>`business_members`<br>`business_hours`<br>`business_reviews` | `is_business_member()`<br>`verify_business_tier()` | Google Maps Geocoding API |
| **Communities & Guilds** | `apps/web/app/(main)/communities/*`<br>`apps/mobile/src/screens/groups/*`| `@caribbean/communities` | `communities`<br>`community_roles`<br>`community_members`<br>`community_channels` | `seed_default_community_roles()`<br>`is_community_moderator()` | Supabase Realtime |
| **Social Marketplace** | `apps/web/app/(main)/marketplace/*`<br>`apps/business-studio/inventory/*`| `@caribbean/marketplace` | `marketplace_listings`<br>`marketplace_orders`<br>`order_items`<br>`carrier_tracking_events` | `ingest_carrier_tracking_event()`<br>`dispute_marketplace_order()` | Regional Carrier APIs (DHL, Caribbean Logistics) |
| **Creator Monetization & Tips** | `apps/web/app/(main)/creator/*`<br>`apps/creator-studio/*` | `@caribbean/creator`<br>`@caribbean/payments` | `creator_subscriptions`<br>`creator_tiers`<br>`tips`<br>`wallets`<br>`ledger_*` | `execute_tip_transfer()`<br>`request_payout()` | Stripe Connect Custom Accounts<br>PayPal Payouts API |
| **Double-Entry Financial Ledger** | `apps/admin/app/(finance)/*` | `@caribbean/payments` | `ledger_accounts`<br>`ledger_transactions`<br>`ledger_entries`<br>`reconciliation_reports` | `enforce_ledger_entry_balance()`<br>`reconcile_ledger_integrity()` | Automated nightly pg_cron job |
| **Trust, Safety & Moderation** | `apps/moderation/*`<br>`apps/admin/app/(safety)/*` | `@caribbean/trust-safety`<br>`@caribbean/ai` | `moderation_cases`<br>`moderation_actions`<br>`appeals`<br>`audit_logs` | `log_admin_action()`<br>`evaluate_risk_score()` | OpenRouter API (CaribAI free inference models) |
| **Telemetry & Analytics** | `apps/admin/app/(analytics)/*` | `@caribbean/analytics` | `analytics_events_2026_*`<br>`user_daily_metrics` | `create_monthly_partition()` | Upstash Redis Pipeline |
