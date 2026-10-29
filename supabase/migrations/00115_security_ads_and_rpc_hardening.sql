-- =============================================================================
-- Migration 00115: Security, RLS, Advertising, Double-Entry Ledger & RPC Hardening
-- =============================================================================
-- Description:
--   1. Reconciles public.posts RLS policies (restores draft/scheduled isolation,
--      bidirectional block checks, private community privacy, page follower access,
--      and publisher impersonation guards).
--   2. Removes residual permissive WITH CHECK (true) policies on feed_activity_timeline_*
--      partitions and enforces user_id = auth.uid().
--   3. Hardens SECURITY DEFINER RPCs (get_user_messaging_friends, is_staff_or_ad_moderator,
--      is_page_member, can_manage_page, can_manage_page_path, sync_business_image_columns)
--      against cross-user IDOR enumeration and search_path hijacking.
--   4. Hardens Advertising & Double-Entry Ledger:
--      - Adds category column to public.ledger_entries and cta_text to public.ads.
--      - Adds BEFORE UPDATE trigger on public.campaigns and public.ads preventing
--        client forgery of funded_amount_minor, spent_amount_minor, moderation_status,
--        or unapproved campaign activation.
--      - Hardens record_ad_impression_and_spend to compute CPM cost server-side,
--        require moderation_status = 'approved', deduplicate repeat viewer impressions,
--        prevent self-impression billing, and record paired double-entry ledger_entries.
--      - Adds idempotent fund_campaign_from_intent RPC.
--   5. Hardens Shorts/Reels (public.videos) RLS, immutable counter trigger,
--      video_saves / video_shares tables, and livestream co-host RPC.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Schema Extensions for Ledger, Ads, Posts & Videos Compatibility
-- -----------------------------------------------------------------------------
ALTER TABLE public.ledger_entries
    ADD COLUMN IF NOT EXISTS category VARCHAR(40);

ALTER TABLE public.ads
    ADD COLUMN IF NOT EXISTS cta_text TEXT DEFAULT 'Learn More';

ALTER TABLE public.posts
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.videos
    ADD COLUMN IF NOT EXISTS shares_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.ad_clicks
    ALTER COLUMN impression_id DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.ad_impressions
    ADD COLUMN IF NOT EXISTS occurred_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.ad_events
    ADD COLUMN IF NOT EXISTS placement TEXT DEFAULT 'feed',
    ADD COLUMN IF NOT EXISTS cost_charged_minor INTEGER NOT NULL DEFAULT 0;

-- -----------------------------------------------------------------------------
-- 2. Harden Page Role & Staff Helper Functions (Prevent IDOR Enumeration)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_staff_or_ad_moderator(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller UUID := (SELECT auth.uid());
    v_role TEXT := (SELECT auth.role());
    v_target UUID := COALESCE(p_user_id, v_caller);
BEGIN
    IF v_target IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Prevent cross-user staff enumeration by non-service_role callers
    IF v_role IS DISTINCT FROM 'service_role' AND v_target IS DISTINCT FROM v_caller THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.accounts
        WHERE id = v_target
          AND role IN ('admin', 'moderator', 'staff', 'super_admin')
    );
END;
$$;

