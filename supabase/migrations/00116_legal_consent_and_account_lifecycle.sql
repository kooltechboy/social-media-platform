-- Migration 00116: Legal Consent Records & Account Lifecycle Subsystem
-- Regulatory compliance: Dominican Republic Law 172-13 (ARCO rights), Law 126-02 (Electronic Consent),
--                       Law 136-03 (Child Safety), and global GDPR / CCPA standards.

-- 1. Create Legal Consent Records Table
CREATE TABLE IF NOT EXISTS public.legal_consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- 'terms_of_service', 'privacy_notice', 'community_standards', 'marketing_communications'
    document_version VARCHAR(20) NOT NULL, -- e.g. '2026.1'
    consented BOOLEAN NOT NULL DEFAULT true,
    consented_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at TIMESTAMPTZ,
    ip_country VARCHAR(10),
    user_agent TEXT,
    jurisdiction VARCHAR(50) DEFAULT 'DO',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_legal_consent_user_doc 
    ON public.legal_consent_records(user_id, document_type, document_version);
CREATE INDEX IF NOT EXISTS idx_legal_consent_consented_at 
    ON public.legal_consent_records(consented_at DESC);

-- Enable RLS on legal_consent_records
ALTER TABLE public.legal_consent_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own consent records" ON public.legal_consent_records;
CREATE POLICY "Users view own consent records"
    ON public.legal_consent_records
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own consent records" ON public.legal_consent_records;
CREATE POLICY "Users insert own consent records"
    ON public.legal_consent_records
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages consent records" ON public.legal_consent_records;
CREATE POLICY "Service role manages consent records"
    ON public.legal_consent_records
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 2. Create Account Deletion Requests Table (30-day grace period pipeline)
CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'processing', 'completed', 'cancelled')),
    reason TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    scheduled_deletion_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
    completed_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_account_deletion_user_status 
    ON public.account_deletion_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_account_deletion_scheduled 
    ON public.account_deletion_requests(scheduled_deletion_at) 
    WHERE status = 'scheduled';

-- Enable RLS on account_deletion_requests
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own deletion requests" ON public.account_deletion_requests;
CREATE POLICY "Users view own deletion requests"
    ON public.account_deletion_requests
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own deletion request" ON public.account_deletion_requests;
CREATE POLICY "Users insert own deletion request"
    ON public.account_deletion_requests
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own scheduled deletion request" ON public.account_deletion_requests;
CREATE POLICY "Users update own scheduled deletion request"
    ON public.account_deletion_requests
    FOR UPDATE
    USING (auth.uid() = user_id AND status = 'scheduled')
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages deletion requests" ON public.account_deletion_requests;
CREATE POLICY "Service role manages deletion requests"
    ON public.account_deletion_requests
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 3. Stored Procedures for Deletion Request Lifecycle
CREATE OR REPLACE FUNCTION public.request_account_deletion(p_reason TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
    v_req_id UUID;
    v_uid UUID := auth.uid();
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required to request account deletion.';
    END IF;

    -- If a scheduled request already exists, return its ID
    SELECT id INTO v_req_id
    FROM public.account_deletion_requests
    WHERE user_id = v_uid AND status = 'scheduled'
    ORDER BY requested_at DESC
    LIMIT 1;

    IF v_req_id IS NOT NULL THEN
        RETURN v_req_id;
    END IF;

    -- Insert new scheduled deletion request with 30-day grace period
    INSERT INTO public.account_deletion_requests (user_id, reason, scheduled_deletion_at)
    VALUES (v_uid, p_reason, now() + interval '30 days')
    RETURNING id INTO v_req_id;

    -- Mark profile status as pending_deletion
    UPDATE public.profiles
    SET status = 'pending_deletion', updated_at = now()
    WHERE id = v_uid;

    RETURN v_req_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.cancel_account_deletion(
    p_request_id UUID,
    p_cancellation_reason TEXT DEFAULT 'Cancelled by user'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_updated BOOLEAN;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required to cancel account deletion.';
    END IF;

    UPDATE public.account_deletion_requests
    SET 
        status = 'cancelled',
        cancellation_reason = p_cancellation_reason
    WHERE id = p_request_id AND user_id = v_uid AND status = 'scheduled';

    GET DIAGNOSTICS v_updated = ROW_COUNT;

    IF v_updated THEN
        -- Restore profile status to active if no other pending deletion
        IF NOT EXISTS (
            SELECT 1 FROM public.account_deletion_requests
            WHERE user_id = v_uid AND status = 'scheduled'
        ) THEN
            UPDATE public.profiles
            SET status = 'active', updated_at = now()
            WHERE id = v_uid;
        END IF;
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 4. Function to Record Legal Consent
CREATE OR REPLACE FUNCTION public.record_legal_consent(
    p_document_type TEXT,
    p_version TEXT,
    p_consented BOOLEAN DEFAULT TRUE,
    p_ip_country TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_jurisdiction TEXT DEFAULT 'DO'
)
RETURNS UUID AS $$
DECLARE
    v_consent_id UUID;
    v_uid UUID := auth.uid();
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required to record legal consent.';
    END IF;

    INSERT INTO public.legal_consent_records (
        user_id,
        document_type,
        document_version,
        consented,
        consented_at,
        ip_country,
        user_agent,
        jurisdiction
    )
    VALUES (
        v_uid,
        p_document_type,
        p_version,
        p_consented,
        now(),
        p_ip_country,
        p_user_agent,
        COALESCE(p_jurisdiction, 'DO')
    )
    RETURNING id INTO v_consent_id;

    RETURN v_consent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.request_account_deletion(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cancel_account_deletion(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_legal_consent(TEXT, TEXT, BOOLEAN, TEXT, TEXT, TEXT) TO authenticated, service_role;
