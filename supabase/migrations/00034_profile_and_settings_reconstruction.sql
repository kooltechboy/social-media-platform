-- Migration 00034: Profile & Settings Reconstruction
-- Description: Adds comprehensive identity, personal, professional, social,
--   privacy, and settings preference columns to public.profiles, with robust
--   indexes, storage bucket configuration, and Row Level Security.

-- =============================================================================
-- SECTION A: Personal & Identity Columns on public.profiles
-- =============================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender VARCHAR(50);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pronouns VARCHAR(50);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS relationship_status VARCHAR(50);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS island VARCHAR(100);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

-- =============================================================================
-- SECTION B: Professional & Educational Information
-- =============================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_title VARCHAR(100);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS employer VARCHAR(100);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS education VARCHAR(100);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school VARCHAR(100);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS professional_bio TEXT;

-- =============================================================================
-- SECTION C: Social Links (Instagram, Twitter, TikTok, LinkedIn, YouTube, Facebook)
-- =============================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- =============================================================================
-- SECTION D: Privacy & Visibility Controls
-- =============================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_visibility VARCHAR(20) DEFAULT 'public';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dob_visibility VARCHAR(20) DEFAULT 'private';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address_visibility VARCHAR(20) DEFAULT 'private';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS relationship_visibility VARCHAR(20) DEFAULT 'public';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS online_status_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS messaging_permission VARCHAR(20) DEFAULT 'everyone';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interaction_permission VARCHAR(20) DEFAULT 'everyone';

-- =============================================================================
-- SECTION E: Preferences & Account State
-- =============================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme_preference VARCHAR(20) DEFAULT 'twilight';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language_preference VARCHAR(10) DEFAULT 'en';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- =============================================================================
-- SECTION F: Performance Indexing
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower ON public.profiles(LOWER(username));

-- =============================================================================
-- SECTION G: Storage Configuration
-- =============================================================================
-- Update avatars bucket file size limit to 10MB to accommodate high-res banners/covers
UPDATE storage.buckets 
SET file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif']
WHERE id = 'avatars';

-- =============================================================================
-- SECTION H: RLS Policy Harmonization
-- =============================================================================
-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Ensure users can read their own profile in full
DROP POLICY IF EXISTS "Owner reads full profile" ON public.profiles;
CREATE POLICY "Owner reads full profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Ensure public can read non-private profiles
DROP POLICY IF EXISTS "Public minimal profile access" ON public.profiles;
CREATE POLICY "Public minimal profile access"
ON public.profiles FOR SELECT
USING (
    is_private = FALSE 
    OR auth.uid() = id
);

-- Ensure owner can update their own profile
DROP POLICY IF EXISTS "User update own profile" ON public.profiles;
CREATE POLICY "User update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Ensure owner can insert their own profile
DROP POLICY IF EXISTS "User create profile" ON public.profiles;
CREATE POLICY "User create profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);
