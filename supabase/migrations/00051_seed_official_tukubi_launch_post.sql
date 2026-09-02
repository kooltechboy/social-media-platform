-- Migration 00051: Seed and Guarantee Official TUKUBI Inaugural Launch Post
-- Author: TUKUBI Engineering
-- Profile UUID: ff1e8b1f-7796-4424-b341-3b39e1c993bd (@tukubi)
-- Post UUID: d23f3e75-0dfa-47c6-8df9-2c0fa299d7ff

DO $$
DECLARE
    v_author_id UUID := 'ff1e8b1f-7796-4424-b341-3b39e1c993bd';
    v_post_id UUID := 'd23f3e75-0dfa-47c6-8df9-2c0fa299d7ff';
BEGIN
    -- 1. Guarantee @tukubi profile exists and is official
    INSERT INTO public.profiles (
        id,
        username,
        display_name,
        bio,
        account_type,
        is_official,
        is_verified,
        is_system_account,
        is_private,
        status,
        updated_at
    )
    VALUES (
        v_author_id,
        'tukubi',
        'TUKUBI',
        E'🌴 The Caribbean Connected.\nConnecting Caribbean people, culture, creators, businesses & the global diaspora.\n🌎 Born in the Caribbean. Built for the World.',
        'organization',
        true,
        true,
        true,
        false,
        'active',
        now()
    )
    ON CONFLICT (id) DO UPDATE
    SET username = 'tukubi',
        display_name = 'TUKUBI',
        is_official = true,
        is_verified = true,
        is_system_account = true,
        status = 'active',
        updated_at = now();

    -- 2. Insert or update the Inaugural Launch Post
    INSERT INTO public.posts (
        id,
        author_id,
        content,
        visibility,
        cultural_tags,
        media_urls,
        likes_count,
        comments_count,
        shares_count,
        created_at,
        updated_at
    )
    VALUES (
        v_post_id,
        v_author_id,
        E'🌴 Welcome to TUKUBI — The Caribbean Connected.\n\nConnecting Caribbean people, culture, creators, businesses & the global diaspora in one unified digital ecosystem.\n\n🌎 Born in the Caribbean. Built for the World.\n\nJoin conversations across the islands, explore live audio/video broadcasts, discover local creators, support Caribbean merchants, and build the future of our digital heritage together. ☀️🌊🎶',
        'public',
        ARRAY['caribbean', 'tukubiofficial', 'welcome', 'diaspora', 'culture'],
        ARRAY[]::TEXT[],
        1240,
        86,
        312,
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE
    SET content = EXCLUDED.content,
        visibility = 'public',
        cultural_tags = EXCLUDED.cultural_tags,
        updated_at = now();

    -- 3. Update profile_counts posts_count
    UPDATE public.profile_counts
    SET posts_count = (SELECT COUNT(*) FROM public.posts WHERE author_id = v_author_id),
        updated_at = now()
    WHERE profile_id = v_author_id;

    RAISE NOTICE 'Official TUKUBI Launch Post % seeded successfully for @tukubi.', v_post_id;
END $$;
