-- Migration 00036: TUKUBI Hybrid Monetization, Commissions & Revenue Architecture
-- Description: Configurable tiers, versioned commission rules, immutable transaction snapshots,
-- commercial subscriptions, dispute tracking, audit logs, and provider-neutral cleanup.

-- 1. Monetization Tier Configurations
CREATE TABLE IF NOT EXISTS public.monetization_tier_configs (
    id VARCHAR(60) PRIMARY KEY, -- e.g. 'user_free', 'creator_free', 'creator_plus', 'business_free', 'seller_pro'
    account_category VARCHAR(20) NOT NULL CHECK (account_category IN ('user', 'creator', 'merchant', 'business')),
    tier_code VARCHAR(40) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_minor_monthly INTEGER NOT NULL DEFAULT 0,
    price_minor_annual INTEGER NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    default_commission_rate_bps INTEGER NOT NULL DEFAULT 0,
    default_fixed_fee_minor INTEGER NOT NULL DEFAULT 0,
    entitlements JSONB NOT NULL DEFAULT '[]'::jsonb,
    listing_limit INTEGER, -- NULL = unlimited
    is_active BOOLEAN NOT NULL DEFAULT true,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed Canonical Monetization Tiers
INSERT INTO public.monetization_tier_configs 
(id, account_category, tier_code, name, description, price_minor_monthly, price_minor_annual, currency, default_commission_rate_bps, default_fixed_fee_minor, entitlements, listing_limit, is_active)
VALUES
    -- User Tiers
    ('user_free', 'user', 'free', 'Community Member', 'Standard browsing, social interactions, community access, purchasing.', 0, 0, 'USD', 0, 0, '["social_access", "browse_marketplace", "purchase_goods", "community_member"]'::jsonb, NULL, true),
    ('user_premium', 'user', 'premium', 'TUKUBI Patron', 'Verified patron badge, exclusive community access, priority customer support.', 499, 4990, 'USD', 0, 0, '["social_access", "browse_marketplace", "purchase_goods", "community_member", "patron_badge", "priority_support"]'::jsonb, NULL, true),

    -- Creator Tiers (Incentive model: paid creators receive lower platform commissions)
    ('creator_free', 'creator', 'free', 'Creator Starter', 'Start publishing, accept tips, standard live broadcasting.', 0, 0, 'USD', 1000, 0, '["standard_uploads", "fan_tips", "live_gifts", "basic_analytics"]'::jsonb, NULL, true),
    ('creator_plus', 'creator', 'plus', 'Creator Plus', 'Reduced platform fee (5%), custom live gifts, HD broadcast, podcast hosting.', 999, 9990, 'USD', 500, 0, '["standard_uploads", "fan_tips", "live_gifts", "basic_analytics", "reduced_commission", "custom_live_gifts", "hd_broadcast", "podcast_hosting", "fan_memberships"]'::jsonb, NULL, true),
    ('creator_pro', 'creator', 'pro', 'Creator Pro', 'Zero platform fee on tips/memberships, dedicated partner manager, priority discovery.', 2499, 24990, 'USD', 0, 0, '["standard_uploads", "fan_tips", "live_gifts", "basic_analytics", "reduced_commission", "zero_tip_commission", "custom_live_gifts", "hd_broadcast", "podcast_hosting", "fan_memberships", "priority_discovery", "dedicated_manager"]'::jsonb, NULL, true),

    -- Merchant Tiers (Incentive model: higher tier = lower commission + more listings & tools)
    ('merchant_free', 'merchant', 'free', 'Merchant Starter', 'Up to 5 listings, basic storefront, standard marketplace commission.', 0, 0, 'USD', 800, 30, '["basic_storefront", "orders_management", "basic_shipping"]'::jsonb, 5, true),
    ('seller_pro', 'merchant', 'pro', 'Seller Pro', 'Unlimited listings, digital storefront, 0% platform sales commission, AI business tools.', 1499, 14990, 'USD', 0, 0, '["basic_storefront", "orders_management", "basic_shipping", "unlimited_listings", "lower_commission", "ai_tools", "analytics_dashboard"]'::jsonb, NULL, true),
    ('business_plus', 'business', 'business_plus', 'Business+', 'Advanced CRM, AI sales assistant, 5 staff seats, priority search placement.', 3999, 39990, 'USD', 0, 0, '["basic_storefront", "orders_management", "basic_shipping", "unlimited_listings", "lower_commission", "ai_tools", "analytics_dashboard", "advanced_crm", "ai_sales_assistant", "multi_staff", "priority_search"]'::jsonb, NULL, true),
    ('enterprise', 'business', 'enterprise', 'Enterprise Partner', 'Custom multi-location, dedicated API, custom integrations, 24/7 dedicated support.', 0, 0, 'USD', 0, 0, '["basic_storefront", "orders_management", "basic_shipping", "unlimited_listings", "lower_commission", "ai_tools", "analytics_dashboard", "advanced_crm", "ai_sales_assistant", "multi_staff", "priority_search", "custom_api", "enterprise_support"]'::jsonb, NULL, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_minor_monthly = EXCLUDED.price_minor_monthly,
    price_minor_annual = EXCLUDED.price_minor_annual,
    default_commission_rate_bps = EXCLUDED.default_commission_rate_bps,
    default_fixed_fee_minor = EXCLUDED.default_fixed_fee_minor,
    entitlements = EXCLUDED.entitlements,
    listing_limit = EXCLUDED.listing_limit;

-- 2. Versioned Commission Rules Engine
CREATE TABLE IF NOT EXISTS public.commission_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version INTEGER NOT NULL DEFAULT 1,
    rule_name VARCHAR(120) NOT NULL,
    account_category VARCHAR(20) NOT NULL DEFAULT '*', -- 'user', 'creator', 'merchant', 'business', '*'
    tier_code VARCHAR(40) NOT NULL DEFAULT '*', -- 'free', 'starter', 'pro', 'premium', '*'
    product_type VARCHAR(40) NOT NULL DEFAULT '*', -- 'physical', 'digital', 'service', 'event_ticket', 'creator_tip', 'live_gift', 'subscription', '*'
    country_iso VARCHAR(3) NOT NULL DEFAULT '*',
    currency VARCHAR(3) NOT NULL DEFAULT '*',
    percentage_bps INTEGER NOT NULL DEFAULT 0,
    fixed_fee_minor INTEGER NOT NULL DEFAULT 0,
    min_commission_minor INTEGER NOT NULL DEFAULT 0,
    max_commission_minor INTEGER,
    promotional_rate_bps INTEGER,
    promotional_fixed_minor INTEGER,
    promo_starts_at TIMESTAMPTZ,
    promo_ends_at TIMESTAMPTZ,
    is_exempt BOOLEAN NOT NULL DEFAULT false,
    effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
    effective_to TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id),
    change_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed Initial Versioned Commission Rules
INSERT INTO public.commission_rules (rule_name, account_category, tier_code, product_type, percentage_bps, fixed_fee_minor, change_reason)
VALUES
    ('Free Merchant Marketplace Standard', 'merchant', 'free', 'physical', 800, 30, 'Initial base marketplace rule for free merchants: 8% + $0.30'),
    ('Seller Pro Marketplace Exemption', 'merchant', 'pro', 'physical', 0, 0, 'Seller Pro subscription benefit: 0% platform sales commission'),
    ('Creator Free Fan Tips Platform Fee', 'creator', 'free', 'creator_tip', 1000, 0, 'Creator Starter fee: 10% platform fee on fan tips'),
    ('Creator Plus Fan Tips Reduced Fee', 'creator', 'plus', 'creator_tip', 500, 0, 'Creator Plus fee: 5% reduced platform fee on fan tips'),
    ('Creator Pro Fan Tips Exemption', 'creator', 'pro', 'creator_tip', 0, 0, 'Creator Pro benefit: 0% platform fee on fan tips'),
    ('Standard Event Ticket Processing', '*', '*', 'event_ticket', 500, 50, 'Standard ticket processing fee: 5% + $0.50'),
    ('Digital Product Sales Standard', '*', '*', 'digital', 1000, 0, 'Digital goods marketplace baseline commission: 10%')
ON CONFLICT DO NOTHING;

-- 3. Immutable Commission Snapshots (Never recalculated retrospectively)
CREATE TABLE IF NOT EXISTS public.commission_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id TEXT NOT NULL UNIQUE, -- e.g. order ID or payment intent ID
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    payment_intent_id UUID REFERENCES public.payment_intents(id) ON DELETE SET NULL,
    payer_id UUID REFERENCES public.profiles(id) NOT NULL,
    seller_id UUID REFERENCES public.profiles(id) NOT NULL,
    account_category VARCHAR(20) NOT NULL,
    seller_tier VARCHAR(40) NOT NULL,
    product_type VARCHAR(40) NOT NULL,
    gross_amount_minor INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    commission_rule_id UUID REFERENCES public.commission_rules(id) ON DELETE SET NULL,
    commission_rule_version INTEGER NOT NULL DEFAULT 1,
    commission_rate_bps INTEGER NOT NULL,
    commission_amount_minor INTEGER NOT NULL,
    fixed_platform_fee_minor INTEGER NOT NULL DEFAULT 0,
    payment_processing_fee_minor INTEGER NOT NULL DEFAULT 0,
    tax_amount_minor INTEGER NOT NULL DEFAULT 0,
    seller_net_minor INTEGER NOT NULL,
    tukubi_revenue_minor INTEGER NOT NULL,
    refunded_amount_minor INTEGER NOT NULL DEFAULT 0,
    commission_refunded_minor INTEGER NOT NULL DEFAULT 0,
    is_settled BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Universal Commercial Subscriptions Engine
CREATE TABLE IF NOT EXISTS public.commercial_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscriber_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('user', 'creator', 'merchant', 'business')),
    target_id UUID NOT NULL,
    tier_id VARCHAR(60) REFERENCES public.monetization_tier_configs(id) NOT NULL,
    billing_interval VARCHAR(20) NOT NULL CHECK (billing_interval IN ('monthly', 'annual')),
    price_minor INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'trialing', 'grace_period', 'expired')) DEFAULT 'active',
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    payment_provider VARCHAR(40) NOT NULL DEFAULT 'paypal',
    provider_subscription_id TEXT,
    last_payment_intent_id UUID REFERENCES public.payment_intents(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (target_type, target_id)
);

