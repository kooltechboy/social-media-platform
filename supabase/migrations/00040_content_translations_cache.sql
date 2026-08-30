-- 00040_content_translations_cache.sql
-- Migration: Content Translations Cache for High-Scale Provider-Agnostic Multilingual Delivery
-- Adheres to TUKUBI Engineering Governance & AGENTS.md Security/RLS standards

CREATE TABLE IF NOT EXISTS public.content_translations_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_hash VARCHAR(64) NOT NULL,
    source_language VARCHAR(10) NOT NULL,
    target_language VARCHAR(10) NOT NULL,
    original_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'caribai',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT valid_source_lang CHECK (source_language IN ('en', 'es', 'fr', 'ht', 'nl', 'pap', 'auto', 'und')),
    CONSTRAINT valid_target_lang CHECK (target_language IN ('en', 'es', 'fr', 'ht', 'nl', 'pap'))
);

-- Unique composite index for O(1) cache lookups by content hash and language pair
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_translations_lookup 
ON public.content_translations_cache (content_hash, source_language, target_language);

-- Secondary index for cache maintenance, analytics, or eviction
CREATE INDEX IF NOT EXISTS idx_content_translations_created 
ON public.content_translations_cache (created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.content_translations_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone (authenticated or public) can read translated content cache
CREATE POLICY "Public and authenticated users can view cached translations"
ON public.content_translations_cache
FOR SELECT
TO authenticated, anon
USING (true);

-- RLS Policy: Authenticated users can insert cached translations
CREATE POLICY "Authenticated users can insert cached translations"
ON public.content_translations_cache
FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLS Policy: Service role has full management
CREATE POLICY "Service role can manage translations cache"
ON public.content_translations_cache
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add constraint to profiles.language_preference if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_profiles_language_preference'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT check_profiles_language_preference 
        CHECK (language_preference IS NULL OR language_preference IN ('en', 'es', 'fr', 'ht', 'nl', 'pap'));
    END IF;
END $$;
