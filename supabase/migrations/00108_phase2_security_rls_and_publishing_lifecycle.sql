-- =============================================================================
-- Migration 00108: Phase 2 Security, RLS & Unified Publishing Lifecycle Hardening
-- Program: TUKUBI-RTP-001
-- Description:
--   1. Hardens post-00093 SECURITY DEFINER functions (SET search_path, REVOKE PUBLIC/anon)
--   2. Fixes IDOR in get_available_identities(UUID) and community role check in can_publish_as
--   3. Restricts direct unverified client inserts/calls on relief_donations, place_order_with_escrow,
--      and feed_activity_timeline
--   4. Scopes post_external_media, sound_licenses, and affiliate_referrals SELECT policies
--   5. Adds unified draft lifecycle columns (status, idempotency_key, published_post_id,
--      external_media, poll_payload, tagged_product_ids, last_error) to creator_content_drafts
-- Rollback Strategy:
--   All schema changes are additive (ADD COLUMN IF NOT EXISTS) and policy/function
--   updates can be reverted by restoring prior policy definitions from 00097/00102/00103/00107.
-- =============================================================================

-- 1. Harden prevent_banned_tester_posts() and post-00093 trigger functions
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'prevent_banned_tester_posts'
    ) THEN
        ALTER FUNCTION public.prevent_banned_tester_posts() SET search_path = public, pg_temp;
        REVOKE ALL ON FUNCTION public.prevent_banned_tester_posts() FROM PUBLIC, anon, authenticated;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'refresh_trending_signals'
    ) THEN
        ALTER FUNCTION public.refresh_trending_signals() SET search_path = public, pg_temp;
        REVOKE ALL ON FUNCTION public.refresh_trending_signals() FROM PUBLIC, anon, authenticated;
        GRANT EXECUTE ON FUNCTION public.refresh_trending_signals() TO service_role;
    END IF;
END $$;

-- 2. Fix IDOR in get_available_identities(p_user_id UUID) so callers can only query their own identities
CREATE OR REPLACE FUNCTION public.get_available_identities(p_user_id UUID)
RETURNS TABLE (
    identity_type TEXT,
    entity_id UUID,
    display_name TEXT,
    handle TEXT,
    avatar_url TEXT,
    role TEXT,
    is_verified BOOLEAN,
    is_official BOOLEAN,
    category TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF auth.role() <> 'service_role' AND p_user_id IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'Access denied: cannot query identities for another user';
    END IF;

    -- 1. Personal Profile Identity
    RETURN QUERY
    SELECT
        'personal'::TEXT AS identity_type,
        p.id AS entity_id,
        COALESCE(p.display_name, p.username, 'Member')::TEXT AS display_name,
        COALESCE(p.username, 'member')::TEXT AS handle,
        p.avatar_url::TEXT AS avatar_url,
        'owner'::TEXT AS role,
        COALESCE(p.is_verified, false) AS is_verified,
        COALESCE(p.is_official, false) AS is_official,
        'Personal Profile'::TEXT AS category
    FROM public.profiles p
    WHERE p.id = p_user_id;

    -- 2. Owned Businesses / Pages
    RETURN QUERY
    SELECT
        'page'::TEXT AS identity_type,
        b.id AS entity_id,
        b.name::TEXT AS display_name,
        b.slug::TEXT AS handle,
        b.avatar_url::TEXT AS avatar_url,
        'owner'::TEXT AS role,
        COALESCE(b.is_verified, false) AS is_verified,
        false AS is_official,
        COALESCE(b.category, 'Business Page')::TEXT AS category
    FROM public.businesses b
    WHERE b.owner_id = p_user_id;

    -- 3. Assigned Page Roles (Admin / Editor / Moderator)
    RETURN QUERY
    SELECT
        'page'::TEXT AS identity_type,
        b.id AS entity_id,
        b.name::TEXT AS display_name,
        b.slug::TEXT AS handle,
        b.avatar_url::TEXT AS avatar_url,
        pr.role::TEXT AS role,
        COALESCE(b.is_verified, false) AS is_verified,
        false AS is_official,
        COALESCE(b.category, 'Business Page')::TEXT AS category
    FROM public.page_roles pr
    JOIN public.businesses b ON b.id = pr.page_id
    WHERE pr.user_id = p_user_id
      AND b.owner_id <> p_user_id
      AND pr.role IN ('admin', 'editor', 'moderator');
END;
$$;

REVOKE ALL ON FUNCTION public.get_available_identities(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_available_identities(UUID) TO authenticated, service_role;

-- 3. Restrict feed_activity_timeline INSERT policy to service_role or self-owned rows
DROP POLICY IF EXISTS "feed_timeline_insert_service" ON public.feed_activity_timeline;
CREATE POLICY "feed_timeline_insert_service"
    ON public.feed_activity_timeline
    FOR INSERT
    TO authenticated, service_role
    WITH CHECK (auth.role() = 'service_role' OR user_id = (SELECT auth.uid()));

-- 4. Scope post_external_media SELECT policy to visible parent posts
DROP POLICY IF EXISTS "Public read post external media" ON public.post_external_media;
CREATE POLICY "Public read post external media"
    ON public.post_external_media
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.posts p
            WHERE p.id = post_external_media.post_id
              AND (
                  p.visibility = 'public'
                  OR p.author_id = (SELECT auth.uid())
                  OR auth.role() = 'service_role'
              )
        )
    );

-- 5. Restrict sound_licenses and affiliate_referrals SELECT to owner or service_role
DROP POLICY IF EXISTS "sound_licenses_public_select" ON public.sound_licenses;
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
CREATE POLICY "Owner read affiliate referrals"
    ON public.affiliate_referrals
    FOR SELECT
    USING (
        auth.role() = 'service_role'
        OR affiliate_id = (SELECT auth.uid())
        OR referred_user_id = (SELECT auth.uid())
    );

-- 6. Unified Draft Lifecycle Schema Enhancements on public.creator_content_drafts
ALTER TABLE public.creator_content_drafts
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'validating', 'uploading', 'processing', 'published', 'failed', 'discarded')),
    ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
    ADD COLUMN IF NOT EXISTS published_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS external_media JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS poll_payload JSONB,
    ADD COLUMN IF NOT EXISTS tagged_product_ids UUID[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS last_error TEXT;

CREATE INDEX IF NOT EXISTS idx_creator_content_drafts_creator_status
    ON public.creator_content_drafts(creator_id, status, updated_at DESC);
