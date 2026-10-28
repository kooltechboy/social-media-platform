---
title: "SOCIAL_AND_CREATOR_WORKFLOWS — Feed, Publishing, Shorts, Pages & Messaging"
type: social-workflows
status: verified
owner: Media, Publishing & Social Architect
created: 2026-10-28
updated: 2026-10-28
tags:
  - tukubi
  - social
  - shorts
  - pages
  - messaging
related:
  - "[[TUKUBI Engineering Intelligence]]"
  - "[[05 Feature Inventory/FEATURE_INVENTORY]]"
---

# SOCIAL_AND_CREATOR_WORKFLOWS — TUKUBI

## 1. Unified Publishing & Page Attribution Lifecycle

1. **Personal vs. Page Publishing:**
   - When a user publishes from their personal identity, `posts.author_id = user.id`, `posts.page_id = NULL`, and `posts.publisher_type = 'user'`.
   - When a user switches identity to a managed Page (`can_manage_page(page_id, user.id)` — verified via `page_roles` or `businesses.owner_id`), `posts.author_id = user.id`, `posts.created_by_user_id = user.id`, `posts.page_id = page_id`, `posts.publisher_type = 'page'`, and `posts.publisher_entity_id = page_id`.
2. **Feed & Profile Separation:**
   - The Home Feed (`/`) and Page Detail Feed (`/pages/[slug]`) hydrate `businesses:businesses!posts_page_id_fkey(...)` so Page posts display the Page's name, avatar, verification badge, and `/pages/[slug]` link.
   - Personal profile feeds (`/profile/[username]`) filter `.is('page_id', null)` so Page posts do not impersonate personal profile posts.

---

## 2. Shorts & Reels Engine (`/shorts` & `/reels`)

- **Creation & Remixing:** Creators can upload vertical video (`MP4`/`WebM`), select a category (`culture`, `music`, `food`, `comedy`, `island_life`, `travel`), tag a Caribbean location, attach or remix a sound track (`sound_id`), and publish either as themselves or as a managed Page.
- **Engagement & Persistence:**
  - Views are recorded after `>= 2s` playback via `recordShortViewAction` -> `increment_video_counter`.
  - Likes toggle `video_views.completed` and update `videos.likes_count`.
  - Comments load from `video_comments` via `fetchShortCommentsAction` when opening the drawer and persist via `postShortCommentAction`.
  - Bookmarks persist in `public.video_saves` (`saveShortAction` / `unsaveShortAction`).
  - Shares log to `public.video_shares` (`recordShortShareAction`).
  - Reports create entries in `public.reports` and `public.moderation_cases` (`reportShortAction`).

---

## 3. Direct & Business Messaging (`/messages`)

- **Message Delivery & Hydration:** Supports text, emoji reactions (`message_reactions`), reply quotes (`reply_to_id`), message editing (`edited_at`), per-user or global deletion (`deleted_for`, `deleted_at`), persistent voice notes (Data URL audio encoding), and Business AI Concierge responses (`message_kind = 'ai_response'`).