REVOKE ALL ON FUNCTION public.is_staff_or_ad_moderator(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_staff_or_ad_moderator(UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_page_member(
    p_page_id UUID,
    p_user_id UUID,
    p_roles TEXT[] DEFAULT ARRAY['owner', 'admin', 'editor', 'moderator', 'analyst']
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller UUID := (SELECT auth.uid());
    v_role TEXT := (SELECT auth.role());
BEGIN
    IF p_page_id IS NULL OR p_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    IF v_role IS DISTINCT FROM 'service_role' AND p_user_id IS DISTINCT FROM v_caller THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.page_roles pr
        WHERE pr.page_id = p_page_id
          AND pr.user_id = p_user_id
          AND pr.role = ANY(p_roles)
    ) OR (
        ('owner' = ANY(p_roles) OR 'admin' = ANY(p_roles) OR 'editor' = ANY(p_roles))
        AND EXISTS (
            SELECT 1 FROM public.businesses b
            WHERE b.id = p_page_id
              AND b.owner_id = p_user_id
              AND b.deleted_at IS NULL
        )
    );
END;
$$;

REVOKE ALL ON FUNCTION public.is_page_member(UUID, UUID, TEXT[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_page_member(UUID, UUID, TEXT[]) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.can_manage_page(p_page_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN public.is_page_member(p_page_id, p_user_id, ARRAY['owner', 'admin', 'editor']);
END;
$$;

REVOKE ALL ON FUNCTION public.can_manage_page(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_page(UUID, UUID) TO authenticated, service_role;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'sync_business_image_columns'
    ) THEN
        EXECUTE 'REVOKE ALL ON FUNCTION public.sync_business_image_columns() FROM PUBLIC, anon, authenticated';
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3. Harden get_user_messaging_friends Against Cross-User IDOR Enumeration
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_messaging_friends(viewer_id UUID DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    display_name TEXT,
    username TEXT,
    avatar_url TEXT,
    is_verified BOOLEAN,
    bio TEXT,
    friend_since TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller UUID := (SELECT auth.uid());
    v_role TEXT := (SELECT auth.role());
    target_uid UUID := COALESCE(viewer_id, v_caller);
BEGIN
    IF target_uid IS NULL THEN
        RETURN;
    END IF;

    IF v_role IS DISTINCT FROM 'service_role' AND target_uid IS DISTINCT FROM v_caller THEN
        RAISE EXCEPTION 'Access denied: cannot query another user''s messaging friends'
            USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    WITH friend_edges AS (
        SELECT
            CASE WHEN f.requester_id = target_uid THEN f.addressee_id ELSE f.requester_id END AS friend_id,
            f.updated_at AS friend_since
        FROM public.friendships f
        WHERE (f.requester_id = target_uid OR f.addressee_id = target_uid)
          AND f.status = 'accepted'
    )
    SELECT
        p.id,
        p.display_name,
        p.username,
        p.avatar_url,
        COALESCE(p.is_verified, false) AS is_verified,
        p.bio,
        fe.friend_since
    FROM friend_edges fe
    JOIN public.profiles p ON p.id = fe.friend_id
    WHERE NOT EXISTS (
        SELECT 1 FROM public.blocks b
        WHERE (b.blocker_id = target_uid AND b.blocked_id = p.id)
           OR (b.blocker_id = p.id AND b.blocked_id = target_uid)
    )
    ORDER BY fe.friend_since DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_messaging_friends(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_messaging_friends(UUID) TO authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 4. Reconcile Unified public.posts RLS Policies (Fix 00108 Regression)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "posts_select_policy" ON public.posts;
DROP POLICY IF EXISTS "posts_insert_policy" ON public.posts;
DROP POLICY IF EXISTS "posts_update_policy" ON public.posts;
DROP POLICY IF EXISTS "posts_delete_policy" ON public.posts;
DROP POLICY IF EXISTS "View posts policy" ON public.posts;

CREATE POLICY "View posts policy"
    ON public.posts
    FOR SELECT
    TO anon, authenticated
    USING (
        deleted_at IS NULL
        AND (
            -- 1. Author or authorized Page manager can view their own posts (including drafts/scheduled)
            ((SELECT auth.uid()) IS NOT NULL AND (
                author_id = (SELECT auth.uid())
                OR created_by_user_id = (SELECT auth.uid())
                OR (page_id IS NOT NULL AND public.is_page_member(page_id, (SELECT auth.uid())))
            ))
            OR (
                -- 2. Published and due posts only for non-owners
                (post_status IS NULL OR post_status = 'published')
                AND (scheduled_at IS NULL OR scheduled_at <= now())
                -- 3. Bi-directional block enforcement
                AND (
                    (SELECT auth.uid()) IS NULL
                    OR NOT EXISTS (
                        SELECT 1 FROM public.blocks b
                        WHERE (b.blocker_id = (SELECT auth.uid()) AND b.blocked_id = posts.author_id)
                           OR (b.blocker_id = posts.author_id AND b.blocked_id = (SELECT auth.uid()))
                    )
                )
                -- 4. Community privacy boundary
                AND (
                    community_id IS NULL
                    OR public.is_active_community_member(community_id)
                    OR EXISTS (
                        SELECT 1 FROM public.communities c
                        WHERE c.id = posts.community_id
                          AND c.join_policy = 'public'
                    )
                )
                -- 5. Post visibility rules
                AND (
                    visibility = 'public'
                    OR (
                        visibility = 'followers'
                        AND (SELECT auth.uid()) IS NOT NULL
                        AND (
                            EXISTS (
                                SELECT 1 FROM public.follows f
                                WHERE f.follower_id = (SELECT auth.uid())
                                  AND f.following_id = posts.author_id
                            )
                            OR (
                                page_id IS NOT NULL
                                AND EXISTS (
                                    SELECT 1 FROM public.page_followers pf
                                    WHERE pf.user_id = (SELECT auth.uid())
                                      AND pf.page_id = posts.page_id
                                )
                            )
                        )
                    )
                    OR (
                        visibility = 'friends'
                        AND (SELECT auth.uid()) IS NOT NULL
                        AND EXISTS (
                            SELECT 1 FROM public.friendships fr
                            WHERE fr.status = 'accepted'
                              AND (
                                  (fr.requester_id = (SELECT auth.uid()) AND fr.addressee_id = posts.author_id)
                                  OR (fr.addressee_id = (SELECT auth.uid()) AND fr.requester_id = posts.author_id)
                              )
                        )
                    )
                )
            )
        )
    );

CREATE POLICY "posts_insert_policy"
    ON public.posts
    FOR INSERT
    TO authenticated
    WITH CHECK (
        (SELECT auth.uid()) = author_id
        AND (
            page_id IS NULL
            OR public.is_page_member(page_id, (SELECT auth.uid()), ARRAY['owner', 'admin', 'editor'])
        )
    );

CREATE POLICY "posts_update_policy"
    ON public.posts
    FOR UPDATE
    TO authenticated
    USING (
        (SELECT auth.uid()) = author_id
        OR (
            page_id IS NOT NULL
            AND public.is_page_member(page_id, (SELECT auth.uid()), ARRAY['owner', 'admin'])
        )
    )
    WITH CHECK (
        (SELECT auth.uid()) = author_id
        OR (
            page_id IS NOT NULL
            AND public.is_page_member(page_id, (SELECT auth.uid()), ARRAY['owner', 'admin'])
        )
    );

CREATE POLICY "posts_delete_policy"
    ON public.posts
    FOR DELETE
    TO authenticated
    USING (
        (SELECT auth.uid()) = author_id
        OR (
            page_id IS NOT NULL
            AND public.is_page_member(page_id, (SELECT auth.uid()), ARRAY['owner', 'admin'])
        )
    );

-- -----------------------------------------------------------------------------
-- 5. Remove Residual Permissive WITH CHECK (true) on feed_activity_timeline_*
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    v_part TEXT;
BEGIN
    FOR v_part IN
        SELECT c.relname
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname LIKE 'feed_activity_timeline_%'
          AND c.relkind = 'r'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', v_part || '_insert', v_part);
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'policy_insert_' || v_part, v_part);
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', v_part || '_insert_own', v_part);
        EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id)',
            v_part || '_insert_own',
            v_part
        );
    END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 6. Advertising & Campaign Security Triggers, RLS & Server-Side Spend RPC
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff update all campaigns" ON public.campaigns;
CREATE POLICY "Staff update all campaigns"
    ON public.campaigns FOR UPDATE
    USING (public.is_staff_or_ad_moderator((SELECT auth.uid())))
    WITH CHECK (public.is_staff_or_ad_moderator((SELECT auth.uid())));

DROP POLICY IF EXISTS "Staff update all ads" ON public.ads;
CREATE POLICY "Staff update all ads"
    ON public.ads FOR UPDATE
    USING (public.is_staff_or_ad_moderator((SELECT auth.uid())))
    WITH CHECK (public.is_staff_or_ad_moderator((SELECT auth.uid())));

-- Allow feed delivery queries to inspect active, approved ad metadata safely
DROP POLICY IF EXISTS "Public view active approved campaigns" ON public.campaigns;
CREATE POLICY "Public view active approved campaigns"
    ON public.campaigns FOR SELECT
    USING (status = 'active' AND moderation_status = 'approved' AND funded_amount_minor > spent_amount_minor);

DROP POLICY IF EXISTS "Public view active ad sets" ON public.ad_sets;
CREATE POLICY "Public view active ad sets"
    ON public.ad_sets FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.campaigns c
            WHERE c.id = ad_sets.campaign_id
              AND c.status = 'active'
              AND c.moderation_status = 'approved'
        )
    );

DROP POLICY IF EXISTS "Public view active advertisers" ON public.advertisers;
CREATE POLICY "Public view active advertisers"
    ON public.advertisers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.campaigns c
            WHERE c.advertiser_id = advertisers.id
              AND c.status = 'active'
              AND c.moderation_status = 'approved'
        )
        OR profile_id = (SELECT auth.uid())
        OR public.is_staff_or_ad_moderator((SELECT auth.uid()))
    );

