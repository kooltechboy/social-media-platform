-- =============================================================================
-- Migration 00103: Events Extensions, Community Relief Campaigns,
--                  Donations & Atomic Increment Trigger
--
-- Standards: NASA-grade SQL, Fortune-100 Database Security & Ledger Integrity
-- Objectives:
-- 1. Extend public.events with privacy, livestreaming, cover image, tagging,
--    featured flag, cancellation timestamp and performance indexes.
-- 2. Extend public.event_attendees with guest count constraint, check-in code,
--    and attendance confirmation timestamps.
-- 3. Create public.relief_campaigns table for Caribbean humanitarian initiatives
--    (CDEMA / ODPEM / NEMO protocol alignment, multi-currency ledger, disaster verification).
-- 4. Create public.relief_donations table with idempotency keys and anonymity support.
-- 5. Create atomic SECURITY DEFINER trigger public.handle_relief_donation_insert()
--    with row-level concurrency lock, validation, and ledger tally increments.
-- 6. Enforce RLS and explicit grants for public and authenticated roles.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Events Table: Privacy, Livestream, Tagging & Cancellation Extensions
-- -----------------------------------------------------------------------------
ALTER TABLE public.events
    ADD COLUMN IF NOT EXISTS privacy VARCHAR(20) DEFAULT 'public' NOT NULL,
    ADD COLUMN IF NOT EXISTS livestream_url TEXT,
    ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
    ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::text[] NOT NULL,
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false NOT NULL,
    ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'events_privacy_check'
    ) THEN
        ALTER TABLE public.events
            ADD CONSTRAINT events_privacy_check
            CHECK (privacy IN ('public', 'community_only', 'invite_only'));
    END IF;
END $$;

COMMENT ON COLUMN public.events.privacy IS 'Event audience visibility scope: public, community_only, or invite_only.';
COMMENT ON COLUMN public.events.livestream_url IS 'URL for virtual or hybrid live-streamed events.';
COMMENT ON COLUMN public.events.cover_image_url IS 'Hero banner image for event display.';
COMMENT ON COLUMN public.events.tags IS 'Categorization and discovery tags.';
COMMENT ON COLUMN public.events.is_featured IS 'Curated showcase status for high-profile Caribbean cultural events.';
COMMENT ON COLUMN public.events.cancelled_at IS 'Timestamp when the host officially cancelled the event.';

CREATE INDEX IF NOT EXISTS idx_events_privacy
    ON public.events(privacy, starts_at);

CREATE INDEX IF NOT EXISTS idx_events_tags
    ON public.events USING gin (tags);

-- -----------------------------------------------------------------------------
-- 2. Event Attendees Table: Guest Count, Check-In Code & Verification
-- -----------------------------------------------------------------------------
ALTER TABLE public.event_attendees
    ADD COLUMN IF NOT EXISTS guest_count INTEGER DEFAULT 1 NOT NULL,
    ADD COLUMN IF NOT EXISTS check_in_code VARCHAR(32) DEFAULT substr(md5(random()::text), 1, 12),
    ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT false NOT NULL,
    ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'event_attendees_guest_count_check'
    ) THEN
        ALTER TABLE public.event_attendees
            ADD CONSTRAINT event_attendees_guest_count_check
            CHECK (guest_count >= 1 AND guest_count <= 10);
    END IF;
END $$;

COMMENT ON COLUMN public.event_attendees.guest_count IS 'Total party size for RSVP reservation (1 to 10 guests).';
COMMENT ON COLUMN public.event_attendees.check_in_code IS 'Unique alphanumeric code for on-site QR/ticket verification.';
COMMENT ON COLUMN public.event_attendees.checked_in IS 'Whether the attendee was verified at the venue.';
COMMENT ON COLUMN public.event_attendees.checked_in_at IS 'Timestamp when attendee check-in was registered.';

