-- Migration 00028: Monetization Engine, Seller Subscription Plans & Affiliate Commerce
-- Description: Configurable seller plans, business subscriptions, dynamic monetization rules, creator affiliate referrals, and AI business knowledge base.

-- 1. Configurable Seller Plans
CREATE TABLE IF NOT EXISTS public.seller_plans (
    id VARCHAR(40) PRIMARY KEY, -- 'business_free', 'seller_pro', 'business_plus', 'enterprise'
    name VARCHAR(80) NOT NULL,
    description TEXT,
    price_minor INTEGER NOT NULL DEFAULT 0, -- integer minor units (e.g. 1499 = $14.99)
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    billing_period VARCHAR(20) NOT NULL DEFAULT 'monthly', -- 'monthly', 'annual'
    listing_limit INTEGER, -- NULL = unlimited
    commission_rate_bps INTEGER NOT NULL DEFAULT 0, -- 0 bps on eligible plans
    ai_tools_enabled BOOLEAN NOT NULL DEFAULT false,
    crm_enabled BOOLEAN NOT NULL DEFAULT false,
    staff_limit INTEGER NOT NULL DEFAULT 1,
    priority_support BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Seed Default Seller Plans (Configurable, never hard-coded in business logic)
INSERT INTO public.seller_plans (id, name, description, price_minor, currency, listing_limit, commission_rate_bps, ai_tools_enabled, crm_enabled, staff_limit, priority_support)
VALUES
    ('business_free', 'Business Free', 'Basic profile, community discovery, messaging, and up to 5 listings.', 0, 'USD', 5, 0, false, false, 1, false),
    ('seller_pro', 'Seller Pro', 'Full digital storefront, unlimited listings, unified checkout, orders, analytics, and AI business tools.', 1499, 'USD', NULL, 0, true, false, 2, false),
    ('business_plus', 'Business+', 'Advanced analytics, CRM, AI sales assistant, multi-staff access, priority search placement.', 3999, 'USD', NULL, 0, true, true, 5, true),
    ('enterprise', 'Enterprise', 'Custom multi-location, dedicated API, custom integrations, enterprise advertising, and 24/7 dedicated support.', 0, 'USD', NULL, 0, true, true, 50, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_minor = EXCLUDED.price_minor,
    ai_tools_enabled = EXCLUDED.ai_tools_enabled,
    crm_enabled = EXCLUDED.crm_enabled;

-- 2. Business Subscriptions
CREATE TABLE IF NOT EXISTS public.business_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    plan_id VARCHAR(40) REFERENCES public.seller_plans(id) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('active', 'past_due', 'cancelled', 'trialing')) DEFAULT 'active' NOT NULL,
    current_period_start TIMESTAMPTZ DEFAULT now() NOT NULL,
    current_period_end TIMESTAMPTZ DEFAULT (now() + interval '30 days') NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT false NOT NULL,
    payment_intent_id UUID REFERENCES public.payment_intents(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (business_id)
);

-- 3. Configurable Monetization Rules Engine
CREATE TABLE IF NOT EXISTS public.monetization_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    rule_type VARCHAR(40) NOT NULL, -- 'subscription', 'listing', 'advertising', 'boost', 'event', 'creator', 'payment', 'payout', 'affiliate'
    country_iso VARCHAR(3) DEFAULT '*' NOT NULL,
    currency VARCHAR(3) DEFAULT '*' NOT NULL,
    product_type VARCHAR(40) DEFAULT '*' NOT NULL,
    seller_plan_id VARCHAR(40) REFERENCES public.seller_plans(id) ON DELETE SET NULL,
    percentage_bps INTEGER DEFAULT 0 NOT NULL,
    fixed_amount_minor INTEGER DEFAULT 0 NOT NULL,
    min_amount_minor INTEGER DEFAULT 0 NOT NULL,
    max_amount_minor INTEGER,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Seed default monetization rules
INSERT INTO public.monetization_rules (name, rule_type, percentage_bps, fixed_amount_minor)
VALUES
    ('Default Creator Tips Platform Fee', 'creator', 0, 0), -- 0% platform fee on creator tips for promotional launch
    ('Default Marketplace Order Processing Fee', 'payment', 290, 30), -- 2.9% + 30 cents standard payment processing pass-through
    ('Default Creator Affiliate Commission Standard', 'affiliate', 1000, 0) -- 10% standard creator affiliate referral baseline
ON CONFLICT DO NOTHING;

-- 4. Creator Affiliate Commerce & Product Referrals
CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
    referral_code VARCHAR(40) UNIQUE NOT NULL,
    commission_bps INTEGER DEFAULT 1000 NOT NULL, -- 10%
    clicks_count INTEGER DEFAULT 0 NOT NULL,
    orders_count INTEGER DEFAULT 0 NOT NULL,
    total_commission_minor INTEGER DEFAULT 0 NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. Business AI Knowledge Base & Policy Grounding ("Ask This Business")
CREATE TABLE IF NOT EXISTS public.business_ai_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    is_enabled BOOLEAN DEFAULT true NOT NULL,
    greeting_message TEXT,
    delivery_policies TEXT,
    return_policies TEXT,
    special_hours TEXT,
    frequently_asked_questions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (business_id)
);

-- Enable RLS on All Tables
ALTER TABLE public.seller_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monetization_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_ai_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Seller Plans: Public read, admin write
CREATE POLICY "Public read seller plans" ON public.seller_plans FOR SELECT USING (true);
CREATE POLICY "Admin manage seller plans" ON public.seller_plans FOR ALL USING (
    EXISTS (SELECT 1 FROM public.accounts WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'superadmin', 'management'))
);

-- Business Subscriptions: Owners can read/manage their business subscriptions, Admins can view all
CREATE POLICY "Business owners read subscription" ON public.business_subscriptions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = business_subscriptions.business_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.accounts WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'superadmin', 'management', 'finance'))
);
CREATE POLICY "Business owners insert subscription" ON public.business_subscriptions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = business_subscriptions.business_id AND owner_id = auth.uid())
);
CREATE POLICY "Business owners update subscription" ON public.business_subscriptions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = business_subscriptions.business_id AND owner_id = auth.uid())
);

-- Monetization Rules: Public read, Admin manage
CREATE POLICY "Public read active monetization rules" ON public.monetization_rules FOR SELECT USING (is_active = true);
CREATE POLICY "Admin manage monetization rules" ON public.monetization_rules FOR ALL USING (
    EXISTS (SELECT 1 FROM public.accounts WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'superadmin', 'management', 'finance'))
);

-- Affiliate Referrals: Public read, Creator manage
CREATE POLICY "Public read affiliate referrals" ON public.affiliate_referrals FOR SELECT USING (true);
CREATE POLICY "Creator manage own affiliate referrals" ON public.affiliate_referrals FOR ALL USING (creator_id = auth.uid());

-- Business AI Configs: Public read (for customer queries), Owner manage
CREATE POLICY "Public read business AI configs" ON public.business_ai_configs FOR SELECT USING (true);
CREATE POLICY "Business owners manage AI configs" ON public.business_ai_configs FOR ALL USING (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = business_ai_configs.business_id AND owner_id = auth.uid())
);
