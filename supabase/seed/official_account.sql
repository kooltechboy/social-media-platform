-- Seed: official TUKUBI account + launch content
-- Run: supabase db query --linked -f supabase/seed/official_account.sql
-- Idempotent: safe to re-run.

DO $$
DECLARE
    official_id uuid := 'a0000000-0000-4000-8000-000000000001';
    lounge_id uuid;
BEGIN
    -- Official platform identity
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
                            raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES (official_id, 'hello@caribbeanone.app',
            '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
            now(), now(), now(),
            '{"provider":"email","providers":["email"]}', '{"official":true}', 'authenticated', 'authenticated')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (id, username, display_name, bio)
    VALUES (official_id, 'caribbean_one', 'TUKUBI',
            'The digital home of the Caribbean and its global diaspora. Social, creators, businesses, events and commerce — one ecosystem.')
    ON CONFLICT (id) DO NOTHING;


    -- Flagship community
    INSERT INTO public.communities (name, slug, description, join_policy, created_by)
    VALUES ('Tukubi Lounge', 'caribbean-one-lounge',
            'The official town square: announcements, feedback, and diaspora introductions.',
            'public', official_id)
    ON CONFLICT (slug) DO NOTHING
    RETURNING id INTO lounge_id;

    IF lounge_id IS NULL THEN
        SELECT id INTO lounge_id FROM public.communities WHERE slug = 'caribbean-one-lounge';
    END IF;

    INSERT INTO public.community_members (community_id, profile_id, role_id, membership_status)
    SELECT lounge_id, official_id, r.id, 'active'
    FROM public.community_roles r
    WHERE r.community_id = lounge_id AND r.name = 'owner'
    ON CONFLICT (community_id, profile_id) DO NOTHING;

    RAISE NOTICE 'Seed complete: official account + launch content ready';
END $$;