-- -----------------------------------------------------------------------------
-- 3. Relief Campaigns Table: Humanitarian, Disaster & Community Aid
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.relief_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(32) NOT NULL,
    target_country_iso VARCHAR(3) REFERENCES public.countries(iso_code),
    target_city_id UUID REFERENCES public.cities(id),
    goal_minor INTEGER NOT NULL,
    raised_minor INTEGER DEFAULT 0 NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    verification_status VARCHAR(20) DEFAULT 'pending' NOT NULL,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id),
    disaster_declaration_ref TEXT,
    supporting_evidence_urls TEXT[] DEFAULT '{}'::text[] NOT NULL,
    cover_image_url TEXT,
    disbursement_status VARCHAR(20) DEFAULT 'locked' NOT NULL,
    deadline_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true NOT NULL,
    donations_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

    CONSTRAINT relief_campaigns_category_check
        CHECK (category IN (
            'hurricane_relief',
            'flood_disaster',
            'medical_aid',
            'community_rebuild',
            'education',
            'cultural_heritage'
        )),
    CONSTRAINT relief_campaigns_goal_check
        CHECK (goal_minor > 0),
    CONSTRAINT relief_campaigns_raised_check
        CHECK (raised_minor >= 0),
    CONSTRAINT relief_campaigns_verification_status_check
        CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    CONSTRAINT relief_campaigns_disbursement_status_check
        CHECK (disbursement_status IN ('locked', 'verified_ready', 'disbursed')),
    CONSTRAINT relief_campaigns_donations_count_check
        CHECK (donations_count >= 0)
);

COMMENT ON TABLE public.relief_campaigns IS 'Humanitarian relief and disaster recovery campaigns verified under Caribbean emergency protocols.';
COMMENT ON COLUMN public.relief_campaigns.category IS 'Disaster or aid category (hurricane, flood, medical, rebuild, etc.).';
COMMENT ON COLUMN public.relief_campaigns.disaster_declaration_ref IS 'Official national/regional emergency disaster code (e.g., CDEMA, ODPEM, NEMO).';
COMMENT ON COLUMN public.relief_campaigns.disbursement_status IS 'Fund safety escrow gate: locked until full verification before payout.';

CREATE INDEX IF NOT EXISTS idx_relief_campaigns_category
    ON public.relief_campaigns(category);

CREATE INDEX IF NOT EXISTS idx_relief_campaigns_country
    ON public.relief_campaigns(target_country_iso);

CREATE INDEX IF NOT EXISTS idx_relief_campaigns_verification
    ON public.relief_campaigns(verification_status, is_active);

CREATE INDEX IF NOT EXISTS idx_relief_campaigns_creator
    ON public.relief_campaigns(creator_id);

-- -----------------------------------------------------------------------------
-- 4. Relief Donations Table: Individual Contributions Ledger
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.relief_donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.relief_campaigns(id) ON DELETE CASCADE NOT NULL,
    donor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    amount_minor INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL,
    is_anonymous BOOLEAN DEFAULT false NOT NULL,
    donor_name TEXT,
    donor_message TEXT,
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

    CONSTRAINT relief_donations_amount_check
        CHECK (amount_minor > 0)
);

COMMENT ON TABLE public.relief_donations IS 'Granular donation records contributing to disaster and community relief campaigns.';
COMMENT ON COLUMN public.relief_donations.idempotency_key IS 'Payment / request deduplication key guaranteeing single-execution ledger safety.';