-- 5. Financial Disputes & Chargeback Tracking
CREATE TABLE IF NOT EXISTS public.financial_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    payment_intent_id UUID REFERENCES public.payment_intents(id) ON DELETE SET NULL,
    buyer_id UUID REFERENCES public.profiles(id) NOT NULL,
    seller_id UUID REFERENCES public.profiles(id) NOT NULL,
    provider_id VARCHAR(40) NOT NULL,
    provider_dispute_id TEXT NOT NULL,
    original_amount_minor INTEGER NOT NULL,
    disputed_amount_minor INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(30) NOT NULL CHECK (status IN ('opened', 'under_review', 'resolved_won', 'resolved_lost', 'closed')) DEFAULT 'opened',
    reason TEXT,
    evidence JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Commercial Rule Audit Trail
CREATE TABLE IF NOT EXISTS public.commercial_rule_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.profiles(id) NOT NULL,
    action VARCHAR(60) NOT NULL,
    entity_type VARCHAR(40) NOT NULL,
    entity_id TEXT NOT NULL,
    previous_value JSONB,
    new_value JSONB NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Provider Registry Cleanup: Purge obsolete SpotPay row if present
DELETE FROM public.payment_providers WHERE id = 'spotpay';

-- 8. Indexing for High-Performance Queries
CREATE INDEX IF NOT EXISTS idx_monetization_tiers_cat ON public.monetization_tier_configs(account_category, is_active);
CREATE INDEX IF NOT EXISTS idx_commission_rules_lookup ON public.commission_rules(account_category, tier_code, product_type, effective_from);
CREATE INDEX IF NOT EXISTS idx_commission_snapshots_seller ON public.commission_snapshots(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commission_snapshots_payer ON public.commission_snapshots(payer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commission_snapshots_created ON public.commission_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commercial_subs_target ON public.commercial_subscriptions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_commercial_subs_status ON public.commercial_subscriptions(status, current_period_end);
CREATE INDEX IF NOT EXISTS idx_financial_disputes_order ON public.financial_disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_financial_disputes_provider ON public.financial_disputes(provider_id, provider_dispute_id);

-- 9. Row Level Security (RLS)
ALTER TABLE public.monetization_tier_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_rule_audit_logs ENABLE ROW LEVEL SECURITY;

-- 9.1 Monetization Tiers: Public Read, Admin Write
CREATE POLICY "Public read monetization tiers" ON public.monetization_tier_configs
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admin manage monetization tiers" ON public.monetization_tier_configs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.accounts WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'superadmin', 'management', 'finance'))
    );

-- 9.2 Commission Rules: Public Read active rules, Admin Manage
CREATE POLICY "Public read active commission rules" ON public.commission_rules
    FOR SELECT USING (effective_to IS NULL OR effective_to > now());

CREATE POLICY "Admin manage commission rules" ON public.commission_rules
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.accounts WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'superadmin', 'management', 'finance'))
    );

