-- Migration 00002: User Identity & Profiles Schema with Row Level Security
-- Description: User profiles, Caribbean heritage linking, diaspora connections, cultural interests

CREATE TYPE public.account_type AS ENUM ('personal', 'creator', 'business', 'organization');

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(30) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    account_type public.account_type DEFAULT 'personal' NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    cover_url TEXT,
    
    -- Geographic & Diaspora Identity
    current_country_id UUID REFERENCES public.countries(id),
    current_city VARCHAR(100),
    origin_country_id UUID REFERENCES public.countries(id),
    origin_city VARCHAR(100),
    
    -- Cultural Interests & Dialects
    cultural_interests TEXT[] DEFAULT '{}',
    languages_spoken VARCHAR(10)[] DEFAULT '{en}',
    
    -- Status & Verification
    is_verified BOOLEAN DEFAULT false NOT NULL,
    is_private BOOLEAN DEFAULT false NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexing for Fast Querying
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_origin_country ON public.profiles(origin_country_id);
CREATE INDEX idx_profiles_current_country ON public.profiles(current_country_id);

-- Row Level Security Rules
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. Anyone can view public profiles
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (is_private = false OR auth.uid() = id);

-- 2. Users can insert their own profile upon auth signup
CREATE POLICY "Users can create their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- 3. Users can update only their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);
