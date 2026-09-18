-- Seed: official TUKUBI account + launch content
-- Run: supabase db query --linked -f supabase/seed/official_account.sql
-- Idempotent: safe to re-run.

DO $$
DECLARE
    official_id uuid := 'ff1e8b1f-7796-4424-b341-3b39e1c993bd';
    lounge_id uuid;
BEGIN
    -- Official platform identity
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
                            raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES (official_id, 'hello@tukubi.com',
            '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
            now(), now(), now(),
            '{"provider":"email","providers":["email"]}', '{"official":true}', 'authenticated', 'authenticated')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (id, username, display_name, bio, is_official, is_verified)
    VALUES (official_id, 'tukubi', 'TUKUBI',
            'The digital home of the Caribbean and its global diaspora. Social, creators, businesses, events and commerce — one ecosystem.',
            true, true)
    ON CONFLICT (id) DO UPDATE SET
        is_official = true,
        is_verified = true;

    -- Flagship community
    INSERT INTO public.communities (name, slug, description, join_policy, created_by)
    VALUES ('Tukubi Lounge', 'tukubi-lounge',
            'The official town square: announcements, feedback, and diaspora introductions.',
            'public', official_id)
    ON CONFLICT (slug) DO NOTHING
    RETURNING id INTO lounge_id;

    IF lounge_id IS NULL THEN
        SELECT id INTO lounge_id FROM public.communities WHERE slug = 'tukubi-lounge';
    END IF;

    IF lounge_id IS NOT NULL THEN
        INSERT INTO public.community_members (community_id, profile_id, role_id, membership_status)
        SELECT lounge_id, official_id, r.id, 'active'
        FROM public.community_roles r
        WHERE r.community_id = lounge_id AND r.name = 'owner'
        ON CONFLICT (community_id, profile_id) DO NOTHING;
    END IF;

    RAISE NOTICE 'Seed complete: official account + launch content ready';
END $$;
