# Sub-Project 2: Media, Stories & Reels Engine — Design Spec

> TikTok / Instagram Core — Caribbean Futurism Edition

## Status: READY FOR IMPLEMENTATION

---

## 1. Situation Analysis

### What Already Exists (Strong Foundation)
The codebase has **substantial production-grade infrastructure** already in place:

#### Database (Supabase Migrations)
- `videos` table with `video_kind IN ('reel', 'short', 'long_form', 'podcast_video')`, `creator_id`, `page_id`, `category`, `moderation_status`, `visibility`, `storage_path`, `sound_id`, `likes_count`, `comments_count`, `view_count`, `captions`, `aspect_ratio` — **full RLS** with page-manager policies (migrations 00085, 00110)
- `media_assets` universal table with lifecycle stages (`uploaded → quarantined → processing → transcoding → thumbnailing → captioning → ready → failed`) — **full RLS** (migration 00073)
- `sounds` table + `sound_licenses` + `sound_usage` with trending trigger (migration 00085)
- `stories` table with `author_id`, `media_path`, `media_kind`, `caption`, `audience`, `expires_at` — live CRUD via `createStoryAction` / `fetchActiveStoriesAction`
- Storage buckets: `caribbean-sounds`, `live-replays`, `story-media`

#### Routes (All Live Supabase Queries)
- `/reels` — Server component queries `videos WHERE video_kind='reel'`, supports `tab` (for_you, following, caribbean, communities) + `category` + `id` deep links
- `/shorts` — Server component queries `videos WHERE video_kind IN ('short','reel')`, supports tabs + category + moderation_status filtering, enhanced/legacy fallback query
- Feed homepage: `MomentsCinemaRail` with `fetchActiveStoriesAction()` (live stories)

#### Components (Fully Built)
- `ReelsFeedViewer` (776 LOC): Snap-scroll, IntersectionObserver active detection, AudioManager, video playback, like/comment/share/save/follow actions, subtitle overlay, shoppable reel badge, create reel modal
- `ShortsFeedViewer` (505 LOC): Same TikTok-style vertical feed, category chips, keyboard nav (j/k/m), report modal, "Use this sound" flow
- `ShortCard`: Individual short card with video/gradient fallback
- `StoryCreatorModal`: Photo/video/text/poll/question modes, Supabase Storage upload, EXIF normalization
- `StoryViewerModal`: Auto-advancing progress bar, pause/resume, navigation
- `MomentsCinemaRail`: Mobile circular rings + desktop cinema cards, discovery channels
- `TukubiCreationStudio`: Full photo/video creation studio with effects pipeline
- `VideoTimelineEditor`, `PhotoEditor`, `StudioViewfinder`

#### Server Actions (All Hit Live Supabase)
- `reel-actions.ts`: `toggleReelLikeAction`, `postReelCommentAction`, `fetchReelCommentsAction`, `recordReelShareAction`, `recordReelViewAction`, `publishReelAction`, `saveReelAction`, `unsaveReelAction`
- `short-actions.ts`: `fetchShortCommentsAction`, `postShortCommentAction`, `recordShortShareAction`, `recordShortViewAction`, `saveShortAction`, `unsaveShortAction`
- `social/actions.ts`: `createStoryAction`, `fetchActiveStoriesAction` + `StoryData` type

### Zero-Mock Audit: CLEAN ✅
No `MOCK_`, `SAMPLE_`, `DEFAULT_`, `DEMO_`, `FAKE_`, `HARDCODED_` tokens found in any reels/shorts/moments/media component or action. The one `'sample-processed-photo'` in `tukubi-creation-studio.tsx` is a blob fallback guard in the compositor, not displayable mock data.

---

## 2. Gaps & Missing Capabilities

Despite the strong foundation, critical functionality gaps remain:

### Gap 1: No `publishShortAction` — Shorts Cannot Be Created
`short-actions.ts` has read/engagement actions but **no publish/create action**. The `CreateShortModal` exists but has no server action to persist. Users can open the creation modal but cannot actually publish.

