-- =============================================================================
-- Migration 00041: TUKUBI Status, Recognition, Achievements & Founder Ecosystem
-- Description: Complete production-grade recognition engine supporting:
--   1. Dynamic Badge Catalog & Categories
--   2. User Badge Allocations & Visibility Settings
--   3. Digital Achievements & Milestone Progression
--   4. Configurable Multi-Tier Reputation Engine (Newcomer to Ambassador)
--   5. Chronological Atomic Founder Numbering (Elite 100, 1000, 10k, 100k)
--   6. Specialized Vertical Programs (Creators, Podcasters, Merchants, Businesses)
--   7. Regional & Island Pioneers
--   8. Founders Council, Ambassadors, TUKUBI Labs & Early Access
--   9. Editorial Spotlights, Annual Awards & Academy Certifications
--  10. Anti-Abuse Verified Referral Milestones
--  11. Stored Procedures, Audit Integration & Robust Row Level Security (RLS)
-- =============================================================================

-- =============================================================================
-- 1. BADGE CATEGORIES & BADGE CATALOG
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.recognition_badge_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) NOT NULL DEFAULT 'Award',
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recognition_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.recognition_badge_categories(id) ON DELETE RESTRICT NOT NULL,
    slug VARCHAR(60) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(60) NOT NULL,
    tier VARCHAR(30) NOT NULL DEFAULT 'standard' CHECK (tier IN ('standard', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'cosmic')),
    rarity VARCHAR(30) NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic')),
    color_theme JSONB NOT NULL DEFAULT '{"bg": "from-slate-800 to-slate-900", "border": "border-slate-700", "text": "text-slate-200"}'::jsonb,
    criteria_rules JSONB NOT NULL DEFAULT '{"type": "manual"}'::jsonb,
    is_permanent BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_priority INTEGER NOT NULL DEFAULT 50,
    max_recipients INTEGER,
    current_recipients_count INTEGER NOT NULL DEFAULT 0,
    is_automatic BOOLEAN NOT NULL DEFAULT false,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recognition_badges_category ON public.recognition_badges(category_id);
CREATE INDEX IF NOT EXISTS idx_recognition_badges_slug ON public.recognition_badges(slug);
CREATE INDEX IF NOT EXISTS idx_recognition_badges_active_priority ON public.recognition_badges(is_active, display_priority DESC);

CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    badge_id UUID REFERENCES public.recognition_badges(id) ON DELETE RESTRICT NOT NULL,
    awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    awarded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    award_reason TEXT,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    revocation_reason TEXT,
    external_token_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(profile_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_profile ON public.user_badges(profile_id) WHERE is_revoked = false;
CREATE INDEX IF NOT EXISTS idx_user_badges_featured ON public.user_badges(profile_id, is_featured) WHERE is_revoked = false;

-- =============================================================================
-- 2. FOUNDER PROGRAMS & ATOMIC CHRONOLOGICAL NUMBERING
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.founder_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    badge_id UUID REFERENCES public.recognition_badges(id) ON DELETE SET NULL,
    max_members INTEGER NOT NULL,
    current_count INTEGER NOT NULL DEFAULT 0,
    is_closed BOOLEAN NOT NULL DEFAULT false,
    sequence_prefix VARCHAR(10) NOT NULL DEFAULT '#',
    benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.founder_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES public.founder_programs(id) ON DELETE RESTRICT NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    founder_number INTEGER NOT NULL,
    formatted_number VARCHAR(30) NOT NULL,
    allocated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    revocation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(program_id, founder_number),
    UNIQUE(program_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_founder_members_profile ON public.founder_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_founder_members_program_number ON public.founder_members(program_id, founder_number);

-- =============================================================================
-- 3. ACHIEVEMENTS SYSTEM
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.recognition_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(60) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(40) NOT NULL DEFAULT 'community',
    icon VARCHAR(60) NOT NULL,
    points INTEGER NOT NULL DEFAULT 10,
    rarity VARCHAR(30) NOT NULL DEFAULT 'common',
    criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
    unlock_badge_id UUID REFERENCES public.recognition_badges(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recognition_achievements_slug ON public.recognition_achievements(slug);

CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    achievement_id UUID REFERENCES public.recognition_achievements(id) ON DELETE RESTRICT NOT NULL,
    progress_percentage INTEGER NOT NULL DEFAULT 100 CHECK (progress_percentage BETWEEN 0 AND 100),
    is_unlocked BOOLEAN NOT NULL DEFAULT true,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(profile_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_profile ON public.user_achievements(profile_id, is_unlocked);

-- =============================================================================
-- 4. REPUTATION LEVELS & USER REPUTATION ENGINE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.reputation_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level_tier INTEGER UNIQUE NOT NULL,
    name VARCHAR(60) NOT NULL,
    title VARCHAR(80) NOT NULL,
    emoji VARCHAR(20) NOT NULL,
    min_score INTEGER NOT NULL,
    description TEXT NOT NULL,
    privileges JSONB NOT NULL DEFAULT '[]'::jsonb,
    badge_id UUID REFERENCES public.recognition_badges(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_reputation (
    profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    reputation_score INTEGER NOT NULL DEFAULT 10,
    current_level_tier INTEGER NOT NULL DEFAULT 1 REFERENCES public.reputation_levels(level_tier),
    positive_signals_count INTEGER NOT NULL DEFAULT 0,
    verified_contributions_count INTEGER NOT NULL DEFAULT 0,
    community_trust_score INTEGER NOT NULL DEFAULT 100,
    last_evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 5. FOUNDERS COUNCIL & AMBASSADORS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.founders_council (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(120) NOT NULL DEFAULT 'TUKUBI Founders Council',
    cohort_year INTEGER NOT NULL DEFAULT 2026,
    max_seats INTEGER NOT NULL DEFAULT 250,
    current_members_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.founders_council_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    council_id UUID REFERENCES public.founders_council(id) ON DELETE RESTRICT NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active', 'alumni', 'revoked')),
    seat_number INTEGER,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes TEXT,
    UNIQUE(council_id, profile_id)
);

CREATE TABLE IF NOT EXISTS public.ambassador_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    region VARCHAR(100),
    description TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ambassador_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES public.ambassador_programs(id) ON DELETE RESTRICT NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('applicant', 'active', 'emeritus', 'revoked')),
    appointed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    territory VARCHAR(100),
    appointed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(program_id, profile_id)
);

-- =============================================================================
-- 6. TUKUBI LABS & EARLY ACCESS COHORTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.labs_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(60) UNIQUE NOT NULL,
    title VARCHAR(120) NOT NULL,
    feature_key VARCHAR(80) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('upcoming', 'active', 'graduated', 'closed')),
    release_notes TEXT,
    max_participants INTEGER,
    current_participants_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.labs_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES public.labs_programs(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    feedback_count INTEGER NOT NULL DEFAULT 0,
    opted_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(program_id, profile_id)
);

CREATE TABLE IF NOT EXISTS public.labs_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES public.labs_programs(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
    feedback_text TEXT NOT NULL,
    reported_issue BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'actioned', 'resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.early_access_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(60) UNIQUE NOT NULL,
    title VARCHAR(120) NOT NULL,
    description TEXT,
    eligibility_criteria JSONB NOT NULL DEFAULT '{"reputation_min": 2, "required_badges": []}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.early_access_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES public.early_access_programs(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    granted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    UNIQUE(program_id, profile_id)
);

-- =============================================================================
-- 7. EDITORIAL SPOTLIGHTS, ANNUAL AWARDS & ACADEMY CERTIFICATIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.spotlights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(40) NOT NULL CHECK (category IN ('member_of_week', 'creator_of_week', 'podcaster_of_week', 'merchant_of_week', 'business_of_week', 'community_builder', 'caribbean_spotlight')),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    headline VARCHAR(200) NOT NULL,
    story TEXT NOT NULL,
    media_url TEXT,
    featured_from TIMESTAMPTZ NOT NULL,
    featured_until TIMESTAMPTZ NOT NULL,
    curated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_spotlights_active ON public.spotlights(featured_from, featured_until, is_published);

CREATE TABLE IF NOT EXISTS public.awards_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL,
    category VARCHAR(60) NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    badge_id UUID REFERENCES public.recognition_badges(id) ON DELETE SET NULL,
    is_closed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(year, category)
);

CREATE TABLE IF NOT EXISTS public.award_nominations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    award_id UUID REFERENCES public.awards_programs(id) ON DELETE CASCADE NOT NULL,
    nominee_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    nominated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    statement TEXT,
    is_shortlisted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(award_id, nominee_profile_id)
);

CREATE TABLE IF NOT EXISTS public.award_winners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    award_id UUID REFERENCES public.awards_programs(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    placement VARCHAR(20) NOT NULL DEFAULT 'winner' CHECK (placement IN ('winner', 'honorable_mention', 'finalist')),
    announced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(award_id, profile_id)
);

CREATE TABLE IF NOT EXISTS public.academy_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(60) UNIQUE NOT NULL,
    title VARCHAR(150) NOT NULL,
    track VARCHAR(50) NOT NULL CHECK (track IN ('creator', 'podcaster', 'merchant', 'business', 'digital_marketing', 'ai_skills', 'leadership')),
    description TEXT NOT NULL,
    modules_count INTEGER NOT NULL DEFAULT 5,
    badge_id UUID REFERENCES public.recognition_badges(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES public.academy_programs(id) ON DELETE RESTRICT NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    certificate_id VARCHAR(50) UNIQUE NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    verification_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(program_id, profile_id)
);

-- =============================================================================
-- 8. VERIFIED COMMUNITY REFERRALS (NON-FINANCIAL RECOGNITION MILESTONES)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.recognition_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    referred_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'flagged', 'disqualified')),
    verified_at TIMESTAMPTZ,
    ip_hash_match BOOLEAN NOT NULL DEFAULT false,
    device_fingerprint_match BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT no_self_referral CHECK (referrer_id <> referred_id)
);

