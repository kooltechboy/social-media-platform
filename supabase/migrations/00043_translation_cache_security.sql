-- Migration 00043: Translation Cache Poisoning Remediation
-- Description: Removes the overly-permissive authenticated user INSERT policy on
--              content_translations_cache, which allowed any authenticated user
--              to inject arbitrary translations (cache poisoning attack).
--
-- Threat neutralized: Translation Cache Poisoning (CWE-349, Content Injection)
-- Severity: P1 — High, must fix before production launch
-- Rollback: See bottom of file.

-- =============================================================================
-- 1. REMOVE VULNERABLE AUTHENTICATED-USER INSERT POLICY
-- =============================================================================

-- This policy allowed ANY authenticated user to inject poisoned translations
-- into the global cache, serving incorrect/offensive content to all users
-- in a targeted language.
DROP POLICY IF EXISTS "Authenticated users can insert cached translations" ON public.content_translations_cache;

-- =============================================================================
-- 2. ENSURE SERVICE-ROLE POLICY REMAINS INTACT (already exists from 00040)
-- =============================================================================
-- The existing "Service role can manage translations cache" policy allows
-- service_role full CRUD access, which is correct for the CaribAI backend.
-- Only service_role (never client JWT) writes translations to the cache.

-- =============================================================================
-- 3. AUDIT LOG — record this security change
-- =============================================================================
-- No explicit audit log entry needed; migration versioning is the audit trail.

-- =============================================================================
-- ROLLBACK PLAN
-- =============================================================================
-- To roll back this migration (WARNING: re-introduces the vulnerability):
--
--   CREATE POLICY "Authenticated users can insert cached translations"
--   ON public.content_translations_cache
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (true);
