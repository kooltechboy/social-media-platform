-- Migration 00001: Initial Schema including basic profile data (already applied)
-- 
-- Updated profile schema with enhanced cultural identity fields

CREATE TYPE public.account_type AS ENUM ('personal', 'creator', 'business', 'organization');

CREATE TABLE public.profiles (
 id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 username VARCHAR(30) UNIQUE NOT NULL,
 display_name VARCHAR(100) NOT NULL,
 account_type public.account_type DEFAULT 'personal' NOT NULL,
 bio TEXT,
 avatar_url TEXT,
 cover_url TEXT,
 
 -- Expanded identity fields
 current_country_id UUID REFERENCES public.countries(id),
 current_city VARCHAR(100),
 origin_country_id UUID REFERENCES public.countries(id),
 origin_city VARCHAR(100),
 origin_diaspora_links UUID[] DEFAULT '{}' CHECK (origin_diaspora_links IS NULL OR ARRAY_LENGTH(origin_diaspora_links, 1) <= 10),
 
 -- Cultural identity details
 cultural_interests TEXT[] DEFAULT '{}',
 languages_spoken VARCHAR(10)[] DEFAULT '{en}',
 coastal_cultural_tags TEXT[],
 hinterland_cultural_tags TEXT[],

 -- Compliance & Security
 is_verified BOOLEAN DEFAULT false NOT NULL,
 is_private BOOLEAN DEFAULT false NOT NULL,
 data_masking_policy TEXT DEFAULT 'default',

 created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
 updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enhanced Indexes
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_origin_country ON public.profiles(origin_country_id);
CREATE INDEX idx_profiles_current_country ON public.profiles(current_country_id);
CREATE INDEX idx_dialogue_idioms ON public.profiles(
  jsonb_build_array(coastal_cultural_tags, hinterland_cultural_tags)
);

-- More granular RLS rules
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Public access to non-private profiles
CREATE POLICY "Public profiles accessible"
ON public.profiles FOR SELECT
WITH check (is_private = FALSE OR auth.uid() = id);

-- Policy 2: User-owned inserts
CREATE POLICY "User can create profile"
ON public.profiles FOR INSERT
WITH check (auth.uid() = id);

-- Policy 3: Ownership-based updates
CREATE POLICY "User owned updates"
ON public.profiles FOR UPDATE
WITH check (auth.uid() = id);

-- Policy 4:-Management can view all
CREATE POLICY "Management audit access"
ON public.profiles FOR SELECT
WITH check (auth.uid() IN (SELECT id FROM public.accounts WHERE role = 'management'));