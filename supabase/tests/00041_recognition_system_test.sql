-- =============================================================================
-- Test Suite: 00041 Recognition, Status, Achievements & Founder Ecosystem
-- =============================================================================

BEGIN;

-- 1. Create Mock Test Profiles
INSERT INTO public.profiles (id, username, display_name, account_type, is_verified, is_private)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'founder_test_user_1', 'Founder One', 'personal', true, false),
  ('22222222-2222-2222-2222-222222222222', 'founder_test_user_2', 'Founder Two', 'creator', true, false),
  ('33333333-3333-3333-3333-333333333333', 'founder_test_user_3', 'Founder Three', 'business', false, false)
ON CONFLICT (id) DO NOTHING;

-- 2. Test Atomic Founder Number Allocation (User 1)
DO $$
DECLARE
    v_res JSONB;
BEGIN
    v_res := public.allocate_founder_number('11111111-1111-1111-1111-111111111111', 'founding_1000');
    IF (v_res->>'success')::boolean != true OR (v_res->>'founder_number')::int != 1 THEN
        RAISE EXCEPTION 'TEST FAILED: User 1 did not receive founder number 1: %', v_res;
    END IF;
    RAISE NOTICE 'TEST PASSED: User 1 allocated founder number 1 successfully (%)', v_res->>'formatted_number';
END $$;

-- 3. Test Duplicate Allocation Idempotency (User 1 again)
DO $$
DECLARE
    v_res JSONB;
BEGIN
    v_res := public.allocate_founder_number('11111111-1111-1111-1111-111111111111', 'founding_1000');
    IF (v_res->>'already_member')::boolean != true OR (v_res->>'founder_number')::int != 1 THEN
        RAISE EXCEPTION 'TEST FAILED: Duplicate allocation did not return existing number: %', v_res;
    END IF;
    RAISE NOTICE 'TEST PASSED: Duplicate allocation returned existing founder record cleanly.';
END $$;

-- 4. Test Second User Chronological Sequence Allocation (User 2 should get 2)
DO $$
DECLARE
    v_res JSONB;
BEGIN
    v_res := public.allocate_founder_number('22222222-2222-2222-2222-222222222222', 'founding_1000');
    IF (v_res->>'founder_number')::int != 2 THEN
        RAISE EXCEPTION 'TEST FAILED: User 2 did not receive chronological number 2: %', v_res;
    END IF;
    RAISE NOTICE 'TEST PASSED: User 2 allocated chronological founder number 2 (%)', v_res->>'formatted_number';
END $$;

-- 5. Test Badge Award & Audit Logging
DO $$
DECLARE
    v_award_res JSONB;
    v_audit_count INT;
BEGIN
    v_award_res := public.award_badge('11111111-1111-1111-1111-111111111111', 'community_builder', 'Distinguished test achievement');
    IF (v_award_res->>'success')::boolean != true THEN
        RAISE EXCEPTION 'TEST FAILED: award_badge failed: %', v_award_res;
    END IF;

    SELECT COUNT(*) INTO v_audit_count
    FROM public.audit_logs
    WHERE action = 'recognition.badge_awarded';

    IF v_audit_count < 1 THEN
        RAISE EXCEPTION 'TEST FAILED: Audit log for badge award was not created.';
    END IF;
    RAISE NOTICE 'TEST PASSED: Badge awarded and recorded in immutable audit logs.';
END $$;

-- 6. Test Reputation Scoring & Level Assignment
DO $$
DECLARE
    v_rep_res JSONB;
    v_level_tier INT;
BEGIN
    v_rep_res := public.evaluate_user_reputation('11111111-1111-1111-1111-111111111111');
    v_level_tier := (v_rep_res->>'level_tier')::int;
    IF v_level_tier < 1 THEN
        RAISE EXCEPTION 'TEST FAILED: Invalid reputation tier %', v_level_tier;
    END IF;
    RAISE NOTICE 'TEST PASSED: Reputation evaluated successfully (Score: %, Tier: %)', v_rep_res->>'score', v_level_tier;
END $$;

-- 7. Test Anti-Abuse Self-Referral Prevention
DO $$
BEGIN
    BEGIN
        INSERT INTO public.recognition_referrals (referrer_id, referred_id, status)
        VALUES ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'verified');
        RAISE EXCEPTION 'TEST FAILED: Self-referral constraint was bypassed!';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'TEST PASSED: Self-referral constraint actively rejected abusive loop.';
    END;
END $$;

-- 8. Test Consolidated Profile Recognition Summary RPC
DO $$
DECLARE
    v_summary JSONB;
BEGIN
    v_summary := public.get_profile_recognition('11111111-1111-1111-1111-111111111111');
    IF (v_summary->'founder'->>'is_founder')::boolean != true THEN
        RAISE EXCEPTION 'TEST FAILED: get_profile_recognition missing founder status: %', v_summary;
    END IF;
    IF jsonb_array_length(v_summary->'badges') < 1 THEN
        RAISE EXCEPTION 'TEST FAILED: get_profile_recognition missing awarded badges: %', v_summary;
    END IF;
    RAISE NOTICE 'TEST PASSED: Consolidated get_profile_recognition returned valid structured payload.';
END $$;

ROLLBACK;
