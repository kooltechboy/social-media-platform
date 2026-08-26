-- Migration 00023: Super Admin & Staff RBAC, Audit Logging Security & Bootstrap Procedure
-- Description: Adds status, permissions, and assignment tracking to public.accounts,
--              establishes is_super_admin, is_staff, has_permission functions,
--              secures audit_logs with staff RLS and append-only constraints,
--              provides public.bootstrap_super_admin() for secure initial setup.

-- =============================================================================
-- 1. ENHANCE PUBLIC.ACCOUNTS FOR GRANULAR RBAC
-- =============================================================================

ALTER TABLE public.accounts 
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deactivated')),
    ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ DEFAULT now(),
    ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS idx_accounts_status ON public.accounts(status);
CREATE INDEX IF NOT EXISTS idx_accounts_role_status ON public.accounts(role, status);

-- =============================================================================
-- 2. ROLE VERIFICATION & PERMISSION FUNCTIONS (SECURITY DEFINER)
-- =============================================================================

-- Super Admin check
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.accounts
        WHERE (profile_id = auth.uid() OR id = auth.uid())
          AND role IN ('super_admin', 'superadmin', 'management')
          AND status = 'active'
    );
$$;

-- Admin check (Super Admin + Admin)
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
          AND role IN ('super_admin', 'superadmin', 'management', 'admin')
          AND status = 'active'
    );
$$;

-- Moderator check (Super Admin + Admin + Moderator)
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
          AND role IN ('super_admin', 'superadmin', 'management', 'admin', 'moderator')
          AND status = 'active'
    );
$$;

-- General Staff check (Super Admin, Admin, Moderator, Support, Content Manager, Analyst)
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.accounts
        WHERE (profile_id = auth.uid() OR id = auth.uid())
          AND role IN ('super_admin', 'superadmin', 'management', 'admin', 'moderator', 'support', 'content_manager', 'analyst')
          AND status = 'active'
    );
$$;

-- Granular Permission check
CREATE OR REPLACE FUNCTION public.has_permission(p_permission TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role VARCHAR(30);
    v_perms JSONB;
BEGIN
    SELECT role, permissions INTO v_role, v_perms
    FROM public.accounts
    WHERE (profile_id = auth.uid() OR id = auth.uid())
      AND status = 'active'
    LIMIT 1;

    IF v_role IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Super Admin has all permissions
    IF v_role IN ('super_admin', 'superadmin', 'management') THEN
        RETURN TRUE;
    END IF;

    -- Check direct permissions array
    IF v_perms IS NOT NULL AND v_perms ? p_permission THEN
        RETURN TRUE;
    END IF;

    -- Default role capabilities
    IF v_role = 'admin' AND p_permission IN (
        'manage_users', 'manage_content', 'manage_payments',
        'manage_feature_flags', 'view_analytics', 'view_audit_logs', 'manage_staff'
    ) THEN
        RETURN TRUE;
    END IF;

    IF v_role = 'moderator' AND p_permission IN ('manage_content', 'view_reports') THEN
        RETURN TRUE;
    END IF;

    IF v_role = 'support' AND p_permission IN ('view_users', 'view_reports', 'manage_tickets') THEN
        RETURN TRUE;
    END IF;

    IF v_role = 'content_manager' AND p_permission IN ('manage_content', 'feature_posts', 'manage_announcements') THEN
        RETURN TRUE;
    END IF;

    IF v_role = 'analyst' AND p_permission IN ('view_analytics', 'export_reports') THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;

-- =============================================================================
-- 3. AUDIT LOGS SECURITY & IMMUTABILITY (RLS)
-- =============================================================================

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff read audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Deny update audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Deny delete audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Staff insert audit logs" ON public.audit_logs;

-- Read: Admins and authorized staff can inspect audit logs
CREATE POLICY "Staff read audit logs" ON public.audit_logs
    FOR SELECT USING (public.is_admin() OR public.has_permission('view_audit_logs'));

-- Write: Authorized staff can append audit entries
CREATE POLICY "Staff insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (public.is_staff() OR auth.uid() = actor_id);

-- Immutability: UPDATE and DELETE are strictly disallowed
CREATE POLICY "Deny update audit logs" ON public.audit_logs
    FOR UPDATE USING (false);

CREATE POLICY "Deny delete audit logs" ON public.audit_logs
    FOR DELETE USING (false);

-- Indexing for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- =============================================================================
-- 4. AUDIT HELPER PROCEDURE (SECURITY DEFINER)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.log_admin_action(
    p_actor_id UUID,
    p_action VARCHAR(80),
    p_entity_type VARCHAR(60) DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata, created_at)
    VALUES (p_actor_id, p_action, p_entity_type, p_entity_id, p_metadata, now())
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

-- =============================================================================
-- 5. SECURE SUPER ADMIN BOOTSTRAP FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION public.bootstrap_super_admin(
    p_user_id UUID,
    p_username VARCHAR(30),
    p_display_name VARCHAR(100),
    p_notes TEXT DEFAULT 'Initial Super Admin bootstrap'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_existing_super_admin_count INT;
    v_account_id UUID;
BEGIN
    -- Check if any Super Admin already exists
    SELECT COUNT(*) INTO v_existing_super_admin_count
    FROM public.accounts
    WHERE role IN ('super_admin', 'superadmin', 'management');

    IF v_existing_super_admin_count > 0 THEN
        RAISE EXCEPTION 'Platform already initialized. Super Admin already exists. New administrators must be created by an authenticated Super Admin in /admin.';
    END IF;

    -- Ensure profile exists
    INSERT INTO public.profiles (id, username, display_name, account_type, is_verified, is_private)
    VALUES (p_user_id, p_username, p_display_name, 'organization', true, false)
    ON CONFLICT (id) DO UPDATE
    SET is_verified = true,
        display_name = EXCLUDED.display_name,
        updated_at = now();

    -- Create/Update Super Admin account record
    INSERT INTO public.accounts (profile_id, role, status, permissions, notes, assigned_at)
    VALUES (p_user_id, 'super_admin', 'active', '["all"]'::jsonb, p_notes, now())
    ON CONFLICT (profile_id) DO UPDATE
    SET role = 'super_admin',
        status = 'active',
        permissions = '["all"]'::jsonb,
        notes = EXCLUDED.notes,
        assigned_at = now()
    RETURNING id INTO v_account_id;

    -- Record in immutable audit logs
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata, created_at)
    VALUES (
        p_user_id,
        'platform.bootstrapped',
        'account',
        v_account_id,
        jsonb_build_object(
            'user_id', p_user_id,
            'username', p_username,
            'role', 'super_admin',
            'timestamp', now()
        ),
        now()
    );

    RETURN jsonb_build_object(
        'success', true,
        'account_id', v_account_id,
        'user_id', p_user_id,
        'role', 'super_admin'
    );
END;
$$;

-- Grant permissions to authenticated / service role appropriately
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_moderator() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_permission(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_admin_action(UUID, VARCHAR, VARCHAR, UUID, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.bootstrap_super_admin(UUID, VARCHAR, VARCHAR, TEXT) TO authenticated, service_role;
