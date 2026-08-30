-- Migration 00004: Payments Double-Entry Financial Ledger, Wallets & PSP Capability Matrix
-- Description: Financial ledger tables, native Payments wallet, idempotency protection, payment capability routing

CREATE TYPE public.ledger_account_type AS ENUM (
    'Payments_wallet',       -- Native stored-value wallet balance
    'creator_pending',      -- Creator pending earnings prior to payout
    'platform_revenue',     -- Platform fee & commission account
    'stripe_escrow',        -- External Stripe incoming escrow
    'paypal_escrow'         -- External PayPal incoming escrow
);

CREATE TABLE public.ledger_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    account_type public.ledger_account_type NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL,
    account_id UUID REFERENCES public.ledger_accounts(id) NOT NULL,
    amount NUMERIC(18, 4) NOT NULL, -- Positive for Credit, Negative for Debit
    entry_type VARCHAR(10) CHECK (entry_type IN ('DEBIT', 'CREDIT')) NOT NULL,
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- PSP Capability Reference Matrix
CREATE TABLE public.psp_capabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_iso VARCHAR(3) REFERENCES public.countries(iso_code) NOT NULL,
    platform VARCHAR(20) CHECK (platform IN ('web', 'ios', 'android', 'all')) NOT NULL,
    product_type VARCHAR(30) CHECK (product_type IN ('digital_subscription', 'creator_tip', 'live_gift', 'physical_goods', 'event_ticket')) NOT NULL,
    provider VARCHAR(30) NOT NULL, -- 'Payments_wallet', 'stripe', 'paypal', 'apple_pay', 'google_pay'
    is_enabled BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexing
CREATE INDEX idx_ledger_entries_tx ON public.ledger_entries(transaction_id);
CREATE INDEX idx_ledger_entries_account ON public.ledger_entries(account_id);
CREATE INDEX idx_ledger_accounts_owner ON public.ledger_accounts(owner_id);

-- Row Level Security
ALTER TABLE public.ledger_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psp_capabilities ENABLE ROW LEVEL SECURITY;

-- 1. Users can view only their own ledger accounts
CREATE POLICY "Users view own ledger accounts"
ON public.ledger_accounts FOR SELECT
USING (auth.uid() = owner_id);

-- 2. Users can view ledger entries associated with their own accounts
CREATE POLICY "Users view own ledger entries"
ON public.ledger_entries FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.ledger_accounts 
        WHERE id = ledger_entries.account_id AND owner_id = auth.uid()
    )
);

-- 3. Public read access to PSP capabilities reference matrix
CREATE POLICY "Public view PSP capabilities"
ON public.psp_capabilities FOR SELECT
USING (true);
