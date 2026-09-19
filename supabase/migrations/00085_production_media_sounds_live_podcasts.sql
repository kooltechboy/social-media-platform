-- =============================================================================
-- Migration 00085: Production Media, Caribbean Sounds, Live & Podcasting Architecture
-- =============================================================================
-- Description:
--   Comprehensive production-grade schema for TUKUBI's core media ecosystem:
--   1. Reels & Videos schema extensions (metrics, audio tracks, sounds, RLS)
--   2. Caribbean Sounds registry, verified licensing metadata, and usage tracking
--   3. Live Streaming extensions (telemetry, viewers, moderators, replays)
--   4. Podcasting 2.0 extensions (categories, progress persistence, analytics)
--   5. Media storage buckets ('caribbean-sounds', 'live-replays') with RLS policies
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. VIDEOS / REELS SCHEMA EXTENSIONS
-- =============================================================================

ALTER TABLE public.videos
    ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS comments_count INT DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS audio_track TEXT,
    ADD COLUMN IF NOT EXISTS sound_id UUID,
    ADD COLUMN IF NOT EXISTS location_tag TEXT,
    ADD COLUMN IF NOT EXISTS country_id UUID REFERENCES public.countries(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS aspect_ratio VARCHAR(10) DEFAULT '9:16',
    ADD COLUMN IF NOT EXISTS captions JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_videos_kind_created ON public.videos(video_kind, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_sound_id ON public.videos(sound_id);
CREATE INDEX IF NOT EXISTS idx_videos_country_id ON public.videos(country_id);

-- =============================================================================
-- 2. CARIBBEAN SOUNDS & LICENSING INFRASTRUCTURE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.sounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    artist_handle TEXT,
    country_iso VARCHAR(3),
    country_name TEXT,
    genre VARCHAR(40) NOT NULL,
    duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0),
    audio_url TEXT NOT NULL,
    storage_path TEXT,
    cover_url TEXT,
    cover_gradient TEXT DEFAULT 'from-purple-900 via-rose-950 to-[#110D17]',
    bpm INTEGER CHECK (bpm IS NULL OR (bpm >= 40 AND bpm <= 260)),
    is_verified_artist BOOLEAN DEFAULT false NOT NULL,
    release_year INTEGER DEFAULT 2026 NOT NULL,
    sample_lyrics TEXT,
    usage_count INTEGER DEFAULT 0 NOT NULL,
    licensing_status VARCHAR(30) DEFAULT 'royalty_free' NOT NULL CHECK (
        licensing_status IN ('original_creator', 'royalty_free', 'creative_commons', 'public_domain', 'licensed')
    ),
    license_type VARCHAR(50) DEFAULT 'CC-BY-4.0' NOT NULL,
    license_source TEXT,
    attribution_requirement TEXT,
    commercial_use_allowed BOOLEAN DEFAULT true NOT NULL,
    usage_restrictions TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Foreign key from videos to sounds
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_videos_sound_id' AND table_name = 'videos'
    ) THEN
        ALTER TABLE public.videos
            ADD CONSTRAINT fk_videos_sound_id
            FOREIGN KEY (sound_id) REFERENCES public.sounds(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sounds_genre ON public.sounds(genre);
CREATE INDEX IF NOT EXISTS idx_sounds_country ON public.sounds(country_iso);
CREATE INDEX IF NOT EXISTS idx_sounds_usage ON public.sounds(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_sounds_created ON public.sounds(created_at DESC);

-- Sound Licenses Audit Table
CREATE TABLE IF NOT EXISTS public.sound_licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sound_id UUID REFERENCES public.sounds(id) ON DELETE CASCADE NOT NULL,
    licensor_name TEXT NOT NULL,
    licensee_name TEXT DEFAULT 'Tukubi Media' NOT NULL,
    agreement_url TEXT,
    effective_date TIMESTAMPTZ DEFAULT now() NOT NULL,
    expiry_date TIMESTAMPTZ,
    terms JSONB DEFAULT '{}'::jsonb NOT NULL,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sound_licenses_sound ON public.sound_licenses(sound_id);

-- Sound Usage Tracking (Real calculations for trending sounds)
CREATE TABLE IF NOT EXISTS public.sound_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sound_id UUID REFERENCES public.sounds(id) ON DELETE CASCADE NOT NULL,
    video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    used_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sound_usage_sound ON public.sound_usage(sound_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sound_usage_user ON public.sound_usage(used_by);

-- Function and trigger to maintain sound usage counts monotonically
CREATE OR REPLACE FUNCTION public.sync_sound_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.sounds
        SET usage_count = usage_count + 1
        WHERE id = NEW.sound_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.sounds
        SET usage_count = GREATEST(0, usage_count - 1)
        WHERE id = OLD.sound_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sound_usage_count ON public.sound_usage;
CREATE TRIGGER trg_sound_usage_count
    AFTER INSERT OR DELETE ON public.sound_usage
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_sound_usage_count();

-- RLS for Sounds
ALTER TABLE public.sounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sound_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sound_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sounds_public_select" ON public.sounds;
CREATE POLICY "sounds_public_select" ON public.sounds
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "sounds_creator_insert" ON public.sounds;
CREATE POLICY "sounds_creator_insert" ON public.sounds
    FOR INSERT WITH CHECK (auth.uid() = creator_id OR creator_id IS NULL);

DROP POLICY IF EXISTS "sounds_creator_update" ON public.sounds;
CREATE POLICY "sounds_creator_update" ON public.sounds
    FOR UPDATE USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "sound_licenses_public_select" ON public.sound_licenses;
CREATE POLICY "sound_licenses_public_select" ON public.sound_licenses
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "sound_usage_public_select" ON public.sound_usage;
CREATE POLICY "sound_usage_public_select" ON public.sound_usage
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "sound_usage_auth_insert" ON public.sound_usage;
CREATE POLICY "sound_usage_auth_insert" ON public.sound_usage
    FOR INSERT WITH CHECK (auth.uid() = used_by);

-- =============================================================================
-- 3. LIVE STREAMS EXTENSIONS & MODERATION
-- =============================================================================

ALTER TABLE public.livestreams
    ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Culture & Talk',
    ADD COLUMN IF NOT EXISTS country_id UUID REFERENCES public.countries(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS country_iso VARCHAR(3),
    ADD COLUMN IF NOT EXISTS location_tag TEXT,
    ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS allow_chat BOOLEAN DEFAULT true NOT NULL,
    ADD COLUMN IF NOT EXISTS chat_slow_mode_seconds INTEGER DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS is_recording BOOLEAN DEFAULT true NOT NULL,
    ADD COLUMN IF NOT EXISTS replay_url TEXT;

CREATE INDEX IF NOT EXISTS idx_livestreams_category ON public.livestreams(category);
CREATE INDEX IF NOT EXISTS idx_livestreams_country_iso ON public.livestreams(country_iso);

-- Live Viewers Real-time Telemetry
CREATE TABLE IF NOT EXISTS public.live_viewers (
    livestream_id UUID REFERENCES public.livestreams(id) ON DELETE CASCADE NOT NULL,
    viewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    last_heartbeat_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (livestream_id, viewer_id)
);

CREATE INDEX IF NOT EXISTS idx_live_viewers_stream ON public.live_viewers(livestream_id);

-- Live Stream Moderators
CREATE TABLE IF NOT EXISTS public.live_moderators (
    livestream_id UUID REFERENCES public.livestreams(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    assigned_by UUID REFERENCES public.profiles(id) NOT NULL,
    can_timeout BOOLEAN DEFAULT true NOT NULL,
    can_delete_messages BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (livestream_id, profile_id)
);

-- Live Replays & Highlights
CREATE TABLE IF NOT EXISTS public.live_replays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    livestream_id UUID REFERENCES public.livestreams(id) ON DELETE CASCADE NOT NULL,
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    replay_storage_path TEXT NOT NULL,
    thumbnail_url TEXT,
    duration_seconds INTEGER DEFAULT 0 NOT NULL,
    is_published BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_live_replays_creator ON public.live_replays(creator_id);
CREATE INDEX IF NOT EXISTS idx_live_replays_stream ON public.live_replays(livestream_id);

ALTER TABLE public.live_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_moderators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_replays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "live_viewers_select" ON public.live_viewers;
CREATE POLICY "live_viewers_select" ON public.live_viewers
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "live_viewers_insert_self" ON public.live_viewers;
CREATE POLICY "live_viewers_insert_self" ON public.live_viewers
    FOR INSERT WITH CHECK (auth.uid() = viewer_id);

DROP POLICY IF EXISTS "live_viewers_update_self" ON public.live_viewers;
CREATE POLICY "live_viewers_update_self" ON public.live_viewers
    FOR UPDATE USING (auth.uid() = viewer_id);

DROP POLICY IF EXISTS "live_viewers_delete_self" ON public.live_viewers;
CREATE POLICY "live_viewers_delete_self" ON public.live_viewers
    FOR DELETE USING (auth.uid() = viewer_id);

DROP POLICY IF EXISTS "live_moderators_select" ON public.live_moderators;
CREATE POLICY "live_moderators_select" ON public.live_moderators
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "live_moderators_manage_host" ON public.live_moderators;
CREATE POLICY "live_moderators_manage_host" ON public.live_moderators
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.livestreams s WHERE s.id = livestream_id AND s.creator_id = auth.uid()
    ));

DROP POLICY IF EXISTS "live_replays_select" ON public.live_replays;
CREATE POLICY "live_replays_select" ON public.live_replays
    FOR SELECT USING (is_published = true OR auth.uid() = creator_id);

DROP POLICY IF EXISTS "live_replays_creator_all" ON public.live_replays;
CREATE POLICY "live_replays_creator_all" ON public.live_replays
    FOR ALL USING (auth.uid() = creator_id);

-- =============================================================================
-- 4. PODCASTING & PODCAST NETWORK INFRASTRUCTURE
-- =============================================================================

ALTER TABLE public.podcasts
    ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Culture & Talk',
    ADD COLUMN IF NOT EXISTS country_iso VARCHAR(3),
    ADD COLUMN IF NOT EXISTS author_name TEXT,
    ADD COLUMN IF NOT EXISTS website_url TEXT,
    ADD COLUMN IF NOT EXISTS is_explicit BOOLEAN DEFAULT false NOT NULL;

ALTER TABLE public.podcast_episodes
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS play_count INTEGER DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS is_explicit BOOLEAN DEFAULT false NOT NULL;

CREATE INDEX IF NOT EXISTS idx_podcasts_category ON public.podcasts(category);
CREATE INDEX IF NOT EXISTS idx_podcasts_country ON public.podcasts(country_iso);
CREATE INDEX IF NOT EXISTS idx_podcast_episodes_plays ON public.podcast_episodes(play_count DESC);

-- Podcast Listening Progress (Resumes seamlessly across devices)
CREATE TABLE IF NOT EXISTS public.podcast_progress (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    episode_id UUID REFERENCES public.podcast_episodes(id) ON DELETE CASCADE NOT NULL,
    current_position_seconds INTEGER DEFAULT 0 NOT NULL,
    completed BOOLEAN DEFAULT false NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (user_id, episode_id)
);

CREATE INDEX IF NOT EXISTS idx_podcast_progress_user ON public.podcast_progress(user_id, updated_at DESC);

-- Podcast Analytics (Real play & retention telemetry)
CREATE TABLE IF NOT EXISTS public.podcast_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    episode_id UUID REFERENCES public.podcast_episodes(id) ON DELETE CASCADE NOT NULL,
    listener_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    listened_seconds INTEGER NOT NULL,
    completed BOOLEAN DEFAULT false NOT NULL,
    country_iso VARCHAR(3),
    device_type VARCHAR(30),
    recorded_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_podcast_analytics_episode ON public.podcast_analytics(episode_id, recorded_at DESC);

ALTER TABLE public.podcast_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.podcast_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "podcast_progress_user_all" ON public.podcast_progress;
CREATE POLICY "podcast_progress_user_all" ON public.podcast_progress
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "podcast_analytics_creator_select" ON public.podcast_analytics;
CREATE POLICY "podcast_analytics_creator_select" ON public.podcast_analytics
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.podcast_episodes ep
        JOIN public.podcasts p ON p.id = ep.podcast_id
        WHERE ep.id = episode_id AND p.creator_id = auth.uid()
    ));

DROP POLICY IF EXISTS "podcast_analytics_insert_all" ON public.podcast_analytics;
CREATE POLICY "podcast_analytics_insert_all" ON public.podcast_analytics
    FOR INSERT WITH CHECK (auth.uid() = listener_id OR listener_id IS NULL);

-- =============================================================================
-- 5. STORAGE BUCKETS & POLICIES ('caribbean-sounds', 'live-replays')
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
    ('caribbean-sounds', 'caribbean-sounds', true, 52428800, ARRAY['audio/mpeg','audio/mp4','audio/ogg','audio/wav','audio/flac','audio/aac']),
    ('live-replays',     'live-replays',     true, 1073741824, ARRAY['video/mp4','video/webm','application/x-mpegURL'])
ON CONFLICT (id) DO UPDATE
    SET allowed_mime_types = EXCLUDED.allowed_mime_types,
        file_size_limit = EXCLUDED.file_size_limit;

-- Storage Policies: caribbean-sounds
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Sounds are publicly readable' AND tablename = 'objects'
    ) THEN
        CREATE POLICY "Sounds are publicly readable"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'caribbean-sounds');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated creators upload sounds' AND tablename = 'objects'
    ) THEN
        CREATE POLICY "Authenticated creators upload sounds"
        ON storage.objects FOR INSERT
        WITH CHECK (
            bucket_id = 'caribbean-sounds'
            AND auth.role() = 'authenticated'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Replays are publicly readable' AND tablename = 'objects'
    ) THEN
        CREATE POLICY "Replays are publicly readable"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'live-replays');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Broadcasters upload replays' AND tablename = 'objects'
    ) THEN
        CREATE POLICY "Broadcasters upload replays"
        ON storage.objects FOR INSERT
        WITH CHECK (
            bucket_id = 'live-replays'
            AND auth.role() = 'authenticated'
        );
    END IF;
END $$;

COMMIT;
