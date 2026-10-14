-- =============================================================================
-- Migration 00110: TUKUBI Shorts Video Infrastructure & Page Publishing
-- =============================================================================
-- Description:
--   1. Expands public.videos video_kind check constraint to support 'short' as well as 'reel'
--   2. Attaches page_id to public.videos referencing public.businesses(id)
--   3. Adds category column with high-performance composite discovery index
--   4. Adds moderation_status with indexing and default 'approved'
--   5. Updates Row Level Security (RLS) policies on public.videos for profile & page publishing
-- =============================================================================

BEGIN;

-- 1. EXPAND VIDEO_KIND CHECK CONSTRAINT
ALTER TABLE public.videos DROP CONSTRAINT IF EXISTS videos_video_kind_check;
ALTER TABLE public.videos ADD CONSTRAINT videos_video_kind_check 
    CHECK (video_kind IN ('reel', 'short', 'long_form', 'podcast_video'));

-- 2. ATTACH PAGE_ID FOR PAGE-AUTHORED SHORTS & VIDEOS
ALTER TABLE public.videos
    ADD COLUMN IF NOT EXISTS page_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;

-- 3. ADD CATEGORY TAXONOMY
ALTER TABLE public.videos
    ADD COLUMN IF NOT EXISTS category VARCHAR(40);

-- 4. ADD MODERATION STATUS
ALTER TABLE public.videos
    ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'approved' NOT NULL
    CHECK (moderation_status IN ('pending', 'approved', 'flagged', 'rejected'));

-- 5. COMPOSITE INDEXES FOR HIGH-PERFORMANCE DISCOVERY
CREATE INDEX IF NOT EXISTS idx_videos_kind_created
    ON public.videos(video_kind, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_videos_page_id_created
    ON public.videos(page_id, created_at DESC)
    WHERE page_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_videos_category_created
    ON public.videos(category, created_at DESC)
    WHERE category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_videos_moderation
    ON public.videos(moderation_status)
    WHERE moderation_status != 'approved';

-- 6. ROW LEVEL SECURITY (RLS) REFINEMENT FOR VIDEOS
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos FORCE ROW LEVEL SECURITY;

-- Drop previous policies safely to avoid collision
DROP POLICY IF EXISTS "Public videos readable" ON public.videos;
DROP POLICY IF EXISTS "Creators can insert videos" ON public.videos;
DROP POLICY IF EXISTS "Creators can update own videos" ON public.videos;
DROP POLICY IF EXISTS "Creators can delete own videos" ON public.videos;
DROP POLICY IF EXISTS "Visible videos readable by community" ON public.videos;
DROP POLICY IF EXISTS "Creators and page managers can insert videos" ON public.videos;
DROP POLICY IF EXISTS "Creators and page managers can update videos" ON public.videos;
DROP POLICY IF EXISTS "Creators and page managers can delete videos" ON public.videos;

-- SELECT POLICY: Public approved videos readable by everyone; unapproved/private only visible to author/page managers
CREATE POLICY "Visible videos readable by community" ON public.videos
    FOR SELECT USING (
        (
            moderation_status = 'approved'
            AND visibility = 'public'
        )
        OR (auth.uid() = creator_id)
        OR (
            page_id IS NOT NULL
            AND public.is_page_member(page_id, auth.uid(), ARRAY['owner', 'admin', 'editor', 'moderator'])
        )
        OR (
            visibility = 'followers'
            AND EXISTS (
                SELECT 1 FROM public.follows f
                WHERE f.follower_id = auth.uid() AND f.following_id = creator_id
            )
        )
    );

-- INSERT POLICY: Authenticated creator can publish as themselves, or as a Page if they have owner/admin/editor role
CREATE POLICY "Creators and page managers can insert videos" ON public.videos
    FOR INSERT WITH CHECK (
        auth.uid() = creator_id
        AND (
            page_id IS NULL
            OR public.is_page_member(page_id, auth.uid(), ARRAY['owner', 'admin', 'editor'])
        )
    );

-- UPDATE POLICY: Creator or Page owner/admin can update video metadata
CREATE POLICY "Creators and page managers can update videos" ON public.videos
    FOR UPDATE USING (
        auth.uid() = creator_id
        OR (
            page_id IS NOT NULL
            AND public.is_page_member(page_id, auth.uid(), ARRAY['owner', 'admin'])
        )
    ) WITH CHECK (
        auth.uid() = creator_id
        OR (
            page_id IS NOT NULL
            AND public.is_page_member(page_id, auth.uid(), ARRAY['owner', 'admin'])
        )
    );

-- DELETE POLICY: Creator or Page owner/admin can delete video
CREATE POLICY "Creators and page managers can delete videos" ON public.videos
    FOR DELETE USING (
        auth.uid() = creator_id
        OR (
            page_id IS NOT NULL
            AND public.is_page_member(page_id, auth.uid(), ARRAY['owner', 'admin'])
        )
    );

COMMIT;
