-- =============================================================================
-- Migration 00037: Purge Obsolete Payment Names & Schema Standardization
--
-- Objective: Ensure complete database eradication of obsolete payment names
-- across notification preferences, feature flags, psp capabilities, and providers.
-- =============================================================================

DO $$
BEGIN
    -- 1. Ensure notification_preferences has payments_enabled
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'notification_preferences'
          AND column_name = 'payments_enabled'
    ) THEN
        ALTER TABLE public.notification_preferences
        ADD COLUMN IF NOT EXISTS payments_enabled BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 2. Purge obsolete non-standard feature flags
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'feature_flags' AND column_name = 'key'
    ) THEN
        DELETE FROM public.feature_flags WHERE key NOT IN ('caribai_translation', 'crypto_payments', 'moments_cinema', 'universal_search');
    END IF;
END $$;

-- 3. Retain only authorized payment providers in payment_providers and psp_capabilities
DELETE FROM public.payment_providers WHERE id NOT IN ('stripe', 'paypal', 'apple_pay', 'google_pay');

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'psp_capabilities'
    ) THEN
        DELETE FROM public.psp_capabilities WHERE provider NOT IN ('stripe', 'paypal', 'apple_pay', 'google_pay');
    END IF;
END $$;
