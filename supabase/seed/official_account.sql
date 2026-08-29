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
            'The digital home of the Caribbean and its global diaspora. Social, creators, businesses, events and SpotPay — one ecosystem.')
    ON CONFLICT (id) DO NOTHING;

    -- Launch posts
    IF NOT EXISTS (SELECT 1 FROM public.posts WHERE author_id = official_id) THEN
        INSERT INTO public.posts (author_id, content, visibility) VALUES
            (official_id,
             'Welcome to TUKUBI 🌴 The digital home of the Caribbean and its global diaspora. Connect with your islands, your communities, and your culture — wherever you are.',
             'public'),
            (official_id,
             'From Kingston to Brooklyn, Santo Domingo to Toronto, Port of Spain to London: one graph connects our people, our culture, and our businesses. Tell us where your Caribbean story begins.',
             'public'),
            (official_id,
             'Creators and businesses: SpotPay is coming. Tips, subscriptions, event tickets, and marketplace sales in one compliant payment layer. Build your audience here first.',
             'public');
    END IF;

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