CREATE INDEX IF NOT EXISTS idx_recognition_referrals_referrer ON public.recognition_referrals(referrer_id, status);

-- =============================================================================
-- 9. STORED PROCEDURES & ATOMIC ALLOCATION (SECURITY DEFINER)
-- =============================================================================

-- 9.1 Atomic Founder Number Allocation
CREATE OR REPLACE FUNCTION public.allocate_founder_number(
    p_profile_id UUID,
    p_program_slug VARCHAR(50) DEFAULT 'founding_1000'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_program RECORD;
    v_existing_member RECORD;
    v_next_number INT;
    v_formatted_num TEXT;
    v_member_id UUID;
BEGIN
    -- 1. Lock founder program record for atomic increment
    SELECT * INTO v_program
    FROM public.founder_programs
    WHERE slug = p_program_slug
    FOR UPDATE;

    IF v_program.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Founder program not found');
    END IF;

    -- 2. Check if user already holds a founder number in this program
    SELECT * INTO v_existing_member
    FROM public.founder_members
    WHERE program_id = v_program.id AND profile_id = p_profile_id;

    IF v_existing_member.id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'already_member', true,
            'founder_number', v_existing_member.founder_number,
            'formatted_number', v_existing_member.formatted_number,
            'program_name', v_program.name
        );
    END IF;

    -- 3. Verify program has available capacity
    IF v_program.current_count >= v_program.max_members OR v_program.is_closed THEN
        RETURN jsonb_build_object('success', false, 'error', 'Founder program limit reached');
    END IF;

    -- 4. Calculate next atomic chronological sequence number
    v_next_number := v_program.current_count + 1;
    v_formatted_num := v_program.sequence_prefix || lpad(v_next_number::text, 4, '0');

    -- 5. Insert member record
    INSERT INTO public.founder_members (
        program_id,
        profile_id,
        founder_number,
        formatted_number,
        allocated_at
    ) VALUES (
        v_program.id,
        p_profile_id,
        v_next_number,
        v_formatted_num,
        now()
    ) RETURNING id INTO v_member_id;

    -- 6. Update program counter
    UPDATE public.founder_programs
    SET current_count = v_next_number,
        is_closed = CASE WHEN v_next_number >= max_members THEN true ELSE false END,
        updated_at = now()
    WHERE id = v_program.id;

    -- 7. Automatically award associated badge if configured
    IF v_program.badge_id IS NOT NULL THEN
        INSERT INTO public.user_badges (profile_id, badge_id, awarded_by, award_reason, is_featured, is_visible)
        VALUES (p_profile_id, v_program.badge_id, NULL, 'Qualifying Founder Program Achievement: ' || v_formatted_num, true, true)
        ON CONFLICT (profile_id, badge_id) DO UPDATE SET is_revoked = false;
    END IF;

    -- 8. Audit log the allocation
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata, created_at)
    VALUES (
        p_profile_id,
        'founder.number_assigned',
        'founder_members',
        v_member_id,
        jsonb_build_object(
            'program_slug', p_program_slug,
            'founder_number', v_next_number,
            'formatted_number', v_formatted_num
        ),
        now()
    );

    RETURN jsonb_build_object(
        'success', true,
        'founder_number', v_next_number,
        'formatted_number', v_formatted_num,
        'program_name', v_program.name,
        'designation', v_program.designation
    );
