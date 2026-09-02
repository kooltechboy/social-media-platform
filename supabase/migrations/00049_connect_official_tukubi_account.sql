-- Migration 00049: Connect Supabase Auth Identity to Official TUKUBI Profile (@tukubi)
-- Target Auth User UUID: ff1e8b1f-7796-4424-b341-3b39e1c993bd
-- Description: Binds the authenticated operational user identity (tukubi@kooltechsolutions.com)
--              to the official @tukubi profile, registers the official account in public.official_accounts,
--              sets verified & official status flags, and initializes required profile relations.

DO $$
DECLARE
    v_user_id UUID := 'ff1e8b1f-7796-4424-b341-3b39e1c993bd';
    v_official_acc_id UUID;
BEGIN
    -- 1. Authorize reserved username 'tukubi' for this specific Auth UUID
    UPDATE public.reserved_usernames
    SET allow_profile_id = v_user_id
    WHERE username = 'tukubi';

    -- 2. Upsert official profile record
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
        v_user_id,
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
        bio = E'🌴 The Caribbean Connected.\nConnecting Caribbean people, culture, creators, businesses & the global diaspora.\n🌎 Born in the Caribbean. Built for the World.',
        account_type = 'organization',
        is_official = true,
        is_verified = true,
        is_system_account = true,
        is_private = false,
        status = 'active',
        updated_at = now();

    -- 3. Upsert profile_counts counters
    INSERT INTO public.profile_counts (
        profile_id,
        followers_count,
        following_count,
        posts_count,
        likes_received_count,
        updated_at
    )
    VALUES (v_user_id, 0, 0, 0, 0, now())
    ON CONFLICT (profile_id) DO NOTHING;

    -- 4. Upsert notification_preferences
    INSERT INTO public.notification_preferences (profile_id)
    VALUES (v_user_id)
    ON CONFLICT (profile_id) DO NOTHING;

    -- 5. Register / Update official_accounts record
    INSERT INTO public.official_accounts (
        profile_id,
        classification,
        department,
        status,
        is_system_account,
        updated_at
    )
    VALUES (
        v_user_id,
        'official_platform',
        'Executive & Platform Communications',
        'active',
        true,
        now()
    )
    ON CONFLICT (profile_id) DO UPDATE
    SET status = 'active',
        classification = 'official_platform',
        department = 'Executive & Platform Communications',
        is_system_account = true,
        updated_at = now()
    RETURNING id INTO v_official_acc_id;

    -- 6. Log connection in immutable audit trail
    INSERT INTO public.audit_logs (
        actor_id,
        action,
        entity_type,
        entity_id,
        metadata,
        created_at
    )
    VALUES (
        v_user_id,
        'official_account_connected',
        'profiles',
        v_user_id,
        jsonb_build_object(
            'username', 'tukubi',
            'display_name', 'TUKUBI',
            'classification', 'official_platform',
            'official_account_id', v_official_acc_id,
            'source', 'migration_00049'
        ),
        now()
    );

    RAISE NOTICE 'Successfully connected Auth User % to official TUKUBI profile (@tukubi)', v_user_id;
END $$;
