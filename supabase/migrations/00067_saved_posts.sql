-- supabase/migrations/00067_saved_posts.sql
-- Purpose: Post bookmarks/saves — owner-only private collection

CREATE TABLE IF NOT EXISTS public.saved_posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id     UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_posts_profile ON public.saved_posts(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_posts_post    ON public.saved_posts(post_id);

ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

-- Owner-only: only you see and manage your saves
DROP POLICY IF EXISTS "owner_all_saved_posts" ON public.saved_posts;
CREATE POLICY "owner_all_saved_posts" ON public.saved_posts
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = profile_id)
  WITH CHECK ((SELECT auth.uid()) = profile_id);

COMMENT ON TABLE public.saved_posts IS
  'Private post bookmarks — one row per user per post, owner-only RLS.';
