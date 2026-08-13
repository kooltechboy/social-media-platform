-- Migration 00003: Social Graph, Posts, Media, Comments & Reactions with RLS

-- Social Graph Relationships
CREATE TABLE public.follows (
    follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE public.blocks (
    blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (blocker_id, blocked_id)
);

-- Posts & Media Schema
CREATE TYPE public.post_visibility AS ENUM ('public', 'followers', 'friends', 'private');

CREATE TABLE public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT,
    visibility public.post_visibility DEFAULT 'public' NOT NULL,
    country_id UUID REFERENCES public.countries(id),
    cultural_tags TEXT[] DEFAULT '{}',
    media_urls TEXT[] DEFAULT '{}',
    likes_count INT DEFAULT 0 NOT NULL,
    comments_count INT DEFAULT 0 NOT NULL,
    shares_count INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.post_reactions (
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    reaction_type VARCHAR(20) DEFAULT 'like' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (post_id, user_id)
);

-- Indexing
CREATE INDEX idx_posts_author ON public.posts(author_id);
CREATE INDEX idx_posts_country ON public.posts(country_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_comments_post ON public.comments(post_id);

-- Row Level Security
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

-- Follows RLS
CREATE POLICY "Public can view follows" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can manage follows" ON public.follows FOR ALL USING (auth.uid() = follower_id);

-- Posts RLS
CREATE POLICY "View posts policy" ON public.posts FOR SELECT
USING (
    visibility = 'public' 
    OR author_id = auth.uid()
    OR (visibility = 'followers' AND EXISTS (SELECT 1 FROM public.follows WHERE follower_id = auth.uid() AND following_id = author_id))
);

CREATE POLICY "Authors can insert posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own posts" ON public.posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = author_id);
