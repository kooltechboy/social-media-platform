-- Migration 00010: Live Streaming & Podcasts
-- Description: livestreams with chat and ledger-backed gifts, podcast shows/episodes/followers

CREATE TABLE public.livestreams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    access_level VARCHAR(14) CHECK (access_level IN ('public', 'followers', 'subscribers', 'community')) DEFAULT 'public' NOT NULL,
    community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL,
    state VARCHAR(12) CHECK (state IN ('scheduled', 'live', 'ended', 'cancelled')) DEFAULT 'scheduled' NOT NULL,
    ingest_key_hash TEXT,
    playback_path TEXT,
    replay_video_id UUID REFERENCES public.videos(id) ON DELETE SET NULL,
    scheduled_for TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    peak_viewers INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.live_messages (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    livestream_id UUID REFERENCES public.livestreams(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    body TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false NOT NULL,
    removed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.live_gifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    livestream_id UUID REFERENCES public.livestreams(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
    gift_key VARCHAR(40) NOT NULL,
    price_minor INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    ledger_transaction_id UUID,
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.podcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    description TEXT,
    cover_path TEXT,
    language VARCHAR(10) REFERENCES public.languages(iso639),
    is_paid BOOLEAN DEFAULT false NOT NULL,
    follower_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.podcast_episodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    podcast_id UUID REFERENCES public.podcasts(id) ON DELETE CASCADE NOT NULL,
    season_number INTEGER DEFAULT 1 NOT NULL,
    episode_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    audio_path TEXT NOT NULL,
    video_path TEXT,
    duration_seconds INTEGER NOT NULL,
    show_notes TEXT,
    transcript TEXT,
    chapters JSONB DEFAULT '[]'::jsonb,
    is_subscriber_only BOOLEAN DEFAULT false NOT NULL,
    published_at TIMESTAMPTZ,
    scheduled_for TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (podcast_id, season_number, episode_number)
);

CREATE TABLE public.podcast_followers (
    podcast_id UUID REFERENCES public.podcasts(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    followed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (podcast_id, profile_id)
);

-- Indexing
CREATE INDEX idx_livestreams_creator_state ON public.livestreams(creator_id, state);
CREATE INDEX idx_livestreams_live ON public.livestreams(state, started_at DESC) WHERE state = 'live';
CREATE INDEX idx_live_messages_stream ON public.live_messages(livestream_id, created_at DESC);
CREATE INDEX idx_live_gifts_stream ON public.live_gifts(livestream_id, created_at DESC);
CREATE INDEX idx_podcasts_creator ON public.podcasts(creator_id);
CREATE INDEX idx_podcast_episodes_feed ON public.podcast_episodes(podcast_id, published_at DESC);
CREATE INDEX idx_podcast_followers_profile ON public.podcast_followers(profile_id);

-- Row Level Security
ALTER TABLE public.livestreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.podcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.podcast_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.podcast_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Accessible streams readable" ON public.livestreams
    FOR SELECT USING (
        creator_id = auth.uid()
        OR access_level = 'public'
        OR (access_level = 'followers' AND EXISTS (
                SELECT 1 FROM public.follows f WHERE f.follower_id = auth.uid() AND f.following_id = creator_id
        ))
        OR (access_level = 'subscribers' AND EXISTS (
            SELECT 1 FROM public.subscriptions sub
            WHERE sub.subscriber_id = auth.uid() AND sub.status = 'active'
              AND sub.creator_account_id IN (
                SELECT ca.id FROM public.creator_accounts ca WHERE ca.profile_id = livestreams.creator_id
              )
        ))
        OR (access_level = 'community' AND EXISTS (
            SELECT 1 FROM public.community_members m
            WHERE m.community_id = livestreams.community_id
              AND m.profile_id = auth.uid() AND m.membership_status = 'active'
        ))
    );
CREATE POLICY "Creator creates streams" ON public.livestreams
    FOR INSERT WITH CHECK (creator_id = auth.uid());
CREATE POLICY "Creator updates streams" ON public.livestreams
    FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "Stream viewers read chat" ON public.live_messages
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.livestreams s WHERE s.id = livestream_id AND s.state IN ('live', 'ended')
    ));
CREATE POLICY "Viewers send chat" ON public.live_messages
    FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Creator removes chat" ON public.live_messages
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM public.livestreams s WHERE s.id = livestream_id AND s.creator_id = auth.uid()
    ));

CREATE POLICY "Stream participants read gifts" ON public.live_gifts
    FOR SELECT USING (sender_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.livestreams s WHERE s.id = livestream_id AND s.creator_id = auth.uid()
    ));
CREATE POLICY "Senders create gifts" ON public.live_gifts
    FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Public read podcasts" ON public.podcasts FOR SELECT USING (true);
CREATE POLICY "Creator creates podcasts" ON public.podcasts
    FOR INSERT WITH CHECK (creator_id = auth.uid());
CREATE POLICY "Creator edits podcasts" ON public.podcasts
    FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "Readable episodes" ON public.podcast_episodes
    FOR SELECT USING (
        (
            published_at IS NOT NULL
            AND (
                NOT is_subscriber_only
                OR EXISTS (
                    SELECT 1 FROM public.subscriptions sub
                    WHERE sub.subscriber_id = auth.uid() AND sub.status = 'active'
                      AND sub.creator_account_id IN (
                        SELECT ca.id FROM public.creator_accounts ca WHERE ca.profile_id = (
                            SELECT p.creator_id FROM public.podcasts p WHERE p.id = podcast_id
                        )
                      )
                )
            )
        )
        OR EXISTS (
            SELECT 1 FROM public.podcasts p
            WHERE p.id = podcast_id AND p.creator_id = auth.uid()
        )
    );
CREATE POLICY "Podcast creator writes episodes" ON public.podcast_episodes
    FOR ALL WITH CHECK (EXISTS (
        SELECT 1 FROM public.podcasts p WHERE p.id = podcast_id AND p.creator_id = auth.uid()
    ));

CREATE POLICY "Public read podcast followers" ON public.podcast_followers FOR SELECT USING (true);
CREATE POLICY "Self follow podcasts" ON public.podcast_followers
    FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Self unfollow podcasts" ON public.podcast_followers
    FOR DELETE USING (profile_id = auth.uid());
