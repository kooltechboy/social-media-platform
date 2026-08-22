-- Migration 00014: Fix infinite recursion in community RLS policies
-- Problem: community_members policy self-references its own table, and communities
-- policy references community_members — Postgres detects infinite recursion at
-- policy evaluation time (caught by supabase/tests/rls_tests.sql).
-- Fix: SECURITY DEFINER membership helper (Supabase-documented pattern). The helper
-- binds auth.uid() internally so direct callers can only ever probe their own
-- membership — it cannot be used to enumerate other users' private community membership.

CREATE OR REPLACE FUNCTION public.is_active_community_member(target_community uuid)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.community_members m
        WHERE m.community_id = target_community
          AND m.profile_id = auth.uid()
          AND m.membership_status = 'active'
    );
$$;

REVOKE ALL ON FUNCTION public.is_active_community_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_community_member(uuid) TO authenticated, anon;

-- Recreate the recursive policies against the helper
DROP POLICY IF EXISTS "Public read public communities" ON public.communities;
CREATE POLICY "Public read public communities" ON public.communities
    FOR SELECT USING (
        join_policy = 'public'
        OR public.is_active_community_member(id)
    );

DROP POLICY IF EXISTS "Members read community membership" ON public.community_members;
CREATE POLICY "Members read community membership" ON public.community_members
    FOR SELECT USING (
        profile_id = auth.uid()
        OR public.is_active_community_member(community_id)
        OR EXISTS (
            SELECT 1 FROM public.communities c
            WHERE c.id = community_id AND c.join_policy = 'public'
        )
    );

DROP POLICY IF EXISTS "Member read community roles" ON public.community_roles;
CREATE POLICY "Member read community roles" ON public.community_roles
    FOR SELECT USING (
        public.is_active_community_member(community_id)
        OR EXISTS (
            SELECT 1 FROM public.communities c
            WHERE c.id = community_id AND c.join_policy = 'public'
        )
    );

-- Rollback plan:
--   DROP FUNCTION public.is_active_community_member(uuid);
--   (restore original policies from migration 00007 — recursion bug reintroduced, so
--    prefer keeping this migration; the original policies are defective.)
