-- Migration 00080: Caribbean Geography Discovery Engine & Performance Indexes
-- Description:
--   1. Adds unique 'slug' column to public.countries for clean, SEO-friendly deep links (/explore/jamaica, /explore/dominican-republic).
--   2. Populates canonical slugs for all Caribbean sovereign countries, islands, territories, and diaspora nations.
--   3. Adds performance indexes for multi-entity discovery (posts, profiles, events, communities, businesses, videos).
--   4. Preserves all existing data and RLS policies.

BEGIN;

-- 1. Add slug column to public.countries
ALTER TABLE public.countries
    ADD COLUMN IF NOT EXISTS slug VARCHAR(120);

-- 2. Populate canonical slugs for existing countries and territories
UPDATE public.countries SET slug = 'jamaica' WHERE iso_code = 'JAM' AND slug IS NULL;
UPDATE public.countries SET slug = 'dominican-republic' WHERE iso_code = 'DOM' AND slug IS NULL;
UPDATE public.countries SET slug = 'trinidad-and-tobago' WHERE iso_code = 'TTO' AND slug IS NULL;
UPDATE public.countries SET slug = 'haiti' WHERE iso_code = 'HTI' AND slug IS NULL;
UPDATE public.countries SET slug = 'bahamas' WHERE iso_code = 'BHS' AND slug IS NULL;
UPDATE public.countries SET slug = 'barbados' WHERE iso_code = 'BRB' AND slug IS NULL;
UPDATE public.countries SET slug = 'cuba' WHERE iso_code = 'CUB' AND slug IS NULL;
UPDATE public.countries SET slug = 'antigua-and-barbuda' WHERE iso_code = 'ATG' AND slug IS NULL;
UPDATE public.countries SET slug = 'dominica' WHERE iso_code = 'DMA' AND slug IS NULL;
UPDATE public.countries SET slug = 'grenada' WHERE iso_code = 'GRD' AND slug IS NULL;
UPDATE public.countries SET slug = 'saint-kitts-and-nevis' WHERE iso_code = 'KNA' AND slug IS NULL;
UPDATE public.countries SET slug = 'saint-lucia' WHERE iso_code = 'LCA' AND slug IS NULL;
UPDATE public.countries SET slug = 'saint-vincent-and-the-grenadines' WHERE iso_code = 'VCT' AND slug IS NULL;
UPDATE public.countries SET slug = 'belize' WHERE iso_code = 'BLZ' AND slug IS NULL;
UPDATE public.countries SET slug = 'guyana' WHERE iso_code = 'GUY' AND slug IS NULL;
UPDATE public.countries SET slug = 'suriname' WHERE iso_code = 'SUR' AND slug IS NULL;
UPDATE public.countries SET slug = 'puerto-rico' WHERE iso_code = 'PRI' AND slug IS NULL;
UPDATE public.countries SET slug = 'cayman-islands' WHERE iso_code = 'CYM' AND slug IS NULL;
UPDATE public.countries SET slug = 'curacao' WHERE (iso_code = 'CUR' OR iso_code = 'CUW') AND slug IS NULL;
UPDATE public.countries SET slug = 'aruba' WHERE iso_code = 'ABW' AND slug IS NULL;
UPDATE public.countries SET slug = 'sint-maarten' WHERE iso_code = 'SXM' AND slug IS NULL;
UPDATE public.countries SET slug = 'british-virgin-islands' WHERE iso_code = 'VGB' AND slug IS NULL;
UPDATE public.countries SET slug = 'us-virgin-islands' WHERE iso_code = 'VIR' AND slug IS NULL;
UPDATE public.countries SET slug = 'turks-and-caicos' WHERE iso_code = 'TCA' AND slug IS NULL;
UPDATE public.countries SET slug = 'bermuda' WHERE iso_code = 'BMU' AND slug IS NULL;
UPDATE public.countries SET slug = 'anguilla' WHERE iso_code = 'AIA' AND slug IS NULL;
UPDATE public.countries SET slug = 'montserrat' WHERE iso_code = 'MSR' AND slug IS NULL;
UPDATE public.countries SET slug = 'guadeloupe' WHERE iso_code = 'GLP' AND slug IS NULL;
UPDATE public.countries SET slug = 'martinique' WHERE iso_code = 'MTQ' AND slug IS NULL;
UPDATE public.countries SET slug = 'united-states' WHERE iso_code = 'USA' AND slug IS NULL;
UPDATE public.countries SET slug = 'canada' WHERE iso_code = 'CAN' AND slug IS NULL;
UPDATE public.countries SET slug = 'united-kingdom' WHERE iso_code = 'GBR' AND slug IS NULL;
UPDATE public.countries SET slug = 'netherlands' WHERE iso_code = 'NLD' AND slug IS NULL;

-- Fallback for any other country record: lowercase iso code
UPDATE public.countries SET slug = LOWER(iso_code) WHERE slug IS NULL;

-- Ensure unique constraint on slug
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_countries_slug'
    ) THEN
        ALTER TABLE public.countries ADD CONSTRAINT uq_countries_slug UNIQUE (slug);
    END IF;
END $$;

-- 3. Create Performance Indexes for Discovery Engine
CREATE INDEX IF NOT EXISTS idx_countries_slug
    ON public.countries(slug);

CREATE INDEX IF NOT EXISTS idx_posts_country_created
    ON public.posts(country_id, created_at DESC)
    WHERE country_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_country_island
    ON public.profiles(LOWER(country), LOWER(island));

CREATE INDEX IF NOT EXISTS idx_profiles_origin_country_id
    ON public.profiles(origin_country_id)
    WHERE origin_country_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_communities_country_iso
    ON public.communities(country_iso)
    WHERE country_iso IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_country_iso_starts
    ON public.events(country_iso, starts_at ASC)
    WHERE country_iso IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_businesses_country_iso
    ON public.businesses(country_iso)
    WHERE country_iso IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_videos_reel_discovery
    ON public.videos(video_kind, created_at DESC)
    WHERE video_kind = 'reel' AND visibility = 'public';

COMMIT;
