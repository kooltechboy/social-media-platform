---
title: "FEATURE_INVENTORY — Comprehensive TUKUBI Feature & Workflow Matrix"
type: feature-inventory
status: verified
owner: Product & QA Engineering
created: 2026-10-28
updated: 2026-10-28
tags:
  - tukubi
  - features
  - audit
  - workflows
related:
  - "[[TUKUBI Engineering Intelligence]]"
  - "[[00 Dashboard/TECHNICAL_DEBT_REGISTER]]"
---

# FEATURE_INVENTORY — TUKUBI

Every user-facing and operational feature in `apps/web` and `apps/mobile` has been mapped to its exact routes, components, server actions, API endpoints, and database tables, with verified post-remediation status.

## 1. Core Social & Publishing Workflows

| Feature | Routes | Key Components | Server Actions / API | Database Tables | Status |
|---|---|---|---|---|---|
| **Unified Home Feed** | `/` | `feed-stream.tsx`, `feed-post-card.tsx`, `home-rail.tsx` | `loadHomeFeedPage`, `loadFeedAction`, `hydratePostsEngagement` | `posts`, `post_media`, `post_likes`, `saved_posts`, `blocks`, `follows`, `page_followers` | `VERIFIED WORKING` (Fixed `DEFECT-01` media aspect hydration & `DB-01` unified RLS) |
| **Universal Post Composer** | `/` (inline & modal) | `universal-composer.tsx`, `draft-manager.ts` | `createPostAction`, `updatePostAction`, `deletePostAction`, `/api/v1/posts`, `/api/v1/link-preview` | `posts`, `post_media`, `post_drafts` | `VERIFIED WORKING` (Idempotency key, SSRF-safe link preview, draft auto-save) |
| **Personal Profiles** | `/profile`, `/profile/[username]` | `profile-edit-modal.tsx`, `profile-friends-tab.tsx` | `updateProfileAction`, `followAction`, `unfollowAction`, `sendFriendRequestAction` | `profiles`, `profile_counts`, `follows`, `friendships`, `user_blocks` | `VERIFIED WORKING` (Fixed `DEFECT-18` page post leakage & `DEFECT-19` follower visibility) |
| **Universal Pages** | `/pages`, `/pages/[slug]` | `page-detail-client.tsx`, `identity-switcher.tsx` | `createUniversalPageAction`, `updatePageDetailsAction`, `createPagePostAction`, `toggleFollowPageAction` | `businesses`, `page_roles`, `page_followers`, `posts` | `VERIFIED WORKING` (Fixed `DEFECT-05` Page post hydration, `SEC-04` RPC auth, `APP-02` verification bypass) |
| **Shorts & Reels** | `/shorts`, `/reels` | `shorts-feed-viewer.tsx`, `short-card.tsx`, `create-short-modal.tsx` | `publishShortAction`, `toggleShortLikeAction`, `fetchShortCommentsAction`, `postShortCommentAction`, `saveShortAction`, `reportShortAction` | `videos`, `video_views`, `video_comments`, `video_saves`, `video_shares`, `reports`, `moderation_cases` | `VERIFIED WORKING` (Fixed `DB-05`, `DEFECT-07`–`DEFECT-13`) |
| **Direct & Business Messaging** | `/messages` | `messages-shell.tsx`, `message-thread.tsx`, `audio-voice-note-player.tsx`, `webrtc-call-modal.tsx` | `sendMessageAction`, `editMessageAction`, `deleteMessageAction`, `toggleMessageReactionAction`, `generateBusinessAiResponseAction` | `conversations`, `conversation_participants`, `messages`, `message_reactions`, `message_requests` | `VERIFIED WORKING` (Fixed `SEC-02`, `DEFECT-15` voice persistence, `DEFECT-16` hydration, `DEFECT-17` AI alignment) |
| **Notifications Center** | `/notifications` | `notifications-realtime-provider.tsx`, `notifications-list.tsx` | `markNotificationReadAction`, `markAllNotificationsReadAction` | `notifications` | `VERIFIED WORKING` |
| **Communities & Groups** | `/communities`, `/communities/[slug]` | `communities-client.tsx`, `community-detail-view.tsx` | `joinCommunityAction`, `leaveCommunityAction`, `createCommunityPostAction` | `communities`, `community_members`, `posts` | `VERIFIED WORKING` |
| **Islands & Diaspora Hub** | `/islands`, `/culture` | `island-selector.tsx` | `loadFeedAction` (country/island filter) | `countries`, `posts`, `communities`, `events` | `VERIFIED WORKING` |
| **Cultural Events & Tickets** | `/events` | `events-view.tsx` | `rsvpEventAction`, `createEventAction` | `events`, `event_rsvps`, `tickets` | `VERIFIED WORKING` |
| **Caribbean Sounds & Music** | `/sounds`, `/sounds/[id]` | `sounds-hub.tsx`, `sound-detail-viewer.tsx`, `tukubi-audio-player.tsx` | `uploadSoundAction`, `toggleSaveSoundAction` | `sounds`, `saved_sounds`, `videos` | `VERIFIED WORKING` |
| **Podcasts Network** | `/podcasts` | `podcast-network-feed.tsx` | `createPodcastAction`, `publishEpisodeAction` | `podcasts`, `podcast_episodes` | `VERIFIED WORKING` |
| **Livestreaming & Co-Hosts** | `/live` | `live-studio-broadcaster.tsx`, `live-viewer-player.tsx` | `startLivestreamAction`, `endLivestreamAction`, `respondOrLeaveCohostAction` | `livestreams`, `livestream_cohosts`, `livestream_chat` | `VERIFIED WORKING` (Fixed `DB-06` missing `respond_or_leave_livestream_cohost` RPC) |

