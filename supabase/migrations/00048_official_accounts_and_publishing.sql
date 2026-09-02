-- Migration 00048: Official Accounts Framework, Operator RBAC, Bot Draft Pipeline & Reserved Usernames
-- Description: Establishes extensible official account registry, operator management model,
--              draft approval workflow for human operators and automated bots, database-level
--              username reservation enforcement, and official post indicators.

-- =============================================================================
-- 1. ENHANCE PUBLIC.PROFILES WITH OFFICIAL ACCOUNT ATTRIBUTES
-- =============================================================================

ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS is_official BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_system_account BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_is_official ON public.profiles(is_official);
CREATE INDEX IF NOT EXISTS idx_profiles_is_system_account ON public.profiles(is_system_account);

-- =============================================================================
-- 2. OFFICIAL ACCOUNT CLASSIFICATION & REGISTRY
-- =============================================================================

DO $$ BEGIN
    CREATE TYPE public.official_account_classification AS ENUM (
        'official_platform',
        'official_support',
        'official_creator',
        'official_business',
        'official_culture',
        'official_diaspora',
        'official_news'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.official_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    classification public.official_account_classification NOT NULL DEFAULT 'official_platform',
    department VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    is_system_account BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_official_accounts_profile ON public.official_accounts(profile_id);
CREATE INDEX IF NOT EXISTS idx_official_accounts_classification ON public.official_accounts(classification);
CREATE INDEX IF NOT EXISTS idx_official_accounts_status ON public.official_accounts(status);

-- =============================================================================
-- 3. HUMAN OPERATOR MODEL (RBAC FOR OFFICIAL ACCOUNTS)
-- =============================================================================

DO $$ BEGIN
    CREATE TYPE public.official_account_operator_role AS ENUM (
        'owner',
        'administrator',
        'editor',
        'publisher',
        'moderator'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.official_account_operators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    official_account_id UUID NOT NULL REFERENCES public.official_accounts(id) ON DELETE CASCADE,
    operator_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role public.official_account_operator_role NOT NULL DEFAULT 'publisher',
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (official_account_id, operator_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_official_operators_account ON public.official_account_operators(official_account_id);
CREATE INDEX IF NOT EXISTS idx_official_operators_profile ON public.official_account_operators(operator_profile_id);

-- =============================================================================
-- 4. OFFICIAL CONTENT TYPES & DRAFT APPROVAL WORKFLOW
-- =============================================================================

DO $$ BEGIN
    CREATE TYPE public.official_content_type AS ENUM (
        'announcement',
        'platform_update',
        'community',
        'creator_spotlight',
        'business_spotlight',
        'culture',
        'diaspora',
        'event',
        'education',
        'feature',
        'safety',
        'news',
        'welcome'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.official_post_draft_status AS ENUM (
        'draft',
        'pending_approval',
        'approved',
        'published',
        'rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.official_post_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    official_account_id UUID NOT NULL REFERENCES public.official_accounts(id) ON DELETE CASCADE,
    author_operator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_type VARCHAR(30) NOT NULL DEFAULT 'human_operator' CHECK (actor_type IN ('human_operator', 'system_bot', 'service_role')),
    content TEXT NOT NULL,
    media_urls TEXT[] DEFAULT '{}',
    cultural_tags TEXT[] DEFAULT '{}',
    content_type public.official_content_type NOT NULL DEFAULT 'announcement',
    status public.official_post_draft_status NOT NULL DEFAULT 'draft',
    requires_approval BOOLEAN NOT NULL DEFAULT true,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    scheduled_for TIMESTAMPTZ,
    published_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_official_drafts_account ON public.official_post_drafts(official_account_id);
CREATE INDEX IF NOT EXISTS idx_official_drafts_status ON public.official_post_drafts(status);
CREATE INDEX IF NOT EXISTS idx_official_drafts_scheduled ON public.official_post_drafts(scheduled_for);

-- =============================================================================
-- 5. ENHANCE PUBLIC.POSTS WITH OFFICIAL LABELS & PINNING
-- =============================================================================

ALTER TABLE public.posts
    ADD COLUMN IF NOT EXISTS is_official BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS official_content_type VARCHAR(40),
    ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_posts_official ON public.posts(is_official);
CREATE INDEX IF NOT EXISTS idx_posts_pinned ON public.posts(is_pinned);
CREATE INDEX IF NOT EXISTS idx_posts_author_pinned ON public.posts(author_id, is_pinned, created_at DESC);

-- =============================================================================
-- 6. RESERVED USERNAMES TABLE & DATABASE PROTECTION TRIGGER
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.reserved_usernames (
    username VARCHAR(40) PRIMARY KEY,
    reason VARCHAR(100) NOT NULL DEFAULT 'system_reserved',
    allow_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prepopulate reservations
INSERT INTO public.reserved_usernames (username, reason)
VALUES 
    ('tukubi', 'Primary Official Platform Account'),
    ('tukubiofficial', 'Official Brand Identity Variant'),
    ('officialtukubi', 'Official Brand Identity Variant'),
    ('tukubisupport', 'Reserved for Official Support Account'),
    ('tukubicreators', 'Reserved for Official Creators Account'),
    ('tukubibusiness', 'Reserved for Official Business Account'),
    ('tukubiculture', 'Reserved for Official Culture Account'),
    ('tukubidiaspora', 'Reserved for Official Diaspora Account'),
    ('tukubinews', 'Reserved for Official News Account'),
    ('admin', 'System Reserved Staff Handle'),
    ('superadmin', 'System Reserved Staff Handle'),
    ('administrator', 'System Reserved Staff Handle'),
    ('system', 'System Reserved Handle'),
    ('support', 'System Reserved Support Handle'),
    ('staff', 'System Reserved Staff Handle'),
    ('moderator', 'System Reserved Moderator Handle'),
    ('help', 'System Reserved Support Handle'),
    ('api', 'System Reserved Infrastructure Handle'),
    ('root', 'System Reserved Infrastructure Handle')
ON CONFLICT (username) DO UPDATE
SET reason = EXCLUDED.reason;

-- Trigger to prevent any unauthorized profile from taking or updating to a reserved handle
CREATE OR REPLACE FUNCTION public.check_reserved_username()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_reserved_row RECORD;
BEGIN
    SELECT * INTO v_reserved_row
    FROM public.reserved_usernames
    WHERE LOWER(username) = LOWER(NEW.username);

    IF v_reserved_row IS NOT NULL THEN
        -- Only allow if explicitly assigned to this specific profile ID
        IF v_reserved_row.allow_profile_id IS NULL OR v_reserved_row.allow_profile_id != NEW.id THEN
            RAISE EXCEPTION 'Username "%" is officially reserved by the platform and cannot be registered or claimed.', NEW.username;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_reserved_username ON public.profiles;
CREATE TRIGGER trg_check_reserved_username
    BEFORE INSERT OR UPDATE OF username ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.check_reserved_username();

-- =============================================================================
-- 7. HELPER FUNCTIONS FOR OFFICIAL ACCOUNTS (SECURITY DEFINER)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_official_account(p_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.official_accounts
        WHERE profile_id = p_profile_id
          AND status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_official_account_operator(
    p_official_account_id UUID,
    p_user_id UUID,
    p_min_role TEXT DEFAULT 'publisher'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_operator_role public.official_account_operator_role;
    v_is_platform_admin BOOLEAN;
BEGIN
    -- Super admins and admins have operator privileges
    SELECT EXISTS (
        SELECT 1 FROM public.accounts
        WHERE (profile_id = p_user_id OR id = p_user_id)
          AND role IN ('super_admin', 'superadmin', 'management', 'admin')
          AND status = 'active'
    ) INTO v_is_platform_admin;

    IF v_is_platform_admin THEN
        RETURN TRUE;
    END IF;

    SELECT role INTO v_operator_role
    FROM public.official_account_operators
    WHERE official_account_id = p_official_account_id
      AND operator_profile_id = p_user_id;

    IF v_operator_role IS NULL THEN
        RETURN FALSE;
    END IF;

    IF p_min_role = 'owner' THEN
        RETURN v_operator_role = 'owner';
    ELSIF p_min_role = 'administrator' THEN
        RETURN v_operator_role IN ('owner', 'administrator');
    ELSIF p_min_role = 'editor' THEN
        RETURN v_operator_role IN ('owner', 'administrator', 'editor');
    ELSIF p_min_role = 'publisher' THEN
        RETURN v_operator_role IN ('owner', 'administrator', 'editor', 'publisher');
    ELSIF p_min_role = 'moderator' THEN
        RETURN v_operator_role IN ('owner', 'administrator', 'editor', 'publisher', 'moderator');
    END IF;

    RETURN FALSE;
END;
$$;

-- Trigger to automatically tag posts from official accounts
CREATE OR REPLACE FUNCTION public.sync_official_post_flags()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF public.is_official_account(NEW.author_id) THEN
        NEW.is_official := true;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_official_post_flags ON public.posts;
CREATE TRIGGER trg_sync_official_post_flags
    BEFORE INSERT OR UPDATE OF author_id ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_official_post_flags();

-- =============================================================================
-- 8. BOOTSTRAP FUNCTION FOR OFFICIAL TUKUBI ACCOUNT
-- =============================================================================

CREATE OR REPLACE FUNCTION public.bootstrap_official_tukubi_account(
    p_profile_id UUID,
    p_operator_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_official_acc_id UUID;
BEGIN
    -- Allow the reserved handle 'tukubi' for this profile
    UPDATE public.reserved_usernames
    SET allow_profile_id = p_profile_id
    WHERE username = 'tukubi';

    -- Ensure profile is marked as official and verified
    INSERT INTO public.profiles (
        id,
        username,
        display_name,
        bio,
        account_type,
        is_official,
        is_verified,
        is_system_account,
        is_private,
        status,
        updated_at
    )
    VALUES (
        p_profile_id,
        'tukubi',
        'TUKUBI',
        E'🌴 The Caribbean Connected.\nConnecting Caribbean people, culture, creators, businesses & the global diaspora.\n🌎 Born in the Caribbean. Built for the World.',
        'organization',
        true,
        true,
        true,
        false,
        'active',
        now()
    )
    ON CONFLICT (id) DO UPDATE
    SET username = 'tukubi',
        display_name = 'TUKUBI',
        bio = E'🌴 The Caribbean Connected.\nConnecting Caribbean people, culture, creators, businesses & the global diaspora.\n🌎 Born in the Caribbean. Built for the World.',
        account_type = 'organization',
        is_official = true,
        is_verified = true,
        is_system_account = true,
        is_private = false,
        status = 'active',
        updated_at = now();

    -- Insert profile_counts if not exists
    INSERT INTO public.profile_counts (profile_id, followers_count, following_count, posts_count, likes_received_count, updated_at)
    VALUES (p_profile_id, 0, 0, 0, 0, now())
    ON CONFLICT (profile_id) DO NOTHING;

    -- Insert notification_preferences if not exists
    INSERT INTO public.notification_preferences (profile_id)
    VALUES (p_profile_id)
    ON CONFLICT (profile_id) DO NOTHING;

    -- Create or update official_accounts record
    INSERT INTO public.official_accounts (
        profile_id,
        classification,
        department,
        status,
        is_system_account,
        updated_at
    )
    VALUES (
        p_profile_id,
        'official_platform',
        'Executive & Platform Communications',
        'active',
        true,
        now()
    )
    ON CONFLICT (profile_id) DO UPDATE
    SET status = 'active',
        classification = 'official_platform',
        updated_at = now()
    RETURNING id INTO v_official_acc_id;

    -- If operator provided, assign as owner operator
    IF p_operator_user_id IS NOT NULL THEN
        INSERT INTO public.official_account_operators (
            official_account_id,
            operator_profile_id,
            role,
            assigned_at
        )
        VALUES (
            v_official_acc_id,
            p_operator_user_id,
            'owner',
            now()
        )
        ON CONFLICT (official_account_id, operator_profile_id) DO UPDATE
        SET role = 'owner',
            updated_at = now();
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'official_account_id', v_official_acc_id,
        'username', 'tukubi',
        'display_name', 'TUKUBI',
        'is_official', true
    );
END;
$$;

-- =============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE public.official_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.official_account_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.official_post_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reserved_usernames ENABLE ROW LEVEL SECURITY;

-- 9.1 official_accounts: Public read for active accounts; Admins manage
DROP POLICY IF EXISTS "Public view active official accounts" ON public.official_accounts;
CREATE POLICY "Public view active official accounts" ON public.official_accounts
    FOR SELECT USING (status = 'active' OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage official accounts" ON public.official_accounts;
CREATE POLICY "Admins manage official accounts" ON public.official_accounts
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 9.2 official_account_operators: Operators & Admins can read assignments
DROP POLICY IF EXISTS "Operators read assignments" ON public.official_account_operators;
CREATE POLICY "Operators read assignments" ON public.official_account_operators
    FOR SELECT USING (
        operator_profile_id = auth.uid() 
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Admins manage operators" ON public.official_account_operators;
CREATE POLICY "Admins manage operators" ON public.official_account_operators
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 9.3 official_post_drafts: Operators can view & manage drafts for their official accounts
DROP POLICY IF EXISTS "Operators view official drafts" ON public.official_post_drafts;
CREATE POLICY "Operators view official drafts" ON public.official_post_drafts
    FOR SELECT USING (
        public.is_admin()
        OR public.is_official_account_operator(official_account_id, auth.uid(), 'moderator')
    );

DROP POLICY IF EXISTS "Operators create official drafts" ON public.official_post_drafts;
CREATE POLICY "Operators create official drafts" ON public.official_post_drafts
    FOR INSERT WITH CHECK (
        public.is_admin()
        OR public.is_official_account_operator(official_account_id, auth.uid(), 'publisher')
    );

DROP POLICY IF EXISTS "Operators update official drafts" ON public.official_post_drafts;
CREATE POLICY "Operators update official drafts" ON public.official_post_drafts
    FOR UPDATE USING (
        public.is_admin()
        OR public.is_official_account_operator(official_account_id, auth.uid(), 'editor')
    ) WITH CHECK (
        public.is_admin()
        OR public.is_official_account_operator(official_account_id, auth.uid(), 'editor')
    );

DROP POLICY IF EXISTS "Operators delete official drafts" ON public.official_post_drafts;
CREATE POLICY "Operators delete official drafts" ON public.official_post_drafts
    FOR DELETE USING (
        public.is_admin()
        OR public.is_official_account_operator(official_account_id, auth.uid(), 'administrator')
    );

-- 9.4 reserved_usernames: Public read; Admins write
DROP POLICY IF EXISTS "Public read reserved usernames" ON public.reserved_usernames;
CREATE POLICY "Public read reserved usernames" ON public.reserved_usernames
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage reserved usernames" ON public.reserved_usernames;
CREATE POLICY "Admins manage reserved usernames" ON public.reserved_usernames
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
