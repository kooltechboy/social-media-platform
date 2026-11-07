# Sub-Project 2: Media, Stories & Reels Engine — Implementation Plan

> Spec: `docs/superpowers/specs/2026-11-07-media-stories-reels-engine-design.md`
> Branch: `feature/live-core-feed-and-composer` (continuing)

---

## Task Dependency Graph

```
Task 6 (Storage Bucket) ──┐
                           ├──▶ Task 1 (publishShortAction)
                           ├──▶ Task 2 (Story Engagement)
                           │
Task 3 (Story Expiry UI) ◄─┘
Task 4 (Cursor Pagination) — independent
Task 5 (Creator Studio Videos) — independent
Task 7 (Audit & Verify) — depends on all above
```

**Parallel-safe pairs**: Tasks 4+5 are independent of each other and of 1+2+3.
**Sequential chain**: Task 6 → Task 1 (needs bucket before publish action).

---

## Task 1: `publishShortAction` & Short Video Upload Pipeline

**File**: `apps/web/src/lib/media/short-actions.ts`

**Implementation**:
1. Add `publishShortAction(formData: FormData)` mirroring `publishReelAction` from `reel-actions.ts`
2. Accept fields: `title`, `soundId`, `soundTitle`, `storagePath`, `visibility`, `durationSeconds`, `countryId`, `locationTag`, `category`
3. Insert into `videos` with `video_kind: 'short'`, `moderation_status: 'approved'`
4. Record `sound_usage` if sound attached
5. Create companion `posts` entry for feed cross-posting
6. Guard: `isBannedTesterAccount` check
7. `revalidatePath('/shorts')`, `revalidatePath('/creator-studio/videos')`

**File**: `apps/web/src/components/shorts/create-short-modal.tsx`
- Wire form submission to call `publishShortAction`
- Upload video to `video-uploads` bucket before publish

**Tests**: `tests/unit/publish-short.test.ts` — 3 tests
- Publish success returns video data
- Unauthenticated returns error
- Banned tester returns error

---

## Task 2: Story Engagement Actions

**File**: `apps/web/src/lib/social/actions.ts`

**Add functions**:
1. `recordStoryViewAction(storyId: string)` — upsert into `story_views` (or use existing tracking pattern)
2. `deleteStoryAction(storyId: string)` — delete from `stories` WHERE `author_id = auth.uid()`
3. `reactToStoryAction(storyId: string, emoji: string)` — insert into `story_reactions`
4. `replyToStoryAction(storyId: string, content: string)` — insert into `story_replies` or create DM

**Migration** (if needed): Check if `story_views` / `story_reactions` tables exist. If not, create migration.

**Tests**: `tests/unit/story-engagement.test.ts` — 4 tests
- View recording returns success
- Delete own story returns success
- React to story returns success
- Unauthenticated guard on all actions

---

## Task 3: Story Expiration & View Tracking UI

**File**: `apps/web/src/lib/social/actions.ts`
- In `fetchActiveStoriesAction`, ensure WHERE clause includes `expires_at > now()`
- Return `viewerIds` or `viewCount` for stories authored by current user

**File**: `apps/web/src/components/moments/moments-cinema-rail.tsx`
- Add "seen" state: gray ring for viewed stories, gradient ring for unseen
- Track which stories the user has viewed in local state + server

**File**: `apps/web/src/components/moments/story-viewer-modal.tsx`
- Call `recordStoryViewAction` when story becomes active
- Show view count footer for own stories

**Tests**: `tests/unit/story-expiry.test.ts` — 2 tests
- Expired stories filtered out
- Seen indicator state management

---

## Task 4: Keyset Cursor Pagination for Reels & Shorts

**File**: `apps/web/src/lib/media/reel-actions.ts`
```typescript
export async function fetchMoreReelsAction(cursor: { created_at: string; id: string }, tab: string, limit: number = 20)
```
- Query `videos WHERE video_kind='reel' AND (created_at, id) < (cursor.created_at, cursor.id)` ORDER BY `created_at DESC, id DESC` LIMIT `limit`
- Return `{ reels: ReelItem[], nextCursor: { created_at, id } | null }`

