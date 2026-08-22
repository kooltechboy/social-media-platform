-- Migration 00007: Communities, Social Extensions & Moderation
-- Description: friendships, mutes, post enrichment, communities with roles, notifications, reports & moderation cases

CREATE TABLE public.friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    addressee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(12) CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending' NOT NULL,
    is_close_friend BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (requester_id, addressee_id)
);

CREATE TABLE public.mutes (
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    muted_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    scope VARCHAR(12) CHECK (scope IN ('posts', 'stories', 'everywhere')) DEFAULT 'everywhere' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (profile_id, muted_profile_id)
);

CREATE TABLE public.post_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    storage_path TEXT NOT NULL,
    media_kind VARCHAR(10) CHECK (media_kind IN ('image', 'video', 'audio')) NOT NULL,
    width INTEGER,
    height INTEGER,
    duration_seconds INTEGER,
    position SMALLINT DEFAULT 0 NOT NULL,
    alt_text TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.post_hashtags (
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    hashtag VARCHAR(80) NOT NULL,
    PRIMARY KEY (post_id, hashtag)
);

CREATE TABLE public.post_mentions (
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    mentioned_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (post_id, mentioned_profile_id)
);

CREATE TABLE public.communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug VARCHAR(80) UNIQUE NOT NULL,
    description TEXT,
    join_policy VARCHAR(12) CHECK (join_policy IN ('public', 'private', 'invite_only')) DEFAULT 'public' NOT NULL,
    is_paid BOOLEAN DEFAULT false NOT NULL,
    country_iso VARCHAR(3) REFERENCES public.countries(iso_code),
    city_id UUID REFERENCES public.cities(id),
    cover_storage_path TEXT,
    member_count INTEGER DEFAULT 0 NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.community_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(40) NOT NULL,
    can_moderate BOOLEAN DEFAULT false NOT NULL,
    can_post BOOLEAN DEFAULT true NOT NULL,
    can_invite BOOLEAN DEFAULT false NOT NULL,
    UNIQUE (community_id, name)
);

CREATE TABLE public.community_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role_id UUID REFERENCES public.community_roles(id) ON DELETE SET NULL,
    membership_status VARCHAR(12) CHECK (membership_status IN ('active', 'banned', 'pending')) DEFAULT 'active' NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (community_id, profile_id)
);

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    kind VARCHAR(40) NOT NULL,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    entity_type VARCHAR(40),
    entity_id UUID,
    payload JSONB DEFAULT '{}'::jsonb,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_type VARCHAR(30) CHECK (target_type IN ('post', 'comment', 'profile', 'message', 'community', 'livestream')) NOT NULL,
    target_id UUID NOT NULL,
    reason VARCHAR(40) NOT NULL,
    details TEXT,
    status VARCHAR(12) CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')) DEFAULT 'open' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TYPE public.moderation_priority AS ENUM ('critical', 'high', 'medium', 'low');

CREATE TABLE public.moderation_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type VARCHAR(30) NOT NULL,
    target_id UUID NOT NULL,
    report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
    signals JSONB DEFAULT '{}'::jsonb,
    ai_recommendation VARCHAR(12) CHECK (ai_recommendation IN ('remove', 'restrict', 'allow', 'escalate')),
    priority public.moderation_priority DEFAULT 'medium' NOT NULL,
    status VARCHAR(12) CHECK (status IN ('queued', 'assigned', 'decided', 'escalated')) DEFAULT 'queued' NOT NULL,
    assigned_moderator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    decided_at TIMESTAMPTZ
);

CREATE TABLE public.moderation_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES public.moderation_cases(id) ON DELETE CASCADE NOT NULL,
    moderator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(12) CHECK (action IN ('remove', 'restrict', 'allow', 'escalate')) NOT NULL,
    rationale TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.risk_scores (
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    dimension VARCHAR(30) NOT NULL,
    score NUMERIC(4, 3) CHECK (score BETWEEN 0 AND 1) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (profile_id, dimension)
);

