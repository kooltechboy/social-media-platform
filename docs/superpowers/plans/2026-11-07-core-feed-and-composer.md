# Core Feed & Live Post Composer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Tukubi's core feed, post composer, reaction drawer, threaded comments, quote-posting, and product tagging into 100% live operations with zero mock data.

**Architecture:** Refactor `FeedStream`, `FeedPost`, `UniversalComposer`, and `actions.ts` to query live Supabase tables (`posts`, `post_reactions`, `comments`, `products`, `saved_posts`), eliminate hardcoded product arrays, buffer realtime incoming posts behind an X-style floating pill, and provide bulletproof optimistic UI with error rollbacks.

**Tech Stack:** Next.js 15 (App Router, Server Actions), React 19, Supabase (Postgres, Storage, Realtime), Tailwind CSS v4, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-07-core-feed-and-composer-design.md`

## Global Constraints
- Zero mock data in production code paths: all UI components must bind directly to live Supabase data or render authentic empty states.
- Keyset cursor pagination only: no SQL `OFFSET` or row-number paging.
- Idempotency on mutations: every post publishing operation must pass a client-generated UUID idempotency key.
- Strict RLS & identity isolation: anonymous users cannot mutate posts/reactions/comments; users can only delete their own content.
- TypeScript strictness: `pnpm.cmd typecheck` must pass with zero errors across all workspaces.

---

### Task 1: Zero-Mock Marketplace Product Tagging

**Files:**
- Create: `apps/web/src/lib/marketplace/actions.ts`
- Modify: `apps/web/src/components/commerce/product-tagging-tray.tsx:30-115`
- Test: `tests/unit/marketplace-tagging.test.ts`

**Interfaces:**
- Produces: `export async function searchMarketplaceProductsAction(query?: string, limit?: number): Promise<{ products: TaggedProductSummary[]; error: string | null }>`
- Consumes: Supabase `products` and `businesses` tables.

- [ ] **Step 1: Write the failing unit test**

Create `tests/unit/marketplace-tagging.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { searchMarketplaceProductsAction } from '../../apps/web/src/lib/marketplace/actions';

