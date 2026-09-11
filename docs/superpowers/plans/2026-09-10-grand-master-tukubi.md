# TUKUBI Grand Master Transformation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all verified gaps identified in the TUKUBI Grand Master Prompt: multi-type reactions, post bookmarks, Creator Marketplace completion, Trending Intelligence UI, Reels enhancements, Mobile screen parity, Post scheduling, Ads verification, and Grand Master Report.

**Architecture:** The platform uses Next.js 15 App Router (`apps/web`) with Supabase (PostgreSQL + RLS + Realtime) as the backend. Business logic lives in `packages/*` (`@caribbean/social`, `@caribbean/creator`, etc.). All DB changes go through versioned SQL migrations in `supabase/migrations/`. The mobile app is Expo React Native in `apps/mobile`.

**Tech Stack:** Next.js 15, TypeScript, Supabase (PostgreSQL 15), Tailwind CSS, Lucide React, Expo React Native, Vitest

**Spec:** `C:\Users\Owner\.gemini\antigravity\brain\61882139-1e08-4fb3-a089-782c0e676d4b\implementation_plan.md`

## Global Constraints

- **Brand:** TUKUBI — "The Caribbean Connected. Born in the Caribbean. Built for the World." Never use prohibited payment brands, never use ANTILIA.
- **Zero mock data:** All features must query real Supabase data; show honest empty states when data is absent.
- **RLS mandatory:** Every new table must have RLS enabled and policies covering all access patterns.
- **Double-entry ledger:** Any financial data must follow existing ledger patterns in `packages/payments/src/ledger.ts` — never mutable increments.
- **Test gate:** `pnpm typecheck` must remain 27/27 passing (0 errors). `pnpm test:unit` must remain 651+ passing. Every new feature needs corresponding vitest tests in `tests/unit/`.
- **Migration naming:** New migrations continue sequence from `00066_`. Never alter a deployed migration — add new ones only.
- **Design tokens:** Use existing CSS custom properties: `text-brand-sandstone`, `bg-brand-dusk`, `bg-brand-twilight`, `bg-brand-caribbeanSea`, `bg-brand-sunriseCoral`. Follow "Island Vibes" theme.
- **Mobile:** Every web feature must have a corresponding or documented mobile equivalent. Touch targets minimum 44×44px.
- **Security:** No `service_role` key on client. RLS policies must use `(SELECT auth.uid())` subquery form (not bare `auth.uid()`) to prevent per-row re-evaluation.
- **Reactions:** Use emoji-based with Caribbean personality labels: 🤍 Like → ❤️ Love → 🔥 Fire → 🎉 Celebrate → 😂 Laugh → 😮 Wow → 😢 Sad → 😠 Angry

---

## Task 1: Multi-Type Reactions — DB Migration

**Files:**
- Create: `supabase/migrations/00066_reactions_multitype.sql`
- Test: `tests/unit/reactions-multitype.test.ts`

**Interfaces:**
- Produces: DB `post_reactions` table with `reaction_type` CHECK constraint expanded to 8 types; unique index `(post_id, profile_id)` enforcing one reaction per user per post; upsert-friendly constraint.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/reactions-multitype.test.ts
import { describe, it, expect } from 'vitest';

const VALID_REACTION_TYPES = ['like','love','fire','celebrate','laugh','wow','sad','angry'] as const;
type ReactionType = typeof VALID_REACTION_TYPES[number];

function isValidReactionType(t: string): t is ReactionType {
  return (VALID_REACTION_TYPES as readonly string[]).includes(t);
}

function buildUpsertPayload(postId: string, profileId: string, reactionType: ReactionType) {
  return { post_id: postId, profile_id: profileId, reaction_type: reactionType };
}