END;
$$;

-- 9.2 Award Badge
CREATE OR REPLACE FUNCTION public.award_badge(
    p_profile_id UUID,
    p_badge_slug VARCHAR(60),
    p_reason TEXT DEFAULT 'Platform achievement',
    p_awarded_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_badge RECORD;
    v_user_badge_id UUID;
BEGIN
    SELECT * INTO v_badge
    FROM public.recognition_badges
    WHERE slug = p_badge_slug AND is_active = true;

    IF v_badge.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Badge not found or inactive');
    END IF;

    -- Check recipient cap
    IF v_badge.max_recipients IS NOT NULL AND v_badge.current_recipients_count >= v_badge.max_recipients THEN
        RETURN jsonb_build_object('success', false, 'error', 'Badge recipient cap reached');
    END IF;

    INSERT INTO public.user_badges (
        profile_id,
        badge_id,
        awarded_by,
        award_reason,
        is_visible,
        created_at
    ) VALUES (
        p_profile_id,
        v_badge.id,
        p_awarded_by,
        p_reason,
        true,
        now()
    )
    ON CONFLICT (profile_id, badge_id) DO UPDATE
    SET is_revoked = false,
        revoked_at = NULL,
        revocation_reason = NULL,
        updated_at = now()
    RETURNING id INTO v_user_badge_id;

    -- Update badge recipients count
    UPDATE public.recognition_badges
    SET current_recipients_count = (SELECT COUNT(*) FROM public.user_badges WHERE badge_id = v_badge.id AND is_revoked = false),
        updated_at = now()
    WHERE id = v_badge.id;

    -- Log to audit
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata, created_at)
    VALUES (
        COALESCE(p_awarded_by, p_profile_id),
        'recognition.badge_awarded',
        'user_badges',
        v_user_badge_id,
        jsonb_build_object('profile_id', p_profile_id, 'badge_slug', p_badge_slug, 'reason', p_reason),
        now()
    );

    RETURN jsonb_build_object('success', true, 'badge_id', v_badge.id, 'badge_name', v_badge.name);
END;
$$;

-- 9.3 Revoke Badge
CREATE OR REPLACE FUNCTION public.revoke_badge(
    p_profile_id UUID,
    p_badge_slug VARCHAR(60),
    p_reason TEXT,
    p_revoked_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_badge RECORD;
BEGIN
    SELECT * INTO v_badge FROM public.recognition_badges WHERE slug = p_badge_slug;
    IF v_badge.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Badge not found');
    END IF;

    UPDATE public.user_badges
    SET is_revoked = true,
        revoked_at = now(),
        revoked_by = p_revoked_by,
        revocation_reason = p_reason,
        updated_at = now()
    WHERE profile_id = p_profile_id AND badge_id = v_badge.id;

    UPDATE public.recognition_badges
    SET current_recipients_count = (SELECT COUNT(*) FROM public.user_badges WHERE badge_id = v_badge.id AND is_revoked = false),
        updated_at = now()
    WHERE id = v_badge.id;

    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata, created_at)
    VALUES (
        p_revoked_by,
        'recognition.badge_revoked',
        'user_badges',
        v_badge.id,
        jsonb_build_object('profile_id', p_profile_id, 'badge_slug', p_badge_slug, 'reason', p_reason),
        now()
    );

    RETURN jsonb_build_object('success', true);
END;
$$;

