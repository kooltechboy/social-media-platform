# Sub-Project 4: Community Relief, Events & Groups — Design Specification

**Author:** Antigravity Engineering Agent  
**Date:** 2026-11-07  
**Branch:** `feature/live-core-feed-and-composer`  
**Status:** Approved for Implementation

---

## 1. Overview

Sub-Project 4 completes the **Caribbean Communities & Groups**, **Events & Fetes**, and **Disaster Relief & Mutual Aid** surfaces with 100% live data, hardened database triggers, and verifiable unit tests. It eliminates all mutable balance increments (replacing with server-side Postgres triggers) and closes the final integration gaps between UI components and live Supabase queries.

---

## 2. Domains

### 2.1 Caribbean Communities Hub (Facebook Groups core)
- **Join / Leave flow** — `CommunityPolicy.canJoin()` already enforced server-side ✅
- **`member_count` counter** — currently incremented mutably with `UPDATE communities SET member_count = member_count + 1`. **MUST** be replaced with a Postgres `AFTER INSERT/DELETE ON community_members` trigger that uses `SELECT count(*)` to recompute the count — no race conditions.
- **Role-based permissions** — `ROLE_CAPABILITIES` from `@caribbean/communities` enforce admin/mod/member caps ✅
- **Community creation slug** — `policy.slugify(name) + Date.now().toString(36)` — unique ✅

### 2.2 Events & Fetes (Facebook Events / Eventbrite core)
- **RSVP flow** — `rsvpAction()` with capacity enforcement and check-in code generation ✅
- **Host controls** — `updateEventAction`, `cancelEventAction`, `deleteEventAction` restricted to `host_id` ✅
- **Attendee count** — derived from `event_attendees` join (no mutable counter column) ✅
- **Cultural observances** — fetched from `cultural_observances` table with `source_verification_status = 'confirmed'` ✅

### 2.3 Disaster Relief & Mutual Aid (GoFundMe/CDEMA core)
- **Campaign creation** — `createReliefCampaignAction` with $100 minimum goal ✅
- **Donation flow** — `donateToReliefCampaignAction` with idempotency keys ✅  
- **`raised_minor` / `donations_count`** — currently NOT updated when a donation is inserted (gap!). A Postgres `AFTER INSERT ON relief_donations` trigger must recompute both atomically.
- **Anonymous donor privacy** — sanitized at fetch time ✅
- **Admin verification gate** — `verifyReliefCampaignAction` restricted to admin-role users (must add admin check) ⚠️

---

## 3. Data Integrity Contracts

| Table | Counter Column | Strategy |
|---|---|---|
| `communities` | `member_count` | Postgres trigger on `community_members` INSERT/DELETE |
| `relief_campaigns` | `raised_minor`, `donations_count` | Postgres trigger on `relief_donations` INSERT |
| `events` | (derived from join) | No counter column — always aggregate from `event_attendees` |

---

## 4. Zero-Mock Discipline

All pages (`/communities`, `/events`, `/relief`) query live Supabase tables with:
- Server-side data fetching at page render time (RSC pattern)
- Empty-state UIs when queries return 0 rows
- No synthetic fallback arrays

---

## 5. Security Requirements

- **RLS** — All new triggers and RPCs must respect existing RLS on all accessed tables
- **Admin check** — `verifyReliefCampaignAction` must check `profiles.role = 'admin'` or `community_members.role IN ('admin', 'moderator')` before updating verification status
- **Idempotency** — `relief_donations.idempotency_key` UNIQUE constraint prevents double-donations