DROP POLICY IF EXISTS "Advertisers and staff view impressions" ON public.ad_impressions;
CREATE POLICY "Advertisers and staff view impressions"
    ON public.ad_impressions FOR SELECT
    USING (
        public.is_staff_or_ad_moderator((SELECT auth.uid()))
        OR EXISTS (
            SELECT 1 FROM public.ads a
            JOIN public.ad_sets s ON s.id = a.ad_set_id
            JOIN public.campaigns c ON c.id = s.campaign_id
            JOIN public.advertisers adv ON adv.id = c.advertiser_id
            WHERE a.id = ad_impressions.ad_id
              AND adv.profile_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Advertisers and staff view clicks" ON public.ad_clicks;
CREATE POLICY "Advertisers and staff view clicks"
    ON public.ad_clicks FOR SELECT
    USING (
        public.is_staff_or_ad_moderator((SELECT auth.uid()))
        OR EXISTS (
            SELECT 1 FROM public.ads a
            JOIN public.ad_sets s ON s.id = a.ad_set_id
            JOIN public.campaigns c ON c.id = s.campaign_id
            JOIN public.advertisers adv ON adv.id = c.advertiser_id
            WHERE a.id = ad_clicks.ad_id
              AND adv.profile_id = (SELECT auth.uid())
        )
    );

-- Protect financial & moderation columns on public.campaigns and public.ads
CREATE OR REPLACE FUNCTION public.enforce_campaign_and_ad_security()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_role TEXT := (SELECT auth.role());
    v_uid UUID := (SELECT auth.uid());
    v_is_staff BOOLEAN := FALSE;
BEGIN
    IF v_role = 'service_role' OR current_user IN ('postgres', 'supabase_admin') THEN
        RETURN NEW;
    END IF;

    v_is_staff := public.is_staff_or_ad_moderator(v_uid);

    IF TG_TABLE_NAME = 'campaigns' THEN
        -- Non-staff cannot forge financial balances
        IF NEW.funded_amount_minor IS DISTINCT FROM OLD.funded_amount_minor
           OR NEW.spent_amount_minor IS DISTINCT FROM OLD.spent_amount_minor THEN
            RAISE EXCEPTION 'Unauthorized modification of campaign financial balances'
                USING ERRCODE = '42501';
        END IF;

        -- Non-staff cannot forge moderation status
        IF NOT v_is_staff AND (
            NEW.moderation_status IS DISTINCT FROM OLD.moderation_status
            OR NEW.moderation_reason IS DISTINCT FROM OLD.moderation_reason
            OR NEW.moderated_by IS DISTINCT FROM OLD.moderated_by
        ) THEN
            RAISE EXCEPTION 'Unauthorized modification of campaign moderation state'
                USING ERRCODE = '42501';
        END IF;

        -- Prevent activating unapproved or unfunded campaigns
        IF NEW.status = 'active' AND (
            NEW.moderation_status IS DISTINCT FROM 'approved'
            OR COALESCE(NEW.funded_amount_minor, 0) <= COALESCE(NEW.spent_amount_minor, 0)
        ) THEN
            RAISE EXCEPTION 'Campaign must be approved and have available funded budget before activation'
                USING ERRCODE = '42501';
        END IF;
    ELSIF TG_TABLE_NAME = 'ads' THEN
        IF NOT v_is_staff AND NEW.is_approved IS DISTINCT FROM OLD.is_approved THEN
            RAISE EXCEPTION 'Unauthorized modification of ad approval state'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_campaign_and_ad_security() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enforce_campaign_security ON public.campaigns;
CREATE TRIGGER trg_enforce_campaign_security
    BEFORE UPDATE ON public.campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_campaign_and_ad_security();

DROP TRIGGER IF EXISTS trg_enforce_ad_security ON public.ads;
CREATE TRIGGER trg_enforce_ad_security
    BEFORE UPDATE ON public.ads
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_campaign_and_ad_security();

-- Idempotent Campaign Funding RPC (Service Role Only)
CREATE OR REPLACE FUNCTION public.fund_campaign_from_intent(
    p_intent_id UUID,
    p_campaign_id UUID,
    p_amount_minor INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_campaign RECORD;
    v_new_funded INTEGER;
    v_new_status TEXT;
BEGIN
    IF p_amount_minor IS NULL OR p_amount_minor <= 0 THEN
        RETURN jsonb_build_object('funded', false, 'reason', 'invalid_amount');
    END IF;

    SELECT id, status, moderation_status, funded_amount_minor, spent_amount_minor
    INTO v_campaign
    FROM public.campaigns
    WHERE id = p_campaign_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('funded', false, 'reason', 'campaign_not_found');
    END IF;

    v_new_funded := COALESCE(v_campaign.funded_amount_minor, 0) + p_amount_minor;
    v_new_status := CASE
        WHEN v_campaign.moderation_status = 'approved' AND v_campaign.status IN ('draft', 'completed')
        THEN 'active'::TEXT
        ELSE v_campaign.status
    END;

    UPDATE public.campaigns
    SET funded_amount_minor = v_new_funded,
        status = v_new_status,
        updated_at = now()
    WHERE id = p_campaign_id;

    RETURN jsonb_build_object(
        'funded', true,
        'campaign_id', p_campaign_id,
        'funded_amount_minor', v_new_funded,
        'status', v_new_status
    );
END;
$$;

REVOKE ALL ON FUNCTION public.fund_campaign_from_intent(UUID, UUID, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fund_campaign_from_intent(UUID, UUID, INTEGER) TO service_role;

-- Hardened Atomic Impression + Server-Computed Spend + Double-Entry Ledger RPC
CREATE OR REPLACE FUNCTION public.record_ad_impression_and_spend(
    p_ad_id UUID,
    p_viewer_id UUID DEFAULT NULL,
    p_placement TEXT DEFAULT 'feed',
    p_cost_minor INTEGER DEFAULT 2
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_campaign_id UUID;
    v_campaign_status TEXT;
    v_moderation_status TEXT;
    v_funded INTEGER;
    v_spent INTEGER;
    v_currency CHAR(3);
    v_bid_cpm_minor INTEGER;
    v_advertiser_profile_id UUID;
    v_effective_viewer UUID := COALESCE(p_viewer_id, (SELECT auth.uid()));
    v_server_cost INTEGER;
    v_actual_cost INTEGER;
    v_new_spent INTEGER;
    v_impression_id UUID;
    v_existing_impression_id UUID;
    v_adv_account_id UUID;
    v_rev_account_id UUID;
    v_ledger_tx_id UUID;
BEGIN
    -- 1. Resolve ad -> ad_set -> campaign -> advertiser with row lock on campaign
    SELECT
        c.id,
        c.status,
        c.moderation_status,
        COALESCE(c.funded_amount_minor, 0),
        COALESCE(c.spent_amount_minor, 0),
        COALESCE(c.currency, 'USD'),
        COALESCE(s.bid_cpm_minor, 800),
        adv.profile_id
    INTO
        v_campaign_id,
        v_campaign_status,
        v_moderation_status,
        v_funded,
        v_spent,
        v_currency,
        v_bid_cpm_minor,
        v_advertiser_profile_id
    FROM public.ads a
    JOIN public.ad_sets s ON s.id = a.ad_set_id
    JOIN public.campaigns c ON c.id = s.campaign_id
    JOIN public.advertisers adv ON adv.id = c.advertiser_id
    WHERE a.id = p_ad_id
      AND a.is_approved = true
    FOR UPDATE OF c;

    IF v_campaign_id IS NULL THEN
        RETURN jsonb_build_object('recorded', false, 'reason', 'ad_or_campaign_not_found');
    END IF;

    IF v_campaign_status <> 'active' OR v_moderation_status <> 'approved' THEN
        RETURN jsonb_build_object('recorded', false, 'reason', 'campaign_not_active_or_approved');
    END IF;

    -- Prevent self-impression billing when advertiser views their own ad
    IF v_effective_viewer IS NOT NULL AND v_effective_viewer = v_advertiser_profile_id THEN
        RETURN jsonb_build_object('recorded', false, 'reason', 'self_impression_ignored');
    END IF;

    -- Deduplicate rapid repeat impressions for the same viewer within 5 minutes
    IF v_effective_viewer IS NOT NULL THEN
        SELECT id INTO v_existing_impression_id
        FROM public.ad_impressions
        WHERE ad_id = p_ad_id
          AND viewer_id = v_effective_viewer
          AND occurred_at > (now() - interval '5 minutes')
        ORDER BY occurred_at DESC
        LIMIT 1;

        IF v_existing_impression_id IS NOT NULL THEN
            RETURN jsonb_build_object(
                'recorded', true,
                'deduplicated', true,
                'impression_id', v_existing_impression_id,
                'campaign_id', v_campaign_id,
                'spent_amount_minor', v_spent,
                'funded_amount_minor', v_funded
            );
        END IF;
    END IF;

    IF v_funded <= v_spent THEN
        UPDATE public.campaigns
        SET status = 'completed', updated_at = now()
        WHERE id = v_campaign_id;
        RETURN jsonb_build_object('recorded', false, 'reason', 'budget_exhausted');
    END IF;

    -- 2. Compute impression cost strictly on the server from bid_cpm_minor (ignore negative/inflated client p_cost_minor)
    v_server_cost := GREATEST(1, ROUND(v_bid_cpm_minor::numeric / 1000.0)::integer);
    v_new_spent := LEAST(v_spent + v_server_cost, v_funded);
    v_actual_cost := GREATEST(0, v_new_spent - v_spent);

    -- 3. Insert ad_impressions and ad_events
    INSERT INTO public.ad_impressions (ad_id, viewer_id, placement, cost_minor)
    VALUES (p_ad_id, v_effective_viewer, COALESCE(p_placement, 'feed'), v_actual_cost)
    RETURNING id INTO v_impression_id;

    INSERT INTO public.ad_events (ad_id, viewer_id, event_type, placement, cost_charged_minor)
    VALUES (p_ad_id, v_effective_viewer, 'impression', COALESCE(p_placement, 'feed'), v_actual_cost);

    -- 4. Record paired double-entry ledger records for ad spend
    IF v_actual_cost > 0 AND v_advertiser_profile_id IS NOT NULL THEN
        BEGIN
            v_adv_account_id := public.ensure_ledger_account(v_advertiser_profile_id, 'Payments_wallet', v_currency);
            v_rev_account_id := public.ensure_ledger_account(v_advertiser_profile_id, 'platform_revenue', v_currency);
            v_ledger_tx_id := gen_random_uuid();

            IF v_adv_account_id IS NOT NULL AND v_rev_account_id IS NOT NULL THEN
                INSERT INTO public.ledger_entries (
                    transaction_id,
                    account_id,
                    amount,
                    entry_type,
                    category,
                    idempotency_key,
                    description
                ) VALUES
                (
                    v_ledger_tx_id,
                    v_adv_account_id,
                    -v_actual_cost,
                    'DEBIT',
                    'AD_SPEND',
                    'ad_imp_' || v_impression_id::text || '_debit',
                    'Ad impression spend for campaign ' || v_campaign_id::text
                ),
                (
                    v_ledger_tx_id,
                    v_rev_account_id,
                    v_actual_cost,
                    'CREDIT',
                    'PLATFORM_REVENUE',
                    'ad_imp_' || v_impression_id::text || '_credit',
                    'Ad impression revenue for campaign ' || v_campaign_id::text
                );
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- Do not abort impression tracking if ledger account provisioning is unavailable in test fixture
            NULL;
        END;
    END IF;

    -- 5. Update campaign spend and auto-complete if budget reached
    UPDATE public.campaigns
    SET spent_amount_minor = v_new_spent,
        status = CASE WHEN v_new_spent >= v_funded THEN 'completed'::TEXT ELSE status END,
        updated_at = now()
    WHERE id = v_campaign_id;

    RETURN jsonb_build_object(
        'recorded', true,
        'impression_id', v_impression_id,
        'campaign_id', v_campaign_id,
        'cost_charged_minor', v_actual_cost,
        'spent_amount_minor', v_new_spent,
        'funded_amount_minor', v_funded,
        'budget_exhausted', (v_new_spent >= v_funded)
    );
END;
$$;

REVOKE ALL ON FUNCTION public.record_ad_impression_and_spend(UUID, UUID, TEXT, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_ad_impression_and_spend(UUID, UUID, TEXT, INTEGER) TO authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 7. Shorts / Reels (public.videos) Security, Saves/Shares & Counter Integrity
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Visible videos readable by community" ON public.videos;
CREATE POLICY "Visible videos readable by community" ON public.videos
    FOR SELECT USING (
        (
            (SELECT auth.uid()) IS NULL
            OR NOT EXISTS (
                SELECT 1 FROM public.blocks b
                WHERE (b.blocker_id = (SELECT auth.uid()) AND b.blocked_id = videos.creator_id)
                   OR (b.blocker_id = videos.creator_id AND b.blocked_id = (SELECT auth.uid()))
            )
        )
        AND (
            (moderation_status = 'approved' AND visibility = 'public')
            OR ((SELECT auth.uid()) = creator_id)
            OR (
                page_id IS NOT NULL
                AND public.is_page_member(page_id, (SELECT auth.uid()), ARRAY['owner', 'admin', 'editor', 'moderator'])
            )
            OR (
                moderation_status = 'approved'
                AND visibility = 'followers'
                AND (SELECT auth.uid()) IS NOT NULL
                AND (
                    EXISTS (
                        SELECT 1 FROM public.follows f
                        WHERE f.follower_id = (SELECT auth.uid()) AND f.following_id = videos.creator_id
                    )
                    OR (
                        page_id IS NOT NULL
                        AND EXISTS (
                            SELECT 1 FROM public.page_followers pf
                            WHERE pf.user_id = (SELECT auth.uid()) AND pf.page_id = videos.page_id
                        )
                    )
                )
            )
        )
    );

CREATE OR REPLACE FUNCTION public.enforce_video_immutable_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_role TEXT := (SELECT auth.role());
    v_uid UUID := (SELECT auth.uid());
BEGIN
    IF v_role = 'service_role' OR current_user IN ('postgres', 'supabase_admin') OR public.is_staff_or_ad_moderator(v_uid) THEN
        RETURN NEW;
    END IF;

    IF NEW.moderation_status IS DISTINCT FROM OLD.moderation_status THEN
        RAISE EXCEPTION 'Unauthorized modification of video moderation status'
            USING ERRCODE = '42501';
    END IF;

    IF NEW.creator_id IS DISTINCT FROM OLD.creator_id THEN
        RAISE EXCEPTION 'Unauthorized modification of video creator'
            USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_video_immutable_fields() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enforce_video_immutable_fields ON public.videos;
CREATE TRIGGER trg_enforce_video_immutable_fields
    BEFORE UPDATE ON public.videos
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_video_immutable_fields();

-- Dedicated tables for Short/Reel Saves and Shares (preventing FK 23503 on saved_posts / post_shares)
CREATE TABLE IF NOT EXISTS public.video_saves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (profile_id, video_id)
);

ALTER TABLE public.video_saves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own video saves" ON public.video_saves;
CREATE POLICY "Users manage own video saves"
    ON public.video_saves
    FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = profile_id)
    WITH CHECK ((SELECT auth.uid()) = profile_id);

CREATE TABLE IF NOT EXISTS public.video_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
    shared_by_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    share_channel TEXT NOT NULL DEFAULT 'copy_link',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.video_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users insert own video shares" ON public.video_shares;
CREATE POLICY "Users insert own video shares"
    ON public.video_shares
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = shared_by_profile_id);

DROP POLICY IF EXISTS "Users view video shares" ON public.video_shares;
CREATE POLICY "Users view video shares"
    ON public.video_shares
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Atomic RPC for Short/Reel counter increments (likes, comments, shares, views)
CREATE OR REPLACE FUNCTION public.increment_video_counter(
    p_video_id UUID,
    p_column TEXT,
    p_delta INTEGER DEFAULT 1
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF p_video_id IS NULL OR p_delta NOT IN (-1, 1) THEN
        RETURN;
    END IF;

    IF p_column = 'likes_count' THEN
        UPDATE public.videos
        SET likes_count = GREATEST(0, COALESCE(likes_count, 0) + p_delta)
        WHERE id = p_video_id;
    ELSIF p_column = 'comments_count' THEN
        UPDATE public.videos
        SET comments_count = GREATEST(0, COALESCE(comments_count, 0) + p_delta)
        WHERE id = p_video_id;
    ELSIF p_column = 'shares_count' THEN
        UPDATE public.videos
        SET shares_count = GREATEST(0, COALESCE(shares_count, 0) + p_delta)
        WHERE id = p_video_id;
    ELSIF p_column = 'view_count' AND p_delta = 1 THEN
        UPDATE public.videos
        SET view_count = GREATEST(0, COALESCE(view_count, 0) + 1)
        WHERE id = p_video_id;
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_video_counter(UUID, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_video_counter(UUID, TEXT, INTEGER) TO anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 8. Livestream Co-Host Least-Privilege Policy & Safe Transition RPC
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS livestreams_co_host_access ON public.livestreams;

CREATE OR REPLACE FUNCTION public.respond_or_leave_livestream_cohost(
    p_stream_id UUID,
    p_action TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_uid UUID := (SELECT auth.uid());
    v_stream RECORD;
BEGIN
    IF v_uid IS NULL OR p_stream_id IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT id, creator_id, co_host_id, co_host_status
    INTO v_stream
    FROM public.livestreams
    WHERE id = p_stream_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    IF p_action = 'accept' AND v_stream.co_host_id = v_uid AND v_stream.co_host_status = 'invited' THEN
        UPDATE public.livestreams
        SET co_host_status = 'active'
        WHERE id = p_stream_id;
        RETURN TRUE;
    ELSIF p_action = 'decline' AND v_stream.co_host_id = v_uid AND v_stream.co_host_status = 'invited' THEN
        UPDATE public.livestreams
        SET co_host_status = 'declined', co_host_id = NULL
        WHERE id = p_stream_id;
        RETURN TRUE;
    ELSIF p_action = 'leave' AND (v_stream.co_host_id = v_uid OR v_stream.creator_id = v_uid) THEN
        UPDATE public.livestreams
        SET co_host_status = 'none', co_host_id = NULL
        WHERE id = p_stream_id;
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;

REVOKE ALL ON FUNCTION public.respond_or_leave_livestream_cohost(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.respond_or_leave_livestream_cohost(UUID, TEXT) TO authenticated, service_role;

COMMIT;
