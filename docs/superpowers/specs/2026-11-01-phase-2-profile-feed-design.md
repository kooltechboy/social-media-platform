# TUKUBI Phase 2: Profiles, Cultural Identity & Core Feed Architecture Specification

**Document Version:** 1.0.0  
**Status:** Approved  
**Author:** Tukubi Engineering Pair  
**System:** TUKUBI — The Caribbean Connected  

---

## 1. Executive Summary & Problem Statement

Phase 2 governs the primary daily active user (DAU) experience of TUKUBI:
1. **User Profiles & Cultural Identity (`/profile/[username]`):** The official Caribbean Cultural Passport representation, verified creator identity, reputation scores, relationship status (Friends vs Follows), and content showcases (Posts, Media, Reels, Recognition, Community memberships).
2. **Core Feed & Social Discovery Engine (`/`):** The algorithmic and chronological content stream supporting 8 distinct Caribbean feed modes (`for_you`, `friends`, `following`, `pages`, `creators`, `official`, `caribbean`, `communities`), integrated with Caribbean Stories, Live broadcasts, Shoppable tags, and interactive polls.

### Reverse Engineering Audit Findings
1. **Privacy Boundary Invariant:** Rule 8 of `AGENTS.md` mandates that Caribbean location/cultural identity is optional and private by default. When a user marks their `profile_identity` as `visibility: 'private'`, non-owner profile visitors must NEVER see their origin country ISO or diaspora location. We must enforce strict server-side boundary filtering before serializing profile props.
2. **Profile File Monolith:** `apps/web/src/app/profile/[username]/page.tsx` was 1,165 lines long, conflating data fetching, relationship mutation state, and tab presentation. We need clean component modularization.
3. **Feed Hydration & Instant Tab Transitions:** Feed tab switching (`for_you` to `friends` to `creators`) must feel instant without jarring layout shifts, using pre-fetched caches and smooth view transitions.
4. **Empty States & Caribbean Polish:** Profile tabs with no content (e.g. no reels yet) need culturally vibrant, inviting empty states with actionable creator CTAs.

---

## 2. Architecture & Invariant Specifications

### 2.1 Profile Privacy & Identity Contract
```typescript
export interface SanitizedProfileIdentity {
  originCountryIso?: string | null;
  originCountryName?: string | null;
  originFlag?: string | null;
  isDiaspora?: boolean;
  diasporaCountryIso?: string | null;
  diasporaFlag?: string | null;
  isOwnerOrPublic: boolean;
}
```
- If `viewerId !== profileId` and `profile_identity.visibility !== 'public'`, origin coordinates and flags are omitted.
- The user's bio, avatar, display name, handle, verified badge, and public posts remain visible.

### 2.2 Feed Mode Contracts & Optimization
- **`for_you`:** CaribAI weighted cultural recommendation engine combining tag affinity, recency decay, and verified creator signals.
- **`friends`:** Strict 0% algorithmic injection. Only mutual accepted friend relationships are queried.
- **`following`:** Chronological updates from followed personal, creator, and business profiles.
- **`creators`:** Filtered for verified creator accounts and audio/media posts.
- **`official`:** Pinned and platform-wide emergency/cultural announcements from `@tukubi`.

---

## 3. Modular Profile Component Architecture
- `ProfileHeader`: Cover banner, avatar with glowing Caribbean aura, verified/founder badges, relationship action buttons (Follow, Friend request, Message).
- `CulturalPassportDrawer`: Interactive expandable passport card displaying verified diaspora roots and community badges.
- `ProfileTabNavigation`: Accessible tab bar (`Posts`, `Reels`, `Media`, `Friends`, `Recognition`, `About`) with WCAG 2.2 AA keyboard navigation.
- `ProfileEmptyState`: Branded empty state with Caribbean sunrise gradients and creator prompts.

---

## 4. Verification & Testing Strategy
- Unit tests for profile privacy sanitization logic (`tests/profile-privacy.test.ts`).
- Unit tests for feed mode normalizer and ranking contracts (`tests/feed-ranking.test.ts`).
- Full monorepo typecheck verification (`pnpm typecheck`).
