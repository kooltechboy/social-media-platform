-- =============================================================================
-- Migration 00089: Favorites System & Multi-Identity Switcher Architecture
-- =============================================================================
-- Description:
--   1. Implements public.user_favorites table supporting:
--      - Friends, Creators, Pages, Businesses, and Communities designated as favorites.
--      - Full Row Level Security (RLS) ensuring privacy and user ownership.
--      - Efficient indexation for feed filtering and recommendation scoring.
--      - Atomic toggle_favorite() RPC for instant optimistic client interaction.
--   2. Implements Multi-Identity Operating System:
--      - public.user_operating_identities table to store user identity preferences.
--      - public.get_available_identities() RPC returning personal profile,
--        creator account, owned business pages, and managed community hubs.
--      - public.switch_active_identity() RPC to safely persist active operating mode.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Favorites System: user_favorites
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    target_id UUID NOT NULL,
    target_type VARCHAR(20) CHECK (target_type IN ('profile', 'friend', 'creator', 'page', 'business', 'community')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT uq_user_favorites_target UNIQUE (user_id, target_id, target_type)
);

-- Indexing for fast feed lookups and entity existence checks
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_type
    ON public.user_favorites (user_id, target_type);

CREATE INDEX IF NOT EXISTS idx_user_favorites_target
    ON public.user_favorites (target_id);

-- Enable RLS
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_favorites_select_own" ON public.user_favorites;
CREATE POLICY "user_favorites_select_own"
    ON public.user_favorites
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_favorites_insert_own" ON public.user_favorites;
CREATE POLICY "user_favorites_insert_own"
    ON public.user_favorites
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_favorites_delete_own" ON public.user_favorites;
CREATE POLICY "user_favorites_delete_own"
    ON public.user_favorites
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Grants
GRANT SELECT, INSERT, DELETE ON public.user_favorites TO authenticated;
GRANT SELECT ON public.user_favorites TO service_role;

-- -----------------------------------------------------------------------------
-- 2. Favorites RPC Functions
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.toggle_favorite(
    p_target_id UUID,
    p_target_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_existing_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_target_type NOT IN ('profile', 'friend', 'creator', 'page', 'business', 'community') THEN
        RAISE EXCEPTION 'Invalid target type: %', p_target_type;
    END IF;

    SELECT id INTO v_existing_id
    FROM public.user_favorites
    WHERE user_id = v_user_id
      AND target_id = p_target_id
      AND target_type = p_target_type;

    IF v_existing_id IS NOT NULL THEN
        DELETE FROM public.user_favorites WHERE id = v_existing_id;
        RETURN jsonb_build_object('status', 'success', 'is_favorite', false, 'target_id', p_target_id);
    ELSE
        INSERT INTO public.user_favorites (user_id, target_id, target_type)
        VALUES (v_user_id, p_target_id, p_target_type);
        RETURN jsonb_build_object('status', 'success', 'is_favorite', true, 'target_id', p_target_id);
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_favorite(UUID, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 3. Multi-Identity Switcher Architecture
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_active_identity (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    identity_id UUID NOT NULL,
    identity_type VARCHAR(20) CHECK (identity_type IN ('personal', 'creator', 'business', 'community')) DEFAULT 'personal' NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.user_active_identity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_active_identity_select_own" ON public.user_active_identity;
CREATE POLICY "user_active_identity_select_own"
    ON public.user_active_identity
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_active_identity_upsert_own" ON public.user_active_identity;
CREATE POLICY "user_active_identity_upsert_own"
    ON public.user_active_identity
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_active_identity TO authenticated;
GRANT ALL ON public.user_active_identity TO service_role;

-- RPC to retrieve all operational identities available to a user
CREATE OR REPLACE FUNCTION public.get_available_identities(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_personal JSONB;
    v_creator JSONB;
    v_businesses JSONB;
    v_communities JSONB;
    v_active JSONB;
BEGIN
    -- 1. Personal Profile
    SELECT jsonb_build_object(
        'id', id,
        'type', 'personal',
        'display_name', display_name,
        'handle', username,
        'avatar_url', avatar_url,
        'is_verified', is_verified,
        'badge', CASE WHEN username = 'tukubi' THEN 'Official' ELSE NULL END
    ) INTO v_personal
    FROM public.profiles
    WHERE id = p_user_id;

    -- 2. Creator Account (if exists)
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

    -- 3. Owned Businesses / Pages
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', b.id,
                'type', 'business',
                'display_name', b.name,
                'handle', b.slug,
                'avatar_url', NULL,
                'is_verified', b.is_verified,
                'badge', 'Page & Store'
            )
        ),
        '[]'::jsonb
    ) INTO v_businesses
    FROM public.businesses b
    WHERE b.owner_id = p_user_id;

    -- 4. Managed Communities
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

    -- 5. Current Active Identity
    SELECT jsonb_build_object(
        'identity_id', identity_id,
        'identity_type', identity_type
    ) INTO v_active
    FROM public.user_active_identity
    WHERE user_id = p_user_id;

    RETURN jsonb_build_object(
        'personal', v_personal,
        'creator', v_creator,
        'businesses', v_businesses,
        'communities', v_communities,
        'active', COALESCE(v_active, jsonb_build_object('identity_id', p_user_id, 'identity_type', 'personal'))
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_available_identities(UUID) TO authenticated;

-- RPC to switch active operating identity
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

    -- Authorization Verification
    IF p_identity_type = 'personal' AND p_identity_id = v_user_id THEN
        v_is_authorized := true;
    ELSIF p_identity_type = 'creator' THEN
        SELECT EXISTS(
            SELECT 1 FROM public.creator_accounts
            WHERE (id = p_identity_id OR profile_id = p_identity_id)
              AND profile_id = v_user_id
        ) INTO v_is_authorized;
    ELSIF p_identity_type = 'business' THEN
        SELECT EXISTS(
            SELECT 1 FROM public.businesses
            WHERE id = p_identity_id AND owner_id = v_user_id
        ) INTO v_is_authorized;
    ELSIF p_identity_type = 'community' THEN
        SELECT EXISTS(
            SELECT 1 FROM public.community_members
            WHERE community_id = p_identity_id
              AND profile_id = v_user_id
              AND role IN ('admin', 'moderator')
        ) INTO v_is_authorized;
    END IF;

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

GRANT EXECUTE ON FUNCTION public.switch_active_identity(UUID, TEXT) TO authenticated;

COMMIT;