-- 9.4 Reputation Scoring & Level Evaluation
CREATE OR REPLACE FUNCTION public.evaluate_user_reputation(p_profile_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_posts_count INT := 0;
    v_likes_count INT := 0;
    v_followers_count INT := 0;
    v_is_verified BOOLEAN := false;
    v_is_creator BOOLEAN := false;
    v_is_merchant BOOLEAN := false;
    v_referrals_count INT := 0;
    v_achievements_count INT := 0;
    v_score INT := 10;
    v_target_level INT := 1;
    v_level_rec RECORD;
BEGIN
    -- Gather signals
    SELECT is_verified INTO v_is_verified FROM public.profiles WHERE id = p_profile_id;
    SELECT COALESCE(posts_count, 0), COALESCE(likes_received_count, 0), COALESCE(followers_count, 0)
    INTO v_posts_count, v_likes_count, v_followers_count
    FROM public.profile_counts WHERE profile_id = p_profile_id;

    SELECT EXISTS(SELECT 1 FROM public.creator_accounts WHERE profile_id = p_profile_id) INTO v_is_creator;
    SELECT EXISTS(SELECT 1 FROM public.businesses WHERE owner_id = p_profile_id) INTO v_is_merchant;
    SELECT COUNT(*) INTO v_referrals_count FROM public.recognition_referrals WHERE referrer_id = p_profile_id AND status = 'verified';
    SELECT COUNT(*) INTO v_achievements_count FROM public.user_achievements WHERE profile_id = p_profile_id AND is_unlocked = true;

    -- Compute dynamic score safely
    v_score := 10 -- Baseline
        + (LEAST(v_posts_count, 50) * 2)
        + (LEAST(v_likes_count, 100) * 1)
        + (LEAST(v_followers_count, 200) * 1)
        + (CASE WHEN v_is_verified THEN 50 ELSE 0 END)
        + (CASE WHEN v_is_creator THEN 30 ELSE 0 END)
        + (CASE WHEN v_is_merchant THEN 30 ELSE 0 END)
        + (v_referrals_count * 15)
        + (v_achievements_count * 10);

    -- Find matched reputation level tier
    SELECT level_tier INTO v_target_level
    FROM public.reputation_levels
    WHERE min_score <= v_score
    ORDER BY min_score DESC
    LIMIT 1;

    IF v_target_level IS NULL THEN v_target_level := 1; END IF;

    -- Upsert user reputation record
    INSERT INTO public.user_reputation (
        profile_id,
        reputation_score,
        current_level_tier,
        positive_signals_count,
        verified_contributions_count,
        last_evaluated_at,
        updated_at
    ) VALUES (
        p_profile_id,
        v_score,
        v_target_level,
        (v_likes_count + v_referrals_count),
        (v_posts_count + v_achievements_count),
        now(),
        now()
    )
    ON CONFLICT (profile_id) DO UPDATE SET
        reputation_score = EXCLUDED.reputation_score,
        current_level_tier = EXCLUDED.current_level_tier,
        positive_signals_count = EXCLUDED.positive_signals_count,
        verified_contributions_count = EXCLUDED.verified_contributions_count,
        last_evaluated_at = now(),
        updated_at = now();

    RETURN jsonb_build_object(
        'success', true,
        'score', v_score,
        'level_tier', v_target_level
    );
END;
$$;

-- 9.5 Full Profile Recognition Summary
CREATE OR REPLACE FUNCTION public.get_profile_recognition(p_profile_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_founder JSONB;
    v_rep JSONB;
    v_badges JSONB;
    v_achievements JSONB;
    v_council JSONB;
    v_ambassador JSONB;
BEGIN
    -- Founder details
    SELECT jsonb_build_object(
        'is_founder', true,
        'founder_number', fm.founder_number,
        'formatted_number', fm.formatted_number,
        'program_name', fp.name,
        'designation', fp.designation
    ) INTO v_founder
    FROM public.founder_members fm
    JOIN public.founder_programs fp ON fp.id = fm.program_id
    WHERE fm.profile_id = p_profile_id AND fm.is_revoked = false
    LIMIT 1;

    -- Reputation
    SELECT jsonb_build_object(
        'score', ur.reputation_score,
        'level_tier', rl.level_tier,
        'level_name', rl.name,
        'level_title', rl.title,
        'level_emoji', rl.emoji
    ) INTO v_rep
    FROM public.user_reputation ur
    JOIN public.reputation_levels rl ON rl.level_tier = ur.current_level_tier
    WHERE ur.profile_id = p_profile_id;

    -- Active visible badges
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', b.id,
            'slug', b.slug,
            'name', b.name,
            'description', b.description,
            'icon', b.icon,
            'tier', b.tier,
            'rarity', b.rarity,
            'color_theme', b.color_theme,
            'is_featured', ub.is_featured,
            'awarded_at', ub.awarded_at
        ) ORDER BY b.display_priority DESC, ub.awarded_at ASC
    ) INTO v_badges
    FROM public.user_badges ub
    JOIN public.recognition_badges b ON b.id = ub.badge_id
    WHERE ub.profile_id = p_profile_id AND ub.is_revoked = false AND ub.is_visible = true;

    -- Unlocked achievements
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', a.id,
            'slug', a.slug,
            'name', a.name,
            'description', a.description,
            'category', a.category,
            'icon', a.icon,
            'points', a.points,
            'unlocked_at', ua.unlocked_at
        ) ORDER BY a.display_order ASC
    ) INTO v_achievements
    FROM public.user_achievements ua
    JOIN public.recognition_achievements a ON a.id = ua.achievement_id
    WHERE ua.profile_id = p_profile_id AND ua.is_unlocked = true;

    -- Council membership
    SELECT jsonb_build_object('is_member', true, 'status', fcm.status, 'joined_at', fcm.joined_at)
    INTO v_council
    FROM public.founders_council_members fcm
    WHERE fcm.profile_id = p_profile_id AND fcm.status = 'active'
    LIMIT 1;

    -- Ambassador
    SELECT jsonb_build_object('is_ambassador', true, 'territory', am.territory, 'appointed_at', am.appointed_at)
    INTO v_ambassador
    FROM public.ambassador_members am
    WHERE am.profile_id = p_profile_id AND am.status = 'active'
    LIMIT 1;

    RETURN jsonb_build_object(
        'founder', COALESCE(v_founder, '{"is_founder": false}'::jsonb),
        'reputation', COALESCE(v_rep, '{"score": 10, "level_tier": 1, "level_name": "Newcomer", "level_title": "New Member", "level_emoji": "🌱"}'::jsonb),
        'badges', COALESCE(v_badges, '[]'::jsonb),
        'achievements', COALESCE(v_achievements, '[]'::jsonb),
        'council', COALESCE(v_council, '{"is_member": false}'::jsonb),
        'ambassador', COALESCE(v_ambassador, '{"is_ambassador": false}'::jsonb)
    );
END;
$$;

-- =============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE public.recognition_badge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recognition_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founder_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founder_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recognition_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founders_council ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founders_council_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambassador_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambassador_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labs_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labs_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labs_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.early_access_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.early_access_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spotlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.awards_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.award_nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.award_winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recognition_referrals ENABLE ROW LEVEL SECURITY;

-- 10.1 Public Catalog Reads
CREATE POLICY "Public read badge categories" ON public.recognition_badge_categories FOR SELECT USING (true);
CREATE POLICY "Public read active badges" ON public.recognition_badges FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Public read active achievements" ON public.recognition_achievements FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Public read reputation levels" ON public.reputation_levels FOR SELECT USING (true);
CREATE POLICY "Public read founder programs" ON public.founder_programs FOR SELECT USING (true);
CREATE POLICY "Public read spotlights" ON public.spotlights FOR SELECT USING (is_published = true OR public.is_admin());
CREATE POLICY "Public read awards" ON public.awards_programs FOR SELECT USING (true);
CREATE POLICY "Public read award winners" ON public.award_winners FOR SELECT USING (true);
CREATE POLICY "Public read academy programs" ON public.academy_programs FOR SELECT USING (true);
CREATE POLICY "Public read labs programs" ON public.labs_programs FOR SELECT USING (true);

