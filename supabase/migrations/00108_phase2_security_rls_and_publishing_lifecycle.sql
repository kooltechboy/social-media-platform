-- =============================================================================
-- Migration 00108: Phase 2 Security, RLS & Unified Publishing Lifecycle Hardening
-- Program: TUKUBI-RTP-001
-- Description:
--   1. Hardens post-00093 SECURITY DEFINER and trigger functions (SET search_path, REVOKE PUBLIC/anon)
--   2. Fixes IDOR in get_available_identities(UUID) while preserving JSONB return signature (00097)
--      and enforces community admin/moderator role check in can_publish_as
--   3. Enforces server-side price verification in place_order_with_escrow, restricts unverified
--      anonymous inserts on relief_donations, and restricts feed_activity_timeline (+ partitions)
--   4. Scopes post_external_media (including scheduled post guard), sound_licenses, and affiliate_referrals
--   5. Adds unified draft lifecycle columns (status, idempotency_key, published_post_id,
--      external_media, poll_payload, tagged_product_ids, last_error, schema_version) to creator_content_drafts
-- Rollback Strategy:
--   All schema changes are additive (ADD COLUMN IF NOT EXISTS) and policy/function
--   updates can be reverted by restoring prior definitions from 00097/00102/00103/00107.
-- =============================================================================

-- 1. Harden prevent_banned_tester_posts(), refresh_trending_signals(), and post-00093 trigger functions
DO $$
DECLARE
    v_fn RECORD;
BEGIN
    FOR v_fn IN
        SELECT p.oid::regprocedure AS fn_sig, p.proname
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname IN (
              'prevent_banned_tester_posts',
              'refresh_trending_signals',
              'sync_post_reactions_count',
              'sync_post_comments_count',
              'sync_post_shares_count',
              'handle_relief_donation_insert',
              'update_sound_usage_count',
              'sync_friend_counts_from_edges',
              'increment_campaign_raised',
              'process_affiliate_conversion',
              'purchase_event_ticket',
              'create_podcast_episode_with_post',
              'update_podcast_episode_counts'
          )
    LOOP
        EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', v_fn.fn_sig);
        IF v_fn.proname IN ('prevent_banned_tester_posts', 'refresh_trending_signals', 'sync_post_reactions_count', 'sync_post_comments_count', 'sync_post_shares_count', 'handle_relief_donation_insert') THEN
            EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', v_fn.fn_sig);
            EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', v_fn.fn_sig);
        END IF;
    END LOOP;
END $$;

