-- =============================================================================
-- Migration 00094: Universal Pages 2.0, Role-Based Access Control, Real Followers & Real-Time Trending
-- =============================================================================
-- Description:
--   1. Implements public.page_categories with extensible 12-group taxonomy.
--   2. Elevates public.businesses into Universal Pages with page_type, category_id,
--      is_deactivated, and custom_settings.
--   3. Implements public.page_roles with Owner, Administrator, Editor, Moderator, Analyst.
--   4. Implements public.page_followers with atomic follow/unfollow RPC.
--   5. Attaches page_id to public.posts with multi-role publishing permissions.
--   6. Real-time trending intelligence recalculation with ZERO mock data.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Extensible Universal Page Categories
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.page_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_key VARCHAR(50) NOT NULL,
    group_name VARCHAR(100) NOT NULL,
    slug VARCHAR(80) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_name VARCHAR(50) DEFAULT 'Building2',
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_page_categories_group ON public.page_categories(group_key);
CREATE INDEX IF NOT EXISTS idx_page_categories_slug ON public.page_categories(slug);

ALTER TABLE public.page_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_page_categories" ON public.page_categories;
CREATE POLICY "public_read_page_categories"
    ON public.page_categories
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

GRANT SELECT ON public.page_categories TO anon, authenticated;
GRANT ALL ON public.page_categories TO service_role;

