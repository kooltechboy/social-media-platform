-- Migration 00111: Transfer KOOL TECH SOLUTIONS Page Ownership to danieljwilliams2401
-- Target Page UUID: 9bbbb1b0-aec2-4a38-9133-913cb2ab7cd3 (KOOL TECH SOLUTIONS)
-- Target Owner Profile UUID: b4be9228-99d1-4d3b-a930-59537adcc8f6 (danieljwilliams2401@gmail.com)

DO $$
DECLARE
    v_page_id UUID := '9bbbb1b0-aec2-4a38-9133-913cb2ab7cd3';
    v_target_user_id UUID := 'b4be9228-99d1-4d3b-a930-59537adcc8f6';
BEGIN
    -- 1. Verify target user exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_target_user_id) THEN
        RAISE EXCEPTION 'Target profile % (danieljwilliams2401) not found', v_target_user_id;
    END IF;

    -- 2. Verify page exists
    IF NOT EXISTS (SELECT 1 FROM public.businesses WHERE id = v_page_id) THEN
        RAISE EXCEPTION 'Page % (KOOL TECH SOLUTIONS) not found', v_page_id;
    END IF;

    -- 3. Update business owner
    UPDATE public.businesses
    SET owner_id = v_target_user_id
    WHERE id = v_page_id;

    -- 4. Clean up previous roles for this page
    DELETE FROM public.page_roles
    WHERE page_id = v_page_id;

    -- 5. Assign owner role to target user
    INSERT INTO public.page_roles (page_id, user_id, role, created_at)
    VALUES (v_page_id, v_target_user_id, 'owner', now());

    RAISE NOTICE 'Transferred ownership of KOOL TECH SOLUTIONS (%) to profile % (danieljwilliams2401)', v_page_id, v_target_user_id;
END $$;
