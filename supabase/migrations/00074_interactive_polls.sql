-- Migration 00074: Native Interactive Polls Subsystem
-- Adds structured polls, poll options, and poll votes with atomic tallying and RLS containment

-- 1. Polls Table
CREATE TABLE IF NOT EXISTS public.polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL UNIQUE,
    question TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    allow_multiple BOOLEAN DEFAULT false NOT NULL,
    total_votes BIGINT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Poll Options Table
CREATE TABLE IF NOT EXISTS public.poll_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
    option_text TEXT NOT NULL,
    position SMALLINT DEFAULT 0 NOT NULL,
    votes_count BIGINT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Poll Votes Table (Enforces One Vote Per User per Poll)
CREATE TABLE IF NOT EXISTS public.poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
    option_id UUID REFERENCES public.poll_options(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT uq_poll_user_vote UNIQUE (poll_id, user_id)
);

-- Covering Indexes for High Concurrency Feed Querying
CREATE INDEX IF NOT EXISTS idx_polls_post_id ON public.polls(post_id);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON public.poll_options(poll_id, position);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_user ON public.poll_votes(poll_id, user_id);

-- 4. Atomic Vote Counting Trigger Function
CREATE OR REPLACE FUNCTION public.handle_poll_vote_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure poll has not expired
    IF EXISTS (
        SELECT 1 FROM public.polls
        WHERE id = NEW.poll_id AND expires_at <= now()
    ) THEN
        RAISE EXCEPTION 'This poll has ended and is no longer accepting votes.';
    END IF;

    -- Increment option votes_count atomically
    UPDATE public.poll_options
    SET votes_count = votes_count + 1
    WHERE id = NEW.option_id AND poll_id = NEW.poll_id;

    -- Increment overall poll total_votes atomically
    UPDATE public.polls
    SET total_votes = total_votes + 1
    WHERE id = NEW.poll_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_poll_vote_insert ON public.poll_votes;
CREATE TRIGGER trg_poll_vote_insert
AFTER INSERT ON public.poll_votes
FOR EACH ROW
EXECUTE FUNCTION public.handle_poll_vote_insert();

-- 5. Row Level Security (RLS) - Mandatory Rule
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- Polls RLS
CREATE POLICY polls_select_all ON public.polls
    FOR SELECT USING (true);

CREATE POLICY polls_insert_post_author ON public.polls
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.posts
            WHERE id = post_id AND author_id = auth.uid()
        )
    );

CREATE POLICY polls_delete_post_author ON public.polls
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.posts
            WHERE id = post_id AND author_id = auth.uid()
        )
    );

-- Poll Options RLS
CREATE POLICY poll_options_select_all ON public.poll_options
    FOR SELECT USING (true);

CREATE POLICY poll_options_insert_post_author ON public.poll_options
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.polls p
            JOIN public.posts post ON post.id = p.post_id
            WHERE p.id = poll_id AND post.author_id = auth.uid()
        )
    );

-- Poll Votes RLS (Users can only cast their own vote, and view votes)
CREATE POLICY poll_votes_select_own ON public.poll_votes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY poll_votes_insert_own ON public.poll_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Force RLS
ALTER TABLE public.polls FORCE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options FORCE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes FORCE ROW LEVEL SECURITY;
