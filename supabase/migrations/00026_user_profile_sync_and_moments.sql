-- Migration 00026: User Profile Sync Trigger, Idempotent Backfill & Moments/Stories Security
-- Description: Establishes an automatic trigger on auth.users to create and sync public.profiles,
--              backfills existing auth users without profiles, and reinforces stories/moments RLS.

-- =============================================================================
-- 1. TRIGGER FUNCTION: handle_new_user()
-- =============================================================================
-- Automatically runs AFTER INSERT ON auth.users to provision public.profiles,
-- public.profile_counts, and public.notification_preferences.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    base_username TEXT;
    candidate_username TEXT;
    suffix_counter INT := 0;
    resolved_display_name TEXT;
    raw_acc_type TEXT;
    valid_acc_type public.account_type := 'personal';
BEGIN
    -- 1. Extract and sanitize base username
    base_username := COALESCE(
        NEW.raw_user_meta_data->>'username',
        split_part(NEW.email, '@', 1)
    );
    -- Remove non-alphanumeric/underscore characters and limit length
    base_username := lower(regexp_replace(base_username, '[^a-zA-Z0-9_.]', '', 'g'));
    IF length(base_username) < 3 THEN
        base_username := 'user_' || substr(md5(NEW.id::text), 1, 6);
    END IF;
    base_username := substr(base_username, 1, 24);

    -- 2. Resolve display name
    resolved_display_name := COALESCE(
        NEW.raw_user_meta_data->>'display_name',
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        base_username,
        'Caribbean Citizen'
    );

    -- 3. Resolve account type safely
    raw_acc_type := NEW.raw_user_meta_data->>'account_type';
    IF raw_acc_type IN ('personal', 'creator', 'business', 'organization') THEN
        valid_acc_type := raw_acc_type::public.account_type;
    END IF;

    -- 4. Find an available username if candidate is taken
    candidate_username := base_username;
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = candidate_username AND id != NEW.id) LOOP
        suffix_counter := suffix_counter + 1;
        candidate_username := substr(base_username, 1, 20) || '_' || suffix_counter::text;
    END LOOP;

    -- 5. Insert or update the public.profiles record
    INSERT INTO public.profiles (
        id,
        username,
        display_name,
        account_type,
        avatar_url,
        bio,
        is_verified,
        is_private,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        candidate_username,
        resolved_display_name,
        valid_acc_type,
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'bio',
        false,
        false,
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        display_name = EXCLUDED.display_name,
        updated_at = now();

    -- 6. Insert profile_counts if not exists
    INSERT INTO public.profile_counts (profile_id, followers_count, following_count, posts_count, likes_received_count, updated_at)
    VALUES (NEW.id, 0, 0, 0, 0, now())
    ON CONFLICT (profile_id) DO NOTHING;

    -- 7. Insert notification_preferences if not exists
    INSERT INTO public.notification_preferences (profile_id)
    VALUES (NEW.id)
    ON CONFLICT (profile_id) DO NOTHING;

    -- 8. Insert fallback profile_identity if origin_country provided
    IF NEW.raw_user_meta_data->>'origin_country_iso' IS NOT NULL THEN
        INSERT INTO public.profile_identity (
            profile_id,
            origin_country_iso,
            visibility,
            updated_at
        )
        VALUES (
            NEW.id,
            NEW.raw_user_meta_data->>'origin_country_iso',
            'private',
            now()
        )
        ON CONFLICT (profile_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- 2. SAFE IDEMPOTENT BACKFILL FOR EXISTING AUTH USERS
-- =============================================================================
-- Ensures every pre-existing user in auth.users has a valid public.profiles record

DO $$
DECLARE
    u RECORD;
    base_u TEXT;
    cand_u TEXT;
    ctr INT;
BEGIN
    FOR u IN (SELECT * FROM auth.users WHERE id NOT IN (SELECT id FROM public.profiles)) LOOP
        base_u := COALESCE(
            u.raw_user_meta_data->>'username',
            split_part(u.email, '@', 1),
            'user'
        );
        base_u := lower(regexp_replace(base_u, '[^a-zA-Z0-9_.]', '', 'g'));
        IF length(base_u) < 3 THEN
            base_u := 'user_' || substr(md5(u.id::text), 1, 6);
        END IF;
        base_u := substr(base_u, 1, 24);

        cand_u := base_u;
        ctr := 0;
        WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = cand_u) LOOP
            ctr := ctr + 1;
            cand_u := substr(base_u, 1, 20) || '_' || ctr::text;
        END LOOP;

        INSERT INTO public.profiles (
            id,
            username,
            display_name,
            account_type,
            avatar_url,
            created_at,
            updated_at
        )
        VALUES (
            u.id,
            cand_u,
            COALESCE(u.raw_user_meta_data->>'display_name', cand_u),
            'personal',
            u.raw_user_meta_data->>'avatar_url',
            now(),
            now()
        )
        ON CONFLICT (id) DO NOTHING;

        INSERT INTO public.profile_counts (profile_id, followers_count, following_count, posts_count, likes_received_count, updated_at)
        VALUES (u.id, 0, 0, 0, 0, now())
        ON CONFLICT (profile_id) DO NOTHING;

        INSERT INTO public.notification_preferences (profile_id)
        VALUES (u.id)
        ON CONFLICT (profile_id) DO NOTHING;
    END LOOP;
END;
$$;

-- =============================================================================
-- 3. STORIES & STORY VIEWS RLS & REFINEMENTS
-- =============================================================================
-- Ensure RLS is active and author delete policy is present

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- Author can delete their own stories
DROP POLICY IF EXISTS "Authors can delete own stories" ON public.stories;
CREATE POLICY "Authors can delete own stories" ON public.stories
    FOR DELETE
    TO authenticated
    USING (auth.uid() = author_id);

-- Author can update their own stories
DROP POLICY IF EXISTS "Authors can update own stories" ON public.stories;
CREATE POLICY "Authors can update own stories" ON public.stories
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

-- Grant schema permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;
