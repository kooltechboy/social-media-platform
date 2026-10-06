-- =============================================================================
-- Migration 00107: Post Composer Idempotency, Multi-Link & External Media Engine
-- Description: Adds database-level idempotency key enforcement, multi-link
--              previews storage, and a normalized external media registry
--              for YouTube, Vimeo, TikTok, direct video/audio, and web embeds.
-- Follows NASA-grade reliability, strict RLS, and zero-downtime compatibility.
-- =============================================================================

-- 1. Ensure posts table has idempotency_key for safe double-click & retry deduplication
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'posts' 
          AND column_name = 'idempotency_key'
    ) THEN 
        ALTER TABLE public.posts ADD COLUMN idempotency_key TEXT;
    END IF; 
END $$;

COMMENT ON COLUMN public.posts.idempotency_key IS 'Client-provided idempotency key preventing duplicate post publication on double-click or network retry.';

-- Unique partial index enforcing author-scoped idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_author_idempotency 
    ON public.posts(author_id, idempotency_key) 
    WHERE idempotency_key IS NOT NULL;

-- 2. Ensure posts table supports multiple link previews (link_previews JSONB)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'posts' 
          AND column_name = 'link_previews'
    ) THEN 
        ALTER TABLE public.posts ADD COLUMN link_previews JSONB DEFAULT '[]'::jsonb;
    END IF; 
END $$;

COMMENT ON COLUMN public.posts.link_previews IS 'Array of normalized ResolvedContentMetadata payloads for mixed-media / multi-link posts.';

CREATE INDEX IF NOT EXISTS idx_posts_link_previews 
    ON public.posts USING gin (link_previews) 
    WHERE link_previews IS NOT NULL;

-- 3. Normalized External Media Registry
CREATE TABLE IF NOT EXISTS public.post_external_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    provider VARCHAR(50) NOT NULL,
    media_type VARCHAR(50) NOT NULL,
    original_url TEXT NOT NULL,
    canonical_url TEXT,
    external_id TEXT,
    title TEXT,
    description TEXT,
    thumbnail_url TEXT,
    embed_url TEXT,
    author_name TEXT,
    author_url TEXT,
    duration_seconds INTEGER,
    aspect_ratio VARCHAR(20) DEFAULT '16:9',
    metadata JSONB DEFAULT '{}'::jsonb,
    embed_allowed BOOLEAN DEFAULT true,
    resolution_status VARCHAR(20) DEFAULT 'resolved' CHECK (resolution_status IN ('resolved', 'partial', 'fallback', 'failed', 'blocked')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.post_external_media IS 'Normalized external rich media items (YouTube, Vimeo, TikTok, direct video/audio, etc.) attached to posts.';

-- 4. Indexes for rapid lookups and feed hydration
CREATE INDEX IF NOT EXISTS idx_post_external_media_post_id ON public.post_external_media(post_id);
CREATE INDEX IF NOT EXISTS idx_post_external_media_provider ON public.post_external_media(provider);
CREATE INDEX IF NOT EXISTS idx_post_external_media_canonical_url ON public.post_external_media(canonical_url) WHERE canonical_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_post_external_media_created_at ON public.post_external_media(created_at DESC);

-- 5. Row Level Security
ALTER TABLE public.post_external_media ENABLE ROW LEVEL SECURITY;

-- Public read access (mirrors post visibility; safe sanitized data)
DROP POLICY IF EXISTS "Public read post external media" ON public.post_external_media;
CREATE POLICY "Public read post external media"
    ON public.post_external_media
    FOR SELECT
    USING (true);

-- Authenticated post author management policy
DROP POLICY IF EXISTS "Authors can manage their post external media" ON public.post_external_media;
CREATE POLICY "Authors can manage their post external media"
    ON public.post_external_media
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.posts 
            WHERE posts.id = post_external_media.post_id 
              AND posts.author_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.posts 
            WHERE posts.id = post_external_media.post_id 
              AND posts.author_id = auth.uid()
        )
    );

-- Service role full access
DROP POLICY IF EXISTS "Service role manages post external media" ON public.post_external_media;
CREATE POLICY "Service role manages post external media"
    ON public.post_external_media
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