-- 2. Fix IDOR in get_available_identities(p_user_id UUID) while preserving 00097 JSONB return type & all 6 identity categories
CREATE OR REPLACE FUNCTION public.get_available_identities(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_personal JSONB;
    v_official JSONB;
    v_creator JSONB;
    v_businesses JSONB;
    v_communities JSONB;
    v_active JSONB;
    v_is_platform_admin BOOLEAN := false;
BEGIN
    IF auth.role() <> 'service_role' AND p_user_id IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'Access denied: cannot query identities for another user';
    END IF;

    -- Check if user is platform admin
    SELECT EXISTS (
        SELECT 1 FROM public.accounts
        WHERE (profile_id = p_user_id OR id = p_user_id)
          AND role IN ('super_admin', 'superadmin', 'management', 'admin')
          AND status = 'active'
    ) INTO v_is_platform_admin;

    -- 1. Personal Profile
    SELECT jsonb_build_object(
        'id', id,
        'type', 'personal',
        'display_name', display_name,
        'handle', username,
        'avatar_url', avatar_url,
        'is_verified', is_verified,
        'badge', 'Personal'
    ) INTO v_personal
    FROM public.profiles
    WHERE id = p_user_id;

    -- 2. Official Account (if user is operator or platform admin)
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', p.id,
                'type', 'official',
                'display_name', p.display_name,
                'handle', p.username,
                'avatar_url', p.avatar_url,
                'is_verified', true,
                'badge', 'Official Platform'
            )
        ),
        '[]'::jsonb
    ) INTO v_official
    FROM public.official_accounts oa
    JOIN public.profiles p ON p.id = oa.profile_id
    WHERE oa.status = 'active'
      AND (
          v_is_platform_admin
          OR EXISTS (
              SELECT 1 FROM public.official_account_operators oao
              WHERE oao.official_account_id = oa.id
                AND oao.operator_profile_id = p_user_id
          )
      );

    -- 3. Creator Account (if exists)
    SELECT jsonb_build_object(
        'id', ca.id,
        'type', 'creator',
        'display_name', p.display_name || ' (Creator)',
        'handle', p.username,
        'avatar_url', p.avatar_url,
        'is_verified', ca.is_verified,
        'badge', 'Creator'
    ) INTO v_creator
    FROM public.creator_accounts ca
    JOIN public.profiles p ON p.id = ca.profile_id
    WHERE ca.profile_id = p_user_id;

    -- 4. Owned & Managed Business Pages
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', b.id,
                'type', 'business',
                'display_name', b.name,
                'handle', b.slug,
                'avatar_url', b.avatar_url,
                'is_verified', b.is_verified,
                'badge', 'Page & Store'
            )
        ),
        '[]'::jsonb
    ) INTO v_businesses
    FROM public.businesses b
    WHERE (
        b.owner_id = p_user_id
        OR EXISTS (
            SELECT 1 FROM public.page_roles pr
            WHERE pr.page_id = b.id
              AND pr.user_id = p_user_id
              AND pr.role IN ('owner', 'admin', 'editor')
        )
    )
    AND b.is_archived = false
    AND b.is_deactivated = false
    AND b.deleted_at IS NULL;

    -- 5. Managed Communities
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', c.id,
                'type', 'community',
                'display_name', c.name,
                'handle', c.slug,
                'avatar_url', c.cover_image_url,
                'is_verified', false,
                'badge', 'Hub Lead'
            )
        ),
        '[]'::jsonb
    ) INTO v_communities
    FROM public.community_members cm
    JOIN public.communities c ON c.id = cm.community_id
    WHERE cm.profile_id = p_user_id
      AND cm.role IN ('admin', 'moderator');

    -- 6. Current Active Identity
    SELECT jsonb_build_object(
        'identity_id', identity_id,
        'identity_type', identity_type
    ) INTO v_active
    FROM public.user_active_identity
    WHERE user_id = p_user_id;

    RETURN jsonb_build_object(
        'personal', v_personal,
        'official', v_official,
        'creator', v_creator,
        'businesses', v_businesses,
        'communities', v_communities,
        'active', COALESCE(v_active, jsonb_build_object('identity_id', p_user_id, 'identity_type', 'personal'))
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_available_identities(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_available_identities(UUID) TO authenticated, service_role;

-- 3. Harden can_publish_as so 'community' entity publishing requires community admin/moderator or creator_id
CREATE OR REPLACE FUNCTION public.can_publish_as(
    p_publisher_type TEXT,
    p_publisher_entity_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_is_platform_admin BOOLEAN := false;
BEGIN
    IF p_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.accounts
        WHERE (profile_id = p_user_id OR id = p_user_id)
          AND role IN ('super_admin', 'superadmin', 'management', 'admin')
          AND status = 'active'
    ) INTO v_is_platform_admin;

    IF p_publisher_type = 'personal' THEN
        RETURN p_publisher_entity_id = p_user_id;

    ELSIF p_publisher_type = 'official' THEN
        IF v_is_platform_admin THEN
            RETURN TRUE;
        END IF;

        RETURN EXISTS (
            SELECT 1
            FROM public.official_account_operators oao
            JOIN public.official_accounts oa ON oa.id = oao.official_account_id
            WHERE (oa.id = p_publisher_entity_id OR oa.profile_id = p_publisher_entity_id)
              AND oao.operator_profile_id = p_user_id
              AND oa.status = 'active'
              AND oao.role IN ('owner', 'administrator', 'editor', 'publisher')
        );

    ELSIF p_publisher_type = 'page' THEN
        IF v_is_platform_admin THEN
            RETURN TRUE;
        END IF;

        RETURN EXISTS (
            SELECT 1 FROM public.businesses b
            WHERE b.id = p_publisher_entity_id
              AND b.is_archived = false
              AND b.deleted_at IS NULL
              AND (
                  b.owner_id = p_user_id
                  OR EXISTS (
                      SELECT 1 FROM public.page_roles pr
                      WHERE pr.page_id = b.id
                        AND pr.user_id = p_user_id
                        AND pr.role IN ('owner', 'admin', 'editor')
                  )
              )
        );

    ELSIF p_publisher_type = 'community' THEN
        IF v_is_platform_admin THEN
            RETURN TRUE;
        END IF;

        RETURN EXISTS (
            SELECT 1 FROM public.communities c
            WHERE c.id = p_publisher_entity_id
              AND c.creator_id = p_user_id
        ) OR EXISTS (
            SELECT 1 FROM public.community_members cm
            WHERE cm.community_id = p_publisher_entity_id
              AND cm.profile_id = p_user_id
              AND cm.membership_status = 'active'
              AND cm.role IN ('admin', 'moderator')
        );

    ELSIF p_publisher_type = 'creator' THEN
        RETURN EXISTS (
            SELECT 1 FROM public.creator_accounts ca
            WHERE (ca.id = p_publisher_entity_id OR ca.profile_id = p_publisher_entity_id)
              AND ca.profile_id = p_user_id
        );
    END IF;

    RETURN FALSE;
END;
$$;

REVOKE ALL ON FUNCTION public.can_publish_as(TEXT, UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_publish_as(TEXT, UUID, UUID) TO authenticated, service_role;

-- 4. Harden place_order_with_escrow to enforce authoritative server-side product/variant pricing
CREATE OR REPLACE FUNCTION public.place_order_with_escrow(
    p_buyer_id UUID,
    p_seller_id UUID,
    p_items JSONB,
    p_subtotal_minor INTEGER,
    p_platform_fee_minor INTEGER,
    p_total_minor INTEGER,
    p_currency VARCHAR(3) DEFAULT 'USD',
    p_idempotency_key VARCHAR(128) DEFAULT NULL,
    p_shipping_address JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_existing_order_id UUID;
    v_existing_escrow_status VARCHAR(24);
    v_order_id UUID;
    v_item JSONB;
    v_product_id UUID;
    v_variant_id UUID;
    v_qty INTEGER;
    v_unit_price INTEGER;
    v_line_total INTEGER;
    v_computed_subtotal INTEGER := 0;
    v_effective_fee INTEGER := GREATEST(COALESCE(p_platform_fee_minor, 0), 0);
    v_product RECORD;
    v_variant RECORD;
BEGIN
    IF auth.role() <> 'service_role' AND (auth.uid() IS NULL OR NOT (auth.uid() = p_buyer_id)) THEN
        RAISE EXCEPTION 'Unauthorized: Caller (auth.uid() = %) does not match buyer_id (%)', auth.uid(), p_buyer_id;
    END IF;

    IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
        SELECT id, escrow_status
        INTO v_existing_order_id, v_existing_escrow_status
        FROM public.orders
        WHERE idempotency_key = p_idempotency_key;

        IF FOUND THEN
            RETURN jsonb_build_object(
                'success', true,
                'order_id', v_existing_order_id,
                'escrow_status', v_existing_escrow_status,
                'idempotent_replay', true
            );
        END IF;
    ELSE
        p_idempotency_key := 'ord_' || gen_random_uuid()::TEXT;
    END IF;

    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Order must contain at least one line item.';
    END IF;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_variant_id := NULLIF(v_item->>'variant_id', '')::UUID;
        v_qty := COALESCE((v_item->>'quantity')::INTEGER, 1);

        IF v_qty <= 0 THEN
            RAISE EXCEPTION 'Quantity for product % must be greater than zero.', v_product_id;
        END IF;

        SELECT id, is_active, inventory_count, seller_id, price_minor
        INTO v_product
        FROM public.products
        WHERE id = v_product_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product % not found.', v_product_id;
        END IF;

        IF NOT v_product.is_active THEN
            RAISE EXCEPTION 'Product % is not active.', v_product_id;
        END IF;

        IF v_product.inventory_count IS NOT NULL AND v_product.inventory_count < v_qty THEN
            RAISE EXCEPTION 'Insufficient stock for product % (available: %, requested: %).',
                v_product_id, v_product.inventory_count, v_qty;
        END IF;

        IF p_seller_id IS NULL THEN
            p_seller_id := v_product.seller_id;
        END IF;

        IF v_product.inventory_count IS NOT NULL THEN
            UPDATE public.products
            SET inventory_count = inventory_count - v_qty
            WHERE id = v_product_id;
        END IF;

        v_unit_price := v_product.price_minor;

        IF v_variant_id IS NOT NULL THEN
            SELECT id, is_active, inventory_count, price_minor
            INTO v_variant
            FROM public.product_variants
            WHERE id = v_variant_id AND product_id = v_product_id
            FOR UPDATE;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Variant % for product % not found.', v_variant_id, v_product_id;
            END IF;

            IF NOT v_variant.is_active THEN
                RAISE EXCEPTION 'Variant % is not active.', v_variant_id;
            END IF;

            IF v_variant.inventory_count IS NOT NULL AND v_variant.inventory_count < v_qty THEN
                RAISE EXCEPTION 'Insufficient stock for variant % (available: %, requested: %).',
                    v_variant_id, v_variant.inventory_count, v_qty;
            END IF;

            IF v_variant.inventory_count IS NOT NULL THEN
                UPDATE public.product_variants
                SET inventory_count = inventory_count - v_qty
                WHERE id = v_variant_id;
            END IF;

            IF v_variant.price_minor IS NOT NULL THEN
                v_unit_price := v_variant.price_minor;
            END IF;
        END IF;

        v_unit_price := COALESCE(v_unit_price, GREATEST((v_item->>'unit_price_minor')::INTEGER, 0));
        v_computed_subtotal := v_computed_subtotal + (v_unit_price * v_qty);
    END LOOP;

    INSERT INTO public.orders (
        buyer_id,
        seller_id,
        status,
        escrow_status,
        subtotal_minor,
        platform_fee_minor,
        total_minor,
        currency,
        idempotency_key,
        shipping_address,
        created_at
    ) VALUES (
        p_buyer_id,
        p_seller_id,
        'paid'::public.order_status,
        'held',
        v_computed_subtotal,
        v_effective_fee,
        v_computed_subtotal + v_effective_fee,
        p_currency,
        p_idempotency_key,
        p_shipping_address,
        now()
    ) RETURNING id INTO v_order_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_variant_id := NULLIF(v_item->>'variant_id', '')::UUID;
        v_qty := COALESCE((v_item->>'quantity')::INTEGER, 1);

        SELECT price_minor INTO v_unit_price FROM public.products WHERE id = v_product_id;
        IF v_variant_id IS NOT NULL THEN
            SELECT COALESCE(price_minor, v_unit_price) INTO v_unit_price
            FROM public.product_variants
            WHERE id = v_variant_id AND product_id = v_product_id;
        END IF;
        v_unit_price := COALESCE(v_unit_price, GREATEST((v_item->>'unit_price_minor')::INTEGER, 0));
        v_line_total := v_unit_price * v_qty;

        INSERT INTO public.order_items (
            order_id,
            product_id,
            variant_id,
            quantity,
            unit_price_minor,
            line_total_minor
        ) VALUES (
            v_order_id,
            v_product_id,
            v_variant_id,
            v_qty,
            v_unit_price,
            v_line_total
        );
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'escrow_status', 'held'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.place_order_with_escrow(UUID, UUID, JSONB, INTEGER, INTEGER, INTEGER, VARCHAR, VARCHAR, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_order_with_escrow(UUID, UUID, JSONB, INTEGER, INTEGER, INTEGER, VARCHAR, VARCHAR, JSONB) TO authenticated, service_role;

-- 5. Restrict unverified anonymous inserts on public.relief_donations
REVOKE INSERT ON public.relief_donations FROM anon;
DROP POLICY IF EXISTS "Authenticated or authorized donors can insert donations" ON public.relief_donations;
CREATE POLICY "Authenticated or authorized donors can insert donations"
    ON public.relief_donations
    FOR INSERT
    TO authenticated, service_role
    WITH CHECK (
        auth.role() = 'service_role'
        OR (
            auth.role() = 'authenticated'
            AND donor_id = (SELECT auth.uid())
            AND idempotency_key IS NOT NULL
        )
    );

-- 6. Restrict feed_activity_timeline (+ partitions) INSERT policy to service_role or self-owned rows
DROP POLICY IF EXISTS "feed_timeline_insert_service" ON public.feed_activity_timeline;
CREATE POLICY "feed_timeline_insert_service"
    ON public.feed_activity_timeline
    FOR INSERT
    TO authenticated, service_role
    WITH CHECK (auth.role() = 'service_role' OR user_id = (SELECT auth.uid()));

DO $$
DECLARE
    v_part TEXT;
BEGIN
    FOREACH v_part IN ARRAY ARRAY[
        'feed_activity_timeline_2026_02',
        'feed_activity_timeline_2026_03',
        'feed_activity_timeline_2026_04',
        'feed_activity_timeline_2026_05',
        'feed_activity_timeline_2026_06',
        'feed_activity_timeline_2026_07',
        'feed_activity_timeline_2026_08',
        'feed_activity_timeline_2026_10',
        'feed_activity_timeline_2026_12'
    ]
    LOOP
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = v_part) THEN
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'policy_insert_' || v_part, v_part);
            EXECUTE format(
                'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated, service_role WITH CHECK (auth.role() = ''service_role'' OR user_id = (SELECT auth.uid()))',
                'policy_insert_' || v_part,
                v_part
            );
        END IF;
    END LOOP;
END $$;

-- 7. Scope post_external_media SELECT policy to visible, published parent posts
DROP POLICY IF EXISTS "Public read post external media" ON public.post_external_media;
CREATE POLICY "Public read post external media"
    ON public.post_external_media
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.posts p
            WHERE p.id = post_external_media.post_id
              AND (
                  p.author_id = (SELECT auth.uid())
                  OR auth.role() = 'service_role'
                  OR (
                      (p.post_status IS NULL OR p.post_status = 'published')
                      AND (p.scheduled_at IS NULL OR p.scheduled_at <= now())
                      AND p.visibility IN ('public', 'followers', 'friends')
                  )
              )
        )
    );

-- 8. Restrict sound_licenses and affiliate_referrals SELECT to owner or service_role
DROP POLICY IF EXISTS "sound_licenses_public_select" ON public.sound_licenses;
DROP POLICY IF EXISTS "sound_licenses_owner_select" ON public.sound_licenses;
CREATE POLICY "sound_licenses_owner_select"
    ON public.sound_licenses
    FOR SELECT
    USING (
        auth.role() = 'service_role'
        OR EXISTS (
            SELECT 1 FROM public.sounds s
            WHERE s.id = sound_licenses.sound_id
              AND s.creator_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Public read affiliate referrals" ON public.affiliate_referrals;
DROP POLICY IF EXISTS "Owner read affiliate referrals" ON public.affiliate_referrals;
CREATE POLICY "Owner read affiliate referrals"
    ON public.affiliate_referrals
    FOR SELECT
    USING (
        auth.role() = 'service_role'
        OR affiliate_id = (SELECT auth.uid())
        OR referred_user_id = (SELECT auth.uid())
    );

-- 9. Unified Draft Lifecycle Schema Enhancements on public.creator_content_drafts
ALTER TABLE public.creator_content_drafts
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'validating', 'uploading', 'processing', 'published', 'failed', 'discarded')),
    ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
    ADD COLUMN IF NOT EXISTS published_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS external_media JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS poll_payload JSONB,
    ADD COLUMN IF NOT EXISTS tagged_product_ids UUID[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS last_error TEXT,
    ADD COLUMN IF NOT EXISTS schema_version INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_creator_content_drafts_creator_status
    ON public.creator_content_drafts(creator_id, status, updated_at DESC);
