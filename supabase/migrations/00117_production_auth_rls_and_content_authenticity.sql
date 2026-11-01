-- =============================================================================
-- Migration 00117: Production Authentication, RLS Hardening & Caribbean Content Authenticity
--
-- Standards: NASA-grade SQL, Fortune-100 Database Security & RLS Compliance
-- Governing: AGENTS.md, ARCHITECTURE.md, THREAT-MODEL.md
--
-- Objectives:
-- 1. Create public.cultural_observances model separating timeless annual
--    traditions and cultural heritage from scheduled future events.
-- 2. Extend public.events with official source attribution, verification status,
--    timezone, organizer credentials, and re-verification timestamps.
-- 3. Harden public.events RLS: only confirmed events or host's own events are visible.
-- 4. Harden public.sounds RLS: remove anonymous sound insertion vulnerability; require
--    TO authenticated with strict auth.uid() = creator_id ownership check.
-- 5. Harden public.podcast_analytics RLS: enforce authenticated listener ownership.
-- 6. Seed authoritative cultural observances with official tourism boards and cultural ministries.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Caribbean Cultural Observances & Traditions Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cultural_observances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    territory_iso VARCHAR(3) REFERENCES public.countries(iso_code) NOT NULL,
    territory_name TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (
        category IN ('carnival', 'national_heritage', 'music_festival', 'religious_observance', 'culinary_tradition', 'folklore_tradition')
    ),
    description TEXT NOT NULL,
    historical_significance TEXT NOT NULL,
    typical_season VARCHAR(80) NOT NULL,
    official_authority_name TEXT NOT NULL,
    official_source_url TEXT,
    source_verification_status VARCHAR(30) DEFAULT 'confirmed' NOT NULL CHECK (
        source_verification_status IN ('confirmed', 'pending_editorial_review', 'historical_archive')
    ),
    is_annual_tradition BOOLEAN DEFAULT true NOT NULL,
    tags TEXT[] DEFAULT '{}'::text[] NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.cultural_observances IS 'Authoritative Caribbean cultural heritage, annual festivals, and traditions with verified source attribution.';
COMMENT ON COLUMN public.cultural_observances.name IS 'Official name of the cultural observance (e.g. Trinidad Carnival).';
COMMENT ON COLUMN public.cultural_observances.historical_significance IS 'Scholarly cultural and historical context.';
COMMENT ON COLUMN public.cultural_observances.official_authority_name IS 'Governing cultural ministry, national carnival commission, or official tourism board.';

CREATE INDEX IF NOT EXISTS idx_cultural_observances_territory ON public.cultural_observances(territory_iso);
CREATE INDEX IF NOT EXISTS idx_cultural_observances_category ON public.cultural_observances(category);
CREATE INDEX IF NOT EXISTS idx_cultural_observances_tags ON public.cultural_observances USING gin (tags);

-- RLS for Cultural Observances
ALTER TABLE public.cultural_observances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cultural_observances_public_read" ON public.cultural_observances;
CREATE POLICY "cultural_observances_public_read" ON public.cultural_observances
    FOR SELECT
    TO anon, authenticated
    USING (source_verification_status = 'confirmed');

DROP POLICY IF EXISTS "cultural_observances_staff_manage" ON public.cultural_observances;
CREATE POLICY "cultural_observances_staff_manage" ON public.cultural_observances
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.accounts a
            WHERE a.profile_id = (select auth.uid())
            AND a.role IN ('super_admin', 'superadmin', 'management', 'admin', 'content_manager')
            AND a.status = 'active'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.accounts a
            WHERE a.profile_id = (select auth.uid())
            AND a.role IN ('super_admin', 'superadmin', 'management', 'admin', 'content_manager')
            AND a.status = 'active'
        )
    );

