-- Migration 00050: Universal Discovery, Recommendations & Social Connections
-- Description: Enhances public.friendships RLS with DELETE permissions, creates recommendation feedback table,
--              adds discovery privacy controls to profiles, and adds indexing for fast multi-entity search.

-- =============================================================================
-- 1. ENHANCE FRIENDSHIPS RLS (ALLOW USERS TO CANCEL / REMOVE FRIENDSHIPS)
-- =============================================================================

DROP POLICY IF EXISTS "Participants delete friendship" ON public.friendships;
CREATE POLICY "Participants delete friendship" ON public.friendships
    FOR DELETE USING (auth.uid() IN (requester_id, addressee_id));

-- Add composite indexes for bi-directional lookup and status checking
CREATE INDEX IF NOT EXISTS idx_friendships_bidirectional
    ON public.friendships (requester_id, addressee_id, status);

CREATE INDEX IF NOT EXISTS idx_friendships_status_updated
    ON public.friendships (status, updated_at DESC);

-- =============================================================================
-- 2. DISCOVERY & RECOMMENDATION PRIVACY PREFERENCES ON PROFILES
-- =============================================================================

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS discoverable_by_name BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS show_in_recommendations BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS allow_mutual_recommendations BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS allow_creator_discovery BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_profiles_discovery_eligible
    ON public.profiles (is_private, show_in_recommendations, status)
    WHERE is_private = false AND show_in_recommendations = true;

-- =============================================================================
-- 3. RECOMMENDATION FEEDBACK & DISMISSAL TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.recommendation_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    entity_type VARCHAR(30) NOT NULL CHECK (entity_type IN ('profile', 'creator', 'business', 'merchant', 'community', 'event', 'product', 'podcast')),
    entity_id UUID NOT NULL,
    action VARCHAR(30) NOT NULL CHECK (action IN ('dismiss', 'not_interested', 'hide', 'block_recommendation')),
    reason VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_rec_feedback_user_entity
    ON public.recommendation_feedback (user_id, entity_type, entity_id);

ALTER TABLE public.recommendation_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own recommendation feedback" ON public.recommendation_feedback;
CREATE POLICY "Users read own recommendation feedback" ON public.recommendation_feedback
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own recommendation feedback" ON public.recommendation_feedback;
CREATE POLICY "Users manage own recommendation feedback" ON public.recommendation_feedback
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 4. MULTI-ENTITY SEARCH OPTIMIZATION INDEXES
-- =============================================================================

-- Businesses search indexes
CREATE INDEX IF NOT EXISTS idx_businesses_name_trgm
    ON public.businesses USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_businesses_category_lower
    ON public.businesses (LOWER(category));

-- Communities search indexes
CREATE INDEX IF NOT EXISTS idx_communities_name_trgm
    ON public.communities USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_communities_slug_lower
    ON public.communities (LOWER(slug));

-- Events search indexes
CREATE INDEX IF NOT EXISTS idx_events_title_trgm
    ON public.events USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_events_starts_at_upcoming
    ON public.events (starts_at)
    WHERE starts_at >= now();

-- Products search indexes
CREATE INDEX IF NOT EXISTS idx_products_title_trgm
    ON public.products USING gin (title gin_trgm_ops);

-- =============================================================================
-- 5. FAST MUTUAL CONNECTIONS COUNT FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_mutual_connections_count(user_a UUID, user_b UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    WITH friends_a AS (
        SELECT CASE WHEN requester_id = user_a THEN addressee_id ELSE requester_id END AS friend_id
        FROM public.friendships
        WHERE (requester_id = user_a OR addressee_id = user_a)
          AND status = 'accepted'
    ),
    friends_b AS (
        SELECT CASE WHEN requester_id = user_b THEN addressee_id ELSE requester_id END AS friend_id
        FROM public.friendships
        WHERE (requester_id = user_b OR addressee_id = user_b)
          AND status = 'accepted'
    )
    SELECT COUNT(*)::INTEGER
    FROM friends_a
    INNER JOIN friends_b ON friends_a.friend_id = friends_b.friend_id;
$$;
