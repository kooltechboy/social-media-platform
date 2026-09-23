-- Migration 00097: Definitive Publisher Identity, Actor Model & Content Distribution Architecture
-- Description:
--   1. Separates initiating human user (created_by_user_id) from publishing entity (publisher_type, publisher_entity_id).
--   2. Establishes first-class publisher classification: 'personal', 'official', 'page', 'community', 'creator'.
--   3. Implements first-class reposting/sharing architecture (shared_post_id, share_commentary).
--   4. Extends comments and notifications with actor_type and entity tracking.
--   5. Implements security definer helper public.can_publish_as() to prevent client-side impersonation.
--   6. Hardens RLS policies on public.posts and public.comments to strictly validate publisher authorization.
--   7. Backfills existing posts with guaranteed zero data loss.

BEGIN;

-- =============================================================================
-- 1. EXTEND PUBLIC.POSTS WITH PUBLISHER IDENTITY & REPOST ATTRIBUTES
-- =============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'publisher_type_enum'
    ) THEN
        CREATE TYPE public.publisher_type_enum AS ENUM (
            'personal',
            'official',
            'page',
            'community',
            'creator'
        );
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.posts
    ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS publisher_type VARCHAR(30) DEFAULT 'personal' NOT NULL
        CHECK (publisher_type IN ('personal', 'official', 'page', 'community', 'creator')),
    ADD COLUMN IF NOT EXISTS publisher_entity_id UUID,
    ADD COLUMN IF NOT EXISTS shared_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS share_commentary TEXT;

-- Composite indexes for lightning-fast feed resolution and author queries
CREATE INDEX IF NOT EXISTS idx_posts_publisher_type_entity
    ON public.posts(publisher_type, publisher_entity_id);

CREATE INDEX IF NOT EXISTS idx_posts_created_by
    ON public.posts(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_posts_shared_post
    ON public.posts(shared_post_id)
    WHERE shared_post_id IS NOT NULL;

-- =============================================================================
-- 2. EXTEND PUBLIC.COMMENTS WITH PUBLISHER IDENTITY
-- =============================================================================

ALTER TABLE public.comments
    ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS publisher_type VARCHAR(30) DEFAULT 'personal' NOT NULL
        CHECK (publisher_type IN ('personal', 'official', 'page', 'community', 'creator')),
    ADD COLUMN IF NOT EXISTS publisher_entity_id UUID,
    ADD COLUMN IF NOT EXISTS page_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_comments_publisher
    ON public.comments(publisher_type, publisher_entity_id);

CREATE INDEX IF NOT EXISTS idx_comments_page_id
    ON public.comments(page_id)
    WHERE page_id IS NOT NULL;

-- =============================================================================
-- 3. EXTEND PUBLIC.NOTIFICATIONS WITH ACTOR CLASSIFICATION
-- =============================================================================

ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS actor_type VARCHAR(30) DEFAULT 'personal' NOT NULL
        CHECK (actor_type IN ('personal', 'official', 'page', 'community', 'creator')),
    ADD COLUMN IF NOT EXISTS actor_entity_id UUID;

CREATE INDEX IF NOT EXISTS idx_notifications_actor_type
    ON public.notifications(actor_type, actor_entity_id);

-- =============================================================================
-- 4. BACKFILL EXISTING POSTS & COMMENTS (ZERO DATA LOSS)
-- =============================================================================

-- 4.1 Ensure created_by_user_id is populated from author_id
UPDATE public.posts
SET created_by_user_id = author_id
WHERE created_by_user_id IS NULL;

-- 4.2 Backfill official posts
UPDATE public.posts
SET publisher_type = 'official',
    publisher_entity_id = author_id
WHERE is_official = true
   OR author_id IN (SELECT profile_id FROM public.official_accounts WHERE status = 'active');

-- 4.3 Backfill page posts
UPDATE public.posts
SET publisher_type = 'page',
    publisher_entity_id = page_id
WHERE page_id IS NOT NULL
  AND publisher_type = 'personal';

-- 4.4 Backfill community posts (if explicitly in a community and not a page post)
UPDATE public.posts
SET publisher_type = 'community',
    publisher_entity_id = community_id
WHERE community_id IS NOT NULL
  AND page_id IS NULL
  AND publisher_type = 'personal'
  AND is_official = false;

-- 4.5 Backfill default publisher_entity_id for personal posts
UPDATE public.posts
SET publisher_entity_id = author_id
WHERE publisher_entity_id IS NULL;

-- 4.6 Comments backfill
UPDATE public.comments
SET created_by_user_id = author_id,
    publisher_entity_id = author_id
WHERE created_by_user_id IS NULL;

-- =============================================================================
-- 5. SERVER-SIDE & DATABASE AUTHORIZATION FUNCTIONS
-- =============================================================================

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

    -- Check if user is platform admin
    SELECT EXISTS (
        SELECT 1 FROM public.accounts
        WHERE (profile_id = p_user_id OR id = p_user_id)
          AND role IN ('super_admin', 'superadmin', 'management', 'admin')
          AND status = 'active'
    ) INTO v_is_platform_admin;

    -- Case 1: Personal profile publishing
    IF p_publisher_type = 'personal' THEN
        RETURN p_publisher_entity_id = p_user_id;

    -- Case 2: Official account publishing
    ELSIF p_publisher_type = 'official' THEN
        IF v_is_platform_admin THEN
            RETURN TRUE;
        END IF;

        -- Verify operator permission on the official account
        RETURN EXISTS (
            SELECT 1 
            FROM public.official_account_operators oao
            JOIN public.official_accounts oa ON oa.id = oao.official_account_id
            WHERE (oa.id = p_publisher_entity_id OR oa.profile_id = p_publisher_entity_id)
              AND oao.operator_profile_id = p_user_id
              AND oa.status = 'active'
              AND oao.role IN ('owner', 'administrator', 'editor', 'publisher')
        );

    -- Case 3: Page / Business publishing
    ELSIF p_publisher_type = 'page' THEN
        IF v_is_platform_admin THEN
            RETURN TRUE;
        END IF;

        -- Verify owner or authorized page role
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

    -- Case 4: Community publishing
    ELSIF p_publisher_type = 'community' THEN
        IF v_is_platform_admin THEN
            RETURN TRUE;
        END IF;

        RETURN EXISTS (
            SELECT 1 FROM public.community_members cm
            WHERE cm.community_id = p_publisher_entity_id
              AND cm.profile_id = p_user_id
              AND cm.membership_status = 'active'
        );

    -- Case 5: Creator publishing
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

GRANT EXECUTE ON FUNCTION public.can_publish_as(TEXT, UUID, UUID) TO anon, authenticated, service_role;

-- =============================================================================
-- 6. HARDENED POSTS RLS POLICIES (PREVENT IMPERSONATION)
-- =============================================================================

-- Drop legacy insert policy
DROP POLICY IF EXISTS "Authors can insert posts" ON public.posts;

-- Enforce strict publisher authorization on INSERT
CREATE POLICY "Authorized publishers can insert posts" ON public.posts
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Initiating user must match authenticated session
        auth.uid() = created_by_user_id
        AND public.can_publish_as(publisher_type, publisher_entity_id, auth.uid())
    );