-- -----------------------------------------------------------------------------
-- 2. Extend public.events with Source Attribution & Verification Metadata
-- -----------------------------------------------------------------------------
ALTER TABLE public.events
    ADD COLUMN IF NOT EXISTS source_type VARCHAR(40) DEFAULT 'community_submission' NOT NULL,
    ADD COLUMN IF NOT EXISTS verification_status VARCHAR(30) DEFAULT 'pending_review' NOT NULL,
    ADD COLUMN IF NOT EXISTS official_source_url TEXT,
    ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC' NOT NULL,
    ADD COLUMN IF NOT EXISTS organizer_name TEXT,
    ADD COLUMN IF NOT EXISTS ticket_source_url TEXT,
    ADD COLUMN IF NOT EXISTS ticket_availability VARCHAR(24) DEFAULT 'unverified' NOT NULL,
    ADD COLUMN IF NOT EXISTS postponed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS cultural_observance_id UUID REFERENCES public.cultural_observances(id) ON DELETE SET NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'events_source_type_check'
    ) THEN
        ALTER TABLE public.events
            ADD CONSTRAINT events_source_type_check
            CHECK (source_type IN ('official_board', 'festival_organizer', 'verified_organizer', 'cultural_calendar', 'community_submission'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'events_verification_status_check'
    ) THEN
        ALTER TABLE public.events
            ADD CONSTRAINT events_verification_status_check
            CHECK (verification_status IN ('confirmed', 'pending_review', 're_verification_needed', 'rejected'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'events_ticket_availability_check'
    ) THEN
        ALTER TABLE public.events
            ADD CONSTRAINT events_ticket_availability_check
            CHECK (ticket_availability IN ('available', 'sold_out', 'free_entry', 'not_applicable', 'unverified'));
    END IF;
END $$;

COMMENT ON COLUMN public.events.source_type IS 'Provenance of the event listing: official board, verified organizer, or community submission.';
COMMENT ON COLUMN public.events.verification_status IS 'Editorial verification state: confirmed, pending_review, re_verification_needed, or rejected.';
COMMENT ON COLUMN public.events.official_source_url IS 'Authoritative external link to official tourism board, organizer site, or calendar.';
COMMENT ON COLUMN public.events.last_verified_at IS 'Timestamp of the most recent factual verification check.';

CREATE INDEX IF NOT EXISTS idx_events_verification_status ON public.events(verification_status, starts_at);
CREATE INDEX IF NOT EXISTS idx_events_source_type ON public.events(source_type);
CREATE INDEX IF NOT EXISTS idx_events_observance ON public.events(cultural_observance_id);

-- -----------------------------------------------------------------------------
-- 3. Harden public.events RLS Policies
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read published events" ON public.events;
CREATE POLICY "Public read published events" ON public.events
    FOR SELECT
    TO anon, authenticated
    USING (
        (verification_status = 'confirmed' AND privacy = 'public' AND is_cancelled = false AND starts_at > now() - interval '24 hours')
        OR ((select auth.uid()) = host_id)
        OR EXISTS (
            SELECT 1 FROM public.accounts a
            WHERE a.profile_id = (select auth.uid())
            AND a.role IN ('super_admin', 'superadmin', 'management', 'admin', 'moderator')
            AND a.status = 'active'
        )
    );

DROP POLICY IF EXISTS "Hosts update events" ON public.events;
CREATE POLICY "Hosts update events" ON public.events
    FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = host_id)
    WITH CHECK ((select auth.uid()) = host_id);

-- -----------------------------------------------------------------------------
-- 4. Harden public.sounds RLS Policies (Fix anonymous insertion security hole)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "sounds_creator_insert" ON public.sounds;
CREATE POLICY "sounds_creator_insert" ON public.sounds
    FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = creator_id);

DROP POLICY IF EXISTS "sounds_creator_update" ON public.sounds;
CREATE POLICY "sounds_creator_update" ON public.sounds
    FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = creator_id)
    WITH CHECK ((select auth.uid()) = creator_id);

DROP POLICY IF EXISTS "sounds_creator_delete" ON public.sounds;
CREATE POLICY "sounds_creator_delete" ON public.sounds
    FOR DELETE
    TO authenticated
    USING ((select auth.uid()) = creator_id);

-- -----------------------------------------------------------------------------
-- 5. Harden public.podcast_analytics RLS Policy
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "podcast_analytics_insert_all" ON public.podcast_analytics;
CREATE POLICY "podcast_analytics_insert_all" ON public.podcast_analytics
    FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = listener_id);

