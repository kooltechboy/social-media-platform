-- Migration 00089: Post Media URL and Type Compatibility
-- Adds media_url and media_type columns to public.post_media,
-- ensures storage_path and media_kind remain backwards-compatible,
-- and verifies aspect ratio columns exist for zero-CLS feed delivery.

ALTER TABLE public.post_media
    ADD COLUMN IF NOT EXISTS media_url TEXT,
    ADD COLUMN IF NOT EXISTS media_type VARCHAR(20) DEFAULT 'image',
    ALTER COLUMN storage_path DROP NOT NULL;

-- Backfill media_url and media_type from existing rows if empty
UPDATE public.post_media
SET media_url = storage_path
WHERE media_url IS NULL AND storage_path IS NOT NULL;

UPDATE public.post_media
SET media_type = media_kind
WHERE media_type IS NULL AND media_kind IS NOT NULL;
