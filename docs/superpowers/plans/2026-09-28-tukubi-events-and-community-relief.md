# TUKUBI Events & Community Relief Lifecycle Implementation Plan
## Sub-Project 4: Hybrid/Physical/Online Events, RSVP State Transitions, Relief Campaigns, Disaster Verification & Atomic Donation Ledger

> **Mandate**: 100% production-ready, zero mock data, zero dead user-facing controls, complete database/RLS enforcement, and cross-platform convergence.

---

### Task 1: Database Migration 00103 for Events Extensions, Relief Campaigns, Donations & Atomic Increment Trigger
- **Files**:
  - `supabase/migrations/00103_events_and_community_relief.sql`
  - `tests/migration-00103.test.ts`
- **Scope**:
  - Extend `events`: `privacy` (`public`, `community_only`, `invite_only`), `livestream_url`, `cover_image_url`, `tags TEXT[]`, `is_featured`, GIN index on `tags`, index on `privacy`.
  - Extend `event_attendees`: `guest_count`, `check_in_code`, `checked_in`, `checked_in_at`.
  - Create `relief_campaigns`: categories (`hurricane_relief`, `flood_disaster`, `medical_aid`, `community_rebuild`, `education`, `cultural_heritage`), `goal_minor`, `raised_minor`, `verification_status`, `disaster_declaration_ref`, `supporting_evidence_urls`, `disbursement_status`, indexes.
  - Create `relief_donations`: `campaign_id`, `donor_id`, `amount_minor`, `is_anonymous`, `donor_name`, `donor_message`, `idempotency_key`.
  - Trigger function `handle_relief_donation_insert()`: Validates target campaign active & verified, atomically increments `raised_minor` and `donations_count`.
  - RLS policies on all tables with explicit security rules and cached `(SELECT auth.uid())`.
- **Verification**: `npx vitest run tests/migration-00103.test.ts`.

---

### Task 2: Events & Community Relief Domain Primitives & Types
- **Files**:
  - `apps/web/src/lib/events/types.ts`
  - `apps/web/src/lib/relief/types.ts`
  - `tests/events-relief-primitives.test.ts`
- **Scope**:
  - Event types: `EventKind`, `EventPrivacy`, `RSVPStatus`, `LiveEventItem`, RSVP transition validation.
  - Relief types: `ReliefCategory`, `ReliefVerificationStatus`, `DisbursementStatus`, `ReliefCampaign`, `ReliefDonation`.
  - Constants: `RELIEF_CATEGORY_METADATA` with Caribbean disaster protocols (CDEMA, ODPEM, NEMO), territory metadata.
  - Helper functions: `calculateCampaignProgress`, `formatDonationAmount`, `validateCampaignGoal`, `validateDonationAmount`.
- **Verification**: `npx vitest run tests/events-relief-primitives.test.ts`.

---

### Task 3: Server Actions for Events & Relief Campaigns
- **Files**:
  - `apps/web/src/lib/events/actions.ts`
  - `apps/web/src/lib/relief/actions.ts`
  - `tests/events-relief-actions.test.ts`
- **Scope**:
  - Enhance `createEventAction`, `rsvpAction`, `updateEventAction`, `cancelEventAction` with privacy and guest count support.
  - Implement `createReliefCampaignAction`: Creates campaign with disaster reference and evidence URLs.
  - Implement `donateToReliefCampaignAction`: Validates donation, records donation with idempotency key, triggers atomic campaign tally update.
  - Implement `fetchReliefCampaignAction`: Queries campaign with donor summary and verification details.
- **Verification**: `npx vitest run tests/events-relief-actions.test.ts`.

---

### Task 4: Interactive Event Card & RSVP Management Component
- **Files**:
  - `apps/web/src/components/events/interactive-event-card.tsx`
  - `tests/interactive-event-card.test.ts`
- **Scope**:
  - Build `InteractiveEventCard` with Caribbean calendar chip, format badge, privacy indicator, capacity progress bar, and instant RSVP toggle button group.
  - Optimistic RSVP updates with immediate visual feedback.
  - Accessible touch targets $\ge 44 \times 44\text{ px}$ and ARIA status attributes.
- **Verification**: `npx vitest run tests/interactive-event-card.test.ts`.

---

### Task 5: Relief Campaign Card & Donation Modal Components
- **Files**:
  - `apps/web/src/components/relief/relief-campaign-card.tsx`
  - `apps/web/src/components/relief/relief-donation-modal.tsx`
  - `tests/relief-components.test.ts`
- **Scope**:
  - Build `ReliefCampaignCard` with category icon, territory flag, Verified Trust Shield badge, progress bar, donor counter, and donate button.
  - Build `ReliefDonationModal` with preset donation chips (`$10`, `$25`, `$50`, `$100`, `$250`), custom amount entry, anonymous toggle, donor message, zero-fee guarantee notice, and instant submission.
- **Verification**: `npx vitest run tests/relief-components.test.ts`.

---

### Task 6: Wire Event & Relief Panels into UniversalComposer
- **Files**:
  - `apps/web/src/components/events/event-composer-panel.tsx`
  - `apps/web/src/components/relief/relief-composer-panel.tsx`
  - `apps/web/src/components/universal-composer.tsx`
  - `tests/composer-events-relief.test.ts`
- **Scope**:
  - Build `EventComposerPanel`: Structured inputs for Title, Starts At, Format, Venue / Livestream URL, Privacy, and Capacity.
  - Build `ReliefComposerPanel`: Structured inputs for Title, Category, Goal, Target Island Territory, Disaster Reference, and Evidence URLs.
  - Wire into `UniversalComposer` replacing text-only inputs in `'event'` and `'fundraiser'` modes.
  - On post publication, creates the event or relief campaign and binds the reference to the post.
- **Verification**: `npx vitest run tests/composer-events-relief.test.ts` and `pnpm --filter caribbean-web typecheck`.

---

### Task 7: Dedicated Community Relief Hub Page
- **Files**:
  - `apps/web/src/app/relief/page.tsx`
  - `tests/relief-hub-page.test.ts`
- **Scope**:
  - Build full-featured Relief Hub route (`/relief`):
    - Category filtering (All, Hurricane Relief, Flooding, Medical Aid, Community Rebuild).
    - Territory selector (Jamaica, Dominica, Grenada, Saint Lucia, etc.).
    - Search bar over relief campaigns.
    - Trust & Safety banner explaining CDEMA disaster verification & 0% platform fee guarantee.
    - Grid of `ReliefCampaignCard` components with live donation modals.
    - Quick "Launch Relief Fundraiser" action opening the creation wizard.
- **Verification**: `npx vitest run tests/relief-hub-page.test.ts`.

---

### Task 8: End-to-End Suite & Acceptance Verification for Sub-Project 4
- **Files**:
  - `tests/unified-events-and-relief.test.ts`
- **Scope**:
  - Comprehensive e2e integration testing covering migration 00103, event RSVP lifecycle, relief campaign creation, atomic donation trigger, composer integration, and relief hub.
  - Run all 8 Sub-Project 4 Vitest suites.
  - Validate monorepo typecheck (31 packages, 0 errors).
- **Verification**: `npx vitest run tests/unified-events-and-relief.test.ts` and `pnpm typecheck`.
