-- Migration 00022: Admin & Moderation RBAC and Enforcement
-- Description: Establishes staff role helper functions (is_admin, is_moderator),
--              adds staff RLS policies on moderation/reports/flags/accounts,
--              adds is_hidden flags to posts/comments, and adds appeal columns to moderation_cases.

-- =============================================================================
-- 1. ENHANCE PUBLIC.ACCOUNTS & INDEXING
-- =============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_profile_id ON public.accounts(profile_id);
CREATE INDEX IF NOT EXISTS idx_accounts_role ON public.accounts(role);

-- =============================================================================
-- 2. HELPER FUNCTIONS FOR ROLE VERIFICATION (SECURITY DEFINER)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.accounts
        WHERE (profile_id = auth.uid() OR id = auth.uid())
          AND role IN ('admin', 'management', 'superadmin')
    );
$$;

CREATE OR REPLACE FUNCTION public.is_moderator()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.accounts
        WHERE (profile_id = auth.uid() OR id = auth.uid())
          AND role IN ('moderator', 'admin', 'management', 'superadmin')
    );
$$;

-- =============================================================================
-- 3. RLS POLICIES FOR ACCOUNTS, MODERATION, REPORTS, FEATURE FLAGS
-- =============================================================================

-- Accounts: Users can read their own account role; Admins can read all accounts
DROP POLICY IF EXISTS "Service role manages accounts" ON public.accounts;

CREATE POLICY "Users read own account" ON public.accounts
    FOR SELECT USING (auth.uid() = profile_id OR auth.uid() = id);

CREATE POLICY "Admins manage all accounts" ON public.accounts
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Moderation Cases: Moderators and Admins have full read/write
DROP POLICY IF EXISTS "Deny client moderation cases" ON public.moderation_cases;

CREATE POLICY "Staff read moderation cases" ON public.moderation_cases
    FOR SELECT USING (public.is_moderator());

CREATE POLICY "Staff update moderation cases" ON public.moderation_cases
    FOR UPDATE USING (public.is_moderator()) WITH CHECK (public.is_moderator());

CREATE POLICY "Staff insert moderation cases" ON public.moderation_cases
    FOR INSERT WITH CHECK (public.is_moderator());

-- Moderation Actions: Moderators and Admins have read/write
DROP POLICY IF EXISTS "Deny client moderation actions" ON public.moderation_actions;

CREATE POLICY "Staff read moderation actions" ON public.moderation_actions
    FOR SELECT USING (public.is_moderator());

CREATE POLICY "Staff create moderation actions" ON public.moderation_actions
    FOR INSERT WITH CHECK (public.is_moderator());

-- Reports: Staff can view and update all reports (in addition to existing reporter read policy)
CREATE POLICY "Staff read all reports" ON public.reports
    FOR SELECT USING (public.is_moderator());

CREATE POLICY "Staff update reports" ON public.reports
    FOR UPDATE USING (public.is_moderator()) WITH CHECK (public.is_moderator());

-- Feature Flags: Admins can update feature flags
CREATE POLICY "Admins update feature flags" ON public.feature_flags
    FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins insert feature flags" ON public.feature_flags
    FOR INSERT WITH CHECK (public.is_admin());

-- =============================================================================
-- 4. CONTENT SUPPRESSION & APPEAL FIELDS
-- =============================================================================

-- Posts & Comments moderation suppression
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;

-- Appeal fields on moderation cases
ALTER TABLE public.moderation_cases ADD COLUMN IF NOT EXISTS appeal_status VARCHAR(20) CHECK (appeal_status IN ('none', 'submitted', 'under_review', 'upheld', 'overturned')) DEFAULT 'none';
ALTER TABLE public.moderation_cases ADD COLUMN IF NOT EXISTS appeal_rationale TEXT;
ALTER TABLE public.moderation_cases ADD COLUMN IF NOT EXISTS appeal_decided_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.moderation_cases ADD COLUMN IF NOT EXISTS appeal_decided_at TIMESTAMPTZ;

-- Indexing for appeal workflow and hidden content filtering
CREATE INDEX IF NOT EXISTS idx_moderation_cases_appeal ON public.moderation_cases(appeal_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_is_hidden ON public.posts(is_hidden) WHERE is_hidden = false;

-- =============================================================================
-- Rollback Plan
-- =============================================================================
-- To reverse this migration:
--   DROP INDEX IF EXISTS idx_posts_is_hidden;
--   DROP INDEX IF EXISTS idx_moderation_cases_appeal;
--   ALTER TABLE public.moderation_cases DROP COLUMN IF EXISTS appeal_decided_at;
--   ALTER TABLE public.moderation_cases DROP COLUMN IF EXISTS appeal_decided_by;
--   ALTER TABLE public.moderation_cases DROP COLUMN IF EXISTS appeal_rationale;
--   ALTER TABLE public.moderation_cases DROP COLUMN IF EXISTS appeal_status;
--   ALTER TABLE public.comments DROP COLUMN IF EXISTS is_hidden;
--   ALTER TABLE public.posts DROP COLUMN IF EXISTS is_hidden;
--   DROP POLICY IF EXISTS "Admins insert feature flags" ON public.feature_flags;
--   DROP POLICY IF EXISTS "Admins update feature flags" ON public.feature_flags;
--   DROP POLICY IF EXISTS "Staff update reports" ON public.reports;
--   DROP POLICY IF EXISTS "Staff read all reports" ON public.reports;
--   DROP POLICY IF EXISTS "Staff create moderation actions" ON public.moderation_actions;
--   DROP POLICY IF EXISTS "Staff read moderation actions" ON public.moderation_actions;
--   DROP POLICY IF EXISTS "Staff insert moderation cases" ON public.moderation_cases;
--   DROP POLICY IF EXISTS "Staff update moderation cases" ON public.moderation_cases;
--   DROP POLICY IF EXISTS "Staff read moderation cases" ON public.moderation_cases;
--   DROP POLICY IF EXISTS "Admins manage all accounts" ON public.accounts;
--   DROP POLICY IF EXISTS "Users read own account" ON public.accounts;
--   DROP FUNCTION IF EXISTS public.is_moderator();
--   DROP FUNCTION IF EXISTS public.is_admin();
--   DROP INDEX IF EXISTS idx_accounts_role;
--   DROP INDEX IF EXISTS idx_accounts_profile_id;
