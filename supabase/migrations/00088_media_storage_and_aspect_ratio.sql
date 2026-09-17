-- Migration 00088: Media Storage and Aspect Ratio Infrastructure
-- Expands allowed MIME types in Supabase Storage buckets for modern mobile formats (HEIC, HEIF, AVIF, QuickTime)
-- Ensures post_media and media_assets aspect ratio columns and indexes are optimized for high-performance feed delivery

-- 1. Update storage buckets with modern image formats & safe size limits
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'image/heic',
    'image/heif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
],
file_size_limit = 104857600 -- 100MB
WHERE id = 'post-media';

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/heic',
    'image/heif',
    'video/mp4',
    'video/quicktime'
],
file_size_limit = 52428800 -- 50MB
WHERE id = 'story-media';

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/heic',
    'image/heif'
],
file_size_limit = 20971520 -- 20MB
WHERE id = 'product-images';

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'image/heic',
    'image/heif'
],
file_size_limit = 10485760 -- 10MB
WHERE id = 'avatars';

-- 2. Verify post_media columns exist with default constraints
ALTER TABLE public.post_media
    ADD COLUMN IF NOT EXISTS aspect_ratio VARCHAR(10),
    ADD COLUMN IF NOT EXISTS width INTEGER,
    ADD COLUMN IF NOT EXISTS height INTEGER,
    ADD COLUMN IF NOT EXISTS blurhash TEXT,
    ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- 3. High-throughput indexing for feed rendering
CREATE INDEX IF NOT EXISTS idx_post_media_post_pos ON public.post_media(post_id, position);