-- Default roles are seeded per community at creation time
CREATE OR REPLACE FUNCTION public.seed_default_community_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.community_roles (community_id, name, can_moderate, can_post, can_invite)
    VALUES
        (NEW.id, 'owner', true, true, true),
        (NEW.id, 'moderator', true, true, true),
        (NEW.id, 'member', false, true, false);
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_seed_community_roles
AFTER INSERT ON public.communities
FOR EACH ROW EXECUTE FUNCTION public.seed_default_community_roles();

-- Indexing
CREATE INDEX idx_friendships_requester ON public.friendships(requester_id, status);
CREATE INDEX idx_friendships_addressee ON public.friendships(addressee_id, status);
CREATE INDEX idx_post_media_post ON public.post_media(post_id, position);
CREATE INDEX idx_post_hashtags_tag ON public.post_hashtags(hashtag);
CREATE INDEX idx_post_mentions_profile ON public.post_mentions(mentioned_profile_id);
CREATE INDEX idx_communities_country ON public.communities(country_iso);
CREATE INDEX idx_community_members_profile ON public.community_members(profile_id);
CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_id, created_at DESC);
CREATE INDEX idx_reports_target ON public.reports(target_type, target_id);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_moderation_cases_queue ON public.moderation_cases(status, priority, created_at);
CREATE INDEX idx_moderation_cases_target ON public.moderation_cases(target_type, target_id);

-- Row Level Security
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Friendship participants read" ON public.friendships
    FOR SELECT USING (auth.uid() IN (requester_id, addressee_id));
CREATE POLICY "Requester creates friendship" ON public.friendships
    FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Participants update friendship" ON public.friendships
    FOR UPDATE USING (auth.uid() IN (requester_id, addressee_id));

CREATE POLICY "Owner read mutes" ON public.mutes FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Owner write mutes" ON public.mutes FOR ALL
    USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Read post media with post visibility" ON public.post_media
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.posts p WHERE p.id = post_id
    ));
CREATE POLICY "Author creates post media" ON public.post_media
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid()
    ));

CREATE POLICY "Read post hashtags" ON public.post_hashtags FOR SELECT USING (true);
CREATE POLICY "Author writes post hashtags" ON public.post_hashtags FOR ALL
    USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid()));

CREATE POLICY "Read post mentions" ON public.post_mentions FOR SELECT USING (true);
CREATE POLICY "Author writes post mentions" ON public.post_mentions FOR ALL
    USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid()));

CREATE POLICY "Public read public communities" ON public.communities
    FOR SELECT USING (join_policy = 'public' OR EXISTS (
        SELECT 1 FROM public.community_members m
        WHERE m.community_id = id AND m.profile_id = auth.uid() AND m.membership_status = 'active'
    ));
CREATE POLICY "Authenticated create communities" ON public.communities
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Member read community roles" ON public.community_roles
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.community_members m
        WHERE m.community_id = community_id AND m.profile_id = auth.uid() AND m.membership_status = 'active'
    ) OR EXISTS (
        SELECT 1 FROM public.communities c WHERE c.id = community_id AND c.join_policy = 'public'
    ));

CREATE POLICY "Members read community membership" ON public.community_members
    FOR SELECT USING (profile_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.community_members me
        WHERE me.community_id = community_id AND me.profile_id = auth.uid() AND me.membership_status = 'active'
    ));
CREATE POLICY "Self join communities" ON public.community_members
    FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Members update own membership" ON public.community_members
    FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Recipient read notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = recipient_id);
CREATE POLICY "Recipient update notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = recipient_id);

CREATE POLICY "Authenticated create reports" ON public.reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Reporter reads own reports" ON public.reports
    FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Deny client moderation cases" ON public.moderation_cases
    FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "Deny client moderation actions" ON public.moderation_actions
    FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "Deny client risk scores" ON public.risk_scores
    FOR ALL USING (false) WITH CHECK (false);
