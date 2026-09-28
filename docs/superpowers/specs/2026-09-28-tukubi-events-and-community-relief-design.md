# TUKUBI Events & Community Relief Lifecycle Specification
## Sub-Project 4: Hybrid/Physical/Online Events, RSVP State Transitions, Relief Campaigns, Disaster Verification & Atomic Donation Ledger

## 1. Executive Summary & Objective
This specification establishes the production architecture and implementation for **TUKUBI Events & Community Relief Lifecycle** (Sub-Project 4 of the 100% Production Maturity Master Plan).

It delivers:
1. **Full-Spectrum Caribbean Event Lifecycle Engine**:
   - In-person fetes, concerts, community gatherings, online live streams, and hybrid island festivals.
   - Multi-tier RSVP state machine (`going`, `interested`, `cancelled`) with guest count allocations, capacity caps, and check-in QR secrets.
   - Granular privacy governance (`public`, `community_only`, `invite_only`) backed by strict Row Level Security.
2. **Community Disaster Relief & Mutual Aid Ecosystem**:
   - Verified Caribbean relief campaigns (hurricane relief, flood disasters, medical emergencies, community rebuilds, cultural heritage preservation).
   - Authoritative verification workflow with disaster declaration references (CDEMA, ODPEM, NEMO) and supporting evidence audit trails.
   - Zero-platform-fee mutual aid guarantee ensuring 100% of donor relief funds reach local communities.
3. **Atomic Donation Ledger & Anti-Tamper Triggers**:
   - Transactional donation pipeline in `relief_donations` backed by PostgreSQL `BEFORE INSERT` / `AFTER INSERT` triggers.
   - Real-time tally updates (`raised_minor`, `donations_count`), preventing donations to unverified, cancelled, or expired relief funds.
4. **Interactive UI Primitives & Composer Convergence**:
   - `InteractiveEventCard`: Island calendar chip, event format badge, capacity progress bar, and instant RSVP toggle.
   - `ReliefCampaignCard` & `ReliefDonationModal`: Transparent goal tracking, donor wall, and preset/custom donation flow.
   - Universal Composer integration: Native Event Creation and Relief Fundraiser launch panels embedded directly into `UniversalComposer`.

---

## 2. Architecture & File Structure

```
supabase/migrations/
└── 00103_events_and_community_relief.sql        # Migration: relief_campaigns, relief_donations, events extensions, triggers & RLS

apps/web/src/lib/events/
├── types.ts                                     # EventKind, EventPrivacy, EventItem, RSVPStatus
└── actions.ts                                   # createEventAction, rsvpAction, cancelEventAction, updateEventAction

apps/web/src/lib/relief/
├── types.ts                                     # ReliefCategory, VerificationStatus, DisbursementStatus, ReliefCampaign
└── actions.ts                                   # createReliefCampaignAction, donateToReliefCampaignAction, verifyReliefCampaignAction

apps/web/src/components/events/
├── interactive-event-card.tsx                   # Event presentation card with RSVP toggle, capacity bar & countdown
└── event-composer-panel.tsx                     # Event creation panel integrated into UniversalComposer

apps/web/src/components/relief/
├── relief-campaign-card.tsx                     # Verified campaign card with progress bar, trust badges & donor counts
├── relief-donation-modal.tsx                    # 1-Click donation modal with preset chips & zero-fee guarantee
└── relief-composer-panel.tsx                    # Relief campaign launch panel for UniversalComposer

apps/web/src/components/universal-composer.tsx    # Convergence: wire native event & relief panels
apps/web/src/app/relief/
├── page.tsx                                     # Community Relief & Disaster Mutual Aid hub
└── [id]/page.tsx                                # Individual campaign page with audit logs and donor wall
```

---

## 3. Database Schema & Migration (`00103`)

### 3.1 Extensions to `public.events`
- `privacy VARCHAR(20) DEFAULT 'public' CHECK (privacy IN ('public', 'community_only', 'invite_only')) NOT NULL`
- `cover_image_url TEXT`
- `livestream_url TEXT`
- `tags TEXT[] DEFAULT '{}'::text[] NOT NULL`
- `is_featured BOOLEAN DEFAULT false NOT NULL`
- `cancelled_at TIMESTAMPTZ`
- Indexes:
  - `CREATE INDEX IF NOT EXISTS idx_events_privacy ON public.events(privacy, starts_at);`
  - `CREATE INDEX IF NOT EXISTS idx_events_tags ON public.events USING gin (tags);`

### 3.2 Extensions to `public.event_attendees`
- `guest_count INTEGER DEFAULT 1 CHECK (guest_count >= 1 AND guest_count <= 10) NOT NULL`
- `check_in_code VARCHAR(32) DEFAULT substr(md5(random()::text), 1, 12)`
- `checked_in BOOLEAN DEFAULT false NOT NULL`
- `checked_in_at TIMESTAMPTZ`

### 3.3 New Table: `public.relief_campaigns`
```sql
CREATE TABLE IF NOT EXISTS public.relief_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(32) CHECK (category IN (
        'hurricane_relief', 'flood_disaster', 'medical_aid', 
        'community_rebuild', 'education', 'cultural_heritage'
    )) NOT NULL,
    target_country_iso VARCHAR(3) REFERENCES public.countries(iso_code),
    target_city_id UUID REFERENCES public.cities(id),
    goal_minor INTEGER CHECK (goal_minor > 0) NOT NULL,
    raised_minor INTEGER DEFAULT 0 CHECK (raised_minor >= 0) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')) NOT NULL,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    disaster_declaration_ref TEXT,
    supporting_evidence_urls TEXT[] DEFAULT '{}'::text[] NOT NULL,
    cover_image_url TEXT,
    disbursement_status VARCHAR(20) DEFAULT 'locked' CHECK (disbursement_status IN ('locked', 'verified_ready', 'disbursed')) NOT NULL,
    deadline_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true NOT NULL,
    donations_count INTEGER DEFAULT 0 CHECK (donations_count >= 0) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_relief_campaigns_category ON public.relief_campaigns(category);
CREATE INDEX IF NOT EXISTS idx_relief_campaigns_country ON public.relief_campaigns(target_country_iso);
CREATE INDEX IF NOT EXISTS idx_relief_campaigns_verification ON public.relief_campaigns(verification_status, is_active);
```

