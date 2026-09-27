# TUKUBI Engagement & Interaction Primitives Specification
## Sub-Project 2: Unicode 15/16 Emoji Engine & Server-Authoritative Poll/Quiz System

## 1. Overview & Objective
This specification establishes the **TUKUBI Engagement & Interaction Primitives** (Sub-Project 2 of the 100% Production Maturity Master Plan).

It delivers:
1. A **Production-Grade Unicode 15/16 Emoji & Multi-Type Reaction Engine**:
   - Comprehensive Unicode dataset across 10 standard categories plus an authentic Caribbean & Diaspora collection.
   - Dynamic Fitzpatrick skin-tone modifier synthesis (Light to Dark) and gender variant sequences.
   - High-throughput tokenized keyword search index (<1ms latency).
   - LocalStorage LRU caching for recently used emojis and favorites.
   - WCAG 2.2 AA keyboard navigation and screen reader live region announcements.
   - Multi-type reaction bar (`like`, `love`, `fire`, `celebrate`, `laugh`, `wow`, `sad`, `angry`, `palm`, `sound`) backed by database persistence and counters.
2. A **Server-Authoritative Interactive Poll & Quiz Engine**:
   - Single-choice and multi-choice voting.
   - Image attachment support per option.
   - Interactive Quiz mode with server-evaluated correctness, explanation revelation, and scoring.
   - Tamper-proof Postgres triggers and RLS enforcing one-vote-per-user and blocking post-expiration submissions.
   - Real-time tally updates, leader highlights, and creator result visibility controls.

---

## 2. Architecture & File Structure

```
apps/web/src/lib/emoji/
├── types.ts                     # Emoji, category, skin tone, and search interfaces
├── unicode-dataset.ts           # Complete Unicode 15/16 categorized dataset
├── skin-tones.ts                # Fitzpatrick modifiers and emoji synthesis engine
├── emoji-search.ts              # Inverted token index for sub-millisecond lookups
├── recent-store.ts              # LocalStorage LRU cache for recent and favorite emojis
└── index.ts                     # Barrel exports

apps/web/src/components/emoji/
├── emoji-picker-popover.tsx     # Full accessible emoji picker popover component
└── message-reaction-bar.tsx     # Interactive message reaction strip

apps/web/src/components/reactions/
├── reaction-picker.tsx          # Multi-type hover/long-press reaction picker
└── reaction-summary-bar.tsx     # Grouped reaction counts and active user states

supabase/migrations/
└── 00101_polls_and_quizzes_enhancements.sql # Schema extensions for quiz mode, images, and triggers

apps/web/src/lib/polls/
├── types.ts                     # Extended PollData, Quiz fields, and Vote results
└── actions.ts                   # createPollAction and votePollAction with quiz evaluation

apps/web/src/components/polls/
└── interactive-poll-widget.tsx  # Interactive widget with quiz feedback, image options, and tallies
```

---

## 3. Detailed Component Specifications

### 3.1 Unicode 15/16 Emoji Engine

#### 3.1.1 Dataset & Categories
10 distinct categories:
1. `caribbean`: Curated Caribbean flags (30+ territories), palm, hibiscus, steelpan, drum, tropical fauna, sunset.
2. `smileys`: Full Unicode smiley and expression set.
3. `people`: Body parts, gestures, people, professions, and families.
4. `nature`: Animals, mammals, marine life, birds, plants, weather.
5. `food`: Fruits, vegetables, meals, snacks, tropical beverages.
6. `travel`: Vehicles, boats, aircraft, island topography, buildings.
7. `activities`: Sports, games, music instruments, performing arts.
8. `objects`: Media gear, stationery, tools, musical audio equipment.
9. `symbols`: Badges, punctuation, zodiac, geometric shapes, religious symbols.
10. `flags`: Global national and regional flags.

#### 3.1.2 Fitzpatrick Skin-Tone Modifiers
* Supports 6 tones:
  - Default: Unmodified base emoji (e.g. 👋)
  - Light (`1F3FB`): 👋🏻
  - Medium-Light (`1F3FC`): 👋🏼
  - Medium (`1F3FD`): 👋🏽
  - Medium-Dark (`1F3FE`): 👋🏾
  - Dark (`1F3FF`): 👋🏿
* Modifiable emoji synthesis: Automatically concatenates the appropriate code point modifier when a user selects a preferred skin tone.

#### 3.1.3 Keyword Search Index
* Generates an inverted index mapping tokens and common synonyms (e.g., "trinidad" -> 🇹🇹, "fire" -> 🔥, "reggae" -> 🥁, "heart" -> ❤️).
* Performs case-insensitive prefix and substring matching returning matching emojis in <1ms.

#### 3.1.4 Accessibility & Keyboard Navigation
* Full 2D arrow key navigation (`ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`) with wrap-around and row indexing.
* `Enter` selects active emoji; `Escape` closes popover; `Tab` moves between search input, category headers, skin-tone bar, and grid.
* Active focused emoji name announced via `aria-live="polite"`.

---

### 3.2 Server-Authoritative Poll & Quiz Engine

#### 3.2.1 Database Extensions (`00101_polls_and_quizzes_enhancements.sql`)
```sql
ALTER TABLE public.polls
    ADD COLUMN IF NOT EXISTS is_quiz BOOLEAN DEFAULT false NOT NULL,
    ADD COLUMN IF NOT EXISTS quiz_explanation TEXT,
    ADD COLUMN IF NOT EXISTS correct_option_id UUID;

ALTER TABLE public.poll_options
    ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE public.poll_votes
    ADD COLUMN IF NOT EXISTS is_correct BOOLEAN;
```

#### 3.2.2 Tamper-Proof Trigger & RLS
* Trigger `handle_poll_vote_insert()`:
  - Rejects vote if `expires_at <= now()`.
  - Sets `NEW.is_correct = (NEW.option_id = poll.correct_option_id)` when `poll.is_quiz = true`.
  - Atomically increments `poll_options.votes_count` and `polls.total_votes`.
  - RLS enforces `auth.uid() = user_id` and unique `(poll_id, user_id)` constraint.

#### 3.2.3 Quiz Feedback UX
* If `poll.is_quiz === true`:
  - After user votes, highlights the correct option in vivid green.
  - If the user selected an incorrect option, highlights their choice in red.
  - Reveals the creator's educational explanation card with smooth transition.

---

## 4. Verification & Testing Matrix
1. **Emoji Unit Tests (`tests/emoji-engine.test.ts`)**:
   - Unicode categories coverage.
   - Fitzpatrick skin tone synthesis across modifiers.
   - Keyword search speed and query matching.
   - Recent items LRU storage and persistence.
2. **Poll & Quiz Unit Tests (`tests/polls-and-quizzes.test.ts`)**:
   - Single-choice and multi-choice constraints.
   - Post-expiration vote rejection.
   - Quiz correctness evaluation and explanation revelation.
   - Image option rendering.
3. **Monorepo Integration**:
   - Zero TypeScript errors (`pnpm typecheck`).
   - Clean keyboard navigation in Playwright/Vitest.
