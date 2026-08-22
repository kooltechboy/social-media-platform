-- Migration 00011: SpotPay Payment Production Layer
-- Description: payment intents, tokenized methods, attempts, idempotency keys, refunds, disputes, payouts, commissions
-- All money values are INTEGER MINOR UNITS + ISO 4217 currency. No mutable balance columns anywhere.

CREATE TABLE public.idempotency_keys (
    key VARCHAR(128) PRIMARY KEY,
    scope VARCHAR(60) NOT NULL,
    resolved_request_hash TEXT NOT NULL,
    response_json JSONB,
    status VARCHAR(12) CHECK (status IN ('in_flight', 'completed', 'failed')) DEFAULT 'in_flight' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours') NOT NULL
);

CREATE TABLE public.payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    provider VARCHAR(30) NOT NULL,
    method_kind VARCHAR(20) CHECK (method_kind IN ('card', 'wallet', 'apple_pay', 'google_pay', 'paypal', 'bank_account')) NOT NULL,
    provider_token TEXT NOT NULL,
    brand VARCHAR(30),
    last4 VARCHAR(4),
    expiry_month SMALLINT,
    expiry_year SMALLINT,
    is_default BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TYPE public.payment_intent_status AS ENUM (
    'requires_payment', 'requires_action', 'processing', 'succeeded', 'failed', 'cancelled'
);

CREATE TABLE public.payment_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    product_type VARCHAR(30) NOT NULL,
    reference_type VARCHAR(30),
    reference_id UUID,
    amount_minor INTEGER CHECK (amount_minor > 0) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    selected_provider VARCHAR(30),
    selected_method_kind VARCHAR(20),
    status public.payment_intent_status DEFAULT 'requires_payment' NOT NULL,
    ledger_transaction_id UUID,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.payment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intent_id UUID REFERENCES public.payment_intents(id) ON DELETE CASCADE NOT NULL,
    provider VARCHAR(30) NOT NULL,
    provider_attempt_id TEXT,
    outcome VARCHAR(20) CHECK (outcome IN ('pending', 'succeeded', 'declined', 'error', 'timeout')) NOT NULL,
    failure_code VARCHAR(40),
    amount_minor INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intent_id UUID REFERENCES public.payment_intents(id) ON DELETE CASCADE NOT NULL,
    amount_minor INTEGER CHECK (amount_minor > 0) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    reason VARCHAR(40),
    state VARCHAR(12) CHECK (state IN ('pending', 'succeeded', 'failed')) DEFAULT 'pending' NOT NULL,
    ledger_transaction_id UUID,
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intent_id UUID REFERENCES public.payment_intents(id) ON DELETE CASCADE NOT NULL,
    dispute_kind VARCHAR(12) CHECK (dispute_kind IN ('chargeback', 'complaint')) NOT NULL,
    provider_dispute_id TEXT,
    amount_minor INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL,
    state VARCHAR(16) CHECK (state IN ('open', 'under_review', 'won', 'lost', 'closed')) DEFAULT 'open' NOT NULL,
    evidence_deadline TIMESTAMPTZ,
    resolution_note TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.chargebacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id UUID REFERENCES public.disputes(id) ON DELETE CASCADE NOT NULL,
    amount_minor INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL,
    fee_minor INTEGER DEFAULT 0 NOT NULL,
    reversed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_account_id UUID REFERENCES public.creator_accounts(id) ON DELETE CASCADE NOT NULL,
    amount_minor INTEGER CHECK (amount_minor > 0) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    provider VARCHAR(30) NOT NULL,
    provider_payout_id TEXT,
    state VARCHAR(16) CHECK (state IN ('queued', 'processing', 'paid', 'failed', 'reversed')) DEFAULT 'queued' NOT NULL,
    ledger_transaction_id UUID,
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    paid_at TIMESTAMPTZ
);

CREATE TABLE public.commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_intent_id UUID REFERENCES public.payment_intents(id) ON DELETE CASCADE NOT NULL,
    revenue_stream VARCHAR(30) NOT NULL,
    amount_minor INTEGER CHECK (amount_minor > 0) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    ledger_transaction_id UUID,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexing
CREATE INDEX idx_payment_methods_owner ON public.payment_methods(owner_id);
CREATE INDEX idx_payment_intents_payer ON public.payment_intents(payer_id, created_at DESC);
CREATE INDEX idx_payment_intents_reference ON public.payment_intents(reference_type, reference_id);
CREATE INDEX idx_payment_intents_status ON public.payment_intents(status);
CREATE INDEX idx_payment_attempts_intent ON public.payment_attempts(intent_id, created_at DESC);
CREATE INDEX idx_refunds_intent ON public.refunds(intent_id);
CREATE INDEX idx_disputes_intent ON public.disputes(intent_id);
CREATE INDEX idx_payouts_creator_state ON public.payouts(creator_account_id, state);
CREATE INDEX idx_commissions_source ON public.commissions(source_intent_id);

-- Row Level Security
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chargebacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- Idempotency keys, attempts, disputes, chargebacks, payouts and commissions are
-- service-role-only: no client policy exists, RLS denies by default.
CREATE POLICY "Deny client idempotency keys" ON public.idempotency_keys
    FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "Deny client payment attempts" ON public.payment_attempts
    FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "Deny client disputes" ON public.disputes
    FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "Deny client chargebacks" ON public.chargebacks
    FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "Deny client commissions" ON public.commissions
    FOR ALL USING (false) WITH CHECK (false);

-- Tokenized payment methods: owner-scoped CRUD (tokens only; raw card data never stored)
CREATE POLICY "Owner reads payment methods" ON public.payment_methods
    FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owner creates payment methods" ON public.payment_methods
    FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner updates payment methods" ON public.payment_methods
    FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owner deletes payment methods" ON public.payment_methods
    FOR DELETE USING (auth.uid() = owner_id);

-- Payment intents: payer can read own intents and create intents for themselves;
-- all state transitions (attempts, success, ledger linkage) are server-driven
CREATE POLICY "Payer reads payment intents" ON public.payment_intents
    FOR SELECT USING (auth.uid() = payer_id);
CREATE POLICY "Payer creates payment intents" ON public.payment_intents
    FOR INSERT WITH CHECK (auth.uid() = payer_id);

-- Refunds: payer sees refunds on their intents; creation is service-only
CREATE POLICY "Payer reads refunds" ON public.refunds
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.payment_intents i WHERE i.id = intent_id AND i.payer_id = auth.uid()
    ));

-- Payouts: creator sees payouts for their own creator account
CREATE POLICY "Creator reads payouts" ON public.payouts
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.creator_accounts ca
        WHERE ca.id = creator_account_id AND ca.profile_id = auth.uid()
    ));

-- Double-entry integrity: a transaction's entries must always sum to zero
CREATE OR REPLACE FUNCTION public.enforce_ledger_sum_zero()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    balance NUMERIC(18, 4);
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO balance
    FROM public.ledger_entries
    WHERE transaction_id = NEW.transaction_id;
    IF balance != 0 THEN
        RAISE EXCEPTION 'Ledger invariant violated: transaction % does not sum to zero', NEW.transaction_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ledger_sum_zero
AFTER INSERT ON public.ledger_entries
FOR EACH ROW EXECUTE FUNCTION public.enforce_ledger_sum_zero();
