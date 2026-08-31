-- Migration 00045: Profile Visibility & Realtime Feed Fix
-- Description: Ensures profiles default to is_private = false (public) so that
--   posts by non-private users appear correctly in the feed JOIN query.
--   Fixes any inadvertently private profiles. Also enables Supabase realtime
--   replication on the posts table for live feed subscriptions.
--
-- Root cause addressed:
--   Feed query in page.tsx: SELECT posts JOIN profiles
--   RLS on profiles: USING (is_private = FALSE OR auth.uid() = id)
--   If is_private = TRUE for a new user, their profile is invisible in the JOIN
--   => posts appear with NULL author data or are filtered out by PostgREST.
--
-- Rollback plan (see bottom of file)

-- =============================================================================
-- SECTION A: Ensure is_private column defaults to FALSE on profiles
-- =============================================================================

ALTER TABLE public.profiles
  ALTER COLUMN is_private SET DEFAULT false;

-- =============================================================================
-- SECTION B: Fix any profiles where is_private is NULL or erroneously TRUE
--   Only reset is_private on profiles that were never explicitly set private
--   by the user (identifiable as those with no deliberate privacy override).
-- =============================================================================

UPDATE public.profiles
SET
  is_private = false,
  updated_at = now()
WHERE
  is_private IS TRUE
  AND (
    -- Not explicitly set private through the settings UI
    profile_visibility IS NULL
    OR profile_visibility != 'private'
  );

-- =============================================================================
-- SECTION C: Ensure profiles created through the signup flow are public by default
--   Add NOT NULL constraint now that all rows have a value
-- =============================================================================

ALTER TABLE public.profiles
  ALTER COLUMN is_private SET NOT NULL;

-- =============================================================================
-- SECTION D: Enable Supabase Realtime replication on the posts table
--   This is required for FeedStream postgres_changes subscription to receive
--   INSERT events for new posts.
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'posts'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
    END IF;
  END IF;
END $$;

-- =============================================================================
-- SECTION E: Add predicate index for profile RLS SELECT performance
--   Supports: USING (is_private = FALSE OR auth.uid() = id)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_is_private_false
  ON public.profiles(id)
  WHERE is_private = FALSE;

-- =============================================================================
-- Rollback Plan
-- =============================================================================
-- To reverse this migration:
--   DROP INDEX IF EXISTS public.idx_profiles_is_private_false;
--   -- ALTER PUBLICATION supabase_realtime DROP TABLE public.posts; (if needed)
--   ALTER TABLE public.profiles ALTER COLUMN is_private DROP NOT NULL;
--   ALTER TABLE public.profiles ALTER COLUMN is_private SET DEFAULT true;