-- 10.2 User / Public Data Access
CREATE POLICY "Read visible user badges" ON public.user_badges FOR SELECT USING (
    (is_visible = true AND is_revoked = false) OR auth.uid() = profile_id OR public.is_admin()
);
CREATE POLICY "Users toggle badge visibility" ON public.user_badges FOR UPDATE USING (
    auth.uid() = profile_id
) WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Public read founder members" ON public.founder_members FOR SELECT USING (is_revoked = false OR public.is_admin());
CREATE POLICY "Public read user reputation" ON public.user_reputation FOR SELECT USING (true);
CREATE POLICY "Public read user achievements" ON public.user_achievements FOR SELECT USING (true);
CREATE POLICY "Public read user certifications" ON public.user_certifications FOR SELECT USING (true);
CREATE POLICY "Public read active council" ON public.founders_council_members FOR SELECT USING (status = 'active' OR public.is_admin());
CREATE POLICY "Public read active ambassadors" ON public.ambassador_members FOR SELECT USING (status = 'active' OR public.is_admin());

-- 10.3 Labs & Feedback
CREATE POLICY "Users read own labs memberships" ON public.labs_members FOR SELECT USING (auth.uid() = profile_id OR public.is_admin());
CREATE POLICY "Users opt in to labs" ON public.labs_members FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users opt out of labs" ON public.labs_members FOR DELETE USING (auth.uid() = profile_id);

CREATE POLICY "Users submit labs feedback" ON public.labs_feedback FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users read own labs feedback" ON public.labs_feedback FOR SELECT USING (auth.uid() = profile_id OR public.is_admin());

-- 10.4 Referrals & Early Access
CREATE POLICY "Users read own referrals" ON public.recognition_referrals FOR SELECT USING (
    auth.uid() = referrer_id OR auth.uid() = referred_id OR public.is_admin()
);
CREATE POLICY "Users read own early access" ON public.early_access_members FOR SELECT USING (auth.uid() = profile_id OR public.is_admin());

-- 10.5 Admin Management Policies
CREATE POLICY "Admin manage badge categories" ON public.recognition_badge_categories FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage badges" ON public.recognition_badges FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage achievements" ON public.recognition_achievements FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage founder programs" ON public.founder_programs FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage spotlights" ON public.spotlights FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage awards" ON public.awards_programs FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage award nominations" ON public.award_nominations FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage award winners" ON public.award_winners FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage council" ON public.founders_council FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage council members" ON public.founders_council_members FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage ambassadors" ON public.ambassador_programs FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage ambassador members" ON public.ambassador_members FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage academy" ON public.academy_programs FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage early access" ON public.early_access_programs FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage labs" ON public.labs_programs FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage labs feedback" ON public.labs_feedback FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =============================================================================
-- 11. CANONICAL INITIAL CATALOG SEED DATA
-- =============================================================================

-- Categories
INSERT INTO public.recognition_badge_categories (slug, name, description, icon, display_order) VALUES
('founding', 'Founding & Early Membership', 'Permanent historical distinctions for pioneer members of the TUKUBI ecosystem.', 'Landmark', 1),
('community', 'Community & Leadership', 'Recognition for community champions, leaders, and contributors.', 'Users', 2),
('creator', 'Creator Economy', 'Honors for digital creators, visual artists, and storytellers.', 'Sparkles', 3),
('podcasting', 'Audio & Podcasting', 'Recognition for podcast hosts, producers, and audio innovators.', 'Mic', 4),
('merchant', 'Marketplace & Commerce', 'Badges for sellers, merchants, and artisan traders.', 'ShoppingBag', 5),
('business', 'Commercial & Enterprise', 'Status designations for Caribbean enterprises and partners.', 'Building2', 6),
('platform', 'Platform Innovation & Labs', 'Beta testing champions, feedback contributors, and platform pioneers.', 'FlaskConical', 7),
('achievements', 'Digital Achievements', 'Milestones in connectivity, culture, and social engagement.', 'Trophy', 8),
('regional', 'Regional Pioneers', 'Founding representatives across Caribbean territories and diaspora hubs.', 'Globe', 9)
ON CONFLICT (slug) DO NOTHING;

-- Reputation Levels
INSERT INTO public.reputation_levels (level_tier, name, title, emoji, min_score, description, privileges) VALUES
(1, 'Newcomer', 'New Member', '🌱', 0, 'Welcome to TUKUBI. Begin your Caribbean digital journey.', '["basic_profile", "read_feeds", "comment"]'::jsonb),
(2, 'Contributor', 'Active Contributor', '⭐', 50, 'Consistent quality participation and positive social signals.', '["create_posts", "join_open_communities", "labs_eligible"]'::jsonb),
(3, 'Community Builder', 'Community Builder', '🔥', 150, 'Meaningful ecosystem engagement, verified referrals, and helpful community value.', '["create_communities", "early_access_eligible", "featured_feed_consideration"]'::jsonb),
(4, 'Community Leader', 'Community Leader', '💎', 400, 'Distinguished reputation, recognized contributions, and trusted leadership.', '["priority_support", "spotlight_eligible", "council_consideration"]'::jsonb),
(5, 'TUKUBI Ambassador', 'Platform Ambassador', '👑', 1000, 'Exemplary trust, regional impact, and platform representation.', '["private_ambassador_channel", "vip_event_access", "direct_product_feedback"]'::jsonb),
(6, 'Founding Member', 'Historical Founder', '🏛️', 2500, 'Permanent historical legacy of building the TUKUBI foundation.', '["all_privileges", "permanent_founder_frame", "hall_of_fame_record"]'::jsonb)
ON CONFLICT (level_tier) DO NOTHING;

-- Seed Master Founder Programs & Badges
DO $$
DECLARE
    v_cat_founding UUID;
    v_cat_community UUID;
    v_cat_creator UUID;
    v_cat_podcast UUID;
    v_cat_merchant UUID;
    v_cat_business UUID;
    v_cat_platform UUID;
    v_cat_achievement UUID;
    v_cat_regional UUID;

    v_badge_elite_id UUID;
    v_badge_1000_id UUID;
    v_badge_10k_id UUID;
    v_badge_pioneer_id UUID;
