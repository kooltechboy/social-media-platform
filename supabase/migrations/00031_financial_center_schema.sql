-- Migration 00031: TUKUBI Financial Center & Universal Provider-Neutral Infrastructure
-- Description: Creates provider registry, connected accounts state machine, webhook audit trail,
-- immutable financial audit logging, provider-neutral transfers, and RLS hardening.

-- 1. Payment Providers Registry
CREATE TABLE IF NOT EXISTS public.payment_providers (
    id VARCHAR(40) PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('active', 'sandbox', 'disabled', 'pending_approval')) NOT NULL DEFAULT 'disabled',
    environment VARCHAR(12) CHECK (environment IN ('production', 'sandbox', 'test')) NOT NULL DEFAULT 'sandbox',
    capabilities TEXT[] NOT NULL DEFAULT '{}',
    supported_countries TEXT[] NOT NULL DEFAULT '{}',
    supported_currencies TEXT[] NOT NULL DEFAULT '{}',
    webhook_url TEXT,
    api_health_status VARCHAR(12) DEFAULT 'unknown',
    is_credentials_configured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. User Connected Accounts (Provider Connection State Machine)
CREATE TABLE IF NOT EXISTS public.payment_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    provider_id VARCHAR(40) REFERENCES public.payment_providers(id) NOT NULL,
    connection_state VARCHAR(24) CHECK (connection_state IN (
        'NOT_CONNECTED', 'CONNECTING', 'AUTHORIZATION_REQUIRED',
        'AUTHORIZED', 'VERIFYING', 'CONNECTED',
        'REAUTH_REQUIRED', 'SUSPENDED', 'ERROR', 'DISCONNECTED'
    )) NOT NULL DEFAULT 'NOT_CONNECTED',
    masked_account_identifier TEXT,
    provider_account_id TEXT,
    connected_at TIMESTAMPTZ,
    last_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (user_id, provider_id)
);

-- 3. Webhook Audit Trail & Replay Protection
CREATE TABLE IF NOT EXISTS public.payment_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id VARCHAR(40) REFERENCES public.payment_providers(id) NOT NULL,
    event_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    signature_valid BOOLEAN NOT NULL,
    is_duplicate BOOLEAN NOT NULL DEFAULT false,
    processing_status VARCHAR(16) CHECK (processing_status IN ('received', 'processing', 'processed', 'failed', 'ignored')) NOT NULL DEFAULT 'received',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (provider_id, event_id)
);

-- 4. Immutable Payment Audit Log
CREATE TABLE IF NOT EXISTS public.payment_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id),
    action VARCHAR(60) NOT NULL,
    resource_type VARCHAR(40) NOT NULL,
    resource_id TEXT,
    details JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. Universal Transfer Records
CREATE TABLE IF NOT EXISTS public.transfer_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    amount_minor INTEGER CHECK (amount_minor > 0) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    provider_id VARCHAR(40) REFERENCES public.payment_providers(id),
    status VARCHAR(16) CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')) NOT NULL DEFAULT 'pending',
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    ledger_transaction_id UUID,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. Extend Payment Intents with Provider & Entity Tracking
ALTER TABLE public.payment_intents ADD COLUMN IF NOT EXISTS provider_id VARCHAR(40) REFERENCES public.payment_providers(id);
ALTER TABLE public.payment_intents ADD COLUMN IF NOT EXISTS provider_transaction_id TEXT;
ALTER TABLE public.payment_intents ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.payment_intents ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.payment_intents ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id);

-- 7. Seed Initial Payment Providers
INSERT INTO public.payment_providers (id, name, status, environment, capabilities, supported_countries, supported_currencies, is_credentials_configured) VALUES
    ('stripe', 'Stripe', 'sandbox', 'sandbox', '{"payment","checkout","authorization","capture","refund","partial_refund","recurring_billing","subscription","tokenization","3ds","google_pay","apple_pay","webhook_support","dispute_management"}', '{"US","CA","GB","IE","PR"}', '{"USD","CAD","GBP","EUR"}', true),
    ('paypal', 'PayPal', 'sandbox', 'sandbox', '{"payment","checkout","refund","partial_refund","recurring_billing","subscription","payout","dispute_management","webhook_support"}', '{"*"}', '{"USD","CAD","GBP","EUR","DOP","JMD","TTD"}', true),
    ('cxpay', 'CX Pay', 'pending_approval', 'sandbox', '{"payment","checkout","tokenization","refund","3ds","webhook_support"}', '{"DO","JM","TT","BB","BS","GY","SR","BZ","AG","KN","LC","VC","DM","GD","CW","AW","SX"}', '{"USD","DOP","JMD","TTD","BBD","BSD","ANG","AWG","XCD"}', false),
    ('wipay', 'WiPay', 'pending_approval', 'sandbox', '{"payment","checkout","refund","webhook_support","withdrawal","bank_settlement"}', '{"TT","JM","BB","GY"}', '{"USD","TTD","JMD","BBD","GYD"}', false),
    ('apple_pay', 'Apple Pay', 'sandbox', 'sandbox', '{"payment","checkout","tokenization"}', '{"*"}', '{"*"}', true),
    ('google_pay', 'Google Pay', 'sandbox', 'sandbox', '{"payment","checkout","tokenization"}', '{"*"}', '{"*"}', true),
    ('cashapp', 'Cash App Pay', 'pending_approval', 'sandbox', '{"payment","refund","webhook_support"}', '{"US"}', '{"USD"}', false),
    ('bank_transfer', 'Bank Transfer Rails', 'pending_approval', 'sandbox', '{"transfer","withdrawal","payout","bank_settlement","account_verification"}', '{"US","DO","JM","TT","BB"}', '{"USD","DOP","JMD","TTD","BBD"}', false),
    ('spotpay', 'SpotPay', 'disabled', 'test', '{}', '{}', '{}', false)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    capabilities = EXCLUDED.capabilities,
    supported_countries = EXCLUDED.supported_countries,
    supported_currencies = EXCLUDED.supported_currencies;

-- 8. Indexing
CREATE INDEX IF NOT EXISTS idx_payment_connections_user ON public.payment_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_connections_provider ON public.payment_connections(provider_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_event ON public.payment_webhooks(provider_id, event_id);
CREATE INDEX IF NOT EXISTS idx_transfer_records_sender ON public.transfer_records(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transfer_records_recipient ON public.transfer_records(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_intents_provider ON public.payment_intents(provider_id, provider_transaction_id);

-- 9. Row Level Security (RLS)
ALTER TABLE public.payment_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_records ENABLE ROW LEVEL SECURITY;

-- 9.1 Payment Providers: Public Read, Service-Role Write
CREATE POLICY "Public read payment providers" ON public.payment_providers
    FOR SELECT USING (true);

-- 9.2 Payment Connections: Owner-Scoped CRUD
CREATE POLICY "User reads own connections" ON public.payment_connections
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User creates own connections" ON public.payment_connections
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User updates own connections" ON public.payment_connections
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "User deletes own connections" ON public.payment_connections
    FOR DELETE USING (auth.uid() = user_id);

-- 9.3 Payment Webhooks: Service-Role Only (Strict Isolation)
CREATE POLICY "Deny client webhook access" ON public.payment_webhooks
    FOR ALL USING (false) WITH CHECK (false);

-- 9.4 Payment Audit Logs: Service-Role Only
CREATE POLICY "Deny client audit log access" ON public.payment_audit_logs
    FOR ALL USING (false) WITH CHECK (false);

-- 9.5 Transfer Records: Participant-Scoped Read, Service-Role Mutate
CREATE POLICY "Transfer participants read" ON public.transfer_records
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
