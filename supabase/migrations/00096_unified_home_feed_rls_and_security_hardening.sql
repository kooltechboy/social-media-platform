-- =============================================================================
-- Migration 00096: Unified Home Feed RLS & Security Hardening
-- =============================================================================
-- Description:
--   1. Hardens public.posts SELECT RLS policy to enforce:
--      - Bi-directional block exclusion (neither author nor viewer blocked).
--      - Scheduled post isolation (only author sees scheduled posts before publish time).
--      - Strict community privacy boundaries (private hubs accessible only to members).
--      - Friendship and follower audience rules.
--   2. Enforces strict author-only UPDATE policy on public.posts with WITH CHECK.
--   3. Adds performance indexes for feed generation and scheduled post dispatch.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Hardened View Posts Policy
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "View posts policy" ON public.posts;

CREATE POLICY "View posts policy" ON public.posts FOR SELECT
USING (
    -- Author always has full access to their own posts (drafts, scheduled, private)
    author_id = auth.uid()
    OR (
        -- For all other viewers:
        -- A. Neither author nor viewer has blocked the other
        NOT EXISTS (
            SELECT 1 FROM public.blocks b
            WHERE (b.blocker_id = auth.uid() AND b.blocked_id = author_id)
               OR (b.blocker_id = author_id AND b.blocked_id = auth.uid())
        )
        -- B. Post is published (not in scheduled or draft state)
        AND (post_status IS NULL OR post_status = 'published')
        AND (scheduled_at IS NULL OR scheduled_at <= now())
        -- C. Audience & surface visibility
        AND (
            -- Case 1: Attached to a community
            (
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
            OR
            -- Case 2: Standard post without community attachment
            (
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
        )
    )
);

-- -----------------------------------------------------------------------------
-- 2. Author Post Update Policy
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Authors can update own posts" ON public.posts;

CREATE POLICY "Authors can update own posts" ON public.posts
    FOR UPDATE
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

-- -----------------------------------------------------------------------------
-- 3. Feed Performance Indexes
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_posts_author_created_at
    ON public.posts(author_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_visibility_created_at
    ON public.posts(visibility, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_scheduled_dispatch
    ON public.posts(post_status, scheduled_at)
    WHERE post_status = 'scheduled';

COMMIT;