-- Update policy: Author, Creator, or Page/Official Managers
DROP POLICY IF EXISTS "Authors can update own posts" ON public.posts;
CREATE POLICY "Authorized publishers can update posts" ON public.posts
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = created_by_user_id
        OR auth.uid() = author_id
        OR (publisher_type = 'page' AND public.can_manage_page(publisher_entity_id, auth.uid()))
        OR (publisher_type = 'official' AND public.is_official_account_operator(publisher_entity_id, auth.uid(), 'editor'))
        OR public.is_admin()
    )
    WITH CHECK (
        auth.uid() = created_by_user_id
        OR auth.uid() = author_id
        OR (publisher_type = 'page' AND public.can_manage_page(publisher_entity_id, auth.uid()))
        OR (publisher_type = 'official' AND public.is_official_account_operator(publisher_entity_id, auth.uid(), 'editor'))
        OR public.is_admin()
    );

-- Delete policy: Author, Creator, or Page/Official Managers
DROP POLICY IF EXISTS "Authors can delete own posts" ON public.posts;
CREATE POLICY "Authorized publishers can delete posts" ON public.posts
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() = created_by_user_id
        OR auth.uid() = author_id
        OR (publisher_type = 'page' AND public.can_manage_page(publisher_entity_id, auth.uid()))
        OR (publisher_type = 'official' AND public.is_official_account_operator(publisher_entity_id, auth.uid(), 'administrator'))
        OR public.is_admin()
    );

-- =============================================================================
-- 7. HARDENED COMMENTS RLS POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Insert comments policy" ON public.comments;
CREATE POLICY "Authorized publishers can insert comments" ON public.comments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = created_by_user_id
        AND public.can_publish_as(publisher_type, publisher_entity_id, auth.uid())
        AND (
            (post_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id))
            OR (video_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.videos v WHERE v.id = video_id))
        )
    );

-- =============================================================================
-- 8. ENHANCED GET_AVAILABLE_IDENTITIES (OFFICIAL + PAGES + CREATOR + COMMUNITY)
-- =============================================================================

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

GRANT EXECUTE ON FUNCTION public.get_available_identities(UUID) TO authenticated, service_role;

-- =============================================================================
-- 9. ENHANCED SWITCH_ACTIVE_IDENTITY
-- =============================================================================

CREATE OR REPLACE FUNCTION public.switch_active_identity(
    p_identity_id UUID,
    p_identity_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_is_authorized BOOLEAN := false;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Validate authorization using unified helper
    v_is_authorized := public.can_publish_as(
        CASE WHEN p_identity_type = 'business' THEN 'page' ELSE p_identity_type END,
        p_identity_id,
        v_user_id
    );

    IF NOT v_is_authorized THEN
        RAISE EXCEPTION 'User not authorized to switch to identity % of type %', p_identity_id, p_identity_type;
    END IF;

    INSERT INTO public.user_active_identity (user_id, identity_id, identity_type, updated_at)
    VALUES (v_user_id, p_identity_id, p_identity_type, now())
    ON CONFLICT (user_id)
    DO UPDATE SET identity_id = EXCLUDED.identity_id,
                  identity_type = EXCLUDED.identity_type,
                  updated_at = now();

    RETURN jsonb_build_object(
        'status', 'success',
        'active_identity_id', p_identity_id,
        'active_identity_type', p_identity_type
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.switch_active_identity(UUID, TEXT) TO authenticated, service_role;

COMMIT;
