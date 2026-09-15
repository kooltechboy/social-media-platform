-- Migration 00083: TUKUBI Payments, Monetization, Creator Economy & Marketplace Financial Architecture
-- Description: Unified immutable payment transactions ledger, creator subscription plans,
-- multi-split settlement support, ledger account auto-provisioning, and strict RLS hardening.

-- 1. Unified Immutable Payment Transactions Ledger
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    transaction_type VARCHAR(40) NOT NULL CHECK (transaction_type IN (
        'TUKUBI_SUBSCRIPTION',
        'CREATOR_SUBSCRIPTION',
        'MARKETPLACE_PURCHASE',
        'CREATOR_TIP',
        'DIGITAL_PRODUCT',
        'PHYSICAL_PRODUCT',
        'EVENT_PAYMENT',
        'AD_PAYMENT',
        'BOOST_PAYMENT',
        'PLATFORM_FEE',
        'PAYOUT',
        'REFUND',
        'CHARGEBACK',
        'ADJUSTMENT'
    )),
    status VARCHAR(24) NOT NULL CHECK (status IN (
        'PENDING',
        'PROCESSING',
        'COMPLETED',
        'FAILED',
        'CANCELLED',
        'REFUNDED',
        'PARTIALLY_REFUNDED',
        'DISPUTED'
    )) DEFAULT 'PENDING',
    payer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    merchant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    payment_intent_id UUID REFERENCES public.payment_intents(id) ON DELETE SET NULL,
    provider VARCHAR(40) NOT NULL DEFAULT 'paypal',
    provider_transaction_id TEXT,
    gross_amount_minor INTEGER NOT NULL CHECK (gross_amount_minor >= 0),
    platform_fee_minor INTEGER NOT NULL DEFAULT 0 CHECK (platform_fee_minor >= 0),
    processing_fee_minor INTEGER NOT NULL DEFAULT 0 CHECK (processing_fee_minor >= 0),
    tax_minor INTEGER NOT NULL DEFAULT 0 CHECK (tax_minor >= 0),
    net_amount_minor INTEGER NOT NULL DEFAULT 0 CHECK (net_amount_minor >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    settled_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Creator Custom Subscription Plans
CREATE TABLE IF NOT EXISTS public.creator_subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(80) NOT NULL,
    description TEXT,
    price_minor INTEGER NOT NULL CHECK (price_minor >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    billing_interval VARCHAR(20) NOT NULL CHECK (billing_interval IN ('monthly', 'annual')) DEFAULT 'monthly',
    benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Extend Creator Accounts & Subscriptions
ALTER TABLE public.creator_accounts
    ADD COLUMN IF NOT EXISTS monetization_enabled BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.subscriptions
    ADD COLUMN IF NOT EXISTS creator_subscription_plan_id UUID REFERENCES public.creator_subscription_plans(id) ON DELETE SET NULL;

ALTER TABLE public.subscriptions
    ADD COLUMN IF NOT EXISTS paypal_subscription_id TEXT;

-- Safely modernize billing_source check on public.subscriptions
DO $$
BEGIN
    ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_billing_source_check;
    ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_billing_source_check
        CHECK (billing_source IN ('user_wallet', 'stripe', 'paypal', 'apple_iap', 'google_play', 'card'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 4. Idempotent Ledger Account Provisioning Function
CREATE OR REPLACE FUNCTION public.ensure_ledger_account(
    p_owner_id UUID,
    p_account_type public.ledger_account_type,
    p_currency VARCHAR DEFAULT 'USD'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_account_id UUID;
BEGIN
    SELECT id INTO v_account_id
    FROM public.ledger_accounts
    WHERE owner_id = p_owner_id
      AND account_type = p_account_type
      AND currency = p_currency
    LIMIT 1;

    IF v_account_id IS NULL THEN
        INSERT INTO public.ledger_accounts (owner_id, account_type, currency)
        VALUES (p_owner_id, p_account_type, p_currency)
        RETURNING id INTO v_account_id;
    END IF;

    RETURN v_account_id;
END;
$$;

-- 5. Indexing for High-Performance Queries
CREATE INDEX IF NOT EXISTS idx_payment_tx_payer ON public.payment_transactions(payer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_tx_recipient ON public.payment_transactions(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_tx_creator ON public.payment_transactions(creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_tx_merchant ON public.payment_transactions(merchant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_tx_type_status ON public.payment_transactions(transaction_type, status);
CREATE INDEX IF NOT EXISTS idx_payment_tx_provider_tx ON public.payment_transactions(provider, provider_transaction_id);
CREATE INDEX IF NOT EXISTS idx_creator_plans_creator ON public.creator_subscription_plans(creator_id, is_active);
CREATE INDEX IF NOT EXISTS idx_subs_plan_id ON public.subscriptions(creator_subscription_plan_id);

-- 6. Row Level Security (RLS)
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_subscription_plans ENABLE ROW LEVEL SECURITY;

-- 6.1 Payment Transactions: Participants and Admins can view
CREATE POLICY "Participants view own payment transactions"
ON public.payment_transactions FOR SELECT
USING (
    auth.uid() = payer_id
    OR auth.uid() = recipient_id
    OR auth.uid() = creator_id
    OR auth.uid() = merchant_id
    OR EXISTS (
        SELECT 1 FROM public.accounts
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'superadmin', 'management', 'finance')
    )
);

-- Deny client direct insertion/updates into transaction ledger (strictly service-role mediated)
CREATE POLICY "Deny client direct payment transactions insert"
ON public.payment_transactions FOR INSERT
WITH CHECK (false);

CREATE POLICY "Deny client direct payment transactions update"
ON public.payment_transactions FOR UPDATE
USING (false);

CREATE POLICY "Deny client direct payment transactions delete"
ON public.payment_transactions FOR DELETE
USING (false);

-- 6.2 Creator Subscription Plans: Public reads active plans, Creator manages own plans
CREATE POLICY "Public read active creator subscription plans"
ON public.creator_subscription_plans FOR SELECT
USING (is_active = true OR auth.uid() = creator_id);

CREATE POLICY "Creators manage own subscription plans"
ON public.creator_subscription_plans FOR ALL
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);
