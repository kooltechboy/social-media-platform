# Sub-Project 4: Community Relief, Events & Groups — Implementation Plan

**Author:** Antigravity Engineering Agent  
**Date:** 2026-11-07  
**Branch:** `feature/live-core-feed-and-composer`

---

## Implementation Steps

### Step 1 — Supabase Migration 00119
Create `supabase/migrations/00119_community_relief_counter_triggers.sql`:
- `fn_sync_community_member_count()` TRIGGER FUNCTION: on `AFTER INSERT OR DELETE ON community_members` → recompute `communities.member_count` via `SELECT count(*) WHERE membership_status = 'active'`
- `fn_sync_relief_campaign_raised()` TRIGGER FUNCTION: on `AFTER INSERT ON relief_donations` → recompute `relief_campaigns.raised_minor = SUM(amount_minor)` and `donations_count = COUNT(*)`
- RLS: triggers run as SECURITY DEFINER (bypass RLS for counter updates)
- Rollback: `DROP TRIGGER` + `DROP FUNCTION` statements

### Step 2 — Fix Mutable Increment in communities/actions.ts
- Remove `update({ member_count: community.member_count + 1 })` from `joinCommunityAction`
- Remove `update({ member_count: newCount })` from `leaveCommunityAction`
- The DB trigger now handles these atomically

### Step 3 — Add Admin Check to verifyReliefCampaignAction
- After auth check, query `profiles` for `role = 'admin'` to authorize admin-only verification

### Step 4 — Unit Tests
Create `tests/unit/community-events-relief.test.ts` covering:
- `joinCommunityAction`: success (public), pending (private), already-member, banned
- `leaveCommunityAction`: success, owner-cannot-leave
- `createCommunityAction`: valid, name-too-short, unauthenticated
- `rsvpAction`: going success, capacity-exceeded, toggle-off, invalid-guest-count
- `createEventAction`: valid, past-start-date, missing-title
- `createReliefCampaignAction`: valid, below-minimum-goal, missing-title
- `donateToReliefCampaignAction`: valid, below-minimum, missing-campaign-id
- `verifyReliefCampaignAction`: non-admin rejected

### Step 5 — Verification
- `node scripts/audit-zero-mock.js` → exit 0
- `pnpm.cmd typecheck` → 31/31 clean
- `pnpm.cmd --filter @tukubi/web vitest run tests/unit/community-events-relief.test.ts`

### Step 6 — Commit
`feat(communities-events-relief): complete Sub-Project 4 — live community hub, RSVP engine, and relief ledger triggers`
