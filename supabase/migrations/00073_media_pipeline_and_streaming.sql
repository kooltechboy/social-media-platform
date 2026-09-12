-- Migration 00073: Media Pipeline & Streaming Infrastructure
-- Adds adaptive bitrate streaming (HLS), thumbnails, and blurhash to post_media
-- Creates universal media_assets table with RLS for full lifecycle processing

-- 1. Extend public.post_media with enterprise streaming and optimization columns
ALTER TABLE public.post_media
    ADD COLUMN IF NOT EXISTS hls_manifest_url TEXT,
    ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
    ADD COLUMN IF NOT EXISTS blurhash TEXT,
    ADD COLUMN IF NOT EXISTS transcoding_status VARCHAR(20) DEFAULT 'ready' CHECK (transcoding_status IN ('pending', 'processing', 'ready', 'failed')),
    ADD COLUMN IF NOT EXISTS provider VARCHAR(30) DEFAULT 'supabase_storage',
    ADD COLUMN IF NOT EXISTS provider_asset_id TEXT,
    ADD COLUMN IF NOT EXISTS aspect_ratio VARCHAR(10);

-- Indexes for high-throughput feed querying
CREATE INDEX IF NOT EXISTS idx_post_media_post_id ON public.post_media(post_id);
CREATE INDEX IF NOT EXISTS idx_post_media_transcoding_status ON public.post_media(transcoding_status);

-- 2. Universal media_assets table for cross-platform processing
CREATE TABLE IF NOT EXISTS public.media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    surface VARCHAR(30) NOT NULL CHECK (surface IN ('post', 'story', 'reel', 'long_form', 'podcast', 'live_replay', 'message', 'product', 'avatar', 'banner')),
    media_kind VARCHAR(10) NOT NULL CHECK (media_kind IN ('image', 'video', 'audio')),
    original_file_name TEXT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
    storage_path TEXT NOT NULL,
    hls_manifest_url TEXT,
    thumbnail_url TEXT,
    blurhash TEXT,
    duration_seconds NUMERIC(10, 2),
    width INTEGER,
    height INTEGER,
    aspect_ratio VARCHAR(10),
    stage VARCHAR(20) NOT NULL DEFAULT 'uploaded' CHECK (stage IN ('uploaded', 'quarantined', 'processing', 'transcoding', 'thumbnailing', 'captioning', 'ready', 'failed')),
    quarantine_reason TEXT,
    provider VARCHAR(30) NOT NULL DEFAULT 'supabase_storage',
    provider_asset_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Performance indexes for media_assets
CREATE INDEX IF NOT EXISTS idx_media_assets_owner_stage ON public.media_assets(owner_id, stage);
CREATE INDEX IF NOT EXISTS idx_media_assets_surface ON public.media_assets(surface);
CREATE INDEX IF NOT EXISTS idx_media_assets_created_at ON public.media_assets(created_at DESC);

-- Enable Row Level Security (RLS) - Mandatory rule
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for media_assets
-- Owners have full access to their assets
CREATE POLICY media_assets_owner_select ON public.media_assets
    FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY media_assets_owner_insert ON public.media_assets
    FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY media_assets_owner_update ON public.media_assets
    FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY media_assets_owner_delete ON public.media_assets
    FOR DELETE
    USING (auth.uid() = owner_id);

-- Public can view ready assets that are not quarantined
CREATE POLICY media_assets_public_select_ready ON public.media_assets
    FOR SELECT
    USING (stage = 'ready');

-- Force RLS
ALTER TABLE public.media_assets FORCE ROW LEVEL SECURITY;