BEGIN
    SELECT id INTO v_cat_founding FROM public.recognition_badge_categories WHERE slug = 'founding';
    SELECT id INTO v_cat_community FROM public.recognition_badge_categories WHERE slug = 'community';
    SELECT id INTO v_cat_creator FROM public.recognition_badge_categories WHERE slug = 'creator';
    SELECT id INTO v_cat_podcast FROM public.recognition_badge_categories WHERE slug = 'podcasting';
    SELECT id INTO v_cat_merchant FROM public.recognition_badge_categories WHERE slug = 'merchant';
    SELECT id INTO v_cat_business FROM public.recognition_badge_categories WHERE slug = 'business';
    SELECT id INTO v_cat_platform FROM public.recognition_badge_categories WHERE slug = 'platform';
    SELECT id INTO v_cat_achievement FROM public.recognition_badge_categories WHERE slug = 'achievements';
    SELECT id INTO v_cat_regional FROM public.recognition_badge_categories WHERE slug = 'regional';

    -- 1. Founding Badges
    INSERT INTO public.recognition_badges (category_id, slug, name, description, icon, tier, rarity, display_priority, max_recipients, is_permanent, color_theme)
    VALUES
    (v_cat_founding, 'founding_elite_100', 'TUKUBI Founding Elite', 'One of the first 100 pioneer members shaping the foundation of TUKUBI.', 'Crown', 'diamond', 'mythic', 100, 100, true, '{"bg": "from-amber-900/60 to-purple-950/80", "border": "border-amber-400/80", "text": "text-amber-300"}'::jsonb)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_badge_elite_id;

    INSERT INTO public.recognition_badges (category_id, slug, name, description, icon, tier, rarity, display_priority, max_recipients, is_permanent, color_theme)
    VALUES
    (v_cat_founding, 'founding_1000', 'TUKUBI Founding 1000', 'Permanent founding member among the first 1,000 verified accounts on TUKUBI.', 'Landmark', 'gold', 'legendary', 90, 1000, true, '{"bg": "from-amber-950/50 to-slate-900", "border": "border-amber-500/60", "text": "text-amber-200"}'::jsonb)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_badge_1000_id;

    INSERT INTO public.recognition_badges (category_id, slug, name, description, icon, tier, rarity, display_priority, max_recipients, is_permanent, color_theme)
    VALUES
    (v_cat_founding, 'founding_10k', 'TUKUBI Founder', 'Permanent founding generation member of the first 10,000 accounts.', 'ShieldCheck', 'silver', 'epic', 80, 10000, true, '{"bg": "from-cyan-950/50 to-slate-900", "border": "border-cyan-500/50", "text": "text-cyan-200"}'::jsonb)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_badge_10k_id;

    INSERT INTO public.recognition_badges (category_id, slug, name, description, icon, tier, rarity, display_priority, max_recipients, is_permanent, color_theme)
    VALUES
    (v_cat_founding, 'pioneer_100k', 'TUKUBI Pioneer', 'Early adopter among the first 100,000 members across the Caribbean digital sphere.', 'Compass', 'bronze', 'rare', 70, 100000, true, '{"bg": "from-slate-800 to-slate-900", "border": "border-slate-700", "text": "text-slate-200"}'::jsonb)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_badge_pioneer_id;

    -- Secondary Founding Badges
    INSERT INTO public.recognition_badges (category_id, slug, name, description, icon, tier, rarity, display_priority, is_permanent) VALUES
    (v_cat_founding, 'launch_day_member', 'Launch Day Member', 'Joined TUKUBI on its official launch day.', 'Flame', 'gold', 'rare', 65, true),
    (v_cat_founding, 'early_adopter', 'Early Adopter', 'Joined TUKUBI during its initial founding cycle.', 'Sparkles', 'standard', 'uncommon', 50, true)
    ON CONFLICT (slug) DO NOTHING;

    -- 2. Community Badges
    INSERT INTO public.recognition_badges (category_id, slug, name, description, icon, tier, rarity, display_priority, is_permanent) VALUES
    (v_cat_community, 'community_contributor', 'Community Contributor', 'Regularly provides helpful contributions to the Caribbean social sphere.', 'MessageSquare', 'standard', 'common', 40, true),
    (v_cat_community, 'community_builder', 'Community Builder', 'Actively builds and nurtures vibrant community spaces.', 'Users', 'bronze', 'uncommon', 55, true),
    (v_cat_community, 'community_leader', 'Community Leader', 'Trusted leader fostering cultural dialogue and community growth.', 'Award', 'silver', 'rare', 65, true),
    (v_cat_community, 'community_guardian', 'Community Guardian', 'Promotes safety, respect, and positive culture across TUKUBI.', 'Shield', 'gold', 'epic', 75, true),
    (v_cat_community, 'tukubi_ambassador', 'TUKUBI Ambassador', 'Official platform ambassador representing Caribbean culture and excellence.', 'Crown', 'platinum', 'legendary', 85, false)
    ON CONFLICT (slug) DO NOTHING;

    -- 3. Creator Badges
    INSERT INTO public.recognition_badges (category_id, slug, name, description, icon, tier, rarity, display_priority, is_permanent) VALUES
    (v_cat_creator, 'founding_creator', 'Founding Creator', 'Pioneering creator publishing original content from day one.', 'Sparkles', 'gold', 'legendary', 80, true),
    (v_cat_creator, 'creator_pioneer', 'Creator Pioneer', 'Early creator bringing unique Caribbean culture to digital media.', 'Zap', 'silver', 'epic', 70, true),
    (v_cat_creator, 'rising_creator', 'Rising Creator', 'Rapidly growing creator with outstanding community engagement.', 'TrendingUp', 'bronze', 'rare', 60, false),
    (v_cat_creator, 'featured_creator', 'Featured Creator', 'Editorially spotlighted creator on TUKUBI discovery.', 'Star', 'gold', 'rare', 65, false),
    (v_cat_creator, 'top_creator', 'Top Creator', 'Premier creator recognized for exceptional creative output.', 'Trophy', 'platinum', 'legendary', 85, false),
    (v_cat_creator, 'creator_spotlight', 'Creator Spotlight', 'Featured in the official TUKUBI Creator Spotlight.', 'Sun', 'silver', 'rare', 60, false)
    ON CONFLICT (slug) DO NOTHING;

    -- 4. Podcasting Badges
    INSERT INTO public.recognition_badges (category_id, slug, name, description, icon, tier, rarity, display_priority, is_permanent) VALUES
    (v_cat_podcast, 'founding_podcaster', 'Founding Podcaster', 'Pioneering voice launching one of the first podcasts on TUKUBI.', 'Mic', 'gold', 'legendary', 80, true),
    (v_cat_podcast, 'podcast_pioneer', 'Podcast Pioneer', 'Early audio creator enriching the Caribbean podcast landscape.', 'Radio', 'silver', 'epic', 70, true),
    (v_cat_podcast, 'rising_podcaster', 'Rising Podcaster', 'Audio show demonstrating strong audience growth and listenership.', 'Activity', 'bronze', 'rare', 60, false),
    (v_cat_podcast, 'featured_podcaster', 'Featured Podcaster', 'Featured show in the TUKUBI Podcast Directory.', 'Headphones', 'gold', 'rare', 65, false)
    ON CONFLICT (slug) DO NOTHING;

    -- 5. Merchant Badges
    INSERT INTO public.recognition_badges (category_id, slug, name, description, icon, tier, rarity, display_priority, is_permanent) VALUES
    (v_cat_merchant, 'founding_merchant', 'Founding Merchant', 'Pioneer merchant establishing an early storefront on TUKUBI Marketplace.', 'Store', 'gold', 'legendary', 80, true),
    (v_cat_merchant, 'marketplace_pioneer', 'Marketplace Pioneer', 'Early commerce pioneer connecting Caribbean goods with buyers.', 'PackageCheck', 'silver', 'epic', 70, true),
    (v_cat_merchant, 'verified_merchant', 'Verified Merchant', 'Verified seller with legitimate commercial standing and identity.', 'BadgeCheck', 'bronze', 'uncommon', 60, false),
    (v_cat_merchant, 'trusted_merchant', 'Trusted Merchant', 'Exceptional fulfillment record, verified reviews, and customer trust.', 'ShieldCheck', 'silver', 'rare', 70, false),
    (v_cat_merchant, 'top_merchant', 'Top Merchant', 'Premier marketplace seller with stellar volume and reputation.', 'Award', 'platinum', 'legendary', 85, false),
    (v_cat_merchant, 'community_favorite_merchant', 'Community Favorite Merchant', 'Beloved merchant celebrated by the TUKUBI community.', 'HeartHandshake', 'gold', 'rare', 65, false)
    ON CONFLICT (slug) DO NOTHING;

    -- 6. Business Badges
    INSERT INTO public.recognition_badges (category_id, slug, name, description, icon, tier, rarity, display_priority, is_permanent) VALUES
    (v_cat_business, 'founding_business', 'Founding Business', 'Pioneering business registered during the initial platform launch.', 'Building2', 'gold', 'legendary', 80, true),
    (v_cat_business, 'business_pioneer', 'Business Pioneer', 'Early commercial innovator driving Caribbean digital transformation.', 'Briefcase', 'silver', 'epic', 70, true),
    (v_cat_business, 'verified_business', 'Verified Business', 'Verified enterprise with authenticated company credentials.', 'CheckCircle2', 'bronze', 'uncommon', 60, false),
    (v_cat_business, 'trusted_business', 'Trusted Business', 'Consistently delivering verified services with high community ratings.', 'Shield', 'silver', 'rare', 70, false),
    (v_cat_business, 'featured_business', 'Featured Business', 'Editorially showcased in the TUKUBI Business Directory.', 'Sparkle', 'gold', 'rare', 65, false),
    (v_cat_business, 'community_recommended_business', 'Community Recommended Business', 'Highly recommended commercial partner across the diaspora.', 'ThumbsUp', 'gold', 'rare', 65, false)
    ON CONFLICT (slug) DO NOTHING;

    -- 7. Platform & Labs Badges
    INSERT INTO public.recognition_badges (category_id, slug, name, description, icon, tier, rarity, display_priority, is_permanent) VALUES
    (v_cat_platform, 'tukubi_labs_member', 'TUKUBI Labs Member', 'Active participant testing experimental beta features.', 'FlaskConical', 'bronze', 'uncommon', 50, false),
    (v_cat_platform, 'beta_pioneer', 'Beta Pioneer', 'Early participant in core platform beta testing cycles.', 'Code2', 'silver', 'rare', 60, true),
    (v_cat_platform, 'product_contributor', 'Product Contributor', 'Provided actionable feedback that directly shaped product improvements.', 'Wrench', 'silver', 'rare', 65, true),
    (v_cat_platform, 'feedback_champion', 'Feedback Champion', 'Outstanding dedication to testing and reporting issues.', 'CheckCheck', 'gold', 'epic', 75, true)
    ON CONFLICT (slug) DO NOTHING;

    -- 8. Achievement & Referral Badges
    INSERT INTO public.recognition_badges (category_id, slug, name, description, icon, tier, rarity, display_priority, is_permanent) VALUES
    (v_cat_achievement, 'connector', 'Connector', 'Successfully invited 5 verified members to join the TUKUBI network.', 'UserPlus', 'bronze', 'common', 45, true),
    (v_cat_achievement, 'community_builder_referral', 'Network Builder', 'Successfully invited 25 verified members to TUKUBI.', 'Network', 'silver', 'rare', 60, true),
    (v_cat_achievement, 'ambassador_candidate', 'Ambassador Candidate', 'Successfully brought 100+ verified members to the platform.', 'Crown', 'gold', 'epic', 75, true),
    (v_cat_achievement, 'island_connector', 'Island Connector', 'Actively engaged across 3 or more distinct Caribbean country spaces.', 'Palmtree', 'gold', 'rare', 65, true),
    (v_cat_achievement, 'trendsetter', 'Trendsetter', 'Created a post or media item that achieved widespread viral engagement.', 'Flame', 'silver', 'rare', 60, true),
    (v_cat_achievement, 'night_owl', 'Night Owl', 'Active in the vibrant late-night Caribbean culture discussions.', 'Moon', 'standard', 'common', 35, true),
    (v_cat_achievement, 'first_voice', 'First Voice', 'Participated in one of the inaugural audio rooms or podcast releases.', 'Volume2', 'silver', 'rare', 60, true)
    ON CONFLICT (slug) DO NOTHING;

    -- 9. Regional Pioneers
    INSERT INTO public.recognition_badges (category_id, slug, name, description, icon, tier, rarity, display_priority, is_permanent) VALUES
    (v_cat_regional, 'pioneer_jamaica', 'Jamaica Pioneer 🇯🇲', 'Pioneer representative from Jamaica.', 'Flag', 'bronze', 'rare', 50, true),
    (v_cat_regional, 'pioneer_dom_rep', 'Dominican Republic Pioneer 🇩🇴', 'Pioneer representative from Dominican Republic.', 'Flag', 'bronze', 'rare', 50, true),
    (v_cat_regional, 'pioneer_trinidad', 'Trinidad & Tobago Pioneer 🇹🇹', 'Pioneer representative from Trinidad & Tobago.', 'Flag', 'bronze', 'rare', 50, true),
    (v_cat_regional, 'pioneer_barbados', 'Barbados Pioneer 🇧🇧', 'Pioneer representative from Barbados.', 'Flag', 'bronze', 'rare', 50, true),
    (v_cat_regional, 'pioneer_haiti', 'Haiti Pioneer 🇭🇹', 'Pioneer representative from Haiti.', 'Flag', 'bronze', 'rare', 50, true),
    (v_cat_regional, 'pioneer_bahamas', 'Bahamas Pioneer 🇧🇸', 'Pioneer representative from The Bahamas.', 'Flag', 'bronze', 'rare', 50, true),
    (v_cat_regional, 'pioneer_guyana', 'Guyana Pioneer 🇬🇾', 'Pioneer representative from Guyana.', 'Flag', 'bronze', 'rare', 50, true),
    (v_cat_regional, 'pioneer_suriname', 'Suriname Pioneer 🇸🇷', 'Pioneer representative from Suriname.', 'Flag', 'bronze', 'rare', 50, true),
    (v_cat_regional, 'pioneer_saint_lucia', 'Saint Lucia Pioneer 🇱🇨', 'Pioneer representative from Saint Lucia.', 'Flag', 'bronze', 'rare', 50, true),
    (v_cat_regional, 'pioneer_antigua', 'Antigua & Barbuda Pioneer 🇦🇬', 'Pioneer representative from Antigua & Barbuda.', 'Flag', 'bronze', 'rare', 50, true)
    ON CONFLICT (slug) DO NOTHING;

    -- Seed Founder Programs with references to created badges
    INSERT INTO public.founder_programs (slug, name, designation, description, badge_id, max_members, sequence_prefix, benefits) VALUES
    ('founding_elite_100', 'TUKUBI Founding Elite', 'TUKUBI Founding Elite', 'The first 100 visionary members of TUKUBI.', v_badge_elite_id, 100, '#', '["Permanent Founding Elite Badge", "Numbered Founder Designation (#0001-0100)", "Founders Council Priority Invitation", "Early Beta & Feature Previews", "Exclusive Profile Customizations", "VIP Event Invitations"]'::jsonb),
    ('founding_1000', 'TUKUBI Founding 1000', 'TUKUBI Founding 1000', 'The first 1,000 pioneer members building TUKUBI.', v_badge_1000_id, 1000, '#', '["Permanent Founding 1000 Badge", "Numbered Founder Designation (#0001-1000)", "Early Adopter Badge", "Founder Community Access", "Early Access to New Features", "Founders Hall of Fame Record"]'::jsonb),
    ('founders_10k', 'TUKUBI Founders', 'TUKUBI Founder', 'The first 10,000 members establishing the network.', v_badge_10k_id, 10000, '#', '["Permanent Founding Member Badge", "Early Adopter Distinction", "Selected Beta Feature Opportunities", "Special Profile Recognition"]'::jsonb),
    ('pioneers_100k', 'TUKUBI Pioneers', 'TUKUBI Pioneer', 'The first 100,000 members expanding Caribbean digital influence.', v_badge_pioneer_id, 100000, '#', '["Permanent Pioneer Badge", "Early Community Recognition", "Selected Early-Access Opportunities", "Ambassador Consideration"]'::jsonb)
    ON CONFLICT (slug) DO NOTHING;
