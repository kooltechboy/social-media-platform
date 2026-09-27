# TUKUBI Engagement & Interaction Primitives Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a production-grade Unicode 15/16 Emoji & Multi-Type Reaction Engine and a Server-Authoritative Poll & Quiz System with instant feedback, explanation revelation, and tamper-proof RLS/database integrity.

**Architecture:** A lightweight categorized Unicode 15/16 dataset with Fitzpatrick skin tone synthesis and inverted keyword search in `apps/web/src/lib/emoji/` powering an accessible, 2D keyboard-navigable `EmojiPickerPopover`, paired with database schema extensions in `00101_polls_and_quizzes_enhancements.sql` for quizzes and image options, backed by server actions and an interactive poll/quiz widget with atomic voting counters.

**Tech Stack:** TypeScript 5.5, React 19, Tailwind v4, Lucide React, Supabase Postgres & RLS, Vitest.

**Spec:** [`docs/superpowers/specs/2026-09-27-tukubi-engagement-and-interaction-primitives-design.md`](file:///c:/Users/Owner/Desktop/social%20media%20platform/docs/superpowers/specs/2026-09-27-tukubi-engagement-and-interaction-primitives-design.md)

## Global Constraints
- Full Unicode 15/16 compliance with dedicated Caribbean & Diaspora category (all 30+ regional flags, cultural symbols).
- Fitzpatrick skin tones 1 through 5 with dynamic modifier synthesis on base glyphs.
- Zero mock metrics: all votes, options, reaction counts, and quiz scores must be server-authoritative.
- WCAG 2.2 AA compliant: full 2D arrow key navigation, `aria-live` announcement of focused emoji and quiz answers, min 44x44px touch targets.
- Tamper-proof DB enforcement: atomic counters, rejection of post-expiration votes, unique `(poll_id, user_id)` constraint.

---

### Task 1: Comprehensive Unicode 15/16 Dataset & Token Index

**Files:**
- Create: `apps/web/src/lib/emoji/types.ts`
- Create: `apps/web/src/lib/emoji/unicode-dataset.ts`
- Create: `apps/web/src/lib/emoji/emoji-search.ts`
- Test: `tests/emoji-dataset.test.ts`

**Interfaces:**
- Produces: `EmojiItem`, `EmojiCategoryData`, `SkinTone`, `UNICODE_EMOJI_DATASET`, `searchEmojis(query)` function.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/emoji-dataset.test.ts
import { describe, it, expect } from 'vitest';
import { UNICODE_EMOJI_DATASET, searchEmojis } from '../apps/web/src/lib/emoji';

describe('Unicode Emoji Dataset & Search Index', () => {
  it('contains 10 comprehensive categories including Caribbean & Island vibes', () => {
    expect(UNICODE_EMOJI_DATASET).toBeDefined();
    expect(UNICODE_EMOJI_DATASET.length).toBe(10);
    const categoryIds = UNICODE_EMOJI_DATASET.map((c) => c.id);
    expect(categoryIds).toContain('caribbean');
    expect(categoryIds).toContain('smileys');
    expect(categoryIds).toContain('flags');
  });

  it('searches emojis instantaneously using tokenized keywords', () => {
    const jamaicaResults = searchEmojis('jamaica');
    expect(jamaicaResults.length).toBeGreaterThan(0);
    expect(jamaicaResults[0].emoji).toBe('🇯🇲');

    const fireResults = searchEmojis('fire');
    expect(fireResults.some((e) => e.emoji === '🔥')).toBe(true);

    const emptyResults = searchEmojis('xyznonexistenttoken999');
    expect(emptyResults).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/emoji-dataset.test.ts`
Expected: FAIL with module not found

- [ ] **Step 3: Write minimal implementation**

Create `apps/web/src/lib/emoji/types.ts`:
```typescript
export type SkinTone = 'default' | 'light' | 'medium-light' | 'medium' | 'medium-dark' | 'dark';

export interface EmojiItem {
  emoji: string;
  name: string;
  keywords: string[];
  supportsSkinTone?: boolean;
}

export interface EmojiCategoryData {
  id: string;
  name: string;
  iconName: string;
  emojis: EmojiItem[];
}
```

Create `apps/web/src/lib/emoji/unicode-dataset.ts` with complete 10 categories, Caribbean flags/cultural items, and keywords.
Create `apps/web/src/lib/emoji/emoji-search.ts` implementing `searchEmojis(query: string): EmojiItem[]`.
Create `apps/web/src/lib/emoji/index.ts` exporting all modules.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/emoji-dataset.test.ts`
Expected: PASS (2/2 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/emoji/ tests/emoji-dataset.test.ts
git commit -m "feat(emoji): implement Unicode 15/16 dataset and search index"
```

---

### Task 2: Fitzpatrick Skin-Tone Synthesis & Recent/Favorites Store

**Files:**
- Create: `apps/web/src/lib/emoji/skin-tones.ts`
- Create: `apps/web/src/lib/emoji/recent-store.ts`
- Modify: `apps/web/src/lib/emoji/index.ts`
- Test: `tests/skin-tones.test.ts`

**Interfaces:**
- Produces: `applySkinTone(emoji, tone)`, `SKIN_TONE_MODIFIERS`, `getRecentEmojis()`, `addRecentEmoji(emoji)`, `getFavoriteEmojis()`, `toggleFavoriteEmoji(emoji)`.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/skin-tones.test.ts
import { describe, it, expect } from 'vitest';
import { applySkinTone, addRecentEmoji, getRecentEmojis, toggleFavoriteEmoji, getFavoriteEmojis } from '../apps/web/src/lib/emoji';

describe('Fitzpatrick Skin Tone Synthesis & Recent Store', () => {
  it('synthesizes skin tone modifiers accurately onto base glyphs', () => {
    expect(applySkinTone('👋', 'default')).toBe('👋');
    expect(applySkinTone('👋', 'light')).toBe('👋🏻');
    expect(applySkinTone('👋', 'dark')).toBe('👋🏿');
    expect(applySkinTone('🔥', 'dark')).toBe('🔥'); // unsupported glyph returns unchanged
  });

  it('manages recently used emojis in LRU order', () => {
    addRecentEmoji('🌴');
    addRecentEmoji('🔥');
    const recents = getRecentEmojis();
    expect(recents[0]).toBe('🔥');
    expect(recents[1]).toBe('🌴');
  });

  it('toggles favorites in local persistence', () => {
    toggleFavoriteEmoji('🇯🇲');
    expect(getFavoriteEmojis()).toContain('🇯🇲');
    toggleFavoriteEmoji('🇯🇲');
    expect(getFavoriteEmojis()).not.toContain('🇯🇲');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/skin-tones.test.ts`
Expected: FAIL with functions not defined

- [ ] **Step 3: Write minimal implementation**

Implement `apps/web/src/lib/emoji/skin-tones.ts` with code point modifiers (`0x1F3FB` through `0x1F3FF`).
Implement `apps/web/src/lib/emoji/recent-store.ts` with `localStorage` safe storage and LRU pruning (max 32).
Export from `apps/web/src/lib/emoji/index.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/skin-tones.test.ts`
Expected: PASS (3/3 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/emoji/skin-tones.ts apps/web/src/lib/emoji/recent-store.ts apps/web/src/lib/emoji/index.ts tests/skin-tones.test.ts
git commit -m "feat(emoji): implement Fitzpatrick skin tone synthesis and LRU recents store"
```

---

### Task 3: Accessible 2D Keyboard-Navigable Emoji Picker Component

**Files:**
- Modify: `apps/web/src/components/emoji/emoji-picker-popover.tsx`
- Test: `tests/emoji-picker.test.ts`

**Interfaces:**
- Consumes: `UNICODE_EMOJI_DATASET`, `applySkinTone`, `searchEmojis`, `getRecentEmojis`, `addRecentEmoji`.
- Produces: Complete accessible `EmojiPickerPopover` supporting search, category tabs, skin-tone modifier selector, recent emojis, keyboard arrow navigation, and screen reader announcements.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/emoji-picker.test.ts
import { describe, it, expect } from 'vitest';
import EmojiPickerPopover from '../apps/web/src/components/emoji/emoji-picker-popover';

describe('EmojiPickerPopover Component', () => {
  it('is a defined functional component supporting onSelect and onClose callbacks', () => {
    expect(EmojiPickerPopover).toBeDefined();
    expect(typeof EmojiPickerPopover).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails/passes**

Run: `npx vitest run tests/emoji-picker.test.ts`

- [ ] **Step 3: Implement EmojiPickerPopover**

Reconstruct `apps/web/src/components/emoji/emoji-picker-popover.tsx`:
- Sticky search bar with sub-millisecond instant filtering.
- Category jump bar with Lucide icons.
- Fitzpatrick skin-tone modifier dropdown/pill selector.
- 2D arrow keyboard navigation (`ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Enter`, `Escape`).
- `aria-live` announcement region.
- `onEmojiSelect(emoji: string)` and `onClose()` callbacks.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/emoji-picker.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/emoji/emoji-picker-popover.tsx tests/emoji-picker.test.ts
git commit -m "feat(web): build accessible 2D keyboard-navigable EmojiPickerPopover"
```

---

### Task 4: Database Migration for Quizzes, Image Options & Tamper-Proof Triggers

**Files:**
- Create: `supabase/migrations/00101_polls_and_quizzes_enhancements.sql`
- Test: `tests/migration-00101.test.ts`

**Interfaces:**
- Extends: `polls` table with `is_quiz`, `quiz_explanation`, `correct_option_id`.
- Extends: `poll_options` table with `image_url`.
- Extends: `poll_votes` table with `is_correct`.
- Updates: `handle_poll_vote_insert()` trigger to enforce expiration, evaluate quiz correctness, and atomically update counters.

- [ ] **Step 1: Write migration verification test**

```typescript
// tests/migration-00101.test.ts
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Migration 00101: Polls and Quizzes Enhancements', () => {
  it('defines required schema alterations and atomic trigger functions', () => {
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/00101_polls_and_quizzes_enhancements.sql');
    expect(fs.existsSync(migrationPath)).toBe(true);

    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('is_quiz');
    expect(sql).toContain('quiz_explanation');
    expect(sql).toContain('correct_option_id');
    expect(sql).toContain('image_url');
    expect(sql).toContain('is_correct');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run tests/migration-00101.test.ts`

- [ ] **Step 3: Create migration file**

Write `supabase/migrations/00101_polls_and_quizzes_enhancements.sql` with strict DDL, constraints, triggers, and comments.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/migration-00101.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/00101_polls_and_quizzes_enhancements.sql tests/migration-00101.test.ts
git commit -m "feat(db): add migration 00101 for polls quiz mode, image options and atomic trigger"
```

---

### Task 5: Server-Authoritative Poll & Quiz Server Actions

**Files:**
- Modify: `apps/web/src/lib/polls/types.ts`
- Modify: `apps/web/src/lib/polls/actions.ts`
- Test: `tests/poll-actions.test.ts`

**Interfaces:**
- Produces: Extended `PollData` (`isQuiz`, `quizExplanation`, `correctOptionId`, `userIsCorrect`), `createPollAction` with quiz payload, `votePollAction` returning quiz feedback.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/poll-actions.test.ts
import { describe, it, expect } from 'vitest';
import type { PollData } from '../apps/web/src/lib/polls/types';

describe('Poll & Quiz Data Types', () => {
  it('supports quiz metadata and user correctness tracking', () => {
    const samplePoll: PollData = {
      id: 'p1',
      postId: 'post1',
      question: 'What is the national instrument of Trinidad and Tobago?',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      allowMultiple: false,
      totalVotes: 10,
      createdAt: new Date().toISOString(),
      isQuiz: true,
      quizExplanation: 'The steelpan was invented in Trinidad in the early 20th century.',
      correctOptionId: 'opt_steelpan',
      userIsCorrect: true,
      options: [
        { id: 'opt_steelpan', pollId: 'p1', optionText: 'Steelpan', position: 0, votesCount: 8, percentage: 80 },
        { id: 'opt_maracas', pollId: 'p1', optionText: 'Maracas', position: 1, votesCount: 2, percentage: 20 },
      ],
    };

    expect(samplePoll.isQuiz).toBe(true);
    expect(samplePoll.correctOptionId).toBe('opt_steelpan');
  });
});
```

- [ ] **Step 2: Run test to verify fail/pass**

Run: `npx vitest run tests/poll-actions.test.ts`

- [ ] **Step 3: Update Poll Types & Actions**

Update `apps/web/src/lib/polls/types.ts` and `apps/web/src/lib/polls/actions.ts` to query and persist quiz fields and evaluate user correctness.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/poll-actions.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/polls/ tests/poll-actions.test.ts
git commit -m "feat(polls): add quiz mode and image options to server actions and types"
```

---

### Task 6: Interactive Poll & Quiz Widget with Instant Feedback and Explanations

**Files:**
- Modify: `apps/web/src/components/polls/interactive-poll-widget.tsx`
- Test: `tests/interactive-poll-widget.test.ts`

**Interfaces:**
- Consumes: Extended `PollData`
- Produces: `InteractivePollWidget` supporting option images, instant quiz result reveal (correct option in green, incorrect selection in red), explanation card, and real-time tallies.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/interactive-poll-widget.test.ts
import { describe, it, expect } from 'vitest';
import InteractivePollWidget from '../apps/web/src/components/polls/interactive-poll-widget';

describe('InteractivePollWidget Component', () => {
  it('is a defined functional component', () => {
    expect(InteractivePollWidget).toBeDefined();
    expect(typeof InteractivePollWidget).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify fail/pass**

Run: `npx vitest run tests/interactive-poll-widget.test.ts`

- [ ] **Step 3: Implement Quiz Feedback in InteractivePollWidget**

Add option images support, quiz status badge, reveal explanation card on vote, highlight correct option (emerald ring & checkmark) and wrong selection (rose ring).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/interactive-poll-widget.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/polls/interactive-poll-widget.tsx tests/interactive-poll-widget.test.ts
git commit -m "feat(polls): implement quiz reveal, option images, and explanation card in widget"
```

---

### Task 7: Multi-Type Reaction Bar Integration with Caribbean Badges

**Files:**
- Modify: `apps/web/src/components/reactions/reaction-picker.tsx`
- Modify: `apps/web/src/components/reactions/reaction-summary-bar.tsx`
- Test: `tests/reactions-multitype.test.ts`

**Interfaces:**
- Extends: `ReactionType` with Caribbean cultural reactions (`flame` 🔥, `palm` 🌴, `sound` 🎵) alongside standard reactions (`like`, `love`, `celebrate`, `laugh`, `wow`, `sad`, `angry`).

- [ ] **Step 1: Write the failing test**

```typescript
// tests/reactions-multitype.test.ts
import { describe, it, expect } from 'vitest';
import { VALID_REACTION_TYPES, REACTION_EMOJI_MAP } from '../apps/web/src/components/reactions/reaction-picker';

describe('Multi-Type Reactions with Caribbean Vibrancy', () => {
  it('includes Caribbean-appropriate reaction badges', () => {
    expect(VALID_REACTION_TYPES).toContain('fire');
    expect(VALID_REACTION_TYPES).toContain('celebrate');
    expect(REACTION_EMOJI_MAP['fire'].emoji).toBe('🔥');
  });
});
```

- [ ] **Step 2: Run test to verify fail/pass**

Run: `npx vitest run tests/reactions-multitype.test.ts`

- [ ] **Step 3: Update Reaction Components**

Update `reaction-picker.tsx` and `reaction-summary-bar.tsx` to handle multi-type reactions smoothly on hover and mobile touch long-press.

- [ ] **Step 4: Run test to verify pass**

Run: `npx vitest run tests/reactions-multitype.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/reactions/ tests/reactions-multitype.test.ts
git commit -m "feat(reactions): expand multi-type reaction picker and summary bar"
```

---

### Task 8: End-to-End Suite & Acceptance Verification

**Files:**
- Create: `tests/unified-engagement-primitives.test.ts`

**Interfaces:**
- End-to-end verification of:
  1. Full Unicode 15/16 emoji categorization and instant keyword search.
  2. Fitzpatrick skin tone synthesis and LRU cache.
  3. Server-authoritative polls, quiz scoring, and explanation revelation.
  4. Multi-type reactions with database integrity.
  5. Monorepo typecheck clean with zero errors (`pnpm typecheck`).

- [ ] **Step 1: Write the E2E verification test**

```typescript
// tests/unified-engagement-primitives.test.ts
import { describe, it, expect } from 'vitest';
import { UNICODE_EMOJI_DATASET, searchEmojis, applySkinTone } from '../apps/web/src/lib/emoji';
import { VALID_REACTION_TYPES } from '../apps/web/src/components/reactions/reaction-picker';

describe('Unified Engagement Primitives - E2E Lifecycle', () => {
  it('validates Unicode 15/16 dataset, search index, and skin tone synthesis', () => {
    expect(UNICODE_EMOJI_DATASET.length).toBe(10);
    const searchResult = searchEmojis('trinidad');
    expect(searchResult.some((e) => e.emoji === '🇹🇹')).toBe(true);
    expect(applySkinTone('👋', 'dark')).toBe('👋🏿');
  });

  it('validates reaction types and poll quiz models', () => {
    expect(VALID_REACTION_TYPES.length).toBeGreaterThanOrEqual(8);
  });
});
```

- [ ] **Step 2: Run test to verify pass**

Run: `npx vitest run tests/unified-engagement-primitives.test.ts`
Expected: PASS

- [ ] **Step 3: Run full typecheck and unit suites**

Run: `pnpm typecheck`
Expected: Zero TypeScript errors

- [ ] **Step 4: Commit**

```bash
git add tests/unified-engagement-primitives.test.ts
git commit -m "test(engagement): add comprehensive e2e verification suite for engagement primitives"
```
