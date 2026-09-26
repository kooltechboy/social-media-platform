-- =============================================================================
-- Migration 00100: TUKUBI Production Podcasting Network Architecture (100% Maturity)
-- =============================================================================
-- Description:
--   Complete production-grade podcasting schema for TUKUBI:
--   1. Rich Show metadata (subtitles, canonical URLs, square artwork, show type,
--      territory, diaspora, teams, page association, publication status).
--   2. Rich Episode metadata (episode types, video/HLS derivatives, captions,
--      geographic availability, content warnings, distribution status).
--   3. Team & RBAC (podcast_collaborators).
--   4. Timed Links & Synchronized Transcripts (podcast_timed_links, podcast_transcripts).
--   5. Podcast Distribution Center (podcast_distribution_destinations).
--   6. Private & Subscriber Feeds (podcast_feed_tokens).
--   7. Social Podcasting (podcast_comments, timestamped feedback).
--   8. Sponsor Campaigns & Dynamic Ad Infrastructure (podcast_sponsor_campaigns).
--   9. Storage Buckets ('podcast-video', 'podcast-artwork') with owner RLS.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. PODCAST SHOW EXTENSIONS
-- -----------------------------------------------------------------------------

ALTER TABLE public.podcasts
    ADD COLUMN IF NOT EXISTS subtitle TEXT,
    ADD COLUMN IF NOT EXISTS long_description TEXT,
    ADD COLUMN IF NOT EXISTS canonical_url TEXT,
    ADD COLUMN IF NOT EXISTS artwork_url TEXT,
    ADD COLUMN IF NOT EXISTS square_artwork_url TEXT,
    ADD COLUMN IF NOT EXISTS secondary_languages TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS subcategory VARCHAR(50),
    ADD COLUMN IF NOT EXISTS country VARCHAR(100),
    ADD COLUMN IF NOT EXISTS island_territory VARCHAR(100),
    ADD COLUMN IF NOT EXISTS diaspora_relevance TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS hosts JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS co_hosts JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS guests JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS producer TEXT,
    ADD COLUMN IF NOT EXISTS copyright TEXT,
    ADD COLUMN IF NOT EXISTS publisher TEXT,
    ADD COLUMN IF NOT EXISTS show_type VARCHAR(20) DEFAULT 'episodic',
    ADD COLUMN IF NOT EXISTS trailer_episode_id UUID,
    ADD COLUMN IF NOT EXISTS publication_status VARCHAR(20) DEFAULT 'published',
    ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public',
    ADD COLUMN IF NOT EXISTS page_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS last_published_at TIMESTAMPTZ;

