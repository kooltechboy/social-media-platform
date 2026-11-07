-- =============================================================================
-- Migration 00118: Video Uploads Storage Bucket & Story Engagement Tables
-- =============================================================================
-- Description:
--   1. Creates 'video-uploads' storage bucket for Reels & Shorts video files
--   2. Adds storage RLS policies for authenticated upload and public read
--   3. Creates story_views table for view tracking with RLS
--   4. Creates story_reactions table for emoji quick-reactions with RLS
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. VIDEO UPLOADS STORAGE BUCKET
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('video-uploads', 'video-uploads', true, 524288000, -- 500MB
   ARRAY['video/mp4','video/webm','video/quicktime','video/x-matroska','video/3gpp'])
ON CONFLICT (id) DO UPDATE
  SET allowed_mime_types = EXCLUDED.allowed_mime_types,
      file_size_limit = EXCLUDED.file_size_limit;

-- Storage RLS policies for video-uploads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Video uploads publicly readable' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Video uploads publicly readable"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'video-uploads');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users upload videos' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Authenticated users upload videos"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'video-uploads'
      AND auth.role() = 'authenticated'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users delete own video uploads' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users delete own video uploads"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'video-uploads'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

-- =============================================================================
-- 2. STORY VIEWS TRACKING
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.story_views (
  story_id UUID NOT NULL,
  viewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (story_id, viewer_id)
);

CREATE INDEX IF NOT EXISTS idx_story_views_story ON public.story_views(story_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_story_views_viewer ON public.story_views(viewer_id);

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views FORCE ROW LEVEL SECURITY;

-- Anyone can see view records (story author needs to see who viewed)
DROP POLICY IF EXISTS "story_views_select" ON public.story_views;
CREATE POLICY "story_views_select" ON public.story_views
  FOR SELECT USING (true);

-- Authenticated users can insert their own views
DROP POLICY IF EXISTS "story_views_insert_self" ON public.story_views;
CREATE POLICY "story_views_insert_self" ON public.story_views
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- =============================================================================
-- 3. STORY REACTIONS (EMOJI QUICK-REACTIONS)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.story_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL,
  reactor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  emoji VARCHAR(10) NOT NULL CHECK (emoji IN ('❤️', '🔥', '😂', '😮', '😢', '👏', '🌴', '🎉')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (story_id, reactor_id)
);

CREATE INDEX IF NOT EXISTS idx_story_reactions_story ON public.story_reactions(story_id);

ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_reactions FORCE ROW LEVEL SECURITY;

-- Public read for reaction counts
DROP POLICY IF EXISTS "story_reactions_select" ON public.story_reactions;
CREATE POLICY "story_reactions_select" ON public.story_reactions
  FOR SELECT USING (true);

-- Authenticated users can react
DROP POLICY IF EXISTS "story_reactions_insert_self" ON public.story_reactions;
CREATE POLICY "story_reactions_insert_self" ON public.story_reactions
  FOR INSERT WITH CHECK (auth.uid() = reactor_id);

-- Users can update their own reaction (change emoji)
DROP POLICY IF EXISTS "story_reactions_update_self" ON public.story_reactions;
CREATE POLICY "story_reactions_update_self" ON public.story_reactions
  FOR UPDATE USING (auth.uid() = reactor_id)
  WITH CHECK (auth.uid() = reactor_id);

-- Users can remove their own reaction
DROP POLICY IF EXISTS "story_reactions_delete_self" ON public.story_reactions;
CREATE POLICY "story_reactions_delete_self" ON public.story_reactions
  FOR DELETE USING (auth.uid() = reactor_id);

COMMIT;