-- Seed comprehensive universal category groups
INSERT INTO public.page_categories (group_key, group_name, slug, name, description, icon_name)
VALUES
    -- PEOPLE & CREATOR
    ('creator', 'People & Creator', 'creator-general', 'Creator', 'Content creators and digital storytellers', 'Sparkles'),
    ('creator', 'People & Creator', 'artist', 'Artist', 'Visual, fine, and performance artists', 'Palette'),
    ('creator', 'People & Creator', 'musician', 'Musician & DJ', 'Singers, instrumentalists, and DJs', 'Music'),
    ('creator', 'People & Creator', 'producer', 'Producer', 'Audio, video, and event producers', 'Radio'),
    ('creator', 'People & Creator', 'writer-author', 'Writer & Author', 'Journalists, poets, and authors', 'BookOpen'),
    ('creator', 'People & Creator', 'influencer-personality', 'Influencer & Public Figure', 'Public personalities and figures', 'UserCheck'),
    ('creator', 'People & Creator', 'professional-freelancer', 'Professional & Freelancer', 'Independent consultants and professionals', 'Briefcase'),

    -- BUSINESS & COMMERCE
    ('business', 'Business & Commerce', 'business-company', 'Business & Company', 'Enterprises, agencies, and corporations', 'Building2'),
    ('business', 'Business & Commerce', 'brand', 'Brand', 'Consumer brands, fashion, and lifestyle labels', 'Tag'),
    ('business', 'Business & Commerce', 'retail-store', 'Store & Shop', 'Retail shops, boutiques, and marketplaces', 'Store'),
    ('business', 'Business & Commerce', 'restaurant-cafe', 'Restaurant & Café', 'Dining, bakeries, food trucks, and cafés', 'Utensils'),
    ('business', 'Business & Commerce', 'food-beverage', 'Food & Beverage', 'Distilleries, culinary brands, and food producers', 'Wine'),
    ('business', 'Business & Commerce', 'service-provider', 'Service Provider', 'Trades, mechanics, cleaners, and technical services', 'Wrench'),
    ('business', 'Business & Commerce', 'real-estate-construction', 'Real Estate & Construction', 'Realtors, architects, and building contractors', 'Home'),
    ('business', 'Business & Commerce', 'transport-logistics', 'Transportation & Logistics', 'Carriers, shipping, drivers, and charters', 'Truck'),
    ('business', 'Business & Commerce', 'hospitality-hotel', 'Hospitality & Hotel', 'Resorts, villas, guest houses, and hotels', 'Hotel'),

    -- MEDIA & ENTERTAINMENT
    ('media', 'Media & Entertainment', 'media-org', 'Media Organization', 'Broadcasters, digital news, and publications', 'Tv'),
    ('media', 'Media & Entertainment', 'podcast-show', 'Podcast & Audio Show', 'Podcasts, interview shows, and audio blogs', 'Mic'),
    ('media', 'Media & Entertainment', 'radio-station', 'Radio Station', 'Traditional and internet radio stations', 'Radio'),
    ('media', 'Media & Entertainment', 'record-label', 'Record Label', 'Music publishers, collectives, and studios', 'Disc'),
    ('media', 'Media & Entertainment', 'film-production', 'Film & Production Company', 'Cinema, documentary, and video production', 'Film'),

    -- COMMUNITY & CULTURE
    ('community', 'Community & Culture', 'community-group', 'Community & Cultural Organization', 'Cultural groups, associations, and clubs', 'Users'),
    ('community', 'Community & Culture', 'heritage-arts', 'Heritage & Arts Organization', 'Carnival mas bands, folklore, and heritage trusts', 'Flag'),
    ('community', 'Community & Culture', 'diaspora-org', 'Diaspora Organization', 'Societies connecting islanders worldwide', 'Globe'),

    -- EDUCATION
    ('education', 'Education', 'school-university', 'School & University', 'Academic institutions, colleges, and schools', 'GraduationCap'),
    ('education', 'Education', 'training-academy', 'Training Organization', 'Vocational courses, workshops, and bootcamps', 'Award'),

    -- ORGANIZATIONS & INSTITUTIONS
    ('institution', 'Organizations & Institutions', 'nonprofit-ngo', 'Nonprofit & NGO', 'Charities, foundations, and civic bodies', 'HeartHandshake'),
    ('institution', 'Organizations & Institutions', 'civic-public', 'Government & Public Service', 'Civic departments, embassies, and public services', 'Landmark'),

    -- SPORTS & FITNESS
    ('sports', 'Sports & Fitness', 'sports-team-club', 'Sports Team & Club', 'Athletic clubs, teams, leagues, and athletes', 'Trophy'),
    ('sports', 'Sports & Fitness', 'fitness-recreation', 'Fitness & Recreation', 'Gyms, trainers, dive centers, and outdoor rec', 'Activity'),

    -- FAITH & SPIRITUALITY
    ('faith', 'Faith & Spirituality', 'faith-congregation', 'Faith Organization & Ministry', 'Churches, ministries, and religious institutions', 'Compass'),

    -- EVENTS
    ('events', 'Events & Festivals', 'event-festival', 'Festival & Event Organizer', 'Carnivals, conferences, and exhibitions', 'Calendar'),

    -- TRAVEL & PLACES
    ('travel', 'Travel & Places', 'destination-attraction', 'Destination & Attraction', 'Tourist attractions, natural parks, and landmarks', 'MapPin'),
    ('travel', 'Travel & Places', 'tour-operator', 'Tour Operator & Guide', 'Island excursions, boat charters, and travel guides', 'Compass'),

    -- TECHNOLOGY
    ('technology', 'Technology', 'tech-company-startup', 'Technology Company & Startup', 'Software, app builders, tech hardware, and labs', 'Laptop'),

    -- OTHER
    ('other', 'Other', 'project-initiative', 'Project or Initiative', 'Special projects, civic initiatives, and campaigns', 'Sparkles')
ON CONFLICT (slug) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. Universal Extensions on public.businesses
-- -----------------------------------------------------------------------------

