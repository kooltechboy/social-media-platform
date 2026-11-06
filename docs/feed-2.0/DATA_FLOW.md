# TUKUBI FEED 2.0 — DATA FLOW & MUTATION ARCHITECTURE
**Project:** TUKUBI — The Caribbean Connected  
**Status:** Architecture Specification  

---

## 1. Feed Fetch & Pagination Lifecycle

```
[User Request: / or /?tab=mode]
             │
             ▼
[apps/web/src/app/page.tsx (Server Component)]
   ├── Check getCurrentUser() → Unauthenticated? Render <PublicFrontDoor />
   │                            Authenticated? Continue
   ├── Parse activeMode (for_you | following | caribbean | communities)
   ├── Fetch Ranked Feed: buildRankedFeed(userId, activeMode, supabase, cursor)
   │     ├── Redis Cache Check (feed:userId:mode:cursor)
   │     ├── Base Query on public.posts with status in (published, null)
   │     │   - Exclude banned test accounts
   │     │   - Filter by mode (following follows/pages, communities, caribbean tags/country_id)
   │     │   - Order by created_at DESC, limit 30
   │     └── Encode nextCursor: encodeCursor({ sortKey: lastPost.created_at, id: lastPost.id })
   ├── Parallel Fetch: stories, top reels, cultural events, suggested people, trending topics
   ├── Hydrate Engagement: hydratePostsEngagement(posts, supabase, { currentUserId })
   │     ├── Likes / User reactions (likes_count, user_reaction)
   │     ├── Comments count
   │     ├── Bookmark status (is_saved via user_saved_posts)
   │     └── Publisher identity (personal vs page vs official)
   └── Return <HomeDashboard initialMode={activeMode} initialPosts={livePosts} nextCursor={nextCursor} ... />
```

---

## 2. Client Tab Switching & Caching Lifecycle

```
[User taps tab: 'For You' | 'Following' | 'Caribbean' | 'Communities']
             │
             ▼
[HomeDashboard: handleTabChange(tab)]
   ├── 1. Snapshot current tab state into tabCache[currentTab] = { posts, cursor }
   ├── 2. Update activeTab state
   ├── 3. Update URL history without page reload: window.history.replaceState(null, '', targetUrl)
   ├── 4. Cache hit?
   │     ├── YES: Immediately render tabCache[tab].posts (Zero Spinner, Instant UI)
   │     │        Trigger background fetchFeedPostsAction({ mode: tab.id }) to reconcile fresh posts
   │     └── NO: Show smooth Skeleton/Loader → execute fetchFeedPostsAction({ mode: tab.id })
   │              Update feedPosts, currentCursor, and save into tabCache[tab]
   └── 5. Render <FeedStream posts={feedPosts} cursor={currentCursor} ... />
```

---

## 3. Social Interaction Mutations (Optimistic & Reconciled)

### Like & Reactions
- **Client Action:** User taps Heart or selects Reaction in `ReactionPicker`.
- **Optimistic Update:** Instantly update `postReactions[postId]` and `likeCount[postId]` in UI.
- **Server Mutation:** Calls `toggleLikeAction(postId)` or `toggleReactionAction(postId, type)`.
- **Database Target:** `post_likes` or `post_reactions` table via Supabase RPC.
- **Rollback:** On network error or rejection, reverts state back to pre-mutation snapshot and surfaces friendly toast.

### Comments Submission
- **Client Action:** User enters text in `MobileCommentsSheet` (or desktop inline composer) and submits.
- **Optimistic State:** Adds pending comment item with `isSubmitting: true`.
- **Server Mutation:** Calls `createCommentAction(postId, content, parentId)`.
- **Database Target:** `post_comments` table with `author_id = auth.uid()`.
- **Reconciliation:** Replaces pending comment with server-returned record containing real ID and timestamp. Increments post comment count.

### Repost
- **Client Action:** User taps Repost button in interaction bar.
- **Server Mutation:** Calls `repostPostAction(postId, commentary)`.
- **Database Target:** Inserts new row into `posts` with `shared_post_id = postId` and `content = commentary`.
- **Feed Integration:** Inserts optimistic repost at the head of `feedPosts` and increments parent post `reposts_count`.

### Save / Bookmark
- **Client Action:** User taps Bookmark icon on far right of interaction bar.
- **Optimistic State:** Toggles `isSaved` in `savedPosts` Set.
- **Server Mutation:** Calls `savePostAction(postId)` or `unsavePostAction(postId)`.
- **Database Target:** `user_saved_posts` table via Supabase client.

---

## 4. Post Creation & Publishing Lifecycle

```
[Drafting in UniversalComposer]
   ├── Typing text / attaching media
   ├── Auto-save to localStorage: saveComposerDraft({ content, mode, mediaSummary, ... })
   └── Draft status: 'dirty' → 'saved'

[User Taps Publish]
   ├── 1. State Machine: 'validating' (Check content length, file sizes, permissions)
   ├── 2. Upload Phase: 'uploading' (Upload media files to Supabase Storage bucket 'posts')
   ├── 3. Correlation & Idempotency: generateCorrelationId(), generateIdempotencyKey()
   ├── 4. Persistence Phase: 'publishing'
   │     - Call server action createPostAction(payload, idempotencyKey)
   │     - Server validates auth session, RLS, page ownership / community permissions
   │     - Inserts row into public.posts
   ├── 5. Success Phase: 'published'
   │     - Clear draft from storage: clearComposerDraft() (fires 'tukubi:composer-draft-cleared')
   │     - Prepend new post to feed: onPostCreated(newPost)
   │     - Close composer / collapse card
   └── 6. Failure Phase: 'error'
         - Preserve all input content and uploaded media references in draft
         - Display human-readable error with retry button
         - Zero data loss
```
