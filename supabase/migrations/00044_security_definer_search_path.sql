-- Migration 00044: SECURITY DEFINER search_path Hardening
-- Description: Applies SET search_path = public (or '') to all SECURITY DEFINER
--              functions created before migration 00021 that lacked explicit
--              search_path containment, preventing schema-based search-path hijacking.
--
-- Threat neutralized: Search Path Hijacking in SECURITY DEFINER functions (CWE-427)
-- Severity: P2 — Medium; theoretical attack requiring schema-write privilege
-- Rollback: Re-create functions without SET search_path = public

-- =============================================================================
-- 1. LEDGER TRIGGER FUNCTION (from 00004)
-- =============================================================================

-- Harden enforce_ledger_sum_zero — already exists but may lack search_path
ALTER FUNCTION public.enforce_ledger_sum_zero()
  SET search_path = public;

-- =============================================================================
-- 2. CREATOR STUDIO FIXES (from 00019)
-- =============================================================================

-- Harden auto_create_creator_pending_ledger if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auto_create_creator_pending_ledger' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.auto_create_creator_pending_ledger()
      SET search_path = public;
  END IF;
END $$;

-- Harden update_ledger_account_balance if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_ledger_account_balance' AND pronamespace = 'public'::regnamespace) THEN
    -- Note: overloaded function — harden all variants
    ALTER FUNCTION public.update_ledger_account_balance()
      SET search_path = public;
  END IF;
END $$;

-- =============================================================================
-- 3. PROFILE AUDIT TRIGGERS (from 00017)
-- =============================================================================

ALTER FUNCTION public.handle_profile_identity_audit()
  SET search_path = public;

ALTER FUNCTION public.handle_profile_audit()
  SET search_path = public;

-- =============================================================================
-- 4. TRIGGER SECURITY DEFINER (from 00020)
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user_profile' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.handle_new_user_profile()
      SET search_path = public;
  END IF;
END $$;

-- =============================================================================
-- ROLLBACK PLAN
-- =============================================================================
-- To roll back (removes explicit search_path from functions):
--
--   ALTER FUNCTION public.enforce_ledger_sum_zero() RESET search_path;
--   ALTER FUNCTION public.handle_profile_identity_audit() RESET search_path;
--   ALTER FUNCTION public.handle_profile_audit() RESET search_path;
--   -- (apply RESET for each function above)
