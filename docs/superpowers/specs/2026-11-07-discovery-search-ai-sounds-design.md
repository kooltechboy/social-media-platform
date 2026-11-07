# Sub-Project 6: Discovery, Search, AI Repurposing & Caribbean Sounds — Design Specification

**Author:** Antigravity Engineering Agent  
**Date:** 2026-11-07  
**Branch:** `feature/live-core-feed-and-composer`  
**Status:** Approved for Implementation

---

## 1. Overview & Objectives

Sub-Project 6 delivers the **Discovery, Universal Multi-Entity Search, AI Content Repurposing, and Caribbean Sounds Engine** (analogous to the TikTok FYP / Sound Library, Spotify Caribbean catalog, and X Universal Search).

This sub-project concludes the 6-pillar overhaul of TUKUBI, ensuring:
- Universal multi-entity search across 10 distinct entity types (people, posts, reels, sounds, events, communities, products, businesses, podcasts, and livestreams).
- Authentic Caribbean sound stem catalog with certified royalty-free licensing, audio waveform streaming, and real-time usage tracking.
- AI content repurposing using CaribAI to convert podcast episodes into pull quotes, social post drafts, reel ideas, and hashtags with 1-click publishing to the Universal Composer.
- Zero mock tokens, zero synthetic fallback rows, and 100% live database execution.

---

## 2. Architectural Pillars

### 2.1 Universal Multi-Entity Search (`universalSearchAction`)
Operates across 10 distinct entities:
- `profiles`: matching display name, username, bio, Caribbean country of origin.
- `posts`: sanitized text search across post content and cultural tags.
- `videos`: short-form reels and videos.
- `sounds`: rhythm stems, soca/reggae/dancehall tracks.
- `events`: fetes, festivals, and diaspora gatherings.
- `communities`: island diaspora city hubs and professional guilds.
- `products`: marketplace listings with multi-currency pricing.
- `businesses`: verified Caribbean businesses and service providers.
- `podcasts`: audio talk shows and cultural interviews.
- `live_streams`: ongoing broadcasts.

**Query Sanitization**:
- Strips SQL injection vectors while preserving Caribbean diacritics (e.g., Curaçao, José Martí, Port-au-Prince).
- Evaluates match scoring with exact match prioritization.

### 2.2 Caribbean Sounds & Rhythm Stem Engine (`apps/web/src/lib/sounds/actions.ts`)
- **Sound Catalog**: Curated royalty-free Caribbean stems (Soca, Dancehall, Reggae, Kompa, Steelpan, Bouyon, Calypso, Bachata, Zouk, Parang, Chutney, Punta).
- **Audio Streaming & Master Controller**: Managed by singleton `AudioManager` so only one sound plays platform-wide at any given moment.
- **Audio Stem Uploading (`uploadSoundAction`)**: Creators upload original audio with mandatory copyright certification.
- **Usage Tracking (`recordSoundUsageAction`)**: Tracks videos and posts using each stem. Migration 00120 replaces incremental counter mutation with atomic `COUNT(*)` recomputation.
- **Direct Reel Integration**: "Use This Sound" opens the Reel Creation workflow with the audio pre-attached.

### 2.3 AI Content Repurposing Engine (`repurpose-actions.ts`)
- Powered by `CaribAIEngine`.
- Analyzes Caribbean podcast episodes and extracts:
  1. Executive Summary (3-4 sentences).
  2. 5 Quoted Highlights / Pull Quotes (with 1-click "Create Story" action).
  3. 5 Social Post Drafts (under 280 characters with 1-click "Post Now" action).
  4. 5 Short/Reel Ideas (with 1-click "Create Reel" action).
  5. 10 Caribbean cultural hashtags.
- Saves results directly to `podcast_episodes.repurpose_result`.

---

## 3. Data Integrity & Migration 00120

### Migration 00120: `sound_usage_and_search_hardening.sql`
- Updates `sync_sound_usage_count()` to compute `usage_count = (SELECT count(*) FROM public.sound_usage WHERE sound_id = ...)` to prevent counter drift.
- Adds composite index `idx_sound_usage_lookup` on `(sound_id, used_by)`.
- Verifies RLS policies on `sounds` and `sound_usage`.
