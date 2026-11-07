# Sub-Project 6: Discovery, Search, AI Repurposing & Caribbean Sounds — Implementation Plan

**Author:** Antigravity Engineering Agent  
**Date:** 2026-11-07  
**Branch:** `feature/live-core-feed-and-composer`

---

## Tasks

### Task 1: Supabase Migration 00120
- [ ] Create `supabase/migrations/00120_sound_usage_and_search_hardening.sql`:
  - Upgrade `sync_sound_usage_count()` function to use atomic `COUNT(*)` recomputation from source-of-truth rows on `sound_usage` table.
  - Backfill `sounds.usage_count` to ensure exact accuracy.
  - Add composite index `idx_sound_usage_composite` on `sound_usage(sound_id, created_at DESC)`.

### Task 2: Action Hardening & Verification
- [ ] Verify `apps/web/src/lib/sounds/actions.ts`:
  - `fetchSoundsAction`: DB search with royalty-free stems catalog.
  - `getSoundDetailsAction`: UUID and slug matching with associated video joins.
  - `uploadSoundAction`: Auth gate, file size (<25MB), audio MIME types, and mandatory copyright certification.
  - `recordSoundUsageAction`: Auth gate and non-blocking usage recording.
- [ ] Verify `apps/web/src/lib/creator/repurpose-actions.ts`:
  - `repurposePodcastEpisodeAction`: Auth gate, episode lookup, structured AI JSON prompt parsing.
  - `saveRepurposedContentAction`: Auth gate, creator ownership verification, DB update.
- [ ] Verify `apps/web/src/lib/discovery/actions.ts`:
  - `universalSearchAction`: Multi-entity queries across profiles, posts, reels, sounds, events, communities, products, and businesses.

### Task 3: Unit Tests (`tests/unit/discovery-search-ai-sounds.test.ts`)
- [ ] `fetchSoundsAction`: genre filtering, country filtering, search term matching.
- [ ] `getSoundDetailsAction`: sound retrieval and reel mapping.
- [ ] `uploadSoundAction`: auth check, missing file check, copyright certification check, title check.
- [ ] `recordSoundUsageAction`: auth check.
- [ ] `repurposePodcastEpisodeAction`: auth check, missing episode check.
- [ ] `saveRepurposedContentAction`: auth check.
- [ ] Universal Search: query sanitization, diacritic tolerance, semantic entity matching.

### Task 4: Complete System Certification
- [ ] Monorepo TypeScript check (`pnpm.cmd typecheck` -> 31/31 packages clean).
- [ ] Zero-mock audit (`node scripts/audit-zero-mock.js` -> exit 0).
- [ ] Vitest test execution (all suites passing across all 6 sub-projects).
- [ ] Git commit and final SDD progress update.