-- -----------------------------------------------------------------------------
-- 6. Seed Authoritative Caribbean Cultural Observances
-- -----------------------------------------------------------------------------
INSERT INTO public.cultural_observances (
    name, slug, territory_iso, territory_name, category, description,
    historical_significance, typical_season, official_authority_name,
    official_source_url, source_verification_status, is_annual_tradition, tags
) VALUES
(
    'Trinidad and Tobago Carnival',
    'trinidad-and-tobago-carnival',
    'TTO',
    'Trinidad & Tobago',
    'carnival',
    'The Mother of all Caribbean Carnivals featuring Panorama steelband finals, Canboulay riots reenactment, J’ouvert dawn parade, and Pretty Mas street masquerade.',
    'Traces historical roots to 18th-century French planter masquerades and post-emancipation Canboulay celebrations where formerly enslaved Africans forged calypso, steelpan, and mas traditions.',
    'Pre-Lenten Monday and Tuesday (February or March)',
    'National Carnival Commission of Trinidad and Tobago (NCC)',
    'https://www.ncctt.org',
    'confirmed',
    true,
    ARRAY['carnival', 'steelpan', 'soca', 'calypso', 'jouvert', 'panorama']
),
(
    'Barbados Crop Over Festival',
    'barbados-crop-over',
    'BRB',
    'Barbados',
    'carnival',
    'Barbados premier cultural festival celebrating the historic end of the sugarcane harvest, culminating in Cohobblopot, Pic-O-De-Crop calypso finals, and Grand Kadooment Day.',
    'Dates to 1687 celebrating the annual sugar harvest on plantation estates, revitalized in 1974 by the Barbados Tourism Authority as a national celebration of Bajan heritage.',
    'June to First Monday in August (Grand Kadooment Day)',
    'National Cultural Foundation Barbados (NCF)',
    'https://www.ncf.bb',
    'confirmed',
    true,
    ARRAY['crop-over', 'kadooment', 'soca', 'calypso', 'bajan-heritage']
),
(
    'The Bahamas Junkanoo Celebration',
    'bahamas-junkanoo',
    'BHS',
    'Bahamas',
    'carnival',
    'Vibrant street parade of music, dance, and elaborate handcrafted crepe-paper costumes with cowbells, goatskin drums, brass, and whistles marching through downtown Nassau.',
    'Originated during the transatlantic slave trade when enslaved people were granted three days off around Christmas and Boxing Day to celebrate African ancestral traditions.',
    'Boxing Day (December 26) & New Year’s Day (January 1)',
    'Junkanoo National Commission / Ministry of Youth, Sports & Culture',
    'https://www.bahamas.com/junkanoo',
    'confirmed',
    true,
    ARRAY['junkanoo', 'goatskin-drums', 'cowbells', 'nassau', 'boxing-day']
),
(
    'St. Thomas Carnival',
    'st-thomas-carnival',
    'VIR',
    'U.S. Virgin Islands',
    'carnival',
    'A month-long celebration of Virgin Islands heritage featuring Calypso Monarch, J’ouvert, Children’s Parade, Adults’ Parade, and Carnival Village.',
    'First celebrated in 1912 and re-established in 1952, honoring Virgin Islands cultural identity, Quelbe scratch bands, and Mocko Jumbie stilt dancing.',
    'Mid-April through First Weekend in May',
    'USVI Department of Tourism / Division of Festivals',
    'https://www.usvifestivals.vi',
    'confirmed',
    true,
    ARRAY['usvi', 'st-thomas', 'quelbe', 'mocko-jumbie', 'jouvert']
),
(
    'Haiti Rara & Gouyad Heritage',
    'haiti-rara-gouyad',
    'HTI',
    'Haiti',
    'folklore_tradition',
    'Traditional Haitian communal processional music played on cylindrical bamboo and metal trumpets (vaksin), drums, and percussion, intersecting with contemporary Haitian Kompa.',
    'Sacred and secular seasonal tradition practiced during Lent leading up to Easter Sunday, deeply connected to Haitian rural community self-reliance and anti-colonial resistance.',
    'Lenten Season through Easter Sunday',
    'Ministère de la Culture et de la Communication d’Haïti',
    'https://culture.gouv.ht',
    'confirmed',
    true,
    ARRAY['rara', 'vaksin', 'kompa', 'gouyad', 'ayiti']
),
(
    'Jamaica Reggae Sumfest',
    'jamaica-reggae-sumfest',
    'JAM',
    'Jamaica',
    'music_festival',
    'The largest music festival in Jamaica and the Caribbean, dedicated to authentic Reggae, Dancehall, and Jamaican sound system culture in Montego Bay.',
    'Founded in 1993 to preserve and showcase Jamaica indigenous musical arts on a global stage, maintaining roots in Kingston recording studio innovations.',
    'Mid-July annually',
    'Jamaica Tourist Board (JTB)',
    'https://www.visitjamaica.com',
    'confirmed',
    true,
    ARRAY['reggae', 'dancehall', 'montego-bay', 'sound-system', 'sumfest']
),
(
    'Grenada Spicemas',
    'grenada-spicemas',
    'GRD',
    'Grenada',
    'carnival',
    'Grenada annual national carnival famous for authentic Jab Jab oil mas, traditional drumming, Groovy and Power Soca Monarch, and Fancy Mas.',
    'Roots in post-emancipation African expression where Jab Molassie (molasses devils) symbolically reenacted the cruelties of sugar cane production while mocking colonial authority.',
    'Second Monday and Tuesday in August',
    'Spicemas Corporation (SMC) & Grenada Tourism Authority',
    'https://www.puregrenada.com',
    'confirmed',
    true,
    ARRAY['spicemas', 'jab-jab', 'oil-mas', 'soca', 'grenada']
),
(
    'Dominica World Creole Music Festival',
    'dominica-world-creole-music-festival',
    'DMA',
    'Dominica',
    'music_festival',
    'Premier three-day musical exposition of Cadence-lypso, Bouyon, Kompa, Zouk, and Afro-Caribbean rhythms on the Nature Island.',
    'Launched in 1997 during Dominica’s Independence Season to celebrate Creole-speaking nations and protect indigenous Dominican musical innovations.',
    'Last weekend of October (Dominica Independence Season)',
    'Discover Dominica Authority (DDA)',
    'https://www.discoverdominica.com',
    'confirmed',
    true,
    ARRAY['bouyon', 'cadence', 'zouk', 'creole', 'nature-island']
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    territory_iso = EXCLUDED.territory_iso,
    territory_name = EXCLUDED.territory_name,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    historical_significance = EXCLUDED.historical_significance,
    typical_season = EXCLUDED.typical_season,
    official_authority_name = EXCLUDED.official_authority_name,
    official_source_url = EXCLUDED.official_source_url,
    source_verification_status = EXCLUDED.source_verification_status,
    tags = EXCLUDED.tags,
    updated_at = now();
