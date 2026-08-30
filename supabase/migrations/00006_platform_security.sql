-- Migration 00006: Platform Security, Audit, Feature Flags & Analytics Events
-- Description: device sessions, login events, append-only audit/security logs, feature flags, analytics event pipeline

CREATE TABLE public.device_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    device_label TEXT,
    device_fingerprint_hash TEXT NOT NULL,
    ip_hash TEXT,
    user_agent TEXT,
    last_seen_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.login_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    email TEXT,
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(60),
    ip_hash TEXT,
    device_fingerprint_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(80) NOT NULL,
    entity_type VARCHAR(60),
    entity_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(60) NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    severity VARCHAR(12) CHECK (severity IN ('info', 'warning', 'critical')) DEFAULT 'info' NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.feature_flags (
    key VARCHAR(80) PRIMARY KEY,
    description TEXT,
    is_enabled BOOLEAN DEFAULT false NOT NULL,
    rollout_percentage SMALLINT DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.analytics_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_name VARCHAR(80) NOT NULL,
    event_version SMALLINT DEFAULT 1 NOT NULL,
    user_id UUID,
    properties JSONB DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Seed initial feature flags (all new surfaces default OFF)
INSERT INTO public.feature_flags (key, description, is_enabled) VALUES
    ('stories_enabled', '24h stories surface', false),
    ('reels_enabled', 'Short-form video surface', false),
    ('live_enabled', 'Live streaming', false),
    ('podcasts_enabled', 'Podcast hosting & RSS', false),
    ('payments_enabled', 'Payments & checkout', false),
    ('creator_subscriptions', 'Paid creator memberships', false),
    ('marketplace_enabled', 'Marketplace ordering', false),
    ('ai_search_enabled', 'Ask Caribbean AI search', false),
    ('new_feed_algorithm', 'Ranked For You feed', false),
    ('messaging_enabled', 'Direct & group messaging', false);

-- Indexing
CREATE INDEX idx_device_sessions_user ON public.device_sessions(user_id);
CREATE INDEX idx_login_events_user ON public.login_events(user_id);
CREATE INDEX idx_login_events_created ON public.login_events(created_at);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_security_events_type ON public.security_events(event_type);
CREATE INDEX idx_security_events_created ON public.security_events(created_at);
CREATE INDEX idx_analytics_events_name_time ON public.analytics_events(event_name, occurred_at);
CREATE INDEX idx_analytics_events_user ON public.analytics_events(user_id);

-- Row Level Security
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner read device sessions" ON public.device_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owner revoke device session" ON public.device_sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Owner read login events" ON public.login_events FOR SELECT USING (auth.uid() = user_id);

-- Append-only audit & security logs: no client read/write. Service role bypasses RLS.
CREATE POLICY "Deny all audit logs" ON public.audit_logs
    FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "Deny all security events" ON public.security_events
    FOR ALL USING (false) WITH CHECK (false);

CREATE POLICY "Public read feature flags" ON public.feature_flags FOR SELECT USING (true);

-- Analytics: clients may insert only their own events; no client reads (aggregation is server-side)
CREATE POLICY "Authenticated insert own analytics" ON public.analytics_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);
