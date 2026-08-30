-- Migration 00009: Creator Economy — Stories, Videos, Creator Accounts & Subscriptions
-- Description: 24h stories with views, short/long-form video, creator accounts, paid memberships

CREATE TABLE public.stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    media_path TEXT NOT NULL,
    media_kind VARCHAR(10) CHECK (media_kind IN ('image', 'video')) NOT NULL,
    caption TEXT,
    audience VARCHAR(12) CHECK (audience IN ('public', 'followers', 'close_friends')) DEFAULT 'followers' NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.story_views (
    story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
    viewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    viewed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (story_id, viewer_id)
);

CREATE TABLE public.videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    video_kind VARCHAR(12) CHECK (video_kind IN ('reel', 'long_form', 'podcast_video')) NOT NULL,
    storage_path TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL,
    thumbnail_path TEXT,
    captions_path TEXT,
    transcript TEXT,
    visibility VARCHAR(12) CHECK (visibility IN ('public', 'followers', 'subscribers')) DEFAULT 'public' NOT NULL,
    view_count BIGINT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.video_views (
    video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
    viewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    watched_seconds INTEGER,
    completed BOOLEAN DEFAULT false NOT NULL,
    viewed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (video_id, viewer_id)
);

CREATE TABLE public.creator_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    category VARCHAR(40),
    is_verified BOOLEAN DEFAULT false NOT NULL,
    kyc_status VARCHAR(12) CHECK (kyc_status IN ('unverified', 'pending', 'verified', 'rejected')) DEFAULT 'unverified' NOT NULL,
    payout_threshold_minor INTEGER DEFAULT 5000 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_account_id UUID REFERENCES public.creator_accounts(id) ON DELETE CASCADE NOT NULL,
    subscriber_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    tier VARCHAR(10) CHECK (tier IN ('basic', 'plus', 'pro')) NOT NULL,
    price_minor INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    billing_source VARCHAR(12) CHECK (billing_source IN ('user_wallet', 'stripe', 'apple_iap', 'google_play')) NOT NULL,
    status VARCHAR(12) CHECK (status IN ('active', 'cancelled', 'expired', 'grace')) DEFAULT 'active' NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (creator_account_id, subscriber_id)
);

-- Indexing
CREATE INDEX idx_stories_author_active ON public.stories(author_id, expires_at);
CREATE INDEX idx_videos_creator ON public.videos(creator_id, created_at DESC);
CREATE INDEX idx_videos_kind ON public.videos(video_kind, created_at DESC);
CREATE INDEX idx_subscriptions_creator_status ON public.subscriptions(creator_account_id, status);
CREATE INDEX idx_subscriptions_subscriber ON public.subscriptions(subscriber_id, status);

-- Row Level Security
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visible stories readable" ON public.stories
    FOR SELECT USING (
        expires_at > now()
        AND (
            author_id = auth.uid()
            OR audience = 'public'
            OR (audience = 'followers' AND EXISTS (
                SELECT 1 FROM public.follows f WHERE f.follower_id = auth.uid() AND f.following_id = author_id
            ))
            OR (audience = 'close_friends' AND EXISTS (
                SELECT 1 FROM public.friendships fr
                WHERE fr.is_close_friend AND fr.status = 'accepted'
                  AND ((fr.requester_id = auth.uid() AND fr.addressee_id = author_id)
                    OR (fr.addressee_id = auth.uid() AND fr.requester_id = author_id))
            ))
        )
    );
CREATE POLICY "Author creates stories" ON public.stories
    FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "Story participants read views" ON public.story_views
    FOR SELECT USING (viewer_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.stories s WHERE s.id = story_id AND s.author_id = auth.uid()
    ));
CREATE POLICY "Viewers record views" ON public.story_views
    FOR INSERT WITH CHECK (viewer_id = auth.uid());

CREATE POLICY "Visible videos readable" ON public.videos
    FOR SELECT USING (
        creator_id = auth.uid()
        OR visibility != 'subscribers'
        OR (visibility = 'subscribers' AND EXISTS (
            SELECT 1 FROM public.subscriptions sub
            WHERE sub.creator_account_id IN (
                SELECT ca.id FROM public.creator_accounts ca WHERE ca.profile_id = videos.creator_id
            )
            AND sub.subscriber_id = auth.uid() AND sub.status = 'active'
        ))
    );
CREATE POLICY "Creator manages videos" ON public.videos
    FOR INSERT WITH CHECK (creator_id = auth.uid());
CREATE POLICY "Creator edits videos" ON public.videos
    FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "Creator account owner read" ON public.creator_accounts
    FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Profile becomes creator" ON public.creator_accounts
    FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Owner edits creator account" ON public.creator_accounts
    FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Participants read subscriptions" ON public.subscriptions
    FOR SELECT USING (subscriber_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.creator_accounts ca
        WHERE ca.id = creator_account_id AND ca.profile_id = auth.uid()
    ));
CREATE POLICY "Subscribers create own subscription" ON public.subscriptions
    FOR INSERT WITH CHECK (subscriber_id = auth.uid());
CREATE POLICY "Subscribers cancel own subscription" ON public.subscriptions
    FOR UPDATE USING (subscriber_id = auth.uid());