-- Constraints for show types and visibility
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage
        WHERE constraint_name = 'chk_podcasts_show_type' AND table_name = 'podcasts'
    ) THEN
        ALTER TABLE public.podcasts
            ADD CONSTRAINT chk_podcasts_show_type
            CHECK (show_type IN ('episodic', 'serial'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage
        WHERE constraint_name = 'chk_podcasts_visibility' AND table_name = 'podcasts'
    ) THEN
        ALTER TABLE public.podcasts
            ADD CONSTRAINT chk_podcasts_visibility
            CHECK (visibility IN ('public', 'unlisted', 'private'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage
        WHERE constraint_name = 'chk_podcasts_publication_status' AND table_name = 'podcasts'
    ) THEN
        ALTER TABLE public.podcasts
            ADD CONSTRAINT chk_podcasts_publication_status
            CHECK (publication_status IN ('draft', 'published', 'archived'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_podcasts_page_id ON public.podcasts(page_id);
CREATE INDEX IF NOT EXISTS idx_podcasts_visibility ON public.podcasts(visibility);
CREATE INDEX IF NOT EXISTS idx_podcasts_status ON public.podcasts(publication_status);
CREATE INDEX IF NOT EXISTS idx_podcasts_island ON public.podcasts(island_territory);

-- -----------------------------------------------------------------------------
-- 2. PODCAST EPISODE EXTENSIONS
-- -----------------------------------------------------------------------------

ALTER TABLE public.podcast_episodes
    ADD COLUMN IF NOT EXISTS episode_type VARCHAR(20) DEFAULT 'full',
    ADD COLUMN IF NOT EXISTS subtitle TEXT,
    ADD COLUMN IF NOT EXISTS show_notes_html TEXT,
    ADD COLUMN IF NOT EXISTS author_name TEXT,
    ADD COLUMN IF NOT EXISTS guests JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS artwork_url TEXT,
    ADD COLUMN IF NOT EXISTS hls_manifest_url TEXT,
    ADD COLUMN IF NOT EXISTS audio_derivative_url TEXT,
    ADD COLUMN IF NOT EXISTS captions_url TEXT,
    ADD COLUMN IF NOT EXISTS content_warnings TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS geographic_availability TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS distribution_status VARCHAR(20) DEFAULT 'ready',
    ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false NOT NULL,
    ADD COLUMN IF NOT EXISTS early_access_until TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS guid UUID DEFAULT gen_random_uuid() NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage
        WHERE constraint_name = 'chk_podcast_episodes_type' AND table_name = 'podcast_episodes'
    ) THEN
        ALTER TABLE public.podcast_episodes
            ADD CONSTRAINT chk_podcast_episodes_type
            CHECK (episode_type IN ('full', 'trailer', 'bonus'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage
        WHERE constraint_name = 'chk_podcast_episodes_dist_status' AND table_name = 'podcast_episodes'
    ) THEN
        ALTER TABLE public.podcast_episodes
            ADD CONSTRAINT chk_podcast_episodes_dist_status
            CHECK (distribution_status IN ('processing', 'ready', 'failed', 'flagged'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_podcast_episodes_guid ON public.podcast_episodes(guid);
CREATE INDEX IF NOT EXISTS idx_podcast_episodes_type ON public.podcast_episodes(episode_type);
CREATE INDEX IF NOT EXISTS idx_podcast_episodes_scheduled ON public.podcast_episodes(scheduled_for) WHERE scheduled_for IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 3. PODCAST COLLABORATORS & RBAC (TEAMS)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.podcast_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    podcast_id UUID REFERENCES public.podcasts(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'admin', 'producer', 'editor', 'host', 'contributor', 'analyst', 'moderator')),
    can_publish BOOLEAN DEFAULT false NOT NULL,
    can_edit BOOLEAN DEFAULT true NOT NULL,
    can_view_analytics BOOLEAN DEFAULT true NOT NULL,
    can_manage_monetization BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (podcast_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_podcast_collab_podcast ON public.podcast_collaborators(podcast_id);
CREATE INDEX IF NOT EXISTS idx_podcast_collab_profile ON public.podcast_collaborators(profile_id);

ALTER TABLE public.podcast_collaborators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "collab_readable_by_team" ON public.podcast_collaborators;
CREATE POLICY "collab_readable_by_team" ON public.podcast_collaborators
    FOR SELECT USING (
        auth.uid() = profile_id OR EXISTS (
            SELECT 1 FROM public.podcasts p WHERE p.id = podcast_id AND p.creator_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "collab_managed_by_owner" ON public.podcast_collaborators;
CREATE POLICY "collab_managed_by_owner" ON public.podcast_collaborators
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.podcasts p WHERE p.id = podcast_id AND p.creator_id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- 4. TIMED LINKS (Contextual in-stream interactive items)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.podcast_timed_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    episode_id UUID REFERENCES public.podcast_episodes(id) ON DELETE CASCADE NOT NULL,
    timestamp_seconds INTEGER NOT NULL CHECK (timestamp_seconds >= 0),
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    link_kind VARCHAR(30) DEFAULT 'external' CHECK (link_kind IN ('external', 'product', 'creator_page', 'community', 'tukubi_post')),
    target_id UUID,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_podcast_timed_links_ep ON public.podcast_timed_links(episode_id, timestamp_seconds ASC);

ALTER TABLE public.podcast_timed_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "timed_links_public_read" ON public.podcast_timed_links;
CREATE POLICY "timed_links_public_read" ON public.podcast_timed_links
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "timed_links_creator_manage" ON public.podcast_timed_links;
CREATE POLICY "timed_links_creator_manage" ON public.podcast_timed_links
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.podcast_episodes ep
            JOIN public.podcasts p ON p.id = ep.podcast_id
            WHERE ep.id = episode_id AND (
                p.creator_id = auth.uid() OR EXISTS (
                    SELECT 1 FROM public.podcast_collaborators pc
                    WHERE pc.podcast_id = p.id AND pc.profile_id = auth.uid() AND pc.can_edit = true
                )
            )
        )
    );

-- -----------------------------------------------------------------------------
-- 5. STRUCTURED SYNCHRONIZED TRANSCRIPTS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.podcast_transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    episode_id UUID REFERENCES public.podcast_episodes(id) ON DELETE CASCADE NOT NULL,
    language VARCHAR(10) DEFAULT 'en' NOT NULL,
    format VARCHAR(10) DEFAULT 'json' CHECK (format IN ('json', 'vtt', 'srt', 'plain')),
    segments JSONB DEFAULT '[]'::jsonb NOT NULL,
    is_primary BOOLEAN DEFAULT true NOT NULL,
    ai_generated BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_podcast_transcripts_ep ON public.podcast_transcripts(episode_id);

ALTER TABLE public.podcast_transcripts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transcripts_public_read" ON public.podcast_transcripts;
CREATE POLICY "transcripts_public_read" ON public.podcast_transcripts
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "transcripts_creator_manage" ON public.podcast_transcripts;
CREATE POLICY "transcripts_creator_manage" ON public.podcast_transcripts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.podcast_episodes ep
            JOIN public.podcasts p ON p.id = ep.podcast_id
            WHERE ep.id = episode_id AND (
                p.creator_id = auth.uid() OR EXISTS (
                    SELECT 1 FROM public.podcast_collaborators pc
                    WHERE pc.podcast_id = p.id AND pc.profile_id = auth.uid() AND pc.can_edit = true
                )
            )
        )
    );

-- -----------------------------------------------------------------------------
-- 6. PODCAST DISTRIBUTION DESTINATIONS (Distribution Center)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.podcast_distribution_destinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    podcast_id UUID REFERENCES public.podcasts(id) ON DELETE CASCADE NOT NULL,
    platform VARCHAR(40) NOT NULL CHECK (platform IN ('apple_podcasts', 'spotify', 'youtube_music', 'amazon_music', 'iheart', 'pocket_casts', 'overcast', 'podcast_index', 'generic_rss')),
    destination_feed_url TEXT,
    external_show_url TEXT,
    submission_status VARCHAR(30) DEFAULT 'unsubmitted' CHECK (submission_status IN ('unsubmitted', 'submitted', 'verified', 'active', 'failed', 'rejected')),
    last_sync_at TIMESTAMPTZ,
    last_failure_at TIMESTAMPTZ,
    failure_reason TEXT,
    remediation_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (podcast_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_podcast_dist_podcast ON public.podcast_distribution_destinations(podcast_id);

ALTER TABLE public.podcast_distribution_destinations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dist_dest_creator_all" ON public.podcast_distribution_destinations;
CREATE POLICY "dist_dest_creator_all" ON public.podcast_distribution_destinations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.podcasts p WHERE p.id = podcast_id AND (
                p.creator_id = auth.uid() OR EXISTS (
                    SELECT 1 FROM public.podcast_collaborators pc
                    WHERE pc.podcast_id = p.id AND pc.profile_id = auth.uid() AND pc.can_publish = true
                )
            )
        )
    );

-- -----------------------------------------------------------------------------
-- 7. PRIVATE & SUBSCRIBER FEEDS (Tokenized RSS Feeds)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.podcast_feed_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    podcast_id UUID REFERENCES public.podcasts(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    token_hash VARCHAR(128) UNIQUE NOT NULL,
    is_revoked BOOLEAN DEFAULT false NOT NULL,
    expires_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (podcast_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_podcast_feed_token_hash ON public.podcast_feed_tokens(token_hash);

ALTER TABLE public.podcast_feed_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feed_token_user_read" ON public.podcast_feed_tokens;
CREATE POLICY "feed_token_user_read" ON public.podcast_feed_tokens
    FOR SELECT USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "feed_token_creator_manage" ON public.podcast_feed_tokens;
CREATE POLICY "feed_token_creator_manage" ON public.podcast_feed_tokens
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.podcasts p WHERE p.id = podcast_id AND p.creator_id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- 8. SOCIAL PODCASTING (Timestamped Comments & Discussions)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.podcast_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    episode_id UUID REFERENCES public.podcast_episodes(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    parent_comment_id UUID REFERENCES public.podcast_comments(id) ON DELETE CASCADE,
    timestamp_seconds INTEGER CHECK (timestamp_seconds >= 0),
    body TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0 NOT NULL,
    is_pinned BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_podcast_comments_ep ON public.podcast_comments(episode_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_podcast_comments_timestamp ON public.podcast_comments(episode_id, timestamp_seconds);

ALTER TABLE public.podcast_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "podcast_comments_read" ON public.podcast_comments;
CREATE POLICY "podcast_comments_read" ON public.podcast_comments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "podcast_comments_insert" ON public.podcast_comments;
CREATE POLICY "podcast_comments_insert" ON public.podcast_comments
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "podcast_comments_owner_delete" ON public.podcast_comments;
CREATE POLICY "podcast_comments_owner_delete" ON public.podcast_comments
    FOR DELETE USING (
        auth.uid() = profile_id OR EXISTS (
            SELECT 1 FROM public.podcast_episodes ep
            JOIN public.podcasts p ON p.id = ep.podcast_id
            WHERE ep.id = episode_id AND p.creator_id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- 9. SPONSOR CAMPAIGNS & DYNAMIC AD PLACEMENTS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.podcast_sponsor_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    podcast_id UUID REFERENCES public.podcasts(id) ON DELETE CASCADE NOT NULL,
    sponsor_name TEXT NOT NULL,
    sponsor_url TEXT,
    campaign_type VARCHAR(30) DEFAULT 'host_read' CHECK (campaign_type IN ('host_read', 'dynamic_insertion', 'banner_takeover')),
    ad_position VARCHAR(20) DEFAULT 'mid_roll' CHECK (ad_position IN ('pre_roll', 'mid_roll', 'post_roll')),
    start_date DATE,
    end_date DATE,
    target_impressions INTEGER DEFAULT 1000 NOT NULL,
    delivered_impressions INTEGER DEFAULT 0 NOT NULL,
    revenue_minor INTEGER DEFAULT 0 NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_podcast_campaigns_pod ON public.podcast_sponsor_campaigns(podcast_id);

ALTER TABLE public.podcast_sponsor_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sponsor_campaigns_creator_all" ON public.podcast_sponsor_campaigns;
CREATE POLICY "sponsor_campaigns_creator_all" ON public.podcast_sponsor_campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.podcasts p WHERE p.id = podcast_id AND (
                p.creator_id = auth.uid() OR EXISTS (
                    SELECT 1 FROM public.podcast_collaborators pc
                    WHERE pc.podcast_id = p.id AND pc.profile_id = auth.uid() AND pc.can_manage_monetization = true
                )
            )
        )
    );

-- -----------------------------------------------------------------------------
-- 10. STORAGE BUCKETS ('podcast-video', 'podcast-artwork')
-- -----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
    ('podcast-video',   'podcast-video',   true, 5368709120, ARRAY['video/mp4','video/webm','application/x-mpegURL','video/quicktime']),
    ('podcast-artwork', 'podcast-artwork', true, 20971520,   ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE
    SET allowed_mime_types = EXCLUDED.allowed_mime_types,
        file_size_limit = EXCLUDED.file_size_limit;

DO $$
BEGIN
    -- Public read
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Podcast video is publicly readable' AND tablename = 'objects') THEN
        CREATE POLICY "Podcast video is publicly readable" ON storage.objects FOR SELECT USING (bucket_id = 'podcast-video');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Podcast artwork is publicly readable' AND tablename = 'objects') THEN
        CREATE POLICY "Podcast artwork is publicly readable" ON storage.objects FOR SELECT USING (bucket_id = 'podcast-artwork');
    END IF;

    -- Authenticated creator insert scoped to user folder
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated creators upload podcast video' AND tablename = 'objects') THEN
        CREATE POLICY "Authenticated creators upload podcast video" ON storage.objects FOR INSERT
        WITH CHECK (
            bucket_id = 'podcast-video'
            AND auth.role() = 'authenticated'
            AND (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated creators upload podcast artwork' AND tablename = 'objects') THEN
        CREATE POLICY "Authenticated creators upload podcast artwork" ON storage.objects FOR INSERT
        WITH CHECK (
            bucket_id = 'podcast-artwork'
            AND auth.role() = 'authenticated'
            AND (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;

    -- Owner updates & deletes
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users update own podcast video' AND tablename = 'objects') THEN
        CREATE POLICY "Users update own podcast video" ON storage.objects FOR UPDATE
        USING (bucket_id = 'podcast-video' AND (storage.foldername(name))[1] = auth.uid()::text);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users delete own podcast video' AND tablename = 'objects') THEN
        CREATE POLICY "Users delete own podcast video" ON storage.objects FOR DELETE
        USING (bucket_id = 'podcast-video' AND (storage.foldername(name))[1] = auth.uid()::text);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users update own podcast artwork' AND tablename = 'objects') THEN
        CREATE POLICY "Users update own podcast artwork" ON storage.objects FOR UPDATE
        USING (bucket_id = 'podcast-artwork' AND (storage.foldername(name))[1] = auth.uid()::text);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users delete own podcast artwork' AND tablename = 'objects') THEN
        CREATE POLICY "Users delete own podcast artwork" ON storage.objects FOR DELETE
        USING (bucket_id = 'podcast-artwork' AND (storage.foldername(name))[1] = auth.uid()::text);
    END IF;
END $$;

COMMIT;