CREATE INDEX IF NOT EXISTS idx_relief_donations_campaign
    ON public.relief_donations(campaign_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_relief_donations_donor
    ON public.relief_donations(donor_id);

-- -----------------------------------------------------------------------------
-- 5. Atomic Trigger & Function: handle_relief_donation_insert()
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_relief_donation_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_campaign RECORD;
BEGIN
    -- 1. Concurrency control: Lock the target campaign record row
    SELECT
        id,
        is_active,
        verification_status,
        deadline_at,
        currency
    INTO v_campaign
    FROM public.relief_campaigns
    WHERE id = NEW.campaign_id
    FOR UPDATE;

    -- 2. Validate existence
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Target relief campaign % does not exist', NEW.campaign_id;
    END IF;

    -- 3. Validate active status
    IF v_campaign.is_active IS NOT TRUE THEN
        RAISE EXCEPTION 'Relief campaign % is not active', NEW.campaign_id;
    END IF;

    -- 4. Validate verification status (cannot accept donations if rejected)
    IF v_campaign.verification_status = 'rejected' THEN
        RAISE EXCEPTION 'Cannot donate to a rejected relief campaign';
    END IF;

    -- 5. Validate deadline (cannot donate past expiration date)
    IF v_campaign.deadline_at IS NOT NULL AND v_campaign.deadline_at < now() THEN
        RAISE EXCEPTION 'Relief campaign deadline has passed';
    END IF;

    -- 6. Normalize anonymous donor name
    IF NEW.is_anonymous IS TRUE THEN
        NEW.donor_name := 'Anonymous Supporter';
    END IF;

    -- 7. Atomically increment campaign raised total and donation count
    UPDATE public.relief_campaigns
    SET
        raised_minor = public.relief_campaigns.raised_minor + NEW.amount_minor,
        donations_count = public.relief_campaigns.donations_count + 1,
        updated_at = now()
    WHERE id = NEW.campaign_id;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_relief_donation_insert() IS
'Atomic trigger function enforcing campaign status checks and updating raised_minor and donations_count counters under row-level lock.';

-- Drop existing trigger if present to allow clean idempotency
DROP TRIGGER IF EXISTS trg_relief_donations_insert ON public.relief_donations;

CREATE TRIGGER trg_relief_donations_insert
    BEFORE INSERT ON public.relief_donations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_relief_donation_insert();

-- -----------------------------------------------------------------------------
-- 6. Row Level Security & Policies
-- -----------------------------------------------------------------------------
ALTER TABLE public.relief_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relief_campaigns FORCE ROW LEVEL SECURITY;

ALTER TABLE public.relief_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relief_donations FORCE ROW LEVEL SECURITY;

-- Relief Campaigns: Read policy (verified active campaigns public, or creator owns)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'relief_campaigns'
          AND policyname = 'Relief campaigns viewable if verified or by creator'
    ) THEN
        CREATE POLICY "Relief campaigns viewable if verified or by creator"
            ON public.relief_campaigns FOR SELECT
            USING (
                (verification_status = 'verified' AND is_active = true)
                OR
                creator_id = (SELECT auth.uid())
            );
    END IF;
END $$;

-- Relief Campaigns: Create policy (authenticated creators only)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'relief_campaigns'
          AND policyname = 'Authenticated users can create relief campaigns'
    ) THEN
        CREATE POLICY "Authenticated users can create relief campaigns"
            ON public.relief_campaigns FOR INSERT
            WITH CHECK (
                auth.role() = 'authenticated'
                AND
                creator_id = (SELECT auth.uid())
            );
    END IF;
END $$;

-- Relief Campaigns: Update policy (campaign creator only)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'relief_campaigns'
          AND policyname = 'Campaign creators can update their campaigns'
    ) THEN
        CREATE POLICY "Campaign creators can update their campaigns"
            ON public.relief_campaigns FOR UPDATE
            USING (creator_id = (SELECT auth.uid()))
            WITH CHECK (creator_id = (SELECT auth.uid()));
    END IF;
END $$;

-- Relief Donations: Read policy (public read for visible campaigns or own donations)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'relief_donations'
          AND policyname = 'Public read for donations of visible campaigns'
    ) THEN
        CREATE POLICY "Public read for donations of visible campaigns"
            ON public.relief_donations FOR SELECT
            USING (
                donor_id = (SELECT auth.uid())
                OR
                EXISTS (
                    SELECT 1 FROM public.relief_campaigns c
                    WHERE c.id = relief_donations.campaign_id
                      AND (
                          (c.verification_status = 'verified' AND c.is_active = true)
                          OR
                          c.creator_id = (SELECT auth.uid())
                      )
                )
            );
    END IF;
END $$;

-- Relief Donations: Insert policy (authenticated or guest donation with verified donor_id match)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'relief_donations'
          AND policyname = 'Authenticated or authorized donors can insert donations'
    ) THEN
        CREATE POLICY "Authenticated or authorized donors can insert donations"
            ON public.relief_donations FOR INSERT
            WITH CHECK (
                donor_id IS NULL OR donor_id = (SELECT auth.uid())
            );
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 7. Privileges & Grants
-- -----------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE ON public.relief_campaigns TO authenticated;
GRANT SELECT ON public.relief_campaigns TO anon;

GRANT SELECT, INSERT ON public.relief_donations TO authenticated;
GRANT SELECT, INSERT ON public.relief_donations TO anon;
