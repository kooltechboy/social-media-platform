-- Migration: 00099_universal_content_and_url_metadata.sql
-- Description: Creates persistent caching for universal content resolution, rich media previews,
-- and links schema to posts for frictionless, zero-waterfall feed delivery.
-- Follows NASA-grade safety, Row Level Security, and strict service-role isolation.

-- 1. Create url_metadata_cache table
CREATE TABLE IF NOT EXISTS public.url_metadata_cache (
    url_hash text PRIMARY KEY,
    raw_url text NOT NULL,
    normalized_url text NOT NULL,
    canonical_url text,
    provider text NOT NULL,
    content_type text NOT NULL,
    title text,
    description text,
    thumbnail_url text,
    thumbnail_width integer,
    thumbnail_height integer,
    author_name text,
    author_url text,
    duration_seconds integer,
    site_name text,
    favicon_url text,
    embed_html text,
    embed_url text,
    extra_metadata jsonb DEFAULT '{}'::jsonb,
    status text NOT NULL DEFAULT 'resolved' CHECK (status IN ('resolved', 'partial', 'fallback', 'failed', 'blocked')),
    http_status integer,
    error_message text,
    created_at timestamptz NOT NULL DEFAULT now(),
    fetched_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days')
);

COMMENT ON TABLE public.url_metadata_cache IS 'Production cache for safely resolved universal content and media metadata across TUKUBI.';

-- 2. Indexes for high-throughput feed lookups and expiration cleanups
CREATE INDEX IF NOT EXISTS idx_url_metadata_cache_normalized_url ON public.url_metadata_cache(normalized_url);
CREATE INDEX IF NOT EXISTS idx_url_metadata_cache_expires_at ON public.url_metadata_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_url_metadata_cache_provider ON public.url_metadata_cache(provider);
CREATE INDEX IF NOT EXISTS idx_url_metadata_cache_status ON public.url_metadata_cache(status);

-- 3. Row Level Security
ALTER TABLE public.url_metadata_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access to cached metadata (read-only for clients, safe sanitized data)
DROP POLICY IF EXISTS "Public read url metadata cache" ON public.url_metadata_cache;
CREATE POLICY "Public read url metadata cache"
    ON public.url_metadata_cache
    FOR SELECT
    USING (true);

-- Mutations restricted strictly to authenticated service role or backend workers
DROP POLICY IF EXISTS "Service role manages url metadata cache" ON public.url_metadata_cache;
CREATE POLICY "Service role manages url metadata cache"
    ON public.url_metadata_cache
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 4. Ensure posts table has link_preview jsonb column
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'posts' 
          AND column_name = 'link_preview'
    ) THEN 
        ALTER TABLE public.posts ADD COLUMN link_preview jsonb;
    END IF; 
END $$;

COMMENT ON COLUMN public.posts.link_preview IS 'Normalized ResolvedContentMetadata payload embedded at composition time for instant feed rendering.';

CREATE INDEX IF NOT EXISTS idx_posts_link_preview ON public.posts USING gin (link_preview) WHERE link_preview IS NOT NULL;
