-- Migration 00091: Parental Consent Security & Anti-Hijacking Protection
-- Description: Establishes parental_consent_requests table and hardens confirm_parental_consent
--              to ensure an adult cannot claim guardianship without an active, verified consent request.

CREATE TABLE IF NOT EXISTS public.parental_consent_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    minor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revoked')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    resolved_at TIMESTAMPTZ,
    CONSTRAINT chk_parent_minor_distinct CHECK (minor_id <> parent_id),
    UNIQUE (minor_id, parent_id)
);

CREATE INDEX IF NOT EXISTS idx_parental_consent_minor ON public.parental_consent_requests(minor_id);
CREATE INDEX IF NOT EXISTS idx_parental_consent_parent ON public.parental_consent_requests(parent_id, status);

ALTER TABLE public.parental_consent_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Minors manage own consent requests" ON public.parental_consent_requests;
CREATE POLICY "Minors manage own consent requests"
ON public.parental_consent_requests
FOR ALL
USING (auth.uid() = minor_id)
WITH CHECK (auth.uid() = minor_id);

DROP POLICY IF EXISTS "Parents view requests addressed to them" ON public.parental_consent_requests;
CREATE POLICY "Parents view requests addressed to them"
ON public.parental_consent_requests
FOR SELECT
USING (auth.uid() = parent_id);

-- Hardened Parental Consent Verification Function
CREATE OR REPLACE FUNCTION public.confirm_parental_consent(
    p_minor_id UUID,
    p_parent_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_request BOOLEAN;
BEGIN
    -- 1. Only the verified parent can invoke this function
    IF auth.uid() != p_parent_id THEN
        RAISE EXCEPTION 'Unauthorized: only the specified parent can grant consent.';
    END IF;

    -- 2. Verify parent profile is an adult (18+)
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = p_parent_id AND age_tier = '18_plus'
    ) THEN
        RAISE EXCEPTION 'Parent must be an adult (18+) profile.';
    END IF;

    -- 3. Verify that the minor explicitly initiated or designated a parental consent request
    SELECT EXISTS (
        SELECT 1 FROM public.parental_consent_requests
        WHERE minor_id = p_minor_id 
          AND parent_id = p_parent_id 
          AND status = 'pending'
    ) OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = p_minor_id 
          AND parent_profile_id = p_parent_id 
          AND age_verification_status = 'pending'
    ) INTO v_has_request;

    IF NOT v_has_request THEN
        RAISE EXCEPTION 'Parental consent request not found or not initiated by minor.';
    END IF;

    -- 4. Mark request approved if a consent request record exists
    UPDATE public.parental_consent_requests
    SET status = 'approved', resolved_at = now()
    WHERE minor_id = p_minor_id AND parent_id = p_parent_id AND status = 'pending';

    -- 5. Update minor profile status
    UPDATE public.profiles
    SET 
        parent_profile_id = p_parent_id,
        parental_consent_at = now(),
        age_verification_status = 'verified_parent'
    WHERE id = p_minor_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
