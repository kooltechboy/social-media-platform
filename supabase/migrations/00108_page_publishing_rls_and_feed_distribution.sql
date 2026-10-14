-- =============================================================================
-- Migration 00108: Page Publishing Post Security RLS & Unified Feed Distribution
-- =============================================================================
-- Description:
--   1. Hardens public.posts INSERT policy to enforce RBAC authorization when page_id
--      is specified (caller must be business owner or active owner/admin/editor in page_roles).
--   2. Updates public.posts SELECT policy ("View posts policy") so followers of a
--      Page (via public.page_followers) can access 'followers' visibility posts.
--   3. Updates public.posts UPDATE and DELETE policies so authorized Page managers
--      (owner/admin in page_roles or owner_id) can moderate/manage Page posts.
--   4. Creates high-performance composite index on public.posts (page_id, created_at DESC).
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Index optimization for Page timelines and Feed Distribution
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_posts_page_id_created_at
    ON public.posts(page_id, created_at DESC)
    WHERE page_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 2. Hardened INSERT Policy on public.posts
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authors can insert posts" ON public.posts;
DROP POLICY IF EXISTS "posts_insert_policy" ON public.posts;

CREATE POLICY "posts_insert_policy"
    ON public.posts
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = author_id
        AND (
            page_id IS NULL
            OR public.is_page_member(page_id, auth.uid(), ARRAY['owner', 'admin', 'editor'])
        )
    );

-- -----------------------------------------------------------------------------
-- 3. Hardened SELECT Policy on public.posts ("View posts policy")
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "View posts policy" ON public.posts;
DROP POLICY IF EXISTS "posts_select_policy" ON public.posts;

CREATE POLICY "posts_select_policy"
    ON public.posts
    FOR SELECT
    TO anon, authenticated
    USING (
        -- Public posts visible to everyone
        visibility = 'public'
        -- Author can always view own posts
        OR (auth.uid() IS NOT NULL AND author_id = auth.uid())
        -- Personal follower visibility
        OR (
            visibility = 'followers'
            AND auth.uid() IS NOT NULL
            AND (
                EXISTS (
                    SELECT 1 FROM public.follows
                    WHERE follower_id = auth.uid() AND following_id = posts.author_id
                )
                OR (
                    page_id IS NOT NULL
                    AND EXISTS (
                        SELECT 1 FROM public.page_followers
                        WHERE user_id = auth.uid() AND page_id = posts.page_id
                    )
                )
            )
        )
        -- Friends visibility for mutual friendships
        OR (
            visibility = 'friends'
            AND auth.uid() IS NOT NULL
            AND EXISTS (
                SELECT 1 FROM public.friendships
                WHERE status = 'accepted'
                  AND (
                      (requester_id = auth.uid() AND addressee_id = posts.author_id)
                      OR (addressee_id = auth.uid() AND requester_id = posts.author_id)
                  )
            )
        )
        -- Team members of a Page can always view all posts on their Page (including drafts/scheduled)
        OR (
            page_id IS NOT NULL
            AND auth.uid() IS NOT NULL
            AND public.is_page_member(page_id, auth.uid())
        )
    );

-- -----------------------------------------------------------------------------
-- 4. Hardened UPDATE & DELETE Policies on public.posts
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authors can update own posts" ON public.posts;
DROP POLICY IF EXISTS "posts_update_policy" ON public.posts;

CREATE POLICY "posts_update_policy"
    ON public.posts
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = author_id
        OR (
            page_id IS NOT NULL
            AND public.is_page_member(page_id, auth.uid(), ARRAY['owner', 'admin'])
        )
    )
    WITH CHECK (
        auth.uid() = author_id
        OR (
            page_id IS NOT NULL
            AND public.is_page_member(page_id, auth.uid(), ARRAY['owner', 'admin'])
        )
    );

DROP POLICY IF EXISTS "Authors can delete own posts" ON public.posts;
DROP POLICY IF EXISTS "posts_delete_policy" ON public.posts;

CREATE POLICY "posts_delete_policy"
    ON public.posts
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() = author_id
        OR (
            page_id IS NOT NULL
            AND public.is_page_member(page_id, auth.uid(), ARRAY['owner', 'admin'])
        )
    );

COMMIT;