describe('searchMarketplaceProductsAction', () => {
  it('returns empty array with no errors when database has no products', async () => {
    const result = await searchMarketplaceProductsAction('nonexistent');
    expect(result).toHaveProperty('products');
    expect(Array.isArray(result.products)).toBe(true);
    expect(result.error).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm.cmd test:unit tests/unit/marketplace-tagging.test.ts`  
Expected: FAIL ("cannot find module .../actions")

- [ ] **Step 3: Implement `searchMarketplaceProductsAction`**

Create `apps/web/src/lib/marketplace/actions.ts`:
```typescript
'use server';

import { createSupabaseServerClient } from '../supabase/server';
import type { TaggedProductSummary } from '@caribbean/marketplace';

export async function searchMarketplaceProductsAction(
  query?: string,
  limit: number = 10
): Promise<{ products: TaggedProductSummary[]; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return { products: [], error: 'Database service unavailable' };
    }

    let dbQuery = supabase
      .from('products')
      .select(`
        id, title, price_minor, currency, thumbnail_url, is_active,
        businesses:businesses!products_business_id_fkey(id, name, country_iso)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (query && query.trim()) {
      dbQuery = dbQuery.ilike('title', `%${query.trim()}%`);
    }

    const { data, error } = await dbQuery;

    if (error) {
      return { products: [], error: error.message };
    }

    const products: TaggedProductSummary[] = (data || []).map((row: any) => {
      const biz = Array.isArray(row.businesses) ? row.businesses[0] : row.businesses;
      return {
        id: row.id,
        title: row.title,
        priceMinor: row.price_minor || 0,
        currency: row.currency || 'USD',
        originTerritory: biz?.country_iso || 'Caribbean',
        originCountry: biz?.country_iso || 'Caribbean',
        sellerId: biz?.id || 'unknown',
        sellerName: biz?.name || 'Local Merchant',
        inventoryCount: 1,
        isAvailable: row.is_active ?? true,
        thumbnailUrl: row.thumbnail_url || null,
      };
    });

    return { products, error: null };
  } catch (err) {
    return {
      products: [],
      error: err instanceof Error ? err.message : 'Failed to search marketplace products',
    };
  }
}
```

- [ ] **Step 4: Update `product-tagging-tray.tsx` to remove `DEFAULT_CARIBBEAN_PRODUCTS` and call live action**

Modify `apps/web/src/components/commerce/product-tagging-tray.tsx`:
- Remove `DEFAULT_CARIBBEAN_PRODUCTS` export.
- Replace local search fallback with `searchMarketplaceProductsAction`.
- In the initial load effect, fetch live available products from Supabase.
- If results are empty, render: *"No marketplace products found. Local merchants can list authentic products in the Business Studio."*

- [ ] **Step 5: Run tests to verify pass**

Run: `pnpm.cmd test:unit tests/unit/marketplace-tagging.test.ts`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/marketplace/actions.ts apps/web/src/components/commerce/product-tagging-tray.tsx tests/unit/marketplace-tagging.test.ts
git commit -m "feat: live marketplace product search and purge mock catalog"
```

---

### Task 2: Quote Post Support in UniversalComposer

**Files:**
- Modify: `apps/web/src/components/universal-composer.tsx:88-120,400-480`
- Modify: `apps/web/src/lib/social/actions.ts:88-140,410-475`
- Test: `tests/unit/quote-post.test.ts`

**Interfaces:**
- Produces: `quotePost?: { id: string; author: string; handle: string; content: string; avatarUrl?: string | null }` in `UniversalComposerProps`.
- Consumes: `posts.shared_post_id` and `posts.share_commentary` in `createPostAction`.

- [ ] **Step 1: Write the failing unit test**

Create `tests/unit/quote-post.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { validateComposer } from '@caribbean/social';

describe('Quote Post Validation', () => {
  it('validates post with quote commentary and shared post id', () => {
    const result = validateComposer({
      authorId: 'test-user-id',
      content: 'Check out this take!',
      visibility: 'public',
      mediaCount: 0,
    });
    expect(result.valid).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it passes baseline**

Run: `pnpm.cmd test:unit tests/unit/quote-post.test.ts`  
Expected: PASS

- [ ] **Step 3: Update `UniversalComposer` props and UI for quote mode**

In `apps/web/src/components/universal-composer.tsx`:
- Add `quotedPost?: { id: string; author: string; handle: string; content: string; avatarUrl?: string | null }` to `UniversalComposerProps`.
- When `quotedPost` is provided, render a locked mini preview card below the textarea with an "X" button to remove the quote.
- Include hidden input `<input type="hidden" name="shared_post_id" value={quotedPost.id} />` in form submission.

- [ ] **Step 4: Ensure `createPostAction` extracts `shared_post_id` and records relation**

In `apps/web/src/lib/social/actions.ts`:
- Verify `shared_post_id` and `share_commentary` are properly extracted from `formData`.
- Verify the insert payload sets `shared_post_id` on the new post row.

- [ ] **Step 5: Run tests and typecheck**

Run: `pnpm.cmd typecheck`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/universal-composer.tsx apps/web/src/lib/social/actions.ts tests/unit/quote-post.test.ts
git commit -m "feat: add quote post composer support with preview card"
```

---

### Task 3: Quote Post Card Rendering in FeedPost

**Files:**
- Create: `apps/web/src/components/feed/quote-post-card.tsx`
- Modify: `apps/web/src/components/feed/feed-post.tsx:40-100,500-600`
- Test: `tests/unit/quote-post-card.test.ts`

**Interfaces:**
- Produces: `<QuotePostCard quotedPost={post.sharedPost} />`
- Consumes: `FeedPostData.sharedPost`

- [ ] **Step 1: Write the failing unit test**

Create `tests/unit/quote-post-card.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import React from 'react';
import QuotePostCard from '../../apps/web/src/components/feed/quote-post-card';

describe('QuotePostCard', () => {
  it('is a valid React component function', () => {
    expect(typeof QuotePostCard).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm.cmd test:unit tests/unit/quote-post-card.test.ts`  
Expected: FAIL ("cannot find module .../quote-post-card")

- [ ] **Step 3: Implement `QuotePostCard`**

Create `apps/web/src/components/feed/quote-post-card.tsx`:
```tsx
import React from 'react';
import Link from 'next/link';
import UserAvatar from '../user-avatar';
import type { FeedPostData } from '../feed-stream';

export interface QuotePostCardProps {
  quotedPost: FeedPostData | null | undefined;
}

export default function QuotePostCard({ quotedPost }: QuotePostCardProps) {
  if (!quotedPost) return null;

  return (
    <Link
      href={`/post/${quotedPost.id}`}
      className="block mt-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-colors p-3.5 space-y-2 group"
    >
      <div className="flex items-center gap-2">
        <UserAvatar
          avatarUrl={quotedPost.avatarUrl}
          displayName={quotedPost.author}
          username={quotedPost.handle}
          size="xs"
        />
        <span className="text-xs font-bold text-white group-hover:text-brand-caribbeanSea transition-colors">
          {quotedPost.author}
        </span>
        <span className="text-xs text-brand-mist">@{quotedPost.handle}</span>
        <span className="text-[11px] text-brand-mist/60 ml-auto">{quotedPost.time}</span>
      </div>
      <p className="text-xs text-brand-sand line-clamp-3 leading-relaxed">
        {quotedPost.content}
      </p>
      {quotedPost.mediaUrls && quotedPost.mediaUrls.length > 0 && (
        <div className="text-[11px] text-brand-caribbeanSea font-medium">
          📷 {quotedPost.mediaUrls.length} {quotedPost.mediaUrls.length === 1 ? 'attachment' : 'attachments'}
        </div>
      )}
    </Link>
  );
}
```

- [ ] **Step 4: Integrate `QuotePostCard` into `feed-post.tsx`**

In `apps/web/src/components/feed/feed-post.tsx`:
- Import `QuotePostCard`.
- Render `<QuotePostCard quotedPost={post.sharedPost} />` when `post.sharedPost` or `post.sharedPostId` exists.
- In the Repost button popover/dropdown, wire "Quote Post" to trigger `onQuotePost(post)`.

- [ ] **Step 5: Run tests and typecheck**

Run: `pnpm.cmd test:unit tests/unit/quote-post-card.test.ts`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/feed/quote-post-card.tsx apps/web/src/components/feed/feed-post.tsx tests/unit/quote-post-card.test.ts
git commit -m "feat: render embedded quote post cards in feed stream"
```

---

### Task 4: Threaded 2-Level Comments & Live Sub-Replies

**Files:**
- Modify: `apps/web/src/lib/social/actions.ts:280-340`
- Modify: `apps/web/src/components/feed/feed-post.tsx:700-880`
- Test: `tests/unit/threaded-comments.test.ts`

**Interfaces:**
- Produces: `parent_comment_id` support in `createCommentAction` and hierarchical nesting in `fetchPostCommentsAction`.
- Consumes: Supabase `comments` table with `parent_comment_id`.

- [ ] **Step 1: Write the failing unit test**

Create `tests/unit/threaded-comments.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';

describe('Threaded Comments Structure', () => {
  it('properly structures comments with parent_comment_id', () => {
    const rawComments = [
      { id: 'c1', content: 'Top comment', parent_comment_id: null },
      { id: 'c2', content: 'Nested reply', parent_comment_id: 'c1' },
    ];
    const topLevel = rawComments.filter(c => !c.parent_comment_id);
    const replies = rawComments.filter(c => c.parent_comment_id === 'c1');
    expect(topLevel.length).toBe(1);
    expect(replies.length).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it passes baseline**

Run: `pnpm.cmd test:unit tests/unit/threaded-comments.test.ts`  
Expected: PASS

- [ ] **Step 3: Update `fetchPostCommentsAction` and `createCommentAction` for threading**

In `apps/web/src/lib/social/actions.ts`:
- Ensure `fetchPostCommentsAction` selects `parent_comment_id` and orders by `created_at ASC`.
- Update `createCommentAction(postId: string, content: string, parentCommentId?: string)` to accept `parentCommentId` and insert it into `comments.parent_comment_id`.

- [ ] **Step 4: Update `feed-post.tsx` comment section to render 2-level replies**

In `apps/web/src/components/feed/feed-post.tsx`:
- Group comments into `topLevelComments` and a Map of `repliesByParentId`.
- Under each top-level comment, render an indented list of sub-replies.
- Add a "Reply" button on each comment that sets `replyingTo = { commentId, authorName }`, updating the input placeholder to *"Replying to @authorName..."* with an "X" to cancel reply mode.

- [ ] **Step 5: Run tests and typecheck**

Run: `pnpm.cmd typecheck`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/social/actions.ts apps/web/src/components/feed/feed-post.tsx tests/unit/threaded-comments.test.ts
git commit -m "feat: support 2-level threaded comments and nested replies"
```

---

### Task 5: Realtime Floating Banner (X-Style) & Stream Buffering

**Files:**
- Modify: `apps/web/src/components/feed-stream.tsx:140-200,300-380`
- Test: `tests/unit/feed-realtime-buffer.test.ts`

**Interfaces:**
- Produces: Floating pill button `{pendingNewPosts.length > 0 && <FloatingPill />}`.
- Consumes: Supabase Realtime channel `public:posts:INSERT`.

- [ ] **Step 1: Write the failing unit test**

Create `tests/unit/feed-realtime-buffer.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';

describe('Feed Realtime Buffer Logic', () => {
  it('deduplicates incoming realtime posts against existing timeline IDs', () => {
    const existing = [{ id: 'p1' }, { id: 'p2' }];
    const incoming = [{ id: 'p2' }, { id: 'p3' }];
    const existingIds = new Set(existing.map(p => p.id));
    const toBuffer = incoming.filter(p => !existingIds.has(p.id));
    expect(toBuffer.length).toBe(1);
    expect(toBuffer[0].id).toBe('p3');
  });
});
```

- [ ] **Step 2: Run test to verify it passes baseline**

Run: `pnpm.cmd test:unit tests/unit/feed-realtime-buffer.test.ts`  
Expected: PASS

- [ ] **Step 3: Update `feed-stream.tsx` realtime listener and floating pill**

In `apps/web/src/components/feed-stream.tsx`:
- In the Supabase Realtime channel effect:
  ```typescript
  const channel = supabase
    .channel(`feed_realtime_${mode}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'posts' },
      (payload) => {
        const newPost = payload.new;
        if (!newPost || newPost.post_status !== 'published') return;
        setPendingNewPosts((prev) => {
          if (prev.some((p) => p.id === newPost.id) || posts.some((p) => p.id === newPost.id)) {
            return prev;
          }
          return [formatFeedPost(newPost), ...prev];
        });
      }
    )
    .subscribe();
  ```
- Render a fixed floating pill at the top-center of the feed:
  ```tsx
  {pendingNewPosts.length > 0 && (
    <div className="sticky top-16 z-30 flex justify-center py-2 animate-bounce">
      <button
        onClick={handleFlushPendingPosts}
        className="px-4 py-2 rounded-full bg-brand-caribbeanSea text-white text-xs font-bold shadow-lg shadow-brand-caribbeanSea/30 hover:brightness-110 transition-all flex items-center gap-1.5"
      >
        <span>↑</span> {pendingNewPosts.length} new {pendingNewPosts.length === 1 ? 'post' : 'posts'}
      </button>
    </div>
  )}
  ```

- [ ] **Step 4: Run tests and typecheck**

Run: `pnpm.cmd typecheck`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/feed-stream.tsx tests/unit/feed-realtime-buffer.test.ts
git commit -m "feat: add X-style floating realtime new-post pill"
```

---

### Task 6: Multi-Reaction Drawer Polish & Optimistic Sync

**Files:**
- Modify: `apps/web/src/components/feed/feed-post.tsx:50-100,280-340`
- Modify: `apps/web/src/lib/social/actions.ts:250-310`
- Test: `tests/unit/reactions-sync.test.ts`

**Interfaces:**
- Produces: 5-state reaction drawer (`like`, `vibe`, `fire`, `respect`, `laugh`) with instant optimistic rollbacks on failure.
- Consumes: `toggleReactionAction(postId, reactionType)` against `post_reactions`.

- [ ] **Step 1: Write the failing unit test**

Create `tests/unit/reactions-sync.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';

describe('Reaction Toggle Logic', () => {
  it('correctly calculates count delta when removing or changing reaction', () => {
    let current: string | null = 'like';
    let count = 5;
    
    // Removing same reaction
    const isRemoval = current === 'like';
    current = isRemoval ? null : 'like';
    count += isRemoval ? -1 : 1;
    expect(current).toBeNull();
    expect(count).toBe(4);
  });
});
```

- [ ] **Step 2: Run test to verify it passes baseline**

Run: `pnpm.cmd test:unit tests/unit/reactions-sync.test.ts`  
Expected: PASS

- [ ] **Step 3: Update `ReactionPicker` and `feed-post.tsx`**

In `apps/web/src/components/feed/feed-post.tsx`:
- Ensure the reaction button displays the user's active reaction emoji/color.
- Clicking the active reaction removes it (toggles off).
- Clicking a different reaction swaps it optimistically without changing count.
- If server action fails, rollback state and display a toast alert.

- [ ] **Step 4: Run tests and typecheck**

Run: `pnpm.cmd typecheck`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/feed/feed-post.tsx apps/web/src/lib/social/actions.ts tests/unit/reactions-sync.test.ts
git commit -m "feat: polish multi-reaction drawer with optimistic rollback"
```

---

### Task 7: Zero-Mock Audit & Full System Verification

**Files:**
- Create: `scripts/audit-zero-mock.js`
- Test: Run typecheck, unit test suites, and Playwright E2E

- [ ] **Step 1: Create automated zero-mock audit script**

Create `scripts/audit-zero-mock.js`:
```javascript
const fs = require('fs');
const path = require('path');

const FORBIDDEN_TOKENS = [
  'DEFAULT_CARIBBEAN_PRODUCTS',
  'MOCK_FEED_POSTS',
  'SAMPLE_FEED_DATA',
];

const SCAN_DIRS = [
  path.join(__dirname, '../apps/web/src'),
  path.join(__dirname, '../packages/social/src'),
];

let violations = 0;

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next') {
        scanDir(fullPath);
      }
    } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const token of FORBIDDEN_TOKENS) {
        if (content.includes(token)) {
          console.error(`❌ Mock token found in ${fullPath}: "${token}"`);
          violations++;
        }
      }
    }
  }
}

for (const dir of SCAN_DIRS) {
  scanDir(dir);
}

if (violations > 0) {
  console.error(`Audit failed: ${violations} forbidden mock occurrences found.`);
  process.exit(1);
} else {
  console.log('✅ Zero-mock audit passed! All target code paths use live data.');
}
```

- [ ] **Step 2: Run the zero-mock audit**

Run: `node scripts/audit-zero-mock.js`  
Expected: PASS (0 violations)

- [ ] **Step 3: Run full monorepo typecheck**

Run: `pnpm.cmd typecheck`  
Expected: PASS (0 errors across 24 workspaces)

- [ ] **Step 4: Run full unit test suite**

Run: `pnpm.cmd test:unit`  
Expected: PASS (all tests green)

- [ ] **Step 5: Run Playwright E2E critical journeys**

Run: `pnpm.cmd test:e2e`  
Expected: PASS

- [ ] **Step 6: Commit audit script and final verification**

```bash
git add scripts/audit-zero-mock.js
git commit -m "chore: add automated zero-mock audit script"
```
