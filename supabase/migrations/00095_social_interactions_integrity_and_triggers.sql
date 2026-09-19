-- =============================================================================
-- Migration 00095: Social Interactions Integrity, Triggers & Hidden Posts
-- =============================================================================
-- Description:
--   1. Implements public.hidden_posts for persistent "Hide Post" & "Not Interested" actions.
--   2. Implements trg_sync_post_reactions_count on public.post_reactions to guarantee
--      posts.likes_count and profile_counts.likes_received_count stay 100% accurate.
--   3. Implements trg_sync_post_comments_count on public.comments to keep
--      posts.comments_count synchronized with zero client drift.
--   4. Implements trg_sync_post_shares_count on public.post_shares to keep
--      posts.shares_count synchronized with zero client drift.
--   5. Performs one-time zero-mock sanitize synchronizing all existing post counts
--      with physical child row counts.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Hidden Posts Table (Hide Post & Not Interested persistence)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.hidden_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    reason VARCHAR(50) DEFAULT 'hide' NOT NULL CHECK (reason IN ('hide', 'not_interested')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT uq_hidden_posts_user_post UNIQUE (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_hidden_posts_user ON public.hidden_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_hidden_posts_post ON public.hidden_posts(post_id);

ALTER TABLE public.hidden_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hidden_posts_select_own" ON public.hidden_posts;
CREATE POLICY "hidden_posts_select_own"
    ON public.hidden_posts
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "hidden_posts_insert_own" ON public.hidden_posts;
CREATE POLICY "hidden_posts_insert_own"
    ON public.hidden_posts
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "hidden_posts_delete_own" ON public.hidden_posts;
CREATE POLICY "hidden_posts_delete_own"
    ON public.hidden_posts
    FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

GRANT SELECT, INSERT, DELETE ON public.hidden_posts TO authenticated;
GRANT ALL ON public.hidden_posts TO service_role;

-- -----------------------------------------------------------------------------
-- 2. Post Reactions Counter Trigger Function
-- -----------------------------------------------------------------------------

-- Drop legacy non-recounting trigger if present to prevent redundant execution
DROP TRIGGER IF EXISTS trg_like_received_count_change ON public.post_reactions;

CREATE OR REPLACE FUNCTION public.sync_post_reactions_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_post_id UUID;
    target_author_id UUID;
    cnt INT;
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        target_post_id := NEW.post_id;
    ELSE
        target_post_id := OLD.post_id;
    END IF;

    -- Recalculate verified count of reactions for this post
    SELECT COUNT(*)::INT INTO cnt
    FROM public.post_reactions
    WHERE post_id = target_post_id;

    UPDATE public.posts
    SET likes_count = cnt,
        updated_at = now()
    WHERE id = target_post_id;

    -- Synchronize profile_counts.likes_received_count for post author
    SELECT author_id INTO target_author_id
    FROM public.posts
    WHERE id = target_post_id;

    IF target_author_id IS NOT NULL THEN
        UPDATE public.profile_counts
        SET likes_received_count = (
            SELECT COUNT(*)::INT
            FROM public.post_reactions pr
            JOIN public.posts p ON p.id = pr.post_id
            WHERE p.author_id = target_author_id
        ),
        updated_at = now()
        WHERE profile_id = target_author_id;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_post_reactions_count ON public.post_reactions;
CREATE TRIGGER trg_sync_post_reactions_count
AFTER INSERT OR DELETE OR UPDATE OF reaction_type ON public.post_reactions
FOR EACH ROW EXECUTE FUNCTION public.sync_post_reactions_count();

-- -----------------------------------------------------------------------------
-- 3. Comments Counter Trigger Function
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sync_post_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_post_id UUID;
    cnt INT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        target_post_id := NEW.post_id;
    ELSE
        target_post_id := OLD.post_id;
    END IF;

    IF target_post_id IS NOT NULL THEN
        SELECT COUNT(*)::INT INTO cnt
        FROM public.comments
        WHERE post_id = target_post_id;

        UPDATE public.posts
        SET comments_count = cnt,
            updated_at = now()
        WHERE id = target_post_id;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_post_comments_count ON public.comments;
CREATE TRIGGER trg_sync_post_comments_count
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.sync_post_comments_count();

-- -----------------------------------------------------------------------------
-- 4. Post Shares Counter Trigger Function
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sync_post_shares_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_post_id UUID;
    cnt INT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        target_post_id := NEW.post_id;
    ELSE
        target_post_id := OLD.post_id;
    END IF;

    IF target_post_id IS NOT NULL THEN
        SELECT COUNT(*)::INT INTO cnt
        FROM public.post_shares
        WHERE post_id = target_post_id;

        UPDATE public.posts
        SET shares_count = cnt,
            updated_at = now()
        WHERE id = target_post_id;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_post_shares_count ON public.post_shares;
CREATE TRIGGER trg_sync_post_shares_count
AFTER INSERT OR DELETE ON public.post_shares
FOR EACH ROW EXECUTE FUNCTION public.sync_post_shares_count();

-- -----------------------------------------------------------------------------
-- 5. Zero-Mock One-Time Sanitize Query
-- -----------------------------------------------------------------------------

-- Resynchronize all posts with physical row counts
UPDATE public.posts p
SET likes_count = COALESCE((
        SELECT COUNT(*)::INT
        FROM public.post_reactions pr
        WHERE pr.post_id = p.id
    ), 0),
    comments_count = COALESCE((
        SELECT COUNT(*)::INT
        FROM public.comments c
        WHERE c.post_id = p.id
    ), 0),
    shares_count = COALESCE((
        SELECT COUNT(*)::INT
        FROM public.post_shares ps
        WHERE ps.post_id = p.id
    ), 0);

-- Resynchronize profile likes_received_count
UPDATE public.profile_counts pc
SET likes_received_count = COALESCE((
        SELECT COUNT(*)::INT
        FROM public.post_reactions pr
        JOIN public.posts p ON p.id = pr.post_id
        WHERE p.author_id = pc.profile_id
    ), 0);

COMMIT;