-- 9.3 Commission Snapshots: Participants Read, Service-Role Mutate
CREATE POLICY "Participants read commission snapshots" ON public.commission_snapshots
    FOR SELECT USING (
        auth.uid() = seller_id OR auth.uid() = payer_id OR
        EXISTS (SELECT 1 FROM public.accounts WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'superadmin', 'management', 'finance'))
    );

CREATE POLICY "Deny client commission snapshots mutation" ON public.commission_snapshots
    FOR INSERT WITH CHECK (false);

-- 9.4 Commercial Subscriptions: Subscriber Read/Update, Admin View All
CREATE POLICY "Subscriber read subscription" ON public.commercial_subscriptions
    FOR SELECT USING (
        auth.uid() = subscriber_id OR
        EXISTS (SELECT 1 FROM public.accounts WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'superadmin', 'management', 'finance'))
    );

CREATE POLICY "Subscriber manage subscription" ON public.commercial_subscriptions
    FOR ALL USING (auth.uid() = subscriber_id);

-- 9.5 Financial Disputes: Participants Read, Service-Role Mutate
CREATE POLICY "Participants read financial disputes" ON public.financial_disputes
    FOR SELECT USING (
        auth.uid() = buyer_id OR auth.uid() = seller_id OR
        EXISTS (SELECT 1 FROM public.accounts WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'superadmin', 'management', 'finance'))
    );

-- 9.6 Commercial Rule Audit Logs: Admin Read Only, Service-Role Write
CREATE POLICY "Admin read commercial audit logs" ON public.commercial_rule_audit_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.accounts WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'superadmin', 'management', 'finance'))
    );

CREATE POLICY "Deny client write commercial audit logs" ON public.commercial_rule_audit_logs
    FOR INSERT WITH CHECK (false);