**File**: `apps/web/src/lib/media/short-actions.ts`
```typescript
export async function fetchMoreShortsAction(cursor: { created_at: string; id: string }, tab: string, limit: number = 20)
```

**File**: `apps/web/src/components/reels/reels-feed-viewer.tsx`
- Add `IntersectionObserver` on last reel card to trigger `fetchMoreReelsAction`
- Append results to `reels` state

**File**: `apps/web/src/components/shorts/shorts-feed-viewer.tsx`
- Same infinite-scroll trigger pattern

**Tests**: `tests/unit/cursor-pagination.test.ts` — 2 tests
- Cursor pagination returns next page
- Empty cursor returns null nextCursor

---

## Task 5: Creator Studio Videos Manager

**File**: `apps/web/src/app/creator-studio/videos/page.tsx`
- Server component: query `videos WHERE creator_id = user.id` ORDER BY `created_at DESC`
- Render grid of video cards with title, thumbnail, views, likes, comments, status, date

**File**: `apps/web/src/lib/media/reel-actions.ts` (or new `video-management-actions.ts`)
- `deleteVideoAction(videoId: string)` — DELETE from `videos` WHERE `creator_id = auth.uid()`
- `updateVideoMetadataAction(videoId: string, updates: { title?, visibility?, category? })` — UPDATE `videos`

**Tests**: `tests/unit/creator-studio-videos.test.ts` — 3 tests
- Delete own video returns success
- Update video metadata returns success
- Unauthenticated guard

---

## Task 6: Video Storage Bucket & Upload Integration

**File**: `supabase/migrations/00XXX_video_uploads_storage_bucket.sql`
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('video-uploads', 'video-uploads', true, 524288000, -- 500MB
   ARRAY['video/mp4','video/webm','video/quicktime','video/x-matroska'])
ON CONFLICT (id) DO UPDATE SET allowed_mime_types = EXCLUDED.allowed_mime_types, file_size_limit = EXCLUDED.file_size_limit;

-- Storage RLS policies
CREATE POLICY "Video uploads publicly readable" ON storage.objects FOR SELECT USING (bucket_id = 'video-uploads');
CREATE POLICY "Authenticated users upload videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'video-uploads' AND auth.role() = 'authenticated');
CREATE POLICY "Users delete own video uploads" ON storage.objects FOR DELETE USING (bucket_id = 'video-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
```

**File**: `apps/web/src/components/reels/create-reel-modal.tsx`
- Ensure video upload to `video-uploads` bucket before calling `publishReelAction`

**File**: `apps/web/src/components/shorts/create-short-modal.tsx`
- Ensure video upload to `video-uploads` bucket before calling `publishShortAction`

**Tests**: `tests/unit/video-upload-bucket.test.ts` — 2 tests
- Upload path generation is correct
- Bucket name constant matches migration

---

## Task 7: Audit, Typecheck & Verify

1. Run `node scripts/audit-zero-mock.js` — must exit 0
2. Run all Sub-Project 2 unit tests:
   ```
   pnpm.cmd vitest run tests/unit/publish-short.test.ts tests/unit/story-engagement.test.ts tests/unit/story-expiry.test.ts tests/unit/cursor-pagination.test.ts tests/unit/creator-studio-videos.test.ts tests/unit/video-upload-bucket.test.ts
   ```
3. Run all Sub-Project 1 unit tests (regression):
   ```
   pnpm.cmd vitest run tests/unit/marketplace-tagging.test.ts tests/unit/quote-post.test.ts tests/unit/quote-post-card.test.ts tests/unit/threaded-comments.test.ts tests/unit/feed-realtime-buffer.test.ts tests/unit/reactions-sync.test.ts
   ```
4. Run `pnpm.cmd typecheck` — 31/31 must pass
5. Commit all changes
6. Update SDD progress ledger

---

## Execution Order

Given dependency graph and inline execution (no subagent quota):

1. **Task 6** (Storage Bucket migration) — foundation
2. **Task 1** (publishShortAction) — unblocks short creation
3. **Task 2** (Story Engagement) — story actions
4. **Task 3** (Story Expiry UI) — story polish
5. **Task 4** (Cursor Pagination) — infinite scroll
6. **Task 5** (Creator Studio Videos) — creator dashboard
7. **Task 7** (Audit & Verify) — definition of done
