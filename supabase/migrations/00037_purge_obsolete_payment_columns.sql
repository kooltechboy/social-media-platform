-- =============================================================================
-- Migration 00037: Purge Obsolete Payment Names & Schema Standardization
--
-- Objective: Ensure complete database eradication of obsolete payment names
-- across notification preferences, feature flags, psp capabilities, and providers.
-- =============================================================================

DO $$
BEGIN
    -- 1. Rename notification_preferences.spotpay_enabled to payments_enabled if present
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'notification_preferences'
          AND column_name = 'spotpay_enabled'
    ) THEN
        ALTER TABLE public.notification_preferences
        RENAME COLUMN spotpay_enabled TO payments_enabled;
    END IF;
END $$;

-- 2. Purge obsolete feature flags
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'feature_flags' AND column_name = 'key'
    ) THEN
        DELETE FROM public.feature_flags WHERE key = 'spotpay_enabled';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'feature_flags' AND column_name = 'id'
    ) THEN
        DELETE FROM public.feature_flags WHERE id = 'spotpay_enabled';
    END IF;
END $$;

-- 3. Ensure no obsolete rows exist in payment_providers or psp_capabilities
DELETE FROM public.payment_providers WHERE id = 'spotpay';

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'psp_capabilities'
    ) THEN
        DELETE FROM public.psp_capabilities WHERE provider = 'spotpay';
    END IF;
END $$;
