-- Migration 00027: Social Interactions Enhancements
-- Description: Adds threaded comment replies (parent_id) and post_shares tracking table with RLS

-- 1. Add parent_id to comments for threaded replies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'parent_id'
    ) THEN
        ALTER TABLE public.comments ADD COLUMN parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);

-- 2. Create post_shares table
CREATE TABLE IF NOT EXISTS public.post_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    share_type VARCHAR(20) DEFAULT 'internal' NOT NULL, -- 'internal', 'external', 'copy_link'
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_post_shares_post_user ON public.post_shares(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_post_shares_created_at ON public.post_shares(created_at DESC);

-- Enable RLS on post_shares
ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'post_shares' AND policyname = 'Public read post shares'
    ) THEN
        CREATE POLICY "Public read post shares" ON public.post_shares FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'post_shares' AND policyname = 'Authenticated users record shares'
    ) THEN
        CREATE POLICY "Authenticated users record shares" ON public.post_shares FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;
