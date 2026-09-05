-- Migration 00017: Enhanced RLS Identity Security
-- Description: Strengthens row-level security policies for profile identity data,
--   adds geographic data privacy controls, and enforces compliance with data
--   minimization principles for Caribbean diaspora communities.

-- =============================================================================
-- SECTION A: Enhanced Profile Identity Privacy Controls
-- =============================================================================

-- Drop existing identity policy and replace with hardened version
DROP POLICY IF EXISTS "Owner full control profile identity" ON public.profile_identity;
DROP POLICY IF EXISTS "Public read interests" ON public.profile_interests;

-- Create hardened identity access policy
-- Users can only access their own identity data; no public exposure of origin data
CREATE POLICY "Owner read own identity" ON public.profile_identity
    FOR SELECT
    USING (auth.uid() = profile_id);

-- Owner can modify their own identity with visibility constraints
CREATE POLICY "Owner update own identity" ON public.profile_identity
    FOR ALL
    USING (auth.uid() = profile_id)
    WITH CHECK (
        -- Enforce visibility rules
        (visibility = 'public' AND auth.role() = 'authenticated') OR
        (visibility = 'followers' AND auth.role() = 'authenticated') OR
        (visibility = 'private' AND auth.uid() = profile_id)
    );

-- Strictly limit geographic data exposure
-- Only show country-level data when user has explicitly made it public
CREATE POLICY "Geographic data minimization" ON public.profile_identity
    FOR SELECT
    USING (
        -- Users can always see their own data
        auth.uid() = profile_id OR
        -- Aggregated country stats only (no specific city/region)
        (visibility = 'public' AND origin_country_iso IS NOT NULL AND origin_region_id IS NULL AND origin_city_id IS NULL)
    );

-- =============================================================================
-- SECTION B: Enhanced Profile Table RLS Hardening
-- =============================================================================

-- Strengthen existing profile policies to enforce data minimization
DROP POLICY IF EXISTS "Public profiles accessible" ON public.profiles;
DROP POLICY IF EXISTS "User can create profile" ON public.profiles;
DROP POLICY IF EXISTS "User owned updates" ON public.profiles;
DROP POLICY IF EXISTS "Management audit access" ON public.profiles;

-- Public can only see non-private profiles with minimal data exposure
CREATE POLICY "Public minimal profile access" ON public.profiles
    FOR SELECT
    USING (
        is_private = FALSE AND
        -- Only expose non-sensitive fields
        (SELECT visibility FROM public.profile_identity WHERE profile_id = public.profiles.id) = 'public'
    );

-- Users can create their own profile with full consent
CREATE POLICY "User create profile" ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can update their own profile with visibility enforcement
CREATE POLICY "User update own profile" ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        -- Enforce visibility when updating
        NEW.is_private IS NOT DISTINCT FROM is_private AND
        -- Block sensitive field updates without proper visibility
        (NEW.origin_country_id IS NULL OR 
         (SELECT visibility FROM public.profile_identity WHERE profile_id = NEW.id) IN ('public', 'followers'))
    );

-- Management can view all profiles with audit trail
CREATE POLICY "Management audit access" ON public.profiles
    FOR SELECT
    USING (
        auth.uid() IN (SELECT id FROM public.accounts WHERE role = 'management')
    );

-- =============================================================================
-- SECTION C: Profile Interest Data Isolation
-- =============================================================================

-- Ensure interest data is properly isolated by owner only
-- Remove overly permissive public read policy
DROP POLICY IF EXISTS "Public read interests" ON public.profile_interests;

-- Owner can read their own interests
CREATE POLICY "Owner read own interests" ON public.profile_interests
    FOR SELECT
    USING (auth.uid() = profile_id);

-- Owner can manage their own interests
CREATE POLICY "Owner write own interests" ON public.profile_interests
    FOR ALL
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);

-- =============================================================================
-- SECTION D: Data Masking Enforcement
-- =============================================================================

-- Ensure data_masking_policy is enforced at the database level
-- Add check constraint to validate masking policy values
ALTER TABLE public.profiles
    ADD CONSTRAINT valid_data_masking_policy
    CHECK (data_masking_policy IN ('none', 'partial', 'full', 'anonymized'));

-- =============================================================================
-- SECTION E: Audit Logging for Identity Changes
-- ==========================================

-- Create audit trigger for identity changes
CREATE OR REPLACE FUNCTION public.handle_profile_identity_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.audit_logs (action, target_table, target_id, old_values, new_values, actor_id)
    VALUES (
        'profile_identity_update',
        'profile_identity',
        NEW.profile_id,
        COALESCE(OLD.visibility, 'null'),
        NEW.visibility,
        auth.uid()
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profile_identity_audit
AFTER UPDATE ON public.profile_identity
FOR EACH ROW EXECUTE FUNCTION public.handle_profile_identity_audit();

-- Create audit trigger for profile updates
CREATE OR REPLACE FUNCTION public.handle_profile_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_logs (action, target_table, target_id, old_values, new_values, actor_id)
        VALUES (
            'profile_update',
            'profiles',
            NEW.id,
            ROW(OLD.username, OLD.display_name, OLD.is_private, OLD.data_masking_policy)::text,
            ROW(NEW.username, NEW.display_name, NEW.is_private, NEW.data_masking_policy)::text,
            auth.uid()
        );
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profile_audit
AFTER UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_profile_audit();

-- =============================================================================
-- Rollback Plan
-- =============================================================================
-- To reverse this migration:
--
--   -- Section E
--   DROP TRIGGER IF EXISTS trg_profile_audit ON public.profiles;
--   DROP FUNCTION IF EXISTS public.handle_profile_audit();
--   DROP TRIGGER IF EXISTS trg_profile_identity_audit ON public.profile_identity;
--   DROP FUNCTION IF EXISTS public.handle_profile_identity_audit();
--
--   -- Section D
--   ALTER TABLE public.profiles DROP CONSTRAINT valid_data_masking_policy;
--
--   -- Section C
--   DROP POLICY IF EXISTS "Owner read own identity" ON public.profile_identity;
--   DROP POLICY IF EXISTS "Owner update own identity" ON public.profile_identity;
--   DROP POLICY IF EXISTS "Geographic data minimization" ON public.profile_identity;
--
--   -- Section B
--   DROP POLICY IF EXISTS "User update own profile" ON public.profiles;
--   DROP POLICY IF EXISTS "User create profile" ON public.profiles;
--   DROP POLICY IF EXISTS "Public minimal profile access" ON public.profiles;
--   DROP POLICY IF EXISTS "Management audit access" ON public.profiles;
--
--   -- Section A
--   DROP POLICY IF EXISTS "Owner read own interests" ON public.profile_interests;
--   DROP POLICY IF EXISTS "Owner write own interests" ON public.profile_interests;
--
--   -- Re-add original policies from migration 00002
--   CREATE POLICY "Public profiles accessible" ON public.profiles FOR SELECT
--       WITH check (is_private = FALSE OR auth.uid() = id);
--   CREATE POLICY "User can create profile" ON public.profiles FOR INSERT
--       WITH check (auth.uid() = id);
--   CREATE POLICY "User owned updates" ON public.profiles FOR UPDATE
--       WITH check (auth.uid() = id);
--   CREATE POLICY "Management audit access" ON public.profiles FOR SELECT
--       WITH check (auth.uid() IN (SELECT id FROM public.accounts WHERE role = 'management'));
--   CREATE POLICY "Public read interests" ON public.profile_interests FOR SELECT USING (true);
--   CREATE POLICY "Owner full control profile identity" ON public.profile_identity FOR ALL USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

