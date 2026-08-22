-- Migration 00016: Profile Counts, Notification Preferences & Storage Buckets
-- Description: Denormalized profile counters with auto-update triggers, per-user
--   notification channel preferences, Supabase Storage bucket provisioning with
--   RLS policies, and profile avatar/banner columns.

-- =============================================================================
-- SECTION A: Profile Counts (Denormalized counters)
-- =============================================================================
-- Stores denormalized follower/following/post counts for fast profile rendering.
-- Updated exclusively via SECURITY DEFINER triggers on follows/posts tables.
-- No client writes are permitted; RLS defaults to deny for INSERT/UPDATE/DELETE.

CREATE TABLE IF NOT EXISTS public.profile_counts (
    profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    followers_count INTEGER NOT NULL DEFAULT 0,
    following_count INTEGER NOT NULL DEFAULT 0,
    posts_count INTEGER NOT NULL DEFAULT 0,
    likes_received_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexing: primary key covers profile_id lookups; no additional indices needed.

-- Row Level Security
ALTER TABLE public.profile_counts ENABLE ROW LEVEL SECURITY;

-- Everyone can read profile counts (public counters for profile rendering)
CREATE POLICY "Profile counts are publicly readable"
ON public.profile_counts FOR SELECT
USING (true);

-- No INSERT/UPDATE/DELETE policies for clients — only service role and
-- SECURITY DEFINER triggers can write to this table.

-- -----------------------------------------------------------------------------
-- Trigger: Auto-create profile_counts row when a profile is created
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_profile_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profile_counts (profile_id)
    VALUES (NEW.id)
    ON CONFLICT (profile_id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_profile_counts
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_counts();

-- -----------------------------------------------------------------------------
-- Trigger: Increment/decrement followers_count & following_count on follows
-- insert/delete. A new follow row means:
--   • following_id gains +1 followers_count
--   • follower_id gains +1 following_count
-- On delete, the inverse applies.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_follow_count_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- The person being followed gains a follower
        INSERT INTO public.profile_counts (profile_id, followers_count, updated_at)
        VALUES (NEW.following_id, 1, now())
        ON CONFLICT (profile_id) DO UPDATE
            SET followers_count = public.profile_counts.followers_count + 1,
                updated_at = now();

        -- The follower gains a following
        INSERT INTO public.profile_counts (profile_id, following_count, updated_at)
        VALUES (NEW.follower_id, 1, now())
        ON CONFLICT (profile_id) DO UPDATE
            SET following_count = public.profile_counts.following_count + 1,
                updated_at = now();

        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN
        -- The person being unfollowed loses a follower
        UPDATE public.profile_counts
        SET followers_count = GREATEST(followers_count - 1, 0),
            updated_at = now()
        WHERE profile_id = OLD.following_id;

        -- The unfollower loses a following
        UPDATE public.profile_counts
        SET following_count = GREATEST(following_count - 1, 0),
            updated_at = now()
        WHERE profile_id = OLD.follower_id;

        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_follow_count_change
AFTER INSERT OR DELETE ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.handle_follow_count_change();

-- -----------------------------------------------------------------------------
-- Trigger: Increment/decrement posts_count on posts insert/delete
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_post_count_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.profile_counts (profile_id, posts_count, updated_at)
        VALUES (NEW.author_id, 1, now())
        ON CONFLICT (profile_id) DO UPDATE
            SET posts_count = public.profile_counts.posts_count + 1,
                updated_at = now();
        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.profile_counts
        SET posts_count = GREATEST(posts_count - 1, 0),
            updated_at = now()
        WHERE profile_id = OLD.author_id;
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_post_count_change
AFTER INSERT OR DELETE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.handle_post_count_change();

-- -----------------------------------------------------------------------------
-- Trigger: Increment/decrement likes_received_count on post_reactions
-- insert/delete. The post author's profile_counts row is updated.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_like_received_count_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_author_id UUID;
BEGIN
    IF TG_OP = 'INSERT' THEN
        SELECT author_id INTO target_author_id
        FROM public.posts
        WHERE id = NEW.post_id;

        IF target_author_id IS NOT NULL THEN
            INSERT INTO public.profile_counts (profile_id, likes_received_count, updated_at)
            VALUES (target_author_id, 1, now())
            ON CONFLICT (profile_id) DO UPDATE
                SET likes_received_count = public.profile_counts.likes_received_count + 1,
                    updated_at = now();
        END IF;

        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN
        SELECT author_id INTO target_author_id
        FROM public.posts
        WHERE id = OLD.post_id;

        IF target_author_id IS NOT NULL THEN
            UPDATE public.profile_counts
            SET likes_received_count = GREATEST(likes_received_count - 1, 0),
                updated_at = now()
            WHERE profile_id = target_author_id;
        END IF;

        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_like_received_count_change
AFTER INSERT OR DELETE ON public.post_reactions
FOR EACH ROW EXECUTE FUNCTION public.handle_like_received_count_change();


-- =============================================================================
-- SECTION B: Notification Preferences
-- =============================================================================
-- Stores per-user notification channel and per-kind toggle preferences.
-- One row per profile, created lazily on first settings visit or via trigger.

CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Channel toggles
    push_enabled BOOLEAN NOT NULL DEFAULT true,
    email_enabled BOOLEAN NOT NULL DEFAULT true,
    sms_enabled BOOLEAN NOT NULL DEFAULT false,

    -- Per-kind toggles
    likes_enabled BOOLEAN NOT NULL DEFAULT true,
    comments_enabled BOOLEAN NOT NULL DEFAULT true,
    follows_enabled BOOLEAN NOT NULL DEFAULT true,
    mentions_enabled BOOLEAN NOT NULL DEFAULT true,
    messages_enabled BOOLEAN NOT NULL DEFAULT true,
    community_enabled BOOLEAN NOT NULL DEFAULT true,
    spotpay_enabled BOOLEAN NOT NULL DEFAULT true,
    marketing_enabled BOOLEAN NOT NULL DEFAULT false,

    -- Quiet hours (null = no quiet hours)
    quiet_start TIME,
    quiet_end TIME,
    quiet_timezone TEXT DEFAULT 'America/Jamaica',

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(profile_id)
);

-- Indexing
CREATE INDEX IF NOT EXISTS idx_notification_preferences_profile
ON public.notification_preferences(profile_id);

-- Row Level Security
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can read their own notification preferences
CREATE POLICY "Users can read own notification preferences"
ON public.notification_preferences FOR SELECT
USING (auth.uid() = profile_id);

-- Users can insert their own notification preferences (first-time setup)
CREATE POLICY "Users can create own notification preferences"
ON public.notification_preferences FOR INSERT
WITH CHECK (auth.uid() = profile_id);

-- Users can update their own notification preferences
CREATE POLICY "Users can update own notification preferences"
ON public.notification_preferences FOR UPDATE
USING (auth.uid() = profile_id);

-- No DELETE policy — preferences are cascade-deleted with the profile only.

-- -----------------------------------------------------------------------------
-- Trigger: Auto-create notification_preferences row when a profile is created
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.notification_preferences (profile_id)
    VALUES (NEW.id)
    ON CONFLICT (profile_id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_notification_preferences
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_new_notification_preferences();


-- =============================================================================
-- SECTION C: Storage Buckets Configuration
-- =============================================================================
-- Provision Supabase Storage buckets for all user-uploaded media types.
-- Each bucket defines public visibility, file size limits (bytes), and
-- allowed MIME types. ON CONFLICT ensures idempotent re-runs.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
    ('avatars',           'avatars',           true,   5242880,    ARRAY['image/jpeg','image/png','image/webp','image/gif']),
    ('post-media',        'post-media',        true,  52428800,    ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm']),
    ('story-media',       'story-media',       true,  26214400,    ARRAY['image/jpeg','image/png','image/webp','video/mp4']),
    ('podcast-audio',     'podcast-audio',     true, 2147483648,   ARRAY['audio/mpeg','audio/mp4','audio/ogg','audio/wav']),
    ('product-images',    'product-images',    true,  20971520,    ARRAY['image/jpeg','image/png','image/webp']),
    ('community-banners', 'community-banners', true,  10485760,    ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Storage RLS Policies
-- -----------------------------------------------------------------------------
-- Public read access: anyone can view objects in all public buckets.
-- Authenticated upload: users can upload to their own folder (profile_id/*).
-- Authenticated management: users can update/delete their own objects.

-- ---- AVATARS ----------------------------------------------------------------

CREATE POLICY "Avatars are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ---- POST MEDIA -------------------------------------------------------------

CREATE POLICY "Post media is publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-media');

CREATE POLICY "Users can upload their own post media"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'post-media'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own post media"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'post-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own post media"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'post-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ---- STORY MEDIA ------------------------------------------------------------

CREATE POLICY "Story media is publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'story-media');

CREATE POLICY "Users can upload their own story media"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'story-media'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own story media"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'story-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own story media"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'story-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ---- PODCAST AUDIO ----------------------------------------------------------

CREATE POLICY "Podcast audio is publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'podcast-audio');

CREATE POLICY "Users can upload their own podcast audio"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'podcast-audio'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own podcast audio"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'podcast-audio'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own podcast audio"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'podcast-audio'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ---- PRODUCT IMAGES ---------------------------------------------------------

CREATE POLICY "Product images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Users can upload their own product images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own product images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'product-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own product images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'product-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ---- COMMUNITY BANNERS ------------------------------------------------------

CREATE POLICY "Community banners are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'community-banners');

CREATE POLICY "Users can upload their own community banners"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'community-banners'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own community banners"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'community-banners'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own community banners"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'community-banners'
    AND auth.uid()::text = (storage.foldername(name))[1]
);


-- =============================================================================
-- SECTION D: Profile avatar_url & banner_url Columns
-- =============================================================================
-- avatar_url already exists from migration 00002; ADD COLUMN IF NOT EXISTS
-- ensures idempotency. banner_url is new (cover_url exists; banner_url is
-- a distinct field for profile banner images stored in the storage buckets).

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;


-- =============================================================================
-- Rollback Plan
-- =============================================================================
-- To reverse this migration, execute in order:
--
--   -- Section D
--   ALTER TABLE public.profiles DROP COLUMN IF EXISTS banner_url;
--   -- (avatar_url is from 00002; do not drop)
--
--   -- Section C: Storage policies (drop each named policy on storage.objects)
--   DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
--   DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
--   DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
--   DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
--   DROP POLICY IF EXISTS "Post media is publicly readable" ON storage.objects;
--   DROP POLICY IF EXISTS "Users can upload their own post media" ON storage.objects;
--   DROP POLICY IF EXISTS "Users can update their own post media" ON storage.objects;
--   DROP POLICY IF EXISTS "Users can delete their own post media" ON storage.objects;
--   DROP POLICY IF EXISTS "Story media is publicly readable" ON storage.objects;
--   DROP POLICY IF EXISTS "Users can upload their own story media" ON storage.objects;
--   DROP POLICY IF EXISTS "Users can update their own story media" ON storage.objects;
--   DROP POLICY IF EXISTS "Users can delete their own story media" ON storage.objects;
--   DROP POLICY IF EXISTS "Podcast audio is publicly readable" ON storage.objects;
--   DROP POLICY IF EXISTS "Users can upload their own podcast audio" ON storage.objects;
--   DROP POLICY IF EXISTS "Users can update their own podcast audio" ON storage.objects;
--   DROP POLICY IF EXISTS "Users can delete their own podcast audio" ON storage.objects;
--   DROP POLICY IF EXISTS "Product images are publicly readable" ON storage.objects;
--   DROP POLICY IF EXISTS "Users can upload their own product images" ON storage.objects;
--   DROP POLICY IF EXISTS "Users can update their own product images" ON storage.objects;
--   DROP POLICY IF EXISTS "Users can delete their own product images" ON storage.objects;
--   DROP POLICY IF EXISTS "Community banners are publicly readable" ON storage.objects;
--   DROP POLICY IF EXISTS "Users can upload their own community banners" ON storage.objects;
--   DROP POLICY IF EXISTS "Users can update their own community banners" ON storage.objects;
--   DROP POLICY IF EXISTS "Users can delete their own community banners" ON storage.objects;
--   DELETE FROM storage.buckets WHERE id IN ('avatars','post-media','story-media','podcast-audio','product-images','community-banners');
--
--   -- Section B
--   DROP TRIGGER IF EXISTS trg_create_notification_preferences ON public.profiles;
--   DROP FUNCTION IF EXISTS public.handle_new_notification_preferences();
--   DROP TABLE IF EXISTS public.notification_preferences;
--
--   -- Section A
--   DROP TRIGGER IF EXISTS trg_like_received_count_change ON public.post_reactions;
--   DROP FUNCTION IF EXISTS public.handle_like_received_count_change();
--   DROP TRIGGER IF EXISTS trg_post_count_change ON public.posts;
--   DROP FUNCTION IF EXISTS public.handle_post_count_change();
--   DROP TRIGGER IF EXISTS trg_follow_count_change ON public.follows;
--   DROP FUNCTION IF EXISTS public.handle_follow_count_change();
--   DROP TRIGGER IF EXISTS trg_create_profile_counts ON public.profiles;
--   DROP FUNCTION IF EXISTS public.handle_new_profile_counts();
--   DROP TABLE IF EXISTS public.profile_counts;
