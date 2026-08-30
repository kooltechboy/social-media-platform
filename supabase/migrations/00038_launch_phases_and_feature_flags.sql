-- =============================================================================
-- Migration 00038: TUKUBI Phased Production Launch, Feature Flags & Commerce Gates
--
-- Objective:
-- 1. Align feature_flags schema (support 'enabled' and 'is_enabled' dual compatibility).
-- 2. Seed canonical phased launch configuration flags for Creator Free Access (through Oct 31, 2026),
--    Marketplace Commerce Gating (Sept 30, 2026), and Provider-Agnostic Payments.
-- 3. Enforce Row Level Security (RLS) and administrative write privileges.
-- =============================================================================

DO $$
BEGIN
    -- 1. Add 'enabled' column to feature_flags if not present to support admin & web app queries
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'feature_flags'
          AND column_name = 'enabled'
    ) THEN
        ALTER TABLE public.feature_flags ADD COLUMN enabled BOOLEAN DEFAULT false NOT NULL;
    END IF;

    -- 2. Synchronize enabled from is_enabled if is_enabled exists
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'feature_flags'
          AND column_name = 'is_enabled'
    ) THEN
        UPDATE public.feature_flags SET enabled = is_enabled WHERE enabled = false AND is_enabled = true;
        UPDATE public.feature_flags SET is_enabled = enabled WHERE is_enabled = false AND enabled = true;
    END IF;
END $$;

-- 3. Trigger to keep 'enabled' and 'is_enabled' in sync
CREATE OR REPLACE FUNCTION public.sync_feature_flag_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.enabled IS DISTINCT FROM OLD.enabled THEN
        NEW.is_enabled := NEW.enabled;
    ELSIF NEW.is_enabled IS DISTINCT FROM OLD.is_enabled THEN
        NEW.enabled := NEW.is_enabled;
    END IF;
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_feature_flag_status ON public.feature_flags;
CREATE TRIGGER trg_sync_feature_flag_status
BEFORE UPDATE ON public.feature_flags
FOR EACH ROW
EXECUTE FUNCTION public.sync_feature_flag_status();

-- 4. Seed Canonical Launch Flags
INSERT INTO public.feature_flags (key, description, enabled, is_enabled, updated_at) VALUES
    ('CREATOR_FREE_ACCESS_ENABLED', 'All Creator Hub, Podcasting and Studio features 100% free through Oct 31, 2026', true, true, now()),
    ('CREATOR_FREE_ACCESS_START_DATE', 'Creator free access promotion activation date (2026-08-30)', true, true, now()),
    ('CREATOR_FREE_ACCESS_END_DATE', 'Creator free access promotion expiry date (2026-10-31)', true, true, now()),
    ('CREATOR_PAID_TIERS_ENABLED', 'Paid creator subscription plans (activated Nov 1, 2026)', false, false, now()),
    ('CREATOR_PAID_TIERS_START_DATE', 'Paid creator subscription tier activation date (2026-11-01)', true, true, now()),
    ('MARKETPLACE_ENABLED', 'Marketplace storefront, category discovery and catalog browsing', true, true, now()),
    ('MARKETPLACE_COMMERCE_ENABLED', 'Buyer and seller checkout transactions (launching Sept 30, 2026)', false, false, now()),
    ('MARKETPLACE_COMMERCE_START_DATE', 'Marketplace transactional commerce launch date (2026-09-30)', true, true, now()),
    ('PAYMENTS_ENABLED', 'Platform payments and financial orchestration engine', true, true, now()),
    ('PAYPAL_ENABLED', 'PayPal primary payment gateway and wallet approval integration', true, true, now()),
    ('OTHER_PAYMENT_PROVIDERS_ENABLED', 'Secondary Caribbean localized payment processors (pending certification)', false, false, now()),
    ('MAINTENANCE_MODE', 'Global emergency platform maintenance kill switch', false, false, now()),
    ('CURRENT_LAUNCH_PHASE', 'Current active launch phase: PHASE_1_CREATOR_FREE_MERCHANT_CATALOG', true, true, now())
ON CONFLICT (key) DO UPDATE SET
    description = EXCLUDED.description,
    enabled = EXCLUDED.enabled,
    is_enabled = EXCLUDED.is_enabled,
    updated_at = now();

-- 5. Row Level Security verification
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'feature_flags'
          AND policyname = 'Public read feature flags'
    ) THEN
        CREATE POLICY "Public read feature flags"
            ON public.feature_flags FOR SELECT
            USING (true);
    END IF;
END $$;
