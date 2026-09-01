-- Migration 00046: Social Search & Posting Optimization
-- Description: Enables fast substring and prefix search for profiles by name and username,
--   and optimizes feed retrieval index on posts.

-- Enable pg_trgm extension for fast text matching if available
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

-- Indexes on profiles for case-insensitive search by username and display_name
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower ON public.profiles(LOWER(username));
CREATE INDEX IF NOT EXISTS idx_profiles_display_name_lower ON public.profiles(LOWER(display_name));

-- Trigram indexes for fast partial / ILIKE search if pg_trgm is supported
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    CREATE INDEX IF NOT EXISTS idx_profiles_username_trgm ON public.profiles USING gin (username gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_profiles_display_name_trgm ON public.profiles USING gin (display_name gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_posts_content_trgm ON public.posts USING gin (content gin_trgm_ops);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Gracefully proceed if GIN trgm ops are restricted
END $$;

-- Optimized composite index for public and following feed queries
CREATE INDEX IF NOT EXISTS idx_posts_visibility_created_at
  ON public.posts(visibility, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_author_created_at
  ON public.posts(author_id, created_at DESC);