END $$;

-- Seed Digital Achievements
INSERT INTO public.recognition_achievements (slug, name, description, category, icon, points, rarity, display_order) VALUES
('connector_5', 'Connector', 'Invited 5 verified members to join TUKUBI.', 'referrals', 'UserPlus', 25, 'common', 1),
('community_builder_25', 'Community Builder', 'Invited 25 verified members to join the community.', 'referrals', 'Users', 75, 'rare', 2),
('ambassador_100', 'Ambassador Candidate', 'Invited 100 verified members across the diaspora.', 'referrals', 'Crown', 250, 'epic', 3),
('island_connector', 'Island Connector', 'Interacted with posts or communities from 3+ Caribbean countries.', 'culture', 'Palmtree', 50, 'rare', 4),
('night_owl', 'Night Owl', 'Engaged in late night Caribbean cultural dialogues.', 'social', 'Moon', 20, 'common', 5),
('trendsetter', 'Trendsetter', 'Published a post reaching significant organic engagement.', 'content', 'Flame', 80, 'rare', 6),
('first_voice', 'First Voice', 'Published an audio story or podcast episode.', 'audio', 'Mic', 50, 'rare', 7),
('marketplace_pioneer', 'Marketplace Pioneer', 'Listed or purchased a product on the TUKUBI Marketplace.', 'commerce', 'Store', 50, 'rare', 8)
ON CONFLICT (slug) DO NOTHING;

-- Grant Execution Permissions
GRANT EXECUTE ON FUNCTION public.allocate_founder_number(UUID, VARCHAR) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.award_badge(UUID, VARCHAR, TEXT, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.revoke_badge(UUID, VARCHAR, TEXT, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.evaluate_user_reputation(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_profile_recognition(UUID) TO authenticated, service_role, anon;
