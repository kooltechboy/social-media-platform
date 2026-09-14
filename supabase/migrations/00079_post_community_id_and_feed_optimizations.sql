-- Migration 00079: Post Community Attachment, Video Comments & Universal Feed Optimizations
-- Description:
--   1. Adds community_id to public.posts with foreign key referencing public.communities(id).
--   2. Adds performance indexes for community posts, country-based Caribbean feeds, and cultural tags.
--   3. Updates public.posts RLS to enforce community privacy boundaries (private community posts visible only to active members).
--   4. Extends public.comments to support video_id for persistent reel/video comments.

BEGIN;

-- 1. Add community_id to public.posts
ALTER TABLE public.posts
    ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE;

-- 2. Performance Indexes for feed queries
CREATE INDEX IF NOT EXISTS idx_posts_community_id 
    ON public.posts(community_id) 
    WHERE community_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_posts_country_created_at
    ON public.posts(country_id, created_at DESC)
    WHERE country_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_posts_cultural_tags
    ON public.posts USING gin (cultural_tags);

-- 3. Extend public.comments to support video_id for Reels and video content
ALTER TABLE public.comments
    ALTER COLUMN post_id DROP NOT NULL;

ALTER TABLE public.comments
    ADD COLUMN IF NOT EXISTS video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_comments_target'
    ) THEN
        ALTER TABLE public.comments
            ADD CONSTRAINT chk_comments_target CHECK (post_id IS NOT NULL OR video_id IS NOT NULL);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_comments_video_id
    ON public.comments(video_id, created_at ASC)
    WHERE video_id IS NOT NULL;

-- 4. Update RLS policies on public.posts to respect community privacy
DROP POLICY IF EXISTS "View posts policy" ON public.posts;
CREATE POLICY "View posts policy" ON public.posts FOR SELECT
USING (
    -- Author always has access
    author_id = auth.uid()
    OR (
        -- If attached to a community, check community privacy
        community_id IS NOT NULL AND (
            public.is_active_community_member(community_id)
            OR EXISTS (
                SELECT 1 FROM public.communities c 
                WHERE c.id = posts.community_id AND c.join_policy = 'public'
            )
        )
        AND (
            visibility = 'public'
            OR (visibility = 'followers' AND EXISTS (
                SELECT 1 FROM public.follows WHERE follower_id = auth.uid() AND following_id = author_id
            ))
            OR (visibility = 'friends' AND EXISTS (
                SELECT 1 FROM public.friendships 
                WHERE status = 'accepted' 
                  AND ((requester_id = auth.uid() AND addressee_id = author_id) OR (addressee_id = auth.uid() AND requester_id = author_id))
            ))
        )
    )
    OR (
        -- Standard posts without community attachment
        community_id IS NULL AND (
            visibility = 'public' 
            OR (visibility = 'followers' AND EXISTS (
                SELECT 1 FROM public.follows WHERE follower_id = auth.uid() AND following_id = author_id
            ))
            OR (visibility = 'friends' AND EXISTS (
                SELECT 1 FROM public.friendships 
                WHERE status = 'accepted' 
                  AND ((requester_id = auth.uid() AND addressee_id = author_id) OR (addressee_id = auth.uid() AND requester_id = author_id))
            ))
        )
    )
);

-- Ensure public.comments allows viewing comments on accessible videos
DROP POLICY IF EXISTS "View comments policy" ON public.comments;
CREATE POLICY "View comments policy" ON public.comments FOR SELECT
USING (
    -- Post comment
    (post_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.posts p WHERE p.id = comments.post_id
    ))
    -- Video/reel comment
    OR (video_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.videos v WHERE v.id = comments.video_id
    ))
);

DROP POLICY IF EXISTS "Insert comments policy" ON public.comments;
CREATE POLICY "Insert comments policy" ON public.comments FOR INSERT
WITH CHECK (
    auth.uid() = author_id
    AND (
        (post_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id))
        OR (video_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.videos v WHERE v.id = video_id))
    )
);

COMMIT;
