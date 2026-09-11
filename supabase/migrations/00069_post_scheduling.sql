-- supabase/migrations/00069_post_scheduling.sql
-- Purpose: Add scheduling capability to posts — scheduled_at + post_status enum

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS post_status TEXT NOT NULL DEFAULT 'published'
    CHECK (post_status IN ('draft', 'scheduled', 'published', 'archived'));

-- Feed queries should only show published posts
CREATE INDEX IF NOT EXISTS idx_posts_published_status
  ON public.posts(created_at DESC)
  WHERE post_status = 'published';

-- For scheduled post publish job
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_pending
  ON public.posts(scheduled_at)
  WHERE post_status = 'scheduled' AND scheduled_at IS NOT NULL;

-- Function to auto-publish scheduled posts (called by pg_cron or Edge Function)
CREATE OR REPLACE FUNCTION public.publish_scheduled_posts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.posts
  SET post_status = 'published', updated_at = now()
  WHERE post_status = 'scheduled'
    AND scheduled_at IS NOT NULL
    AND scheduled_at <= now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.publish_scheduled_posts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_scheduled_posts() TO service_role;

COMMENT ON COLUMN public.posts.scheduled_at IS
  'When to auto-publish this post. NULL = publish immediately on creation.';
COMMENT ON COLUMN public.posts.post_status IS
  'Post lifecycle: draft | scheduled | published | archived';
COMMENT ON FUNCTION public.publish_scheduled_posts() IS
  'Auto-publishes scheduled posts whose scheduled_at has passed. Call every minute via pg_cron.';
