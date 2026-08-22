-- RLS Verification Suite — CARIBBEAN ONE
-- Run against a Supabase project with migrations 00001..00013 applied:
--   psql "$SUPABASE_DB_URL" -f supabase/tests/rls_tests.sql
-- Each test sets the active role + JWT claim, executes the guarded statement
-- and asserts the observed row count. Failures raise an exception and abort.
-- Companion TS harness: packages/database/src/index.ts (RlsTestHarness).

BEGIN;

DO $$
DECLARE
  owner_id uuid := '11111111-1111-1111-1111-111111111111';
  other_id uuid := '22222222-2222-2222-2222-222222222222';
  community_id uuid;
  observed int;
BEGIN
  -- Seed two test identities (auth.users first: profiles.id FKs to auth.users)
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
                          raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES
    (owner_id, 'rls_owner@test.caribbeanone.app', 'x', now(), now(), now(),
     '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
    (other_id, 'rls_other@test.caribbeanone.app', 'x', now(), now(), now(),
     '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (id, username, display_name)
  VALUES
    (owner_id, 'rls_owner', 'RLS Owner'),
    (other_id, 'rls_other', 'RLS Other')
  ON CONFLICT (id) DO NOTHING;

  -- Owner-declared Caribbean identity row (private by default)
  INSERT INTO public.profile_identity (profile_id, visibility)
  VALUES (owner_id, 'private')
  ON CONFLICT (profile_id) DO NOTHING;

  INSERT INTO public.communities (name, slug, join_policy, created_by)
  VALUES ('RLS Test Community', 'rls-test-community', 'public', owner_id)
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO community_id;

  IF community_id IS NULL THEN
    SELECT id INTO community_id FROM public.communities WHERE slug = 'rls-test-community';
  END IF;

  -- TEST 1: anon cannot read profile_identity
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claims', '', true);
  SELECT count(*) INTO observed FROM public.profile_identity;
  IF observed > 0 THEN
    RAISE EXCEPTION 'RLS FAILURE: anon read profile_identity (% rows)', observed;
  END IF;

  -- TEST 2: authenticated non-owner cannot read someone else's profile_identity
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', other_id, 'role', 'authenticated')::text, true);
  SELECT count(*) INTO observed FROM public.profile_identity WHERE profile_id = owner_id;
  IF observed > 0 THEN
    RAISE EXCEPTION 'RLS FAILURE: non-owner read profile_identity (% rows)', observed;
  END IF;

  -- TEST 3: owner can read own profile_identity
  PERFORM set_config('request.jwt.claims', json_build_object('sub', owner_id, 'role', 'authenticated')::text, true);
  SELECT count(*) INTO observed FROM public.profile_identity WHERE profile_id = owner_id;
  IF observed != 1 THEN
    RAISE EXCEPTION 'RLS FAILURE: owner cannot read own profile_identity (% rows)', observed;
  END IF;

  -- TEST 4: ledger entries are invisible to authenticated clients
  SELECT count(*) INTO observed FROM public.ledger_entries;
  IF observed > 0 THEN
    RAISE EXCEPTION 'RLS FAILURE: authenticated read ledger_entries (% rows)', observed;
  END IF;

  -- TEST 5: moderation cases are invisible to all client roles
  SELECT count(*) INTO observed FROM public.moderation_cases;
  IF observed > 0 THEN
    RAISE EXCEPTION 'RLS FAILURE: authenticated read moderation_cases (% rows)', observed;
  END IF;

  -- TEST 6: feature flags are publicly readable
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claims', '', true);
  SELECT count(*) INTO observed FROM public.feature_flags;
  IF observed = 0 THEN
    RAISE EXCEPTION 'RLS FAILURE: anon cannot read feature_flags';
  END IF;

  -- TEST 7: a client cannot insert community membership for another user
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', other_id, 'role', 'authenticated')::text, true);
  BEGIN
    INSERT INTO public.community_members (community_id, profile_id, membership_status)
    VALUES (community_id, owner_id, 'active');
    RAISE EXCEPTION 'RLS FAILURE: client inserted membership for another user';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
    WHEN unique_violation THEN RAISE EXCEPTION 'RLS FAILURE: unexpected pre-existing membership';
  END;

  -- TEST 8: analytics events insertable only for self
  BEGIN
    INSERT INTO public.analytics_events (event_name, user_id, properties)
    VALUES ('post_created', owner_id, '{}');
    RAISE EXCEPTION 'RLS FAILURE: client inserted analytics event for another user';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;

  -- TEST 9: audit logs are append-only for clients (deny-all policy)
  BEGIN
    INSERT INTO public.audit_logs (actor_id, action)
    VALUES (other_id, 'rls_probe');
    RAISE EXCEPTION 'RLS FAILURE: client inserted audit log';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;

  -- TEST 10: public communities are visible to authenticated non-members
  SELECT count(*) INTO observed FROM public.communities WHERE slug = 'rls-test-community';
  IF observed != 1 THEN
    RAISE EXCEPTION 'RLS FAILURE: public community invisible to authenticated user (% rows)', observed;
  END IF;

  RAISE NOTICE 'RLS suite: all assertions passed';
END $$;

ROLLBACK;