ALTER TABLE public.businesses
    ALTER COLUMN category TYPE TEXT,
    ADD COLUMN IF NOT EXISTS page_type VARCHAR(40) DEFAULT 'universal' NOT NULL,
    ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.page_categories(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS is_deactivated BOOLEAN DEFAULT false NOT NULL,
    ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS custom_settings JSONB DEFAULT '{}'::jsonb NOT NULL;

CREATE INDEX IF NOT EXISTS idx_businesses_active_search
    ON public.businesses(is_deactivated, is_archived, deleted_at)
    WHERE is_deactivated = false AND is_archived = false AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_businesses_category_id
    ON public.businesses(category_id);

-- -----------------------------------------------------------------------------
-- 3. Page Roles (RBAC)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.page_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role VARCHAR(20) CHECK (role IN ('owner', 'admin', 'editor', 'moderator', 'analyst')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT uq_page_roles UNIQUE (page_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_page_roles_user ON public.page_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_page_roles_page ON public.page_roles(page_id);

ALTER TABLE public.page_roles ENABLE ROW LEVEL SECURITY;

-- Backfill owners of existing businesses into page_roles
INSERT INTO public.page_roles (page_id, user_id, role)
SELECT b.id, b.owner_id, 'owner'
FROM public.businesses b
ON CONFLICT (page_id, user_id) DO NOTHING;

-- Security helper functions
CREATE OR REPLACE FUNCTION public.is_page_member(
    p_page_id UUID,
    p_user_id UUID,
    p_roles TEXT[] DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.page_roles
        WHERE page_id = p_page_id
          AND user_id = p_user_id
          AND (p_roles IS NULL OR role = ANY(p_roles))
    );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_page(
    p_page_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.page_roles
        WHERE page_id = p_page_id
          AND user_id = p_user_id
          AND role IN ('owner', 'admin')
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_page_member(UUID, UUID, TEXT[]) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_page(UUID, UUID) TO anon, authenticated, service_role;

-- RLS Policies for page_roles
DROP POLICY IF EXISTS "page_roles_select" ON public.page_roles;
CREATE POLICY "page_roles_select"
    ON public.page_roles
    FOR SELECT
    TO authenticated
    USING (
        public.is_page_member(page_id, auth.uid())
        OR user_id = auth.uid()
    );

DROP POLICY IF EXISTS "page_roles_manage" ON public.page_roles;
CREATE POLICY "page_roles_manage"
    ON public.page_roles
    FOR ALL
    TO authenticated
    USING (
        public.can_manage_page(page_id, auth.uid())
    )
    WITH CHECK (
        public.can_manage_page(page_id, auth.uid())
    );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_roles TO authenticated;
GRANT ALL ON public.page_roles TO service_role;

-- -----------------------------------------------------------------------------
-- 4. Page Followers Subsystem
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.page_followers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT uq_page_followers UNIQUE (page_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_page_followers_page ON public.page_followers(page_id);
CREATE INDEX IF NOT EXISTS idx_page_followers_user ON public.page_followers(user_id);

ALTER TABLE public.page_followers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "page_followers_select" ON public.page_followers;
CREATE POLICY "page_followers_select"
    ON public.page_followers
    FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "page_followers_insert" ON public.page_followers;
CREATE POLICY "page_followers_insert"
    ON public.page_followers
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "page_followers_delete" ON public.page_followers;
CREATE POLICY "page_followers_delete"
    ON public.page_followers
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

GRANT SELECT, INSERT, DELETE ON public.page_followers TO authenticated;
GRANT SELECT ON public.page_followers TO anon;
GRANT ALL ON public.page_followers TO service_role;

-- Atomic toggle page follow RPC
CREATE OR REPLACE FUNCTION public.toggle_page_follow(p_page_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_existing_id UUID;
    v_count INT;
    v_is_following BOOLEAN;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to follow a Page';
    END IF;

    -- Verify page exists and is not deleted
    IF NOT EXISTS (SELECT 1 FROM public.businesses WHERE id = p_page_id AND deleted_at IS NULL) THEN
        RAISE EXCEPTION 'Page does not exist';
    END IF;

    SELECT id INTO v_existing_id
    FROM public.page_followers
    WHERE page_id = p_page_id AND user_id = v_user_id;

    IF v_existing_id IS NOT NULL THEN
        DELETE FROM public.page_followers WHERE id = v_existing_id;
        v_is_following := false;
    ELSE
        INSERT INTO public.page_followers (page_id, user_id)
        VALUES (p_page_id, v_user_id);
        v_is_following := true;
    END IF;

    SELECT COUNT(*) INTO v_count
    FROM public.page_followers
    WHERE page_id = p_page_id;

    RETURN jsonb_build_object(
        'status', 'success',
        'page_id', p_page_id,
        'is_following', v_is_following,
        'follower_count', v_count
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_page_follow(UUID) TO authenticated;

-- -----------------------------------------------------------------------------
-- 5. Attach page_id to public.posts
-- -----------------------------------------------------------------------------

ALTER TABLE public.posts
    ADD COLUMN IF NOT EXISTS page_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_posts_page_id
    ON public.posts(page_id)
    WHERE page_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 6. Updated Businesses & Posts RLS
-- -----------------------------------------------------------------------------

-- Public read for businesses: active pages are visible to all; inactive only to team members
DROP POLICY IF EXISTS "Public read businesses" ON public.businesses;
CREATE POLICY "Public read businesses"
    ON public.businesses
    FOR SELECT
    TO anon, authenticated
    USING (
        (is_deactivated = false AND is_archived = false AND deleted_at IS NULL)
        OR (auth.uid() IS NOT NULL AND public.is_page_member(id, auth.uid()))
    );

-- Owner or Admin update business
DROP POLICY IF EXISTS "Owner updates business" ON public.businesses;
CREATE POLICY "Owner or admin updates business"
    ON public.businesses
    FOR UPDATE
    TO authenticated
    USING (
        public.can_manage_page(id, auth.uid())
    )
    WITH CHECK (
        public.can_manage_page(id, auth.uid())
    );

-- Delete policy: Owner only
DROP POLICY IF EXISTS "Owner deletes business" ON public.businesses;
CREATE POLICY "Owner deletes business"
    ON public.businesses
    FOR DELETE
    TO authenticated
    USING (
        public.is_page_member(id, auth.uid(), ARRAY['owner'])
    );

-- -----------------------------------------------------------------------------
-- 7. Real-Time Trending Signals Calculation (Zero Mock Data)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.refresh_trending_signals()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_count integer := 0;
BEGIN
    -- 1. Clear expired signals
    DELETE FROM public.trending_signals WHERE expires_at < now();

    -- 2. Compute trending cultural tags and hashtags directly from genuine recent posts
    WITH tag_counts AS (
        SELECT
            p.country_id,
            c.iso_code AS territory_iso,
            t.tag      AS raw_tag,
            p.created_at,
            p.likes_count,
            p.comments_count,
            p.shares_count
        FROM public.posts p
        LEFT JOIN public.countries c ON c.id = p.country_id
        CROSS JOIN LATERAL unnest(p.cultural_tags) AS t(tag)
        WHERE p.created_at > now() - INTERVAL '24 hours'
          AND p.visibility = 'public'
          AND t.tag IS NOT NULL
          AND length(trim(t.tag)) > 1
    ),
    scored_tags AS (
        SELECT
            NULL::text AS territory_iso,
            'hashtag'  AS signal_type,
            lower(replace(raw_tag, '#', '')) AS entity_id,
            replace(raw_tag, '#', '')        AS entity_label,
            (
                COUNT(*) FILTER (WHERE created_at > now() - INTERVAL '2 hours') * 3
                + COUNT(*)
                + COALESCE(SUM(likes_count + comments_count * 2 + shares_count * 3), 0)
            )::numeric AS score,
            COUNT(*) FILTER (WHERE created_at > now() - INTERVAL '2 hours')::integer AS post_count_last_2h,
            COUNT(*)::integer AS post_count_last_24h,
            now() AS computed_at,
            now() + INTERVAL '4 hours' AS expires_at
        FROM tag_counts
        GROUP BY lower(replace(raw_tag, '#', '')), replace(raw_tag, '#', '')
        HAVING COUNT(*) >= 1
    )
    INSERT INTO public.trending_signals (
        territory_iso, signal_type, entity_id, entity_label,
        score, post_count_last_2h, post_count_last_24h, computed_at, expires_at
    )
    SELECT
        territory_iso, signal_type, entity_id, entity_label,
        score, post_count_last_2h, post_count_last_24h, computed_at, expires_at
    FROM scored_tags
    ORDER BY score DESC
    LIMIT 20
    ON CONFLICT DO NOTHING;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_trending_signals() TO authenticated, service_role;

COMMIT;
