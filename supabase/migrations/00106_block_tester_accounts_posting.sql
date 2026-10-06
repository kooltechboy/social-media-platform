-- =============================================================================
-- Migration 00106: Permanent Block on Posts from Bravo Tester & Alpha Tester
-- Description: Enforces an absolute database-level prohibition preventing Bravo
--              Tester and Alpha Tester accounts from inserting, updating, or
--              distributing posts on TUKUBI.
-- =============================================================================

-- 1. Purge any lingering posts, comments, or media associated with banned tester IDs
DELETE FROM public.post_media 
WHERE post_id IN (
  SELECT id FROM public.posts 
  WHERE author_id IN ('a5df3d20-e923-4995-ab94-544fef75a751', '7102174d-57f0-4140-bbba-5ac21455d777')
);

DELETE FROM public.post_reactions 
WHERE post_id IN (
  SELECT id FROM public.posts 
  WHERE author_id IN ('a5df3d20-e923-4995-ab94-544fef75a751', '7102174d-57f0-4140-bbba-5ac21455d777')
);

DELETE FROM public.post_shares 
WHERE post_id IN (
  SELECT id FROM public.posts 
  WHERE author_id IN ('a5df3d20-e923-4995-ab94-544fef75a751', '7102174d-57f0-4140-bbba-5ac21455d777')
);

DELETE FROM public.posts 
WHERE author_id IN ('a5df3d20-e923-4995-ab94-544fef75a751', '7102174d-57f0-4140-bbba-5ac21455d777');

-- 2. Trigger Function: Strictly disallow post creation or update from banned tester accounts
CREATE OR REPLACE FUNCTION public.prevent_banned_tester_posts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check explicit banned UUIDs
  IF NEW.author_id IN ('a5df3d20-e923-4995-ab94-544fef75a751', '7102174d-57f0-4140-bbba-5ac21455d777') THEN
    RAISE EXCEPTION 'Posting is permanently prohibited for test accounts (Bravo Tester / Alpha Tester).';
  END IF;

  -- Defense-in-depth: Check profile username and display_name
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = NEW.author_id 
    AND (
      LOWER(username) IN ('bravo_tester', 'alpha_tester', 'bravotester', 'alphatester') OR
      LOWER(display_name) LIKE '%bravo tester%' OR
      LOWER(display_name) LIKE '%alpha tester%'
    )
  ) THEN
    RAISE EXCEPTION 'Posting is permanently prohibited for test accounts (Bravo Tester / Alpha Tester).';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_banned_tester_posts ON public.posts;
CREATE TRIGGER trg_prevent_banned_tester_posts
  BEFORE INSERT OR UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_banned_tester_posts();

-- 3. Restrictive RLS Policies on public.posts
DROP POLICY IF EXISTS posts_block_testers_insert ON public.posts;
CREATE POLICY posts_block_testers_insert ON public.posts
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id NOT IN ('a5df3d20-e923-4995-ab94-544fef75a751', '7102174d-57f0-4140-bbba-5ac21455d777')
  );

DROP POLICY IF EXISTS posts_block_testers_select ON public.posts;
CREATE POLICY posts_block_testers_select ON public.posts
  AS RESTRICTIVE
  FOR SELECT
  USING (
    author_id NOT IN ('a5df3d20-e923-4995-ab94-544fef75a751', '7102174d-57f0-4140-bbba-5ac21455d777')
  );