---

## 2. Monetization, Commerce & Financial Workflows

| Feature | Routes | Key Components | Server Actions / API | Database Tables | Status |
|---|---|---|---|---|---|
| **TUKUBI Ads Manager** | `/ads`, `/ads/create`, `/ads/[id]`, `/ads/billing` | `campaign-row.tsx`, `fund-campaign-button.tsx`, `ad-preview-card.tsx` | `createFullCampaignAction`, `initiateCampaignCheckoutAction`, `updateCampaignStatusAction`, `/api/ads/impression`, `/api/ads/click` | `campaigns`, `ad_sets`, `ads`, `ad_impressions`, `ad_clicks`, `ad_events`, `ad_moderation_logs` | `VERIFIED WORKING` (Fixed `P0-1`–`P0-11`, server-computed CPM, moderation gate, double-entry ledger) |
| **PayPal Checkout & Webhooks** | `/api/payments/paypal/capture`, `/api/payments/webhooks/paypal` | `paypal.ts` (`PayPalAdapter`), `transaction-service.ts` | `PayPalAdapter.createPayment`, `PayPalAdapter.captureOrder`, `PayPalAdapter.verifyWebhook`, `fund_campaign_from_intent` | `payment_intents`, `transactions`, `ledger_entries`, `webhook_events`, `campaigns` | `VERIFIED WORKING` (Fixed `P0-5`, `P0-6`, `P0-7`, `PAY-02`) |
| **Wallet & Financial Center** | `/wallet` | `wallet-dashboard.tsx` | `getWalletOverviewAction`, `requestPayoutAction`, `/api/v1/wallet/tip` | `wallets`, `transactions`, `ledger_entries`, `payout_requests` | `VERIFIED WORKING` |
| **Marketplace & Stores** | `/marketplace`, `/stores/[slug]`, `/orders` | `marketplace-grid.tsx`, `storefront-view.tsx` | `createProductAction`, `createOrderAction` | `businesses`, `products`, `orders`, `order_items` | `VERIFIED WORKING` |

---

## 3. Help, Settings, AI & Governance Workflows

| Feature | Routes | Key Components | Server Actions / API | Database Tables | Status |
|---|---|---|---|---|---|
| **Settings, Privacy & Themes** | `/settings` | `settings-view.tsx` | `updateThemeAction`, `updatePrivacySettingsAction`, `updateNotificationPrefsAction`, `requestAccountDeletionAction` | `profiles`, `user_settings`, `account_deletion_requests` | `VERIFIED WORKING` (Fixed `P2-UX-02` `Island Vibes` & `Island Daylight` live theme switching) |
| **Help & Learn Center** | `/help`, `/help/category/[slug]`, `/help/[slug]`, `/learn` | `help-search.tsx`, `articles-data.ts` | `/api/v1/help/feedback`, `/api/v1/help/tickets` | `help_articles`, `help_article_feedback`, `support_tickets` | `VERIFIED WORKING` (Fixed `DEFECT-20`–`DEFECT-23`, all 12 categories populated) |
| **CaribAI Assistant** | `/carib-ai`, `/api/v1/ai` | `carib-ai-chat.tsx`, `dialect-caption-generator.tsx` | `generateDialectCaptionsAction`, `generateAdAssistAction` | `ai_usage_logs` | `VERIFIED WORKING` (Strict OpenRouter `:free` model routing) |
| **Admin & Ad Moderation** | `/admin`, `/admin/ads`, `/admin/moderation` | `moderation-client.tsx` | `moderateCampaignAction`, `/api/v1/admin/moderation` | `campaigns`, `ads`, `ad_moderation_logs`, `moderation_cases`, `reports`, `audit_logs` | `VERIFIED WORKING` (Enforced `AAL2` MFA + hardened `SEC-03` RLS) |
