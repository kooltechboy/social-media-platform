-- Migration 00057: Creator Platform Hardening & Lifecycle Integrity
-- Description: Fixes RLS policies on podcast_episodes, adds creator DELETE policies,
--              creates creator_content_drafts table, ensures stream_url on livestreams,
--              and provides atomic triggers and RPCs for podcast follower counts.

-- =============================================================================
-- 1. FIX PODCAST EPISODES RLS POLICY
-- =============================================================================
-- Migration 00010 had FOR ALL WITH CHECK without a USING clause.
-- In PostgreSQL RLS, FOR ALL with only WITH CHECK causes UPDATE and DELETE
-- to default USING to false, preventing creators from editing or deleting episodes.

DROP POLICY IF EXISTS "Podcast creator writes episodes" ON public.podcast_episodes;

CREATE POLICY "Podcast creator writes episodes" ON public.podcast_episodes
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.podcasts p
            WHERE p.id = podcast_id AND p.creator_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.podcasts p
            WHERE p.id = podcast_id AND p.creator_id = auth.uid()
        )
    );

-- =============================================================================
-- 2. ADD CREATOR DELETE POLICIES (Podcasts, Livestreams, Videos)
-- =============================================================================

DROP POLICY IF EXISTS "Creator deletes own podcasts" ON public.podcasts;
CREATE POLICY "Creator deletes own podcasts" ON public.podcasts
    FOR DELETE
    USING (creator_id = auth.uid());

DROP POLICY IF EXISTS "Creator deletes own livestreams" ON public.livestreams;
CREATE POLICY "Creator deletes own livestreams" ON public.livestreams
    FOR DELETE
    USING (creator_id = auth.uid());

DROP POLICY IF EXISTS "Creator deletes own videos" ON public.videos;
CREATE POLICY "Creator deletes own videos" ON public.videos
    FOR DELETE
    USING (creator_id = auth.uid());

-- =============================================================================
-- 3. LIVESTREAMS SCHEMA HARDENING
-- =============================================================================
-- Ensure stream_url column exists for HLS/WebRTC streaming compatibility
ALTER TABLE public.livestreams ADD COLUMN IF NOT EXISTS stream_url TEXT;

-- =============================================================================
-- 4. UNIVERSAL CREATOR CONTENT DRAFTS TABLE
-- =============================================================================
-- Provides server-persisted, cross-device drafts for creators (posts, videos,
-- podcasts, episodes, livestreams, and events).
CREATE TABLE IF NOT EXISTS public.creator_content_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('post', 'video', 'podcast', 'episode', 'livestream', 'event')),
    title TEXT NOT NULL,
    body TEXT,
    media_urls JSONB DEFAULT '[]'::jsonb NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    scheduled_for TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_creator_drafts_owner ON public.creator_content_drafts(creator_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_drafts_type ON public.creator_content_drafts(creator_id, content_type);

ALTER TABLE public.creator_content_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Creator manages own drafts" ON public.creator_content_drafts;
CREATE POLICY "Creator manages own drafts" ON public.creator_content_drafts
    FOR ALL
    USING (creator_id = auth.uid())
    WITH CHECK (creator_id = auth.uid());

-- Trigger: auto update updated_at on creator_content_drafts
CREATE OR REPLACE FUNCTION public.handle_creator_draft_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_creator_draft_updated_at ON public.creator_content_drafts;
CREATE TRIGGER trg_creator_draft_updated_at
    BEFORE UPDATE ON public.creator_content_drafts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_creator_draft_updated_at();

-- =============================================================================
-- 5. PODCAST FOLLOWER COUNT AUTO-SYNC TRIGGERS & ATOMIC RPCs
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_podcast_follower_count_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.podcasts
        SET follower_count = follower_count + 1
        WHERE id = NEW.podcast_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.podcasts
        SET follower_count = GREATEST(follower_count - 1, 0)
        WHERE id = OLD.podcast_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_podcast_follower_count ON public.podcast_followers;
CREATE TRIGGER trg_podcast_follower_count
    AFTER INSERT OR DELETE ON public.podcast_followers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_podcast_follower_count_change();

-- Backward-compatible RPCs if called explicitly:
CREATE OR REPLACE FUNCTION public.increment_podcast_followers(p_podcast_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.podcasts
    SET follower_count = (
        SELECT count(*)::int FROM public.podcast_followers WHERE podcast_id = p_podcast_id
    )
    WHERE id = p_podcast_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_podcast_followers(p_podcast_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.podcasts
    SET follower_count = (
        SELECT count(*)::int FROM public.podcast_followers WHERE podcast_id = p_podcast_id
    )
    WHERE id = p_podcast_id;
END;
$$;

-- Grant permissions to authenticated users for RPCs
GRANT EXECUTE ON FUNCTION public.increment_podcast_followers(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_podcast_followers(UUID) TO authenticated;