### Gap 2: Stories Have No Engagement Actions
Stories can be created and viewed, but:
- No `viewStoryAction` (no view tracking)
- No `replyToStoryAction` (Instagram-style story replies)
- Stories have no reactions/emoji quick-reactions
- No `deleteStoryAction` (creators can't remove their own stories)

### Gap 3: Reels/Shorts Infinite Scroll (Pagination)
Both `/reels` and `/shorts` pages load a fixed batch (30/40) and stop. There's no cursor-based "load more" pagination when the user scrolls past the initial batch.

### Gap 4: Creator Studio Videos Tab Is Not Wired
Route `/creator-studio/videos` exists but likely lacks a page component showing the creator's own videos with edit/delete/analytics.

### Gap 5: Story Expiration Enforcement
Stories have `expires_at` but there's no client-side filtering or server-side cleanup to hide expired stories from the `MomentsCinemaRail`.

### Gap 6: Video Upload for Reels/Shorts Missing Storage Bucket
The `publishReelAction` accepts a `storagePath` but assumes it's already uploaded. There's no `reels-media` or `shorts-media` storage bucket defined in migrations. The `CreateReelModal` and `CreateShortModal` need to upload to a defined bucket.

---

## 3. Hybrid Model (TikTok + Instagram Core)

### From TikTok:
- Full-screen vertical snap-scroll ✅ (already built)
- Sound-first creation with "Use this sound" ✅ (already built)
- Category discovery chips ✅ (already built)
- Keyboard navigation (j/k/m) ✅ (already built for Shorts)

### From Instagram:
- Stories ring with 24h expiry ✅ (already built)
- Story modes: Photo, Video, Text, Poll, Question ✅ (already built)
- Story viewer with auto-advance ✅ (already built)
- **NEW**: Story quick-reactions (emoji) + reply
- **NEW**: Story view tracking + seen indicator

### Tukubi Caribbean Extensions:
- Caribbean Sounds registry with licensing ✅ (already built)
- Dialect subtitle overlays ✅ (already built)
- Shoppable reel badges ✅ (already built)
- Location/country tagging ✅ (already built)

---

## 4. Implementation Tasks

### Task 1: `publishShortAction` & Short Video Upload Pipeline
- Create `publishShortAction` in `short-actions.ts` (mirror `publishReelAction` but with `video_kind: 'short'`)
- Add migration for `shorts-media` storage bucket (or reuse `reels-media`)
- Wire `CreateShortModal` to call the new server action
- Unit tests: 3 tests (publish success, auth guard, banned-tester guard)

### Task 2: Story Engagement Actions
- Add `recordStoryViewAction` to `social/actions.ts` (insert into `story_views` or similar tracking)
- Add `deleteStoryAction` (creator-only, RLS-enforced)
- Add `reactToStoryAction` (emoji quick-reactions)
- Add `replyToStoryAction` (text reply to story author via DM or story_replies)
- Unit tests: 4 tests

### Task 3: Story Expiration & View Tracking UI
- Filter expired stories in `fetchActiveStoriesAction` (WHERE `expires_at > now()`)
- Add "seen" indicator ring color in `MomentsCinemaRail` (gradient vs gray ring)
- Show view count in `StoryViewerModal` for story author
- Unit tests: 2 tests

### Task 4: Keyset Cursor Pagination for Reels & Shorts
- Add `fetchMoreReelsAction(cursor: string)` to `reel-actions.ts` using keyset cursor `(created_at, id)`
- Add `fetchMoreShortsAction(cursor: string)` to `short-actions.ts`
- Wire `ReelsFeedViewer` and `ShortsFeedViewer` to call load-more on scroll-end
- Unit tests: 2 tests (cursor pagination, empty result)

### Task 5: Creator Studio Videos Manager
- Build `/creator-studio/videos/page.tsx` with live query for creator's own `videos`
- Show video cards with title, views, likes, comments, status, created_at
- Add `deleteVideoAction` with creator-only RLS
- Add `updateVideoAction` for editing title/visibility
- Unit tests: 3 tests

### Task 6: Video Storage Bucket & Upload Integration
- Add migration for `video-uploads` storage bucket with RLS policies
- Wire `CreateReelModal` to upload video to bucket before calling `publishReelAction`
- Wire `CreateShortModal` to upload video to bucket before calling `publishShortAction`
- Unit tests: 2 tests

### Task 7: Audit, Typecheck & Verify
- Run `scripts/audit-zero-mock.js` with expanded patterns
- Run full unit test suite (Sub-Project 1 + Sub-Project 2)
- Run `pnpm.cmd typecheck` (31/31 packages)
- Commit all work

---

## 5. Definition of Done

- [ ] All 6 feature tasks committed with passing unit tests
- [ ] Zero mock data tokens in production paths
- [ ] 31/31 packages typecheck clean
- [ ] All engagement actions (publish, like, comment, share, save, view, react) hit live Supabase
- [ ] Keyset cursor pagination on both feed surfaces
- [ ] Creator Studio videos tab shows real creator content
- [ ] Stories expire correctly and show seen/unseen state
