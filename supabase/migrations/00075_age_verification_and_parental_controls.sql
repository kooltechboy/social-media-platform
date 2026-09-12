-- Migration 00075: Age Verification & Minor Protection Subsystem
-- Regulatory compliance for COPPA, GDPR-K, and global Child Safety Standards

-- 1. Add Age Tier & Minor Protection Columns to public.profiles
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS age_tier VARCHAR(20) DEFAULT 'unverified' CHECK (age_tier IN ('under_13', '13_to_17', '18_plus', 'unverified')),
    ADD COLUMN IF NOT EXISTS age_verification_status VARCHAR(30) DEFAULT 'unverified' CHECK (age_verification_status IN ('unverified', 'pending', 'verified_self', 'verified_parent', 'verified_document')),
    ADD COLUMN IF NOT EXISTS parent_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS parental_consent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS minor_safety_settings JSONB DEFAULT '{"dm_restrictions": "followers_only", "safe_content_mode": true, "hide_online_status": true}'::jsonb NOT NULL;

-- 2. Indexes for Quick Security & Filter Evaluations
CREATE INDEX IF NOT EXISTS idx_profiles_age_tier ON public.profiles(age_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_parent_id ON public.profiles(parent_profile_id);

-- 3. Automatic Age Tier Calculation Trigger Function
CREATE OR REPLACE FUNCTION public.calculate_profile_age_tier()
RETURNS TRIGGER AS $$
DECLARE
    calculated_age INTEGER;
BEGIN
    IF NEW.date_of_birth IS NOT NULL THEN
        calculated_age := DATE_PART('year', age(NEW.date_of_birth));
        
        IF calculated_age < 13 THEN
            NEW.age_tier := 'under_13';
            -- Under-13 requires explicit parental consent
            IF NEW.parent_profile_id IS NULL THEN
                NEW.age_verification_status := 'pending';
            END IF;
        ELSIF calculated_age >= 13 AND calculated_age < 18 THEN
            NEW.age_tier := '13_to_17';
            IF NEW.age_verification_status = 'unverified' THEN
                NEW.age_verification_status := 'verified_self';
            END IF;
        ELSE
            NEW.age_tier := '18_plus';
            IF NEW.age_verification_status = 'unverified' THEN
                NEW.age_verification_status := 'verified_self';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_calculate_profile_age_tier ON public.profiles;
CREATE TRIGGER trg_calculate_profile_age_tier
BEFORE INSERT OR UPDATE OF date_of_birth ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.calculate_profile_age_tier();

-- 4. Parental Consent Verification Function
CREATE OR REPLACE FUNCTION public.confirm_parental_consent(
    p_minor_id UUID,
    p_parent_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Only the verified parent can confirm consent
    IF auth.uid() != p_parent_id THEN
        RAISE EXCEPTION 'Unauthorized: only the specified parent can grant consent.';
    END IF;

    -- Ensure parent is 18+
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = p_parent_id AND age_tier = '18_plus'
    ) THEN
        RAISE EXCEPTION 'Parent must be an adult (18+) profile.';
    END IF;

    UPDATE public.profiles
    SET 
        parent_profile_id = p_parent_id,
        parental_consent_at = now(),
        age_verification_status = 'verified_parent'
    WHERE id = p_minor_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