### 3.4 New Table: `public.relief_donations`
```sql
CREATE TABLE IF NOT EXISTS public.relief_donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.relief_campaigns(id) ON DELETE CASCADE NOT NULL,
    donor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    amount_minor INTEGER CHECK (amount_minor > 0) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    is_anonymous BOOLEAN DEFAULT false NOT NULL,
    donor_name TEXT,
    donor_message TEXT,
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_relief_donations_campaign ON public.relief_donations(campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_relief_donations_donor ON public.relief_donations(donor_id);
```

### 3.5 Atomic Trigger & Validation Function: `handle_relief_donation_insert()`
- Executed `BEFORE INSERT ON public.relief_donations`.
- Validates target campaign:
  - Must exist and be active (`is_active = true`).
  - Must be verified (`verification_status = 'verified'`) or allow creator donations in testing.
  - Must not be past `deadline_at` (if deadline is set).
- Atomically increments `raised_minor` and `donations_count` on `public.relief_campaigns`.
- Sets `donor_name = 'Anonymous Supporter'` when `is_anonymous = true`.

### 3.6 Row Level Security (RLS)
- Public read access for active published events and verified relief campaigns.
- Creators can view and edit their own pending campaigns and events.
- Donors can view their own non-anonymous donations; community members view public donor feed.

---

## 4. Component Details & UX Specifications

### 4.1 Interactive Event Card (`interactive-event-card.tsx`)
- Displays start date with authentic Caribbean calendar chip (Month + Day).
- Format badge (`In-Person 🌴`, `Live Stream 📹`, `Hybrid ⚡`).
- Privacy badge (`Public`, `Community Only 🔒`).
- Real-time RSVP button group (`Going`, `Interested`, `Can't Go`) with optimistic state updates.
- Capacity indicator showing attendance vs maximum capacity.

### 4.2 Relief Campaign Card (`relief-campaign-card.tsx`)
- Category badge with icon (e.g. `🌀 Hurricane Relief`, `🏥 Medical Aid`).
- Caribbean territory flag and target area (e.g. `🇯🇲 Saint Elizabeth Parish, Jamaica`).
- Verified Disaster Response Trust Shield (showing official declaration reference, e.g. `CDEMA-2026-HURR`).
- Progress bar displaying percentage towards goal, formatted amounts (`$24,500 / $50,000 USD`), and donor count.
- Direct "Donate" action opening the donation modal.

### 4.3 Relief Donation Modal (`relief-donation-modal.tsx`)
- Preset donation buttons (`$10`, `$25`, `$50`, `$100`, `$250`) and custom amount input.
- Anonymous donation checkbox ("Keep my name and profile private").
- Optional encouragement message for the community or victims.
- Clear disclosure: "100% Guaranteed Caribbean Mutual Aid — 0% Platform Fees Deducted".
- Instant submission via `donateToReliefCampaignAction`.

### 4.4 UniversalComposer Convergence
- **Event Panel (`event-composer-panel.tsx`)**:
  - Replaces text inputs with structured fields: Title, Start Date & Time, Venue/Livestream URL, Format (In-Person / Livestream / Hybrid), Privacy (Public / Community), Capacity.
  - Automatically creates event and attaches `event_id` to post payload.
- **Relief Panel (`relief-composer-panel.tsx`)**:
  - Replaces text inputs with structured fields: Campaign Title, Category, Target Territory, Funding Goal, Disaster Declaration Reference, Supporting Evidence URL.
  - Launches campaign in pending verification status and links to post.

---

## 5. Security, Accessibility & Performance Gates

### 5.1 Security
- Double-entry ledger safety: All donations record unique idempotency keys.
- Verification gate: Disbursement is strictly `locked` until approved by verified administrators (`disbursement_status = 'verified_ready'`).
- RLS enforces `invite_only` and `community_only` event visibility boundaries.

### 5.2 Accessibility (WCAG 2.2 AA)
- Touch targets $\ge 44 \times 44\text{ px}$ on RSVP buttons, donation presets, and modal triggers.
- Progress bars contain `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`.
- Live announcements (`aria-live="polite"`) on RSVP status changes and donation confirmations.

### 5.3 Performance
- GIN indexes on event tags and B-tree indexes on campaign verification status ensure query times $<2\text{ms}$.
- Optimistic UI updates on RSVP toggles for zero-latency user feedback.

---

## 6. Acceptance Criteria
1. Migration `00103` applies cleanly with tables, extensions, indexes, triggers, and RLS policies.
2. Event RSVP state transitions operate reliably with guest counts and capacity checks.
3. Relief campaigns store disaster declaration codes, verification status, and evidence URLs.
4. Donations atomically update campaign totals and donation counts via tamper-proof trigger.
5. `UniversalComposer` seamlessly creates structured events and relief campaigns with typed handoff.
6. `InteractiveEventCard`, `ReliefCampaignCard`, and `ReliefDonationModal` meet WCAG 2.2 AA guidelines.
7. Full Vitest test suites pass and monorepo typecheck reports 0 errors.