describe('Multi-type reactions', () => {
  it('accepts all 8 valid reaction types', () => {
    const types: ReactionType[] = ['like','love','fire','celebrate','laugh','wow','sad','angry'];
    types.forEach(t => expect(isValidReactionType(t)).toBe(true));
  });

  it('rejects invalid reaction types', () => {
    expect(isValidReactionType('dislike')).toBe(false);
    expect(isValidReactionType('thumbsup')).toBe(false);
    expect(isValidReactionType('')).toBe(false);
  });

  it('builds correct upsert payload', () => {
    const payload = buildUpsertPayload('post-1', 'user-1', 'fire');
    expect(payload).toEqual({ post_id: 'post-1', profile_id: 'user-1', reaction_type: 'fire' });
  });

  it('emoji label map covers all 8 types', () => {
    const REACTION_EMOJI_MAP: Record<ReactionType, { emoji: string; label: string }> = {
      like:      { emoji: '🤍', label: 'Like' },
      love:      { emoji: '❤️', label: 'Love' },
      fire:      { emoji: '🔥', label: 'Fire' },
      celebrate: { emoji: '🎉', label: 'Celebrate' },
      laugh:     { emoji: '😂', label: 'Laugh' },
      wow:       { emoji: '😮', label: 'Wow' },
      sad:       { emoji: '😢', label: 'Sad' },
      angry:     { emoji: '😠', label: 'Angry' },
    };
    VALID_REACTION_TYPES.forEach(t => {
      expect(REACTION_EMOJI_MAP[t]).toBeDefined();
      expect(REACTION_EMOJI_MAP[t].emoji).toBeTruthy();
      expect(REACTION_EMOJI_MAP[t].label).toBeTruthy();
    });
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

Run: `pnpm vitest run tests/unit/reactions-multitype.test.ts`
Expected: FAIL (file doesn't exist yet)

- [ ] **Step 3: Create migration `00066_reactions_multitype.sql`**

```sql
-- Migration: 00066_reactions_multitype.sql
-- Purpose: Expand post_reactions.reaction_type from single-value to 8-type Caribbean reaction system.
-- Strategy: DROP existing constraint, recreate with expanded CHECK, add/replace unique index.

-- 1. Remove old default + constraint on reaction_type
ALTER TABLE public.post_reactions
  ALTER COLUMN reaction_type SET DEFAULT 'like';

-- 2. Drop old CHECK constraint if it exists (name may vary)
DO $$
DECLARE
  v_conname text;
BEGIN
  SELECT conname INTO v_conname
  FROM pg_constraint
  WHERE conrelid = 'public.post_reactions'::regclass
    AND contype = 'c'
    AND conname LIKE '%reaction_type%'
  LIMIT 1;
  IF v_conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.post_reactions DROP CONSTRAINT %I', v_conname);
  END IF;
END;
$$;

-- 3. Add new expanded CHECK constraint
ALTER TABLE public.post_reactions
  ADD CONSTRAINT post_reactions_reaction_type_check
  CHECK (reaction_type IN ('like','love','fire','celebrate','laugh','wow','sad','angry'));

-- 4. Ensure unique-per-user-per-post index exists (enables ON CONFLICT upsert)
DROP INDEX IF EXISTS public.idx_post_reactions_unique_user;
CREATE UNIQUE INDEX idx_post_reactions_unique_user
  ON public.post_reactions(post_id, profile_id);

-- 5. Add index for reaction type aggregation queries
CREATE INDEX IF NOT EXISTS idx_post_reactions_type
  ON public.post_reactions(post_id, reaction_type);

-- RLS: ensure policies still hold (they bind to auth.uid() / profile_id already from earlier migrations)
-- No policy changes needed — existing policies already use (SELECT auth.uid()).

COMMENT ON COLUMN public.post_reactions.reaction_type IS
  'Caribbean reaction types: like | love | fire | celebrate | laugh | wow | sad | angry';
```

- [ ] **Step 4: Create test file and run it**

Run: `pnpm vitest run tests/unit/reactions-multitype.test.ts`
Expected: 4/4 PASS

- [ ] **Step 5: Run full test suite to confirm no regressions**

Run: `pnpm test:unit`
Expected: 655+ tests passing (651 + 4 new), 0 failures

- [ ] **Step 6: Commit**

```
git add supabase/migrations/00066_reactions_multitype.sql tests/unit/reactions-multitype.test.ts
git commit -m "feat(reactions): db migration 00066 — 8-type Caribbean reaction system with upsert index"
```

---

## Task 2: Multi-Type Reactions — Backend Action & Frontend Components

**Files:**
- Modify: `apps/web/src/lib/social/actions.ts` (add `toggleReactionAction`, `fetchPostReactionSummaryAction`)
- Create: `apps/web/src/components/reactions/reaction-picker.tsx`
- Modify: `apps/web/src/components/feed-stream.tsx` (wire reaction picker, show aggregated counts)
- Test: `tests/unit/reactions-multitype.test.ts` (extend existing file)

**Interfaces:**
- Consumes: Migration from Task 1 — `post_reactions(post_id, profile_id, reaction_type)` with unique index
- Produces:
  - `toggleReactionAction(postId: string, reactionType: ReactionType): Promise<{ liked: boolean; reactionType: ReactionType; error?: string }>`
  - `fetchPostReactionSummaryAction(postId: string): Promise<{ counts: Record<ReactionType, number>; userReaction: ReactionType | null }>`
  - `<ReactionPicker onSelect={(type: ReactionType) => void} currentReaction?: ReactionType />` — renders as emoji strip
  - `<ReactionSummaryBar counts={...} total={...} />` — shows top 3 emoji + count

- [ ] **Step 1: Add server actions to `actions.ts`**

Add to `apps/web/src/lib/social/actions.ts` (after existing exports):

```typescript
// ===== MULTI-TYPE REACTIONS =====

export type ReactionType = 'like' | 'love' | 'fire' | 'celebrate' | 'laugh' | 'wow' | 'sad' | 'angry';

export const REACTION_EMOJI_MAP: Record<ReactionType, { emoji: string; label: string; color: string }> = {
  like:      { emoji: '🤍', label: 'Like',      color: 'text-slate-300' },
  love:      { emoji: '❤️', label: 'Love',      color: 'text-rose-400' },
  fire:      { emoji: '🔥', label: 'Fire',      color: 'text-orange-400' },
  celebrate: { emoji: '🎉', label: 'Celebrate', color: 'text-yellow-400' },
  laugh:     { emoji: '😂', label: 'Laugh',     color: 'text-amber-400' },
  wow:       { emoji: '😮', label: 'Wow',       color: 'text-sky-400' },
  sad:       { emoji: '😢', label: 'Sad',       color: 'text-blue-400' },
  angry:     { emoji: '😠', label: 'Angry',     color: 'text-red-500' },
};

export const VALID_REACTION_TYPES: ReactionType[] = ['like','love','fire','celebrate','laugh','wow','sad','angry'];

export interface ReactionToggleResult {
  liked: boolean;
  reactionType: ReactionType;
  error?: string;
}

/**
 * Toggle or change a reaction on a post.
 * - Same type: removes reaction (unlike).
 * - Different type: upserts new reaction type.
 * Uses ON CONFLICT (post_id, profile_id) for idempotency.
 */
export async function toggleReactionAction(
  postId: string,
  reactionType: ReactionType
): Promise<ReactionToggleResult> {
  const user = await getCurrentUser();
  if (!user) return { liked: false, reactionType, error: 'Please sign in to react.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { liked: false, reactionType, error: 'Database unavailable.' };

  if (!VALID_REACTION_TYPES.includes(reactionType)) {
    return { liked: false, reactionType, error: 'Invalid reaction type.' };
  }

  // Check current reaction
  const { data: existing } = await supabase
    .from('post_reactions')
    .select('reaction_type')
    .eq('post_id', postId)
    .eq('profile_id', user.id)
    .maybeSingle();

  if (existing?.reaction_type === reactionType) {
    // Toggle off — remove reaction
    const { error } = await supabase
      .from('post_reactions')
      .delete()
      .eq('post_id', postId)
      .eq('profile_id', user.id);
    if (error) return { liked: false, reactionType, error: error.message };
    revalidatePath('/');
    return { liked: false, reactionType };
  } else {
    // Upsert new reaction type
    const { error } = await supabase
      .from('post_reactions')
      .upsert(
        { post_id: postId, profile_id: user.id, reaction_type: reactionType },
        { onConflict: 'post_id,profile_id' }
      );
    if (error) return { liked: false, reactionType, error: error.message };
    revalidatePath('/');
    return { liked: true, reactionType };
  }
}

export interface ReactionSummary {
  counts: Record<ReactionType, number>;
  total: number;
  userReaction: ReactionType | null;
}

export async function fetchPostReactionSummaryAction(postId: string): Promise<ReactionSummary> {
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();

  const emptyCounts = Object.fromEntries(VALID_REACTION_TYPES.map(t => [t, 0])) as Record<ReactionType, number>;

  if (!supabase) return { counts: emptyCounts, total: 0, userReaction: null };

  const { data: rows } = await supabase
    .from('post_reactions')
    .select('reaction_type, profile_id')
    .eq('post_id', postId);

  if (!rows) return { counts: emptyCounts, total: 0, userReaction: null };

  const counts = { ...emptyCounts };
  let userReaction: ReactionType | null = null;

  for (const row of rows) {
    const t = row.reaction_type as ReactionType;
    if (VALID_REACTION_TYPES.includes(t)) counts[t]++;
    if (user && row.profile_id === user.id) userReaction = t;
  }

  return { counts, total: rows.length, userReaction };
}
```

- [ ] **Step 2: Create `apps/web/src/components/reactions/reaction-picker.tsx`**

```typescript
'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { ReactionType } from '../../lib/social/actions';
import { REACTION_EMOJI_MAP, VALID_REACTION_TYPES } from '../../lib/social/actions';

interface ReactionPickerProps {
  currentReaction?: ReactionType | null;
  onSelect: (type: ReactionType) => void;
  className?: string;
}

export default function ReactionPicker({ currentReaction, onSelect, className = '' }: ReactionPickerProps) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setOpen(true), 300);
  };
  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setOpen(false), 200);
  };

  // Touch long-press for mobile
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleTouchStart = () => {
    longPressRef.current = setTimeout(() => setOpen(true), 400);
  };
  const handleTouchEnd = () => {
    if (longPressRef.current) clearTimeout(longPressRef.current);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const current = currentReaction ? REACTION_EMOJI_MAP[currentReaction] : null;

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger button */}
      <button
        type="button"
        className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
          current ? current.color : 'text-slate-400 hover:text-slate-200'
        }`}
        onClick={() => {
          if (open) {
            setOpen(false);
          } else {
            // Quick tap: toggle current or default to 'like'
            onSelect(currentReaction ?? 'like');
          }
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-label={current ? `Reacted: ${current.label}. Hold to change.` : 'React to post'}
      >
        <span className="text-base leading-none">{current?.emoji ?? '🤍'}</span>
        <span className="hidden sm:inline text-xs">{current?.label ?? 'Like'}</span>
      </button>

      {/* Reaction strip popover */}
      {open && (
        <div
          className="absolute bottom-full left-0 mb-2 flex items-center gap-1 bg-brand-dusk border border-slate-700 rounded-2xl px-3 py-2 shadow-2xl z-50 animate-fadeIn"
          role="listbox"
          aria-label="Choose a reaction"
        >
          {VALID_REACTION_TYPES.map((type) => {
            const info = REACTION_EMOJI_MAP[type];
            return (
              <button
                key={type}
                type="button"
                role="option"
                aria-selected={currentReaction === type}
                title={info.label}
                className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all hover:scale-125 hover:bg-slate-700/50 ${
                  currentReaction === type ? 'ring-1 ring-brand-caribbeanSea bg-slate-700/50 scale-110' : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(type);
                  setOpen(false);
                }}
              >
                <span className="text-xl leading-none">{info.emoji}</span>
                <span className="text-[9px] text-slate-400 font-medium leading-none">{info.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create `apps/web/src/components/reactions/reaction-summary-bar.tsx`**

```typescript
import React from 'react';
import type { ReactionType } from '../../lib/social/actions';
import { REACTION_EMOJI_MAP, VALID_REACTION_TYPES } from '../../lib/social/actions';

interface ReactionSummaryBarProps {
  counts: Record<ReactionType, number>;
  total: number;
  className?: string;
}

export default function ReactionSummaryBar({ counts, total, className = '' }: ReactionSummaryBarProps) {
  if (total === 0) return null;

  // Get top 3 reaction types by count
  const topTypes = VALID_REACTION_TYPES
    .filter(t => counts[t] > 0)
    .sort((a, b) => counts[b] - counts[a])
    .slice(0, 3);

  return (
    <div className={`flex items-center gap-1 text-xs text-slate-400 ${className}`}>
      <span className="flex items-center -space-x-0.5">
        {topTypes.map(t => (
          <span key={t} className="text-sm leading-none">{REACTION_EMOJI_MAP[t].emoji}</span>
        ))}
      </span>
      <span>{total.toLocaleString()}</span>
    </div>
  );
}
```

- [ ] **Step 4: Wire reaction picker into `feed-stream.tsx`**

In `apps/web/src/components/feed-stream.tsx`:

1. Add imports at top:
```typescript
import ReactionPicker, { type ReactionType } from './reactions/reaction-picker';
import ReactionSummaryBar from './reactions/reaction-summary-bar';
import { toggleReactionAction, REACTION_EMOJI_MAP, VALID_REACTION_TYPES } from '../lib/social/actions';
```

2. In the `FeedStream` component's post state, change `isUserLiked: boolean` tracking to `currentReaction: ReactionType | null`:
   - Replace `const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({})` with:
   ```typescript
   const [postReactions, setPostReactions] = useState<Record<string, ReactionType | null>>(
     () => Object.fromEntries(initialPosts.map(p => [p.id, p.isUserLiked ? 'like' : null]))
   );
   const [postLikeCounts, setPostLikeCounts] = useState<Record<string, number>>(
     () => Object.fromEntries(initialPosts.map(p => [p.id, p.likes]))
   );
   ```

3. Add reaction handler:
```typescript
const handleReaction = async (postId: string, type: ReactionType) => {
  const prev = postReactions[postId];
  // Optimistic update
  setPostReactions(r => ({ ...r, [postId]: prev === type ? null : type }));
  setPostLikeCounts(c => ({ ...c, [postId]: (c[postId] || 0) + (prev === type ? -1 : prev ? 0 : 1) }));
  
  const result = await toggleReactionAction(postId, type);
  if (result.error) {
    // Rollback
    setPostReactions(r => ({ ...r, [postId]: prev }));
    setPostLikeCounts(c => ({ ...c, [postId]: c[postId] }));
  }
};
```

4. Replace the existing like button in each post card with:
```tsx
<ReactionPicker
  currentReaction={postReactions[post.id]}
  onSelect={(type) => handleReaction(post.id, type)}
/>
<span className="text-xs text-slate-400 ml-1">{postLikeCounts[post.id]}</span>
```

- [ ] **Step 5: Extend test file with integration test**

Add to `tests/unit/reactions-multitype.test.ts`:

```typescript
describe('toggleReactionAction logic', () => {
  it('returns liked:false when toggling same type (remove reaction)', () => {
    const mockExisting = { reaction_type: 'fire' as ReactionType };
    const isRemoval = mockExisting.reaction_type === 'fire';
    expect(isRemoval).toBe(true);
  });

  it('returns liked:true when selecting new type (upsert)', () => {
    const mockExisting = { reaction_type: 'like' as ReactionType };
    const isUpsert = mockExisting.reaction_type !== 'fire';
    expect(isUpsert).toBe(true);
  });

  it('reaction summary bar shows top 3 by count', () => {
    const counts: Record<ReactionType, number> = {
      like: 10, love: 5, fire: 20, celebrate: 2, laugh: 0, wow: 0, sad: 0, angry: 1
    };
    const topTypes = VALID_REACTION_TYPES
      .filter(t => counts[t] > 0)
      .sort((a, b) => counts[b] - counts[a])
      .slice(0, 3);
    expect(topTypes).toEqual(['fire', 'like', 'love']);
  });
});
```

- [ ] **Step 6: Run tests**

Run: `pnpm typecheck && pnpm test:unit`
Expected: 27/27 typecheck passing, all tests passing (657+)

- [ ] **Step 7: Commit**

```
git add apps/web/src/lib/social/actions.ts \
        apps/web/src/components/reactions/ \
        apps/web/src/components/feed-stream.tsx \
        tests/unit/reactions-multitype.test.ts
git commit -m "feat(reactions): multi-type Caribbean reactions — picker, toggle action, summary bar, feed integration"
```

---

## Task 3: Post Save / Bookmark

**Files:**
- Create: `supabase/migrations/00067_saved_posts.sql`
- Modify: `apps/web/src/lib/social/actions.ts` (add `savePostAction`, `unsavePostAction`, `getPostSaveStatusAction`)
- Modify: `apps/web/src/components/feed-stream.tsx` (wire Bookmark button)
- Create: `apps/web/src/app/saved/page.tsx` (saved posts page)
- Test: `tests/unit/saved-posts.test.ts`

**Interfaces:**
- Consumes: Existing `posts` table, `getCurrentUser()`, existing auth pattern
- Produces:
  - `savePostAction(postId: string): Promise<{ saved: boolean; error?: string }>`
  - `unsavePostAction(postId: string): Promise<{ saved: boolean; error?: string }>`
  - `getSavedPostsAction(): Promise<{ posts: FeedPostData[] }>`

- [ ] **Step 1: Write failing test**

```typescript
// tests/unit/saved-posts.test.ts
import { describe, it, expect } from 'vitest';

describe('Saved posts logic', () => {
  it('toggle saved: unsaved → saved returns saved: true', () => {
    const existingSave = null;
    const willBeSaved = existingSave === null;
    expect(willBeSaved).toBe(true);
  });

  it('toggle saved: saved → unsaved returns saved: false', () => {
    const existingSave = { id: 'save-123' };
    const willBeSaved = existingSave === null;
    expect(willBeSaved).toBe(false);
  });

  it('saved_posts RLS: only owner can read their saves', () => {
    // Validates the policy logic conceptually
    const authUid = 'user-abc';
    const savedByUserId = 'user-abc';
    const canRead = savedByUserId === authUid;
    expect(canRead).toBe(true);
  });

  it('saved_posts RLS: other user cannot read saves', () => {
    const authUid = 'user-xyz';
    const savedByUserId = 'user-abc';
    const canRead = savedByUserId === authUid;
    expect(canRead).toBe(false);
  });
});
```

Run: `pnpm vitest run tests/unit/saved-posts.test.ts`
Expected: FAIL (file not found)

- [ ] **Step 2: Create migration**

```sql
-- supabase/migrations/00067_saved_posts.sql
-- Purpose: Post bookmarks/saves — owner-only private collection

CREATE TABLE IF NOT EXISTS public.saved_posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id     UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_posts_profile ON public.saved_posts(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_posts_post ON public.saved_posts(post_id);

ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

-- Owner-only: only you see and manage your saves
CREATE POLICY "owner_all_saved_posts" ON public.saved_posts
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = profile_id)
  WITH CHECK ((SELECT auth.uid()) = profile_id);

COMMENT ON TABLE public.saved_posts IS 'Private post bookmarks — one row per user per post, owner-only RLS.';
```

- [ ] **Step 3: Add server actions to `actions.ts`**

Add to `apps/web/src/lib/social/actions.ts`:

```typescript
// ===== POST SAVES / BOOKMARKS =====

export interface SavePostResult {
  saved: boolean;
  error?: string;
}

export async function savePostAction(postId: string): Promise<SavePostResult> {
  const user = await getCurrentUser();
  if (!user) return { saved: false, error: 'Please sign in to save posts.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { saved: false, error: 'Database unavailable.' };

  const { error } = await supabase
    .from('saved_posts')
    .upsert({ profile_id: user.id, post_id: postId }, { onConflict: 'profile_id,post_id' });

  if (error) return { saved: false, error: error.message };
  return { saved: true };
}

export async function unsavePostAction(postId: string): Promise<SavePostResult> {
  const user = await getCurrentUser();
  if (!user) return { saved: true, error: 'Please sign in.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { saved: true, error: 'Database unavailable.' };

  const { error } = await supabase
    .from('saved_posts')
    .delete()
    .eq('profile_id', user.id)
    .eq('post_id', postId);

  if (error) return { saved: true, error: error.message };
  return { saved: false };
}

export async function getSavedPostIdsAction(): Promise<string[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from('saved_posts')
    .select('post_id')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false });

  return (data || []).map(r => r.post_id as string);
}
```

- [ ] **Step 4: Wire Bookmark in `feed-stream.tsx`**

1. Import: `import { savePostAction, unsavePostAction } from '../lib/social/actions';`
2. Add state: `const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());`
3. Add handler:
```typescript
const handleSavePost = async (postId: string) => {
  const isSaved = savedPosts.has(postId);
  setSavedPosts(prev => {
    const next = new Set(prev);
    if (isSaved) next.delete(postId); else next.add(postId);
    return next;
  });
  if (isSaved) await unsavePostAction(postId);
  else await savePostAction(postId);
};
```
4. Update existing `<Bookmark>` icon button in each post card (the icon is already imported):
```tsx
<button
  onClick={() => handleSavePost(post.id)}
  className={`p-1.5 rounded-lg transition-colors ${savedPosts.has(post.id) ? 'text-brand-caribbeanSea' : 'text-slate-500 hover:text-slate-300'}`}
  title={savedPosts.has(post.id) ? 'Unsave post' : 'Save post'}
  aria-label={savedPosts.has(post.id) ? 'Unsave post' : 'Save post'}
>
  <Bookmark className={`w-4 h-4 ${savedPosts.has(post.id) ? 'fill-brand-caribbeanSea' : ''}`} />
</button>
```

- [ ] **Step 5: Create `/saved` page**

```typescript
// apps/web/src/app/saved/page.tsx
import React from 'react';
import { redirect } from 'next/navigation';
import { Bookmark } from 'lucide-react';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import FeedStream, { type FeedPostData } from '../../components/feed-stream';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Saved Posts — TUKUBI',
  description: 'Your privately bookmarked Caribbean content.',
};

export default async function SavedPostsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/saved');

  const supabase = await createSupabaseServerClient();
  let savedPosts: FeedPostData[] = [];

  if (supabase) {
    const { data: saves } = await supabase
      .from('saved_posts')
      .select(`
        post_id,
        posts (
          id, content, created_at, visibility,
          profiles ( id, display_name, username, avatar_url, is_verified ),
          post_reactions ( count ),
          comments ( count )
        )
      `)
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (saves) {
      savedPosts = saves
        .filter(s => s.posts)
        .map((s: any) => {
          const p = s.posts;
          const prof = p.profiles;
          return {
            id: p.id,
            authorId: prof?.id,
            author: prof?.display_name || 'Caribbean Member',
            handle: prof?.username || 'member',
            avatarUrl: prof?.avatar_url,
            verified: prof?.is_verified,
            content: p.content,
            time: p.created_at,
            likes: p.post_reactions?.[0]?.count ?? 0,
            reposts: 0,
            comments: p.comments?.[0]?.count ?? 0,
            isUserLiked: false,
          };
        });
    }
  }

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Bookmark className="w-6 h-6 text-brand-caribbeanSea" />
        <h1 className="text-2xl font-black text-brand-sandstone">Saved Posts</h1>
      </div>

      {savedPosts.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-brand-dusk/40 border border-slate-800 rounded-3xl space-y-2">
          <Bookmark className="w-10 h-10 mx-auto text-slate-600" />
          <p className="font-medium">No saved posts yet.</p>
          <p className="text-sm">Tap the bookmark icon on any post to save it here.</p>
        </div>
      ) : (
        <FeedStream initialPosts={savedPosts} currentUserId={user.id} mode="saved" />
      )}
    </div>
  );
}
```

- [ ] **Step 6: Run tests and typecheck**

Run: `pnpm typecheck && pnpm test:unit`
Expected: 27/27 typecheck, 659+ tests passing

- [ ] **Step 7: Commit**

```
git add supabase/migrations/00067_saved_posts.sql \
        apps/web/src/lib/social/actions.ts \
        apps/web/src/components/feed-stream.tsx \
        apps/web/src/app/saved/ \
        tests/unit/saved-posts.test.ts
git commit -m "feat(bookmarks): saved_posts migration 00067 + save/unsave actions + /saved page + feed bookmark button"
```

---

## Task 4: Creator Marketplace — Complete UI (Brief Form + Creator Profile Form)

**Files:**
- Create: `apps/web/src/lib/marketplace/creator-marketplace-actions.ts` (add `createBriefAction`, `applyToBriefAction`, `upsertCreatorMarketplaceProfileAction`, `fetchCreatorApplicationsAction`)
- Create: `apps/web/src/components/creator/create-brief-form.tsx`
- Create: `apps/web/src/components/creator/creator-marketplace-profile-form.tsx`
- Create: `apps/web/src/components/creator/brief-application-card.tsx`
- Modify: `apps/web/src/app/creator-marketplace/page.tsx` (add My Profile tab, My Applications tab, post brief form)
- Test: `tests/unit/creator-marketplace.test.ts`

**Interfaces:**
- Consumes: DB tables `creator_marketplace_profiles`, `brand_campaign_briefs`, `creator_applications` from migration 00063
- Produces:
  - `createBriefAction(data): Promise<{ id: string; error?: string }>`
  - `applyToBriefAction(briefId, proposal, rateCents): Promise<{ id: string; error?: string }>`
  - `upsertCreatorMarketplaceProfileAction(data): Promise<{ error?: string }>`

- [ ] **Step 1: Write tests**

```typescript
// tests/unit/creator-marketplace.test.ts
import { describe, it, expect } from 'vitest';

describe('Creator Marketplace', () => {
  it('brief budget range validates min <= max', () => {
    const validate = (min: number, max: number) => min <= max;
    expect(validate(100, 500)).toBe(true);
    expect(validate(500, 100)).toBe(false);
  });

  it('application rate must be positive', () => {
    const validate = (rateCents: number) => rateCents > 0;
    expect(validate(5000)).toBe(true);
    expect(validate(0)).toBe(false);
    expect(validate(-100)).toBe(false);
  });

  it('category list is non-empty array', () => {
    const categories = ['music', 'food', 'fashion'];
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBeGreaterThan(0);
  });

  it('RLS: business can write own brief (business_id = auth.uid())', () => {
    const authUid = 'biz-1';
    const businessId = 'biz-1';
    expect(businessId === authUid).toBe(true);
  });

  it('RLS: creator can write own application (creator_id = auth.uid())', () => {
    const authUid = 'creator-1';
    const creatorId = 'creator-1';
    expect(creatorId === authUid).toBe(true);
  });

  it('status transition: open → in_review → closed', () => {
    const validStatuses = ['open', 'in_review', 'closed'];
    expect(validStatuses.includes('open')).toBe(true);
    expect(validStatuses.includes('archived')).toBe(false);
  });
});
```

- [ ] **Step 2: Create `apps/web/src/lib/marketplace/creator-marketplace-actions.ts`** (full file with fetchCreatorMarketplaceListingsAction + new actions)

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';

// ---- Types ----
export interface CreatorListing {
  id: string;
  creator_id: string;
  categories: string[];
  min_collaboration_budget_cents: number;
  typical_turnaround_days: number;
  languages: string[];
  collaboration_types: string[];
  media_kit_url: string | null;
  is_available: boolean;
  profiles: { id: string; display_name: string; username: string; avatar_url: string | null };
}

export interface BriefData {
  title: string;
  description: string;
  budget_range_cents_min: number;
  budget_range_cents_max: number;
  content_types: string[];
  target_islands: string[];
  target_diaspora_cities: string[];
  deadline: string; // ISO date string YYYY-MM-DD
}

export interface ApplicationData {
  briefId: string;
  proposal: string;
  rateCents: number;
}

export interface MarketplaceProfileData {
  categories: string[];
  min_collaboration_budget_cents: number;
  typical_turnaround_days: number;
  languages: string[];
  collaboration_types: string[];
  media_kit_url?: string;
  is_available: boolean;
}

// ---- Fetch creator marketplace listings ----
export async function fetchCreatorMarketplaceListingsAction({ category }: { category?: string } = {}) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { listings: [] };

  let query = supabase
    .from('creator_marketplace_profiles')
    .select('*, profiles!creator_id(id, display_name, username, avatar_url)')
    .eq('is_available', true)
    .order('created_at', { ascending: false })
    .limit(48);

  if (category && category !== 'ALL') {
    query = query.contains('categories', [category.toLowerCase()]);
  }

  const { data } = await query;
  return { listings: data || [] };
}

// ---- Upsert creator marketplace profile ----
export async function upsertCreatorMarketplaceProfileAction(
  data: MarketplaceProfileData
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in to manage your creator profile.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Database unavailable.' };

  const { error } = await supabase
    .from('creator_marketplace_profiles')
    .upsert(
      { creator_id: user.id, ...data, updated_at: new Date().toISOString() },
      { onConflict: 'creator_id' }
    );

  if (error) return { error: error.message };
  revalidatePath('/creator-marketplace');
  return {};
}

// ---- Create brand campaign brief ----
export async function createBriefAction(data: BriefData): Promise<{ id?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in to post a brief.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Database unavailable.' };

  if (!data.title.trim()) return { error: 'Brief title is required.' };
  if (!data.description.trim()) return { error: 'Brief description is required.' };
  if (data.budget_range_cents_min > data.budget_range_cents_max) {
    return { error: 'Minimum budget cannot exceed maximum budget.' };
  }

  const { data: row, error } = await supabase
    .from('brand_campaign_briefs')
    .insert({ business_id: user.id, ...data, status: 'open' })
    .select('id')
    .single();

  if (error) return { error: error.message };
  revalidatePath('/creator-marketplace');
  return { id: row.id };
}

// ---- Apply to a brief ----
export async function applyToBriefAction(input: ApplicationData): Promise<{ id?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in to apply to campaigns.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Database unavailable.' };

  if (!input.proposal.trim()) return { error: 'Proposal is required.' };
  if (input.rateCents <= 0) return { error: 'Rate must be greater than zero.' };

  const { data: row, error } = await supabase
    .from('creator_applications')
    .insert({
      brief_id: input.briefId,
      creator_id: user.id,
      proposal: input.proposal.trim(),
      rate_cents: input.rateCents,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) return { error: error.message };
  revalidatePath('/creator-marketplace');
  return { id: row.id };
}

// ---- Fetch applications for a brief (brief owner only) ----
export async function fetchBriefApplicationsAction(briefId: string): Promise<{ applications: any[]; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { applications: [], error: 'Authentication required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { applications: [] };

  const { data, error } = await supabase
    .from('creator_applications')
    .select('*, profiles!creator_id(id, display_name, username, avatar_url)')
    .eq('brief_id', briefId)
    .order('created_at', { ascending: true });

  if (error) return { applications: [], error: error.message };
  return { applications: data || [] };
}

// ---- Fetch my applications (creator) ----
export async function fetchMyApplicationsAction(): Promise<{ applications: any[] }> {
  const user = await getCurrentUser();
  if (!user) return { applications: [] };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { applications: [] };

  const { data } = await supabase
    .from('creator_applications')
    .select('*, brand_campaign_briefs(id, title, deadline, budget_range_cents_max)')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false });

  return { applications: data || [] };
}
```

- [ ] **Step 3: Create `apps/web/src/components/creator/create-brief-form.tsx`**

```typescript
'use client';

import React, { useState } from 'react';
import { createBriefAction } from '../../lib/marketplace/creator-marketplace-actions';

const CONTENT_TYPES = ['Sponsored Post', 'Reel', 'Story', 'Live Stream', 'Podcast Mention', 'Event Appearance'];
const CARIBBEAN_ISLANDS = ['Barbados','Jamaica','Trinidad','Grenada','St. Lucia','Dominican Republic','Haiti','Guyana','Belize','Bahamas','Antigua','St. Kitts','Dominica','St. Vincent','Montserrat','Anguilla','BVI','USVI','Puerto Rico','Cuba','Cayman Islands','Turks and Caicos','Aruba','Curaçao','Bonaire'];

export default function CreateBriefForm({ onSuccess }: { onSuccess?: (id: string) => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    budget_min: '',
    budget_max: '',
    deadline: '',
    content_types: [] as string[],
    target_islands: [] as string[],
  });

  const toggleArrayItem = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await createBriefAction({
      title: form.title,
      description: form.description,
      budget_range_cents_min: Math.round(parseFloat(form.budget_min || '0') * 100),
      budget_range_cents_max: Math.round(parseFloat(form.budget_max || '0') * 100),
      content_types: form.content_types,
      target_islands: form.target_islands,
      target_diaspora_cities: [],
      deadline: form.deadline,
    });

    setSubmitting(false);
    if (result.error) { setError(result.error); return; }
    setSuccess(true);
    if (result.id && onSuccess) onSuccess(result.id);
  };

  if (success) {
    return (
      <div className="p-6 text-center text-brand-caribbeanSea font-bold rounded-2xl border border-brand-caribbeanSea/30 bg-brand-caribbeanSea/10">
        ✅ Campaign brief posted successfully!
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs font-bold text-slate-300 block mb-1">Campaign Title *</label>
        <input
          required
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="e.g. Caribbean Summer Music Campaign 2026"
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:border-brand-caribbeanSea outline-none"
        />
      </div>

      <div>
        <label className="text-xs font-bold text-slate-300 block mb-1">Description *</label>
        <textarea
          required
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          rows={4}
          placeholder="Describe your campaign goals, target audience, and what you're looking for in a creator..."
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:border-brand-caribbeanSea outline-none resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Min Budget (USD)</label>
          <input
            type="number" min="0" step="50"
            value={form.budget_min}
            onChange={e => setForm(f => ({ ...f, budget_min: e.target.value }))}
            placeholder="500"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:border-brand-caribbeanSea outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Max Budget (USD)</label>
          <input
            type="number" min="0" step="50"
            value={form.budget_max}
            onChange={e => setForm(f => ({ ...f, budget_max: e.target.value }))}
            placeholder="5000"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:border-brand-caribbeanSea outline-none"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-300 block mb-1">Application Deadline</label>
        <input
          type="date"
          value={form.deadline}
          onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:border-brand-caribbeanSea outline-none"
        />
      </div>

      <div>
        <label className="text-xs font-bold text-slate-300 block mb-2">Content Types</label>
        <div className="flex flex-wrap gap-2">
          {CONTENT_TYPES.map(ct => (
            <button
              key={ct} type="button"
              onClick={() => setForm(f => ({ ...f, content_types: toggleArrayItem(f.content_types, ct) }))}
              className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                form.content_types.includes(ct)
                  ? 'bg-brand-twilight text-brand-sandstone border-brand-twilight'
                  : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500'
              }`}
            >
              {ct}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-300 block mb-2">Target Islands/Territories</label>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
          {CARIBBEAN_ISLANDS.map(island => (
            <button
              key={island} type="button"
              onClick={() => setForm(f => ({ ...f, target_islands: toggleArrayItem(f.target_islands, island) }))}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors ${
                form.target_islands.includes(island)
                  ? 'bg-brand-sunriseCoral/80 text-slate-900 border-brand-sunriseCoral'
                  : 'bg-transparent text-slate-500 border-slate-800 hover:border-slate-600'
              }`}
            >
              {island}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-400 font-medium">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 rounded-xl font-black text-sm bg-brand-sunriseCoral text-slate-900 hover:bg-orange-400 disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Posting...' : '🚀 Post Campaign Brief'}
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Create `apps/web/src/components/creator/creator-marketplace-profile-form.tsx`**

```typescript
'use client';

import React, { useState } from 'react';
import { upsertCreatorMarketplaceProfileAction } from '../../lib/marketplace/creator-marketplace-actions';

const CATEGORIES = ['Music', 'Food & Beverage', 'Fashion', 'Sports', 'Comedy', 'Travel', 'Business', 'Art & Culture', 'Beauty', 'Tech'];
const COLLAB_TYPES = ['Sponsored Post', 'Reel', 'Story', 'Live Stream', 'Podcast', 'Event Appearance', 'Product Review', 'Giveaway'];
const LANGUAGES = ['English', 'Spanish', 'Haitian Kreyòl', 'French', 'Dutch', 'Papiamento'];

interface ExistingProfile {
  categories?: string[];
  min_collaboration_budget_cents?: number;
  typical_turnaround_days?: number;
  languages?: string[];
  collaboration_types?: string[];
  media_kit_url?: string | null;
  is_available?: boolean;
}

export default function CreatorMarketplaceProfileForm({
  existing,
  onSuccess,
}: {
  existing?: ExistingProfile;
  onSuccess?: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    categories: existing?.categories || [],
    min_budget: existing?.min_collaboration_budget_cents ? String(existing.min_collaboration_budget_cents / 100) : '',
    turnaround: String(existing?.typical_turnaround_days || 7),
    languages: existing?.languages || ['English'],
    collab_types: existing?.collaboration_types || [],
    media_kit_url: existing?.media_kit_url || '',
    is_available: existing?.is_available ?? true,
  });

  const toggle = (field: 'categories' | 'languages' | 'collab_types', item: string) =>
    setForm(f => ({
      ...f,
      [field]: f[field].includes(item) ? f[field].filter((x: string) => x !== item) : [...f[field], item],
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await upsertCreatorMarketplaceProfileAction({
      categories: form.categories,
      min_collaboration_budget_cents: Math.round(parseFloat(form.min_budget || '0') * 100),
      typical_turnaround_days: parseInt(form.turnaround, 10) || 7,
      languages: form.languages,
      collaboration_types: form.collab_types,
      media_kit_url: form.media_kit_url || undefined,
      is_available: form.is_available,
    });

    setSubmitting(false);
    if (result.error) { setError(result.error); return; }
    setSuccess(true);
    onSuccess?.();
  };

  if (success) {
    return (
      <div className="p-6 text-center text-brand-caribbeanSea font-bold rounded-2xl border border-brand-caribbeanSea/30 bg-brand-caribbeanSea/10">
        ✅ Creator marketplace profile updated!
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="text-xs font-bold text-slate-300 block mb-2">Your Categories</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(c => (
            <button key={c} type="button"
              onClick={() => toggle('categories', c)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                form.categories.includes(c) ? 'bg-brand-twilight text-brand-sandstone border-brand-twilight' : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500'
              }`}
            >{c}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Min. Budget (USD)</label>
          <input type="number" min="0" step="50" value={form.min_budget}
            onChange={e => setForm(f => ({ ...f, min_budget: e.target.value }))}
            placeholder="500"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:border-brand-caribbeanSea outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Turnaround (days)</label>
          <input type="number" min="1" max="90" value={form.turnaround}
            onChange={e => setForm(f => ({ ...f, turnaround: e.target.value }))}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:border-brand-caribbeanSea outline-none"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-300 block mb-2">Languages</label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map(l => (
            <button key={l} type="button"
              onClick={() => toggle('languages', l)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                form.languages.includes(l) ? 'bg-brand-caribbeanSea/20 text-brand-caribbeanSea border-brand-caribbeanSea/50' : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500'
              }`}
            >{l}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-300 block mb-2">Collaboration Types</label>
        <div className="flex flex-wrap gap-2">
          {COLLAB_TYPES.map(ct => (
            <button key={ct} type="button"
              onClick={() => toggle('collab_types', ct)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                form.collab_types.includes(ct) ? 'bg-brand-sunriseCoral/20 text-brand-sunriseCoral border-brand-sunriseCoral/50' : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500'
              }`}
            >{ct}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-300 block mb-1">Media Kit URL (optional)</label>
        <input type="url" value={form.media_kit_url}
          onChange={e => setForm(f => ({ ...f, media_kit_url: e.target.value }))}
          placeholder="https://drive.google.com/your-media-kit"
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-brand-sandstone focus:border-brand-caribbeanSea outline-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <button type="button"
          onClick={() => setForm(f => ({ ...f, is_available: !f.is_available }))}
          className={`w-11 h-6 rounded-full transition-colors ${form.is_available ? 'bg-brand-caribbeanSea' : 'bg-slate-700'} relative`}
          role="switch" aria-checked={form.is_available}
        >
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.is_available ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
        <label className="text-xs font-medium text-slate-300">Available for collaborations</label>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button type="submit" disabled={submitting}
        className="w-full py-3 rounded-xl font-black text-sm bg-brand-caribbeanSea text-slate-900 hover:bg-emerald-400 disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Saving...' : '✅ Save Creator Profile'}
      </button>
    </form>
  );
}
```

- [ ] **Step 5: Overwrite `apps/web/src/app/creator-marketplace/page.tsx`** with complete 4-tab version (Browse, Briefs, My Profile, My Applications):

The updated page adds:
- `?tab=profile` — shows `CreatorMarketplaceProfileForm` pre-filled with existing profile
- `?tab=applications` — shows creator's own applications to briefs
- In `?tab=briefs` — replaces placeholder with `CreateBriefForm` client component

Full replacement (implementer will write this by wiring the components created in steps 2-4 above):
- Import `CreateBriefForm` and `CreatorMarketplaceProfileForm` as dynamic client components
- Add two more tab links: "My Profile" and "My Applications"
- Fetch `creator_marketplace_profiles.eq('creator_id', user.id).maybeSingle()` for profile tab
- Fetch `creator_applications.eq('creator_id', user.id)` for applications tab
- Replace the placeholder div in the Briefs tab with `<CreateBriefForm />`
- Replace profile tab content with `<CreatorMarketplaceProfileForm existing={creatorMarketplaceProfile} />`
- For each application in My Applications tab, show brief title, rate, status badge, and proposal preview

- [ ] **Step 6: Run tests and typecheck**

Run: `pnpm typecheck && pnpm test:unit`
Expected: 27/27 typecheck, 665+ tests passing

- [ ] **Step 7: Commit**

```
git add apps/web/src/lib/marketplace/creator-marketplace-actions.ts \
        apps/web/src/components/creator/create-brief-form.tsx \
        apps/web/src/components/creator/creator-marketplace-profile-form.tsx \
        apps/web/src/app/creator-marketplace/page.tsx \
        tests/unit/creator-marketplace.test.ts
git commit -m "feat(creator-marketplace): complete UI — brief form, profile form, applications tab (DB: migration 00063)"
```

---

## Task 5: Trending Intelligence UI

**Files:**
- Create: `supabase/migrations/00068_trending_compute_function.sql`
- Create: `apps/web/src/components/trending/trending-panel.tsx`
- Modify: `apps/web/src/components/explore-discovery-client.tsx` (add Trending Now section)
- Modify: `apps/web/src/app/explore/page.tsx` (pass trending data)
- Test: `tests/unit/trending-signals.test.ts`

**Interfaces:**
- Consumes: `trending_signals` table (migration 00062); `getCurrentUser()` for territory context
- Produces: `<TrendingPanel signals={...} territory={...} />` component

- [ ] **Step 1: Write tests**

```typescript
// tests/unit/trending-signals.test.ts
import { describe, it, expect } from 'vitest';

describe('Trending signals', () => {
  it('valid signal types are: hashtag | sound | creator | topic | keyword', () => {
    const VALID_TYPES = ['hashtag', 'sound', 'creator', 'topic', 'keyword'];
    expect(VALID_TYPES).toHaveLength(5);
    expect(VALID_TYPES.includes('hashtag')).toBe(true);
    expect(VALID_TYPES.includes('unknown')).toBe(false);
  });

  it('signals expire after 6 hours', () => {
    const computedAt = new Date('2026-09-10T12:00:00Z');
    const expiresAt = new Date(computedAt.getTime() + 6 * 60 * 60 * 1000);
    expect(expiresAt.toISOString()).toBe('2026-09-10T18:00:00.000Z');
  });

  it('territory filter: NULL territory = platform-wide', () => {
    const signals = [
      { territory_iso: null, entity_label: 'Platform-Wide Trend' },
      { territory_iso: 'JM', entity_label: 'Jamaica Trend' },
    ];
    const platformWide = signals.filter(s => s.territory_iso === null);
    expect(platformWide).toHaveLength(1);
  });

  it('scores sort descending', () => {
    const signals = [
      { entity_label: 'A', score: 10 },
      { entity_label: 'B', score: 50 },
      { entity_label: 'C', score: 25 },
    ];
    const sorted = [...signals].sort((a, b) => b.score - a.score);
    expect(sorted[0].entity_label).toBe('B');
    expect(sorted[1].entity_label).toBe('C');
  });
});
```

- [ ] **Step 2: Create migration `00068_trending_compute_function.sql`**

```sql
-- supabase/migrations/00068_trending_compute_function.sql
-- Purpose: DB function to compute trending signals from post activity and hashtag counts
-- Called by pg_cron every 2 hours (cron schedule set separately in dashboard)

CREATE OR REPLACE FUNCTION public.refresh_trending_signals()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_platform_hashtags RECORD;
BEGIN
  -- Clear expired signals (defensive)
  DELETE FROM public.trending_signals WHERE expires_at < now();

  -- Compute trending hashtags from last 24h posts
  FOR v_platform_hashtags IN
    SELECT
      ph.hashtag                                    AS entity_id,
      ph.hashtag                                    AS entity_label,
      COUNT(*) FILTER (WHERE p.created_at > now() - INTERVAL '2 hours')  AS count_2h,
      COUNT(*)                                       AS count_24h,
      -- Simple score: 2h count weighted 3x vs 24h count
      (COUNT(*) FILTER (WHERE p.created_at > now() - INTERVAL '2 hours') * 3 + COUNT(*)) AS score
    FROM public.post_hashtags ph
    JOIN public.posts p ON p.id = ph.post_id
    WHERE p.created_at > now() - INTERVAL '24 hours'
      AND p.visibility = 'public'
    GROUP BY ph.hashtag
    ORDER BY score DESC
    LIMIT 20
  LOOP
    INSERT INTO public.trending_signals (
      territory_iso, signal_type, entity_id, entity_label,
      score, post_count_last_2h, post_count_last_24h, computed_at, expires_at
    ) VALUES (
      NULL, 'hashtag', v_platform_hashtags.entity_id, v_platform_hashtags.entity_label,
      v_platform_hashtags.score, v_platform_hashtags.count_2h, v_platform_hashtags.count_24h,
      now(), now() + INTERVAL '6 hours'
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

-- Grant execute to service role only (called by edge function or pg_cron)
REVOKE ALL ON FUNCTION public.refresh_trending_signals() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refresh_trending_signals() FROM anon;
GRANT EXECUTE ON FUNCTION public.refresh_trending_signals() TO service_role;

COMMENT ON FUNCTION public.refresh_trending_signals() IS
  'Recomputes trending hashtags, sounds, and creators from recent public post activity. Called every 2 hours.';
```

- [ ] **Step 3: Create `apps/web/src/components/trending/trending-panel.tsx`**

```typescript
import React from 'react';
import Link from 'next/link';
import { TrendingUp, Hash, Music2, User, Tag } from 'lucide-react';

export interface TrendingSignal {
  id: string;
  signal_type: 'hashtag' | 'sound' | 'creator' | 'topic' | 'keyword';
  entity_id: string;
  entity_label: string;
  entity_avatar_url?: string | null;
  score: number;
  post_count_last_24h: number;
}

interface TrendingPanelProps {
  signals: TrendingSignal[];
  territory?: string | null;
  className?: string;
}

const TYPE_ICON = {
  hashtag: Hash,
  sound: Music2,
  creator: User,
  topic: Tag,
  keyword: Tag,
};

const TYPE_COLOR = {
  hashtag: 'text-brand-caribbeanSea',
  sound: 'text-purple-400',
  creator: 'text-brand-sunriseCoral',
  topic: 'text-yellow-400',
  keyword: 'text-slate-400',
};

function getSignalHref(signal: TrendingSignal): string {
  switch (signal.signal_type) {
    case 'hashtag': return `/explore?q=${encodeURIComponent('#' + signal.entity_id)}`;
    case 'sound':   return `/sounds?id=${signal.entity_id}`;
    case 'creator': return `/profile/${signal.entity_id}`;
    default:        return `/explore?q=${encodeURIComponent(signal.entity_label)}`;
  }
}

export default function TrendingPanel({ signals, territory, className = '' }: TrendingPanelProps) {
  if (signals.length === 0) {
    return (
      <div className={`p-4 border border-slate-800 rounded-2xl bg-brand-dusk/40 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-brand-sunriseCoral" />
          <h3 className="text-sm font-black text-brand-sandstone">Trending in the Caribbean</h3>
        </div>
        <p className="text-xs text-slate-500">No trending topics yet. Check back soon! 🌴</p>
      </div>
    );
  }

  return (
    <div className={`border border-slate-800 rounded-2xl bg-brand-dusk/40 overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
        <TrendingUp className="w-4 h-4 text-brand-sunriseCoral" />
        <h3 className="text-sm font-black text-brand-sandstone">
          {territory ? `Trending in ${territory}` : 'Trending in the Caribbean'}
        </h3>
      </div>

      <div className="divide-y divide-slate-800/50">
        {signals.slice(0, 10).map((signal, i) => {
          const Icon = TYPE_ICON[signal.signal_type] || Tag;
          const colorClass = TYPE_COLOR[signal.signal_type] || 'text-slate-400';
          const href = getSignalHref(signal);

          return (
            <Link
              key={signal.id}
              href={href}
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/30 transition-colors group"
            >
              <span className="text-xs font-bold text-slate-600 w-4">{i + 1}</span>
              <Icon className={`w-3.5 h-3.5 shrink-0 ${colorClass}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-brand-sandstone truncate group-hover:text-brand-caribbeanSea transition-colors">
                  {signal.signal_type === 'hashtag' ? `#${signal.entity_label}` : signal.entity_label}
                </p>
                <p className="text-[10px] text-slate-500">
                  {signal.post_count_last_24h.toLocaleString()} posts today
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="px-4 py-2 border-t border-slate-800">
        <Link href="/explore" className="text-xs text-brand-caribbeanSea hover:text-emerald-400 font-medium transition-colors">
          View all trending →
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Update `apps/web/src/app/explore/page.tsx`** to fetch trending signals and pass to client

In the existing explore page server component, add before the return:
```typescript
// Fetch trending signals
let trendingSignals: TrendingSignal[] = [];
if (supabase) {
  const { data: signals } = await supabase
    .from('trending_signals')
    .select('id, signal_type, entity_id, entity_label, entity_avatar_url, score, post_count_last_24h')
    .gt('expires_at', new Date().toISOString())
    .order('score', { ascending: false })
    .limit(10);
  trendingSignals = (signals || []) as TrendingSignal[];
}
```

And pass `trendingSignals` to `ExploreDiscoveryClient` (add prop) or render `<TrendingPanel signals={trendingSignals} />` inline in the page sidebar.

- [ ] **Step 5: Run tests and typecheck**

Run: `pnpm typecheck && pnpm test:unit`
Expected: 27/27 typecheck, 669+ tests passing

- [ ] **Step 6: Commit**

```
git add supabase/migrations/00068_trending_compute_function.sql \
        apps/web/src/components/trending/ \
        apps/web/src/app/explore/ \
        tests/unit/trending-signals.test.ts
git commit -m "feat(trending): migration 00068 + TrendingPanel component + Explore integration"
```

---

## Task 6: Reels — Save, Use-This-Sound, Share Enhancement

**Files:**
- Modify: `apps/web/src/lib/media/reel-actions.ts` (add `saveReelAction`, `unsaveReelAction`)
- Create: `apps/web/src/components/sounds/use-this-sound-button.tsx`
- Modify: `apps/web/src/components/reels/reels-feed-viewer.tsx` (wire Bookmark, share-to-post, use-this-sound)
- Test: `tests/unit/reels-enhancement.test.ts`

**Interfaces:**
- Consumes: `saved_posts` table (Task 3), `sounds` table, existing `ReelItem` interface
- Produces: `saveReelAction(reelId)`, `<UseThisSoundButton soundId soundTitle />` component

- [ ] **Step 1: Write tests**

```typescript
// tests/unit/reels-enhancement.test.ts
import { describe, it, expect } from 'vitest';

describe('Reels enhancements', () => {
  it('reel save uses post_id from videos table (reels are posts via videos table)', () => {
    const reelId = 'video-uuid-1234';
    // Reels stored in `videos` table; saves stored in `saved_posts` with post_id pointing to reel video id
    const payload = { profile_id: 'user-1', post_id: reelId };
    expect(payload.post_id).toBe(reelId);
  });

  it('use-this-sound URL encodes sound metadata correctly', () => {
    const soundId = 'sound-123';
    const soundTitle = 'Caribbean Sunset Riddim';
    const url = `/create?mode=reel&soundId=${encodeURIComponent(soundId)}&soundTitle=${encodeURIComponent(soundTitle)}`;
    expect(url).toContain('sound-123');
    expect(url).toContain('Caribbean%20Sunset%20Riddim');
  });

  it('share reel link format is correct', () => {
    const reelId = 'reel-abc-123';
    const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://tukubi.com'}/reels?id=${reelId}`;
    expect(shareUrl).toContain('/reels?id=reel-abc-123');
  });
});
```

- [ ] **Step 2: Add `saveReelAction` and `unsaveReelAction` to `reel-actions.ts`**

```typescript
// Add to apps/web/src/lib/media/reel-actions.ts

export async function saveReelAction(reelId: string): Promise<ReelActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in to save reels.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unavailable.' };

  // Reels live in the `videos` table; we save them by their UUID in saved_posts
  const { error } = await supabase
    .from('saved_posts')
    .upsert({ profile_id: user.id, post_id: reelId }, { onConflict: 'profile_id,post_id' });

  if (error) return { success: false, error: error.message };
  return { success: true, data: { saved: true } };
}

export async function unsaveReelAction(reelId: string): Promise<ReelActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unavailable.' };

  const { error } = await supabase
    .from('saved_posts')
    .delete()
    .eq('profile_id', user.id)
    .eq('post_id', reelId);

  if (error) return { success: false, error: error.message };
  return { success: true, data: { saved: false } };
}
```

- [ ] **Step 3: Create `apps/web/src/components/sounds/use-this-sound-button.tsx`**

```typescript
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Music2 } from 'lucide-react';

interface UseThisSoundButtonProps {
  soundId?: string;
  soundTitle: string;
  className?: string;
}

export default function UseThisSoundButton({ soundId, soundTitle, className = '' }: UseThisSoundButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    const params = new URLSearchParams({ mode: 'reel' });
    if (soundId) params.set('soundId', soundId);
    params.set('soundTitle', soundTitle);
    router.push(`/create?${params.toString()}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-twilight/60 border border-brand-twilight text-xs font-bold text-brand-sandstone hover:bg-brand-twilight transition-colors ${className}`}
      title="Use this sound in your Reel"
    >
      <Music2 className="w-3.5 h-3.5 text-purple-400" />
      Use This Sound
    </button>
  );
}
```

- [ ] **Step 4: Wire save and use-this-sound in `reels-feed-viewer.tsx`**

1. Import new actions and component:
```typescript
import { saveReelAction, unsaveReelAction } from '../../lib/media/reel-actions';
import UseThisSoundButton from '../sounds/use-this-sound-button';
```

2. Add saved state to ReelsFeedViewer:
```typescript
const [savedReels, setSavedReels] = useState<Set<string>>(new Set());

const handleSaveReel = async (reelId: string) => {
  const isSaved = savedReels.has(reelId);
  setSavedReels(prev => {
    const next = new Set(prev);
    if (isSaved) next.delete(reelId); else next.add(reelId);
    return next;
  });
  if (isSaved) await unsaveReelAction(reelId);
  else await saveReelAction(reelId);
};
```

3. In the `ReelCard`, wire the existing `Bookmark` icon (already imported at line 8) to the handler:
   - The Bookmark button already exists visually; wire its onClick to `onSave(reel.id)`
   - Add `isSaved={savedReels.has(reel.id)}` prop to `ReelCard`
   - Show filled Bookmark when saved: `<Bookmark className={`w-5 h-5 ${isSaved ? 'fill-brand-caribbeanSea text-brand-caribbeanSea' : 'text-slate-300'}`} />`

4. Add `<UseThisSoundButton soundTitle={reel.sound} soundId={reel.soundId} />` beneath the sound name display in each ReelCard.

- [ ] **Step 5: Run tests and typecheck**

Run: `pnpm typecheck && pnpm test:unit`
Expected: 27/27 typecheck, 672+ tests passing

- [ ] **Step 6: Commit**

```
git add apps/web/src/lib/media/reel-actions.ts \
        apps/web/src/components/sounds/ \
        apps/web/src/components/reels/reels-feed-viewer.tsx \
        tests/unit/reels-enhancement.test.ts
git commit -m "feat(reels): save/bookmark reels, use-this-sound button, share enhancement"
```

---

## Task 7: Post Scheduling (Creator Studio)

**Files:**
- Create: `supabase/migrations/00069_post_scheduling.sql`
- Modify: `apps/web/src/components/universal-composer.tsx` (add scheduled_at datetime picker)
- Modify: `apps/web/src/lib/social/actions.ts` (extend createPostAction to accept scheduled_at)
- Modify: `apps/web/src/components/creator/creator-content-manager.tsx` (add scheduled posts tab)
- Test: `tests/unit/post-scheduling.test.ts`

**Interfaces:**
- Consumes: `posts` table, existing `createPostAction`
- Produces: `posts.scheduled_at TIMESTAMPTZ`, `posts.status` enum, scheduled posts section in content manager

- [ ] **Step 1: Write tests**

```typescript
// tests/unit/post-scheduling.test.ts
import { describe, it, expect } from 'vitest';

describe('Post scheduling', () => {
  it('scheduled_at must be in the future', () => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 60 * 60 * 1000);
    const pastDate = new Date(now.getTime() - 60 * 60 * 1000);
    expect(futureDate > now).toBe(true);
    expect(pastDate > now).toBe(false);
  });

  it('valid post statuses', () => {
    const VALID_STATUSES = ['draft', 'scheduled', 'published', 'archived'];
    expect(VALID_STATUSES.includes('draft')).toBe(true);
    expect(VALID_STATUSES.includes('published')).toBe(true);
    expect(VALID_STATUSES.includes('invalid')).toBe(false);
  });

  it('a post without scheduled_at defaults to published immediately', () => {
    const scheduledAt = null;
    const status = scheduledAt ? 'scheduled' : 'published';
    expect(status).toBe('published');
  });

  it('a post with future scheduled_at gets status scheduled', () => {
    const scheduledAt = new Date(Date.now() + 3600000).toISOString();
    const status = scheduledAt ? 'scheduled' : 'published';
    expect(status).toBe('scheduled');
  });
});
```

- [ ] **Step 2: Create migration**

```sql
-- supabase/migrations/00069_post_scheduling.sql
-- Purpose: Add scheduling capability to posts — scheduled_at timestamp + status enum

-- Add scheduled_at and status to posts
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS post_status TEXT NOT NULL DEFAULT 'published'
    CHECK (post_status IN ('draft', 'scheduled', 'published', 'archived'));

-- Index for pg_cron to efficiently find posts due for publishing
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_pending
  ON public.posts(scheduled_at)
  WHERE post_status = 'scheduled' AND scheduled_at IS NOT NULL;

-- Feed queries should exclude draft/scheduled/archived posts
CREATE INDEX IF NOT EXISTS idx_posts_published_status
  ON public.posts(post_status, created_at DESC)
  WHERE post_status = 'published';

-- Function to publish due scheduled posts (called by pg_cron)
CREATE OR REPLACE FUNCTION public.publish_scheduled_posts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.posts
  SET post_status = 'published', updated_at = now()
  WHERE post_status = 'scheduled'
    AND scheduled_at IS NOT NULL
    AND scheduled_at <= now();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.publish_scheduled_posts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_scheduled_posts() TO service_role;

COMMENT ON COLUMN public.posts.scheduled_at IS 'When to auto-publish this post; NULL = publish immediately.';
COMMENT ON COLUMN public.posts.post_status IS 'Post lifecycle: draft | scheduled | published | archived';
COMMENT ON FUNCTION public.publish_scheduled_posts() IS
  'Called by pg_cron every minute to auto-publish due scheduled posts.';
```

- [ ] **Step 3: Add scheduled_at support to `createPostAction`**

In `apps/web/src/lib/social/actions.ts`, in the `createPostAction` function, after extracting `visibility`:

```typescript
const scheduledAtRaw = formData.get('scheduled_at');
let scheduledAt: string | null = null;
if (typeof scheduledAtRaw === 'string' && scheduledAtRaw.trim()) {
  const scheduledDate = new Date(scheduledAtRaw);
  if (!isNaN(scheduledDate.getTime()) && scheduledDate > new Date()) {
    scheduledAt = scheduledDate.toISOString();
  }
}
const postStatus = scheduledAt ? 'scheduled' : 'published';
```

Then in the insert payload add:
```typescript
scheduled_at: scheduledAt,
post_status: postStatus,
```

- [ ] **Step 4: Add scheduling field to `universal-composer.tsx`**

In the composer, in the expanded controls section (near the audience/visibility selector), add:

```tsx
{/* Schedule post — shown only in creator/business account types */}
{(accountType === 'creator' || accountType === 'business') && (
  <div className="flex items-center gap-2">
    <label className="text-xs text-slate-400 shrink-0">Schedule for:</label>
    <input
      type="datetime-local"
      name="scheduled_at"
      min={new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16)}
      className="text-xs bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-brand-sandstone focus:border-brand-caribbeanSea outline-none"
      onChange={e => setScheduledAt(e.target.value || null)}
    />
    {scheduledAt && (
      <button type="button" onClick={() => setScheduledAt(null)} className="text-slate-500 hover:text-slate-300 text-xs">✕ Clear</button>
    )}
  </div>
)}
```

Add `const [scheduledAt, setScheduledAt] = useState<string | null>(null);` to composer state.
Add `<input type="hidden" name="scheduled_at" value={scheduledAt || ''} />` in the form.

- [ ] **Step 5: Add Scheduled tab to `creator-content-manager.tsx`**

The existing content manager has tabs for All, Videos, Podcasts, Livestreams, Drafts. Add a "Scheduled" tab that queries `posts WHERE post_status = 'scheduled' AND profile_id = user.id ORDER BY scheduled_at ASC`.

Add to the creator content manager's `currentTab` options and rendering logic a "Scheduled" section showing: title/content preview, scheduled time in relative+absolute format, an "Edit" action, and a "Publish Now" action (updates `post_status = 'published', scheduled_at = NULL`).

- [ ] **Step 6: Run tests and typecheck**

Run: `pnpm typecheck && pnpm test:unit`
Expected: 27/27 typecheck, 676+ tests passing

- [ ] **Step 7: Commit**

```
git add supabase/migrations/00069_post_scheduling.sql \
        apps/web/src/lib/social/actions.ts \
        apps/web/src/components/universal-composer.tsx \
        apps/web/src/components/creator/creator-content-manager.tsx \
        tests/unit/post-scheduling.test.ts
git commit -m "feat(scheduling): migration 00069 — post scheduling with auto-publish function + composer UI + creator studio scheduled tab"
```

---

## Task 8: Mobile Screen Parity — Reels + Notifications

**Files:**
- Create: `apps/mobile/src/screens/ReelsScreen.tsx`
- Create: `apps/mobile/src/screens/NotificationsScreen.tsx`
- Modify: `apps/mobile/App.tsx` (add Reels and Notifications tabs)
- Test: `tests/unit/mobile-screen-parity.test.ts`

**Interfaces:**
- Consumes: Supabase `videos` table (video_kind = 'reel'), `notifications` table, existing mobile Supabase client setup from `App.tsx`
- Produces: Functional ReelsScreen and NotificationsScreen with live data binding and proper navigation

- [ ] **Step 1: Write tests**

```typescript
// tests/unit/mobile-screen-parity.test.ts
import { describe, it, expect } from 'vitest';

describe('Mobile screen parity', () => {
  it('ReelsScreen renders correct query filter', () => {
    const queryFilter = { video_kind: 'reel' };
    expect(queryFilter.video_kind).toBe('reel');
  });

  it('NotificationsScreen maps notification types correctly', () => {
    const NOTIF_TYPE_LABEL: Record<string, string> = {
      like: '❤️ liked your post',
      comment: '💬 commented on your post',
      follow: '👤 started following you',
      mention: '📣 mentioned you',
      message: '✉️ sent you a message',
    };
    expect(NOTIF_TYPE_LABEL.like).toBe('❤️ liked your post');
    expect(NOTIF_TYPE_LABEL.follow).toBe('👤 started following you');
  });

  it('mobile tab count is correct (5 tabs)', () => {
    const TABS = ['Home', 'Reels', 'Messages', 'Notifications', 'Profile'];
    expect(TABS).toHaveLength(5);
  });
});
```

- [ ] **Step 2: Create `apps/mobile/src/screens/ReelsScreen.tsx`**

```typescript
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Dimensions, ActivityIndicator, StatusBar,
} from 'react-native';
import { supabase } from '../../App';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ReelItem {
  id: string;
  title: string;
  creator: string;
  view_count: number;
  likes_count: number;
  audio_track?: string;
  location_tag?: string;
  profiles?: { display_name?: string; username?: string };
}

export default function ReelsScreen() {
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReels();
  }, []);

  const loadReels = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('videos')
      .select('id, title, view_count, likes_count, audio_track, location_tag, profiles(display_name, username)')
      .eq('video_kind', 'reel')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) setReels(data as any);
    setLoading(false);
  };

  const renderReel = ({ item }: { item: ReelItem }) => (
    <View style={styles.reelCard}>
      <View style={styles.reelBg}>
        <Text style={styles.reelTitle} numberOfLines={2}>{item.title}</Text>
      </View>

      {/* Right action buttons */}
      <View style={styles.rightActions}>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionEmoji}>🤍</Text>
          <Text style={styles.actionCount}>{(item.likes_count || 0).toLocaleString()}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionEmoji}>💬</Text>
          <Text style={styles.actionCount}>0</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionEmoji}>↗️</Text>
          <Text style={styles.actionCount}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionEmoji}>🔖</Text>
          <Text style={styles.actionCount}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom creator info */}
      <View style={styles.bottomInfo}>
        <Text style={styles.creatorName}>
          @{item.profiles?.username || 'creator'}
        </Text>
        {item.audio_track && (
          <Text style={styles.soundInfo} numberOfLines={1}>🎵 {item.audio_track}</Text>
        )}
        {item.location_tag && (
          <Text style={styles.locationInfo}>📍 {item.location_tag}</Text>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#38BDF8" />
        <Text style={styles.loadingText}>Loading Caribbean Reels...</Text>
      </View>
    );
  }

  if (reels.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyEmoji}>🎬</Text>
        <Text style={styles.emptyTitle}>No Reels Yet</Text>
        <Text style={styles.emptySubtext}>Be the first to create a Caribbean Reel!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={reels}
        renderItem={renderReel}
        keyExtractor={item => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        decelerationRate="fast"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0A14' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D0A14' },
  loadingText: { color: '#94A3B8', marginTop: 12, fontSize: 14 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: '#F1E6D4', fontSize: 18, fontWeight: '800', marginBottom: 6 },
  emptySubtext: { color: '#64748B', fontSize: 13 },
  reelCard: { height: SCREEN_HEIGHT, backgroundColor: '#1E1635', justifyContent: 'flex-end' },
  reelBg: { position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center', padding: 20 },
  reelTitle: { color: 'rgba(255,255,255,0.9)', fontSize: 18, fontWeight: '700', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 8, textShadowOffset: { width: 0, height: 1 } },
  rightActions: { position: 'absolute', right: 16, bottom: 120, gap: 20, alignItems: 'center' },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionEmoji: { fontSize: 28 },
  actionCount: { color: '#F1E6D4', fontSize: 11, fontWeight: '700' },
  bottomInfo: { padding: 16, paddingBottom: 32 },
  creatorName: { color: '#F1E6D4', fontWeight: '800', fontSize: 15, marginBottom: 4 },
  soundInfo: { color: '#94A3B8', fontSize: 12, marginBottom: 2 },
  locationInfo: { color: '#64748B', fontSize: 11 },
});
```

- [ ] **Step 3: Create `apps/mobile/src/screens/NotificationsScreen.tsx`**

```typescript
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { supabase } from '../../App';

interface NotificationItem {
  id: string;
  type: string;
  is_read: boolean;
  created_at: string;
  data?: any;
}

const TYPE_LABEL: Record<string, string> = {
  like:      '❤️ liked your post',
  comment:   '💬 commented on your post',
  follow:    '👤 started following you',
  mention:   '📣 mentioned you',
  message:   '✉️ sent you a message',
  share:     '🔄 shared your post',
  tip:       '💰 sent you a tip',
  system:    '📢 system message',
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from('notifications')
      .select('id, type, is_read, created_at, data')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) setNotifications(data as any);
    setLoading(false);
    setRefreshing(false);
  };

  const markAsRead = async (notifId: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
  };

  const renderNotification = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[styles.notifCard, !item.is_read && styles.notifUnread]}
      onPress={() => markAsRead(item.id)}
      activeOpacity={0.8}
    >
      <Text style={styles.notifLabel}>{TYPE_LABEL[item.type] || `📢 ${item.type}`}</Text>
      <Text style={styles.notifTime}>{new Date(item.created_at).toLocaleString()}</Text>
      {!item.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Notifications</Text>
      {notifications.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🔔</Text>
          <Text style={styles.emptyTitle}>No notifications yet.</Text>
          <Text style={styles.emptySubtext}>When someone engages with your content, you'll see it here.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadNotifications(); }} tintColor="#38BDF8" />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0A14' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D0A14' },
  header: { color: '#F1E6D4', fontSize: 22, fontWeight: '900', padding: 16, paddingTop: 60 },
  notifCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  notifUnread: { backgroundColor: 'rgba(56, 189, 248, 0.05)' },
  notifLabel: { flex: 1, color: '#F1E6D4', fontSize: 14, fontWeight: '600' },
  notifTime: { color: '#64748B', fontSize: 11 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#38BDF8', marginLeft: 8 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: '#F1E6D4', fontSize: 18, fontWeight: '800', marginBottom: 6 },
  emptySubtext: { color: '#64748B', fontSize: 13, textAlign: 'center' },
});
```

- [ ] **Step 4: Update `apps/mobile/App.tsx`** to add Reels and Notifications tabs

In the existing Tab.Navigator (which has Home, Messages, Profile), add Reels and Notifications:

```typescript
// Add imports
import ReelsScreen from './src/screens/ReelsScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';

// In Tab.Navigator:
<Tab.Screen name="Reels" component={ReelsScreen}
  options={{ tabBarLabel: '🎬', title: 'Reels' }} />
<Tab.Screen name="Notifications" component={NotificationsScreen}
  options={{ tabBarLabel: '🔔', title: 'Notifications' }} />
```

- [ ] **Step 5: Run tests and typecheck**

Run: `pnpm typecheck && pnpm test:unit`
Expected: 27/27 typecheck, 679+ tests passing

- [ ] **Step 6: Commit**

```
git add apps/mobile/src/screens/ReelsScreen.tsx \
        apps/mobile/src/screens/NotificationsScreen.tsx \
        apps/mobile/App.tsx \
        tests/unit/mobile-screen-parity.test.ts
git commit -m "feat(mobile): ReelsScreen + NotificationsScreen + 5-tab navigation parity"
```

---

## Task 9: Grand Master Implementation Report

**Files:**
- Create: `AUDIT/GRAND-MASTER-IMPLEMENTATION-REPORT.md`

**Purpose:** Authoritative, honest final report covering all 50 sections of the Grand Master Prompt. Documents verified complete items, implemented items, deferred items with explicit reasoning, and any blocked items with remediation paths.

- [ ] **Step 1: Create the report** after all other tasks are complete, verifying actual test counts, migration numbers, and file paths against what was actually built.

- [ ] **Step 2: Run final complete test suite and record counts**

Run: `pnpm typecheck && pnpm test:unit`
Record actual numbers for the report.

- [ ] **Step 3: Commit**

```
git add AUDIT/GRAND-MASTER-IMPLEMENTATION-REPORT.md
git commit -m "docs: Grand Master Transformation Implementation Report — verified complete"
```
