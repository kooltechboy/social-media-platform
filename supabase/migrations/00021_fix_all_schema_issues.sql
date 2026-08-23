-- Migration 00021: Fix All Schema Issues
-- Description: Fixes missing RLS policies, SECURITY DEFINER, column mismatches,
--              mutable balance violation, duplicate FK constraints, broken audit triggers

-- =============================================================================
-- 1. CREATE PUBLIC.ACCOUNTS TABLE (referenced by 00002 RLS policy)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role VARCHAR(30) NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages accounts" ON public.accounts
    FOR ALL USING (false) WITH CHECK (false);

-- =============================================================================
-- 2. ADD MISSING RLS POLICIES FOR blocks, comments, post_reactions, video_views
-- =============================================================================

-- blocks: blocker can insert/delete; both can see their blocks
CREATE POLICY "Blocker manages blocks" ON public.blocks
    FOR ALL USING (auth.uid() = blocker_id) WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Blocked user sees blocks" ON public.blocks
    FOR SELECT USING (auth.uid() = blocked_id);

-- comments: anyone can read comments on visible posts; authenticated users can insert
CREATE POLICY "Read comments on visible posts" ON public.comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.posts p
            WHERE p.id = post_id
            AND (
                p.visibility = 'public'
                OR p.author_id = auth.uid()
                OR (p.visibility = 'followers' AND EXISTS (
                    SELECT 1 FROM public.follows f WHERE f.follower_id = auth.uid() AND f.following_id = p.author_id
                ))
            )
        )
    );
CREATE POLICY "Authenticated users create comments" ON public.comments
    FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors update own comments" ON public.comments
    FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors delete own comments" ON public.comments
    FOR DELETE USING (auth.uid() = author_id);

-- post_reactions: authenticated users can toggle reactions; anyone can see count
CREATE POLICY "Read post reactions" ON public.post_reactions
    FOR SELECT USING (true);
CREATE POLICY "Upsert own reaction" ON public.post_reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Remove own reaction" ON public.post_reactions
    FOR DELETE USING (auth.uid() = user_id);

-- video_views: viewers record their own views; creators see their video view data
CREATE POLICY "Viewer records own view" ON public.video_views
    FOR INSERT WITH CHECK (auth.uid() = viewer_id);
CREATE POLICY "Participants read video views" ON public.video_views
    FOR SELECT USING (
        auth.uid() = viewer_id
        OR EXISTS (
            SELECT 1 FROM public.videos v WHERE v.id = video_id AND v.creator_id = auth.uid()
        )
    );

-- =============================================================================
-- 3. FIX 00017: AUDIT TRIGGERS — REPLACE WITH CORRECT COLUMNS + SECURITY DEFINER
-- =============================================================================

-- Drop broken functions if they exist
DROP FUNCTION IF EXISTS public.handle_profile_identity_audit() CASCADE;
DROP FUNCTION IF EXISTS public.handle_profile_audit() CASCADE;

-- Re-create with correct columns matching actual audit_logs schema
CREATE OR REPLACE FUNCTION public.handle_profile_identity_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
    VALUES (
        COALESCE(auth.uid(), NEW.profile_id),
        TG_OP,
        'profile_identity',
        NEW.profile_id,
        jsonb_build_object(
            'changed_fields', CASE
                WHEN TG_OP = 'UPDATE' THEN (
                    SELECT jsonb_object_agg(key, value)
                    FROM jsonb_each(to_jsonb(OLD))
                    WHERE to_jsonb(NEW) ? key AND to_jsonb(OLD) ->> key IS DISTINCT FROM to_jsonb(NEW) ->> key
                )
                ELSE null
            END
        )
    );
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_profile_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
    VALUES (
        COALESCE(auth.uid(), NEW.id),
        TG_OP,
        'profiles',
        NEW.id,
        jsonb_build_object(
            'changed_fields', CASE
                WHEN TG_OP = 'UPDATE' THEN (
                    SELECT jsonb_object_agg(key, value)
                    FROM jsonb_each(to_jsonb(OLD))
                    WHERE to_jsonb(NEW) ? key AND to_jsonb(OLD) ->> key IS DISTINCT FROM to_jsonb(NEW) ->> key
                )
                ELSE null
            END
        )
    );
    RETURN NEW;
END;
$$;

-- Re-attach triggers
CREATE TRIGGER trg_profile_identity_audit
AFTER INSERT OR UPDATE OR DELETE ON public.profile_identity
FOR EACH ROW EXECUTE FUNCTION public.handle_profile_identity_audit();

CREATE TRIGGER trg_profile_audit
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_profile_audit();

-- =============================================================================
-- 4. FIX 00017: PROFILE VISIBILITY — allow NULL profile_identity to be visible
-- =============================================================================

-- Drop and recreate the public minimal profile access policy
DROP POLICY IF EXISTS "Public minimal profile access" ON public.profiles;
CREATE POLICY "Public minimal profile access" ON public.profiles
    FOR SELECT
    USING (
        is_private = FALSE
        OR auth.uid() = id
    );

-- Fix the sticky is_private check — allow users to toggle privacy
DROP POLICY IF EXISTS "User update own profile" ON public.profiles;
CREATE POLICY "User update own profile" ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- =============================================================================
-- 5. FIX 00018: DROP DUPLICATE FK CONSTRAINTS AND ADD CORRECT ONES
-- =============================================================================

-- Drop duplicate FK constraints (already defined in 00002)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS fk_profiles_origin_country;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS fk_profiles_current_country;

-- Drop FK constraints referencing non-existent columns on profiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS fk_profiles_origin_region;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS fk_profiles_origin_city;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS fk_profiles_current_city;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS fk_profiles_diaspora_hub;

-- Drop invalid RLS policy
DROP POLICY IF EXISTS "Block invalid country references" ON public.profiles;

-- =============================================================================
-- 6. FIX 00018: ADD CORRECT FK CONSTRAINTS ON profile_identity TABLE
-- =============================================================================

-- Add FK constraints to profile_identity where the columns actually exist
ALTER TABLE public.profile_identity DROP CONSTRAINT IF EXISTS fk_profile_identity_origin_region;
ALTER TABLE public.profile_identity DROP CONSTRAINT IF EXISTS fk_profile_identity_origin_city;
ALTER TABLE public.profile_identity DROP CONSTRAINT IF EXISTS fk_profile_identity_current_city;
ALTER TABLE public.profile_identity DROP CONSTRAINT IF EXISTS fk_profile_identity_diaspora_hub;

ALTER TABLE public.profile_identity
    ADD CONSTRAINT fk_profile_identity_origin_region
    FOREIGN KEY (origin_region_id) REFERENCES public.regions(id) ON DELETE SET NULL;

ALTER TABLE public.profile_identity
    ADD CONSTRAINT fk_profile_identity_origin_city
    FOREIGN KEY (origin_city_id) REFERENCES public.cities(id) ON DELETE SET NULL;

ALTER TABLE public.profile_identity
    ADD CONSTRAINT fk_profile_identity_current_city
    FOREIGN KEY (current_city_id) REFERENCES public.cities(id) ON DELETE SET NULL;

ALTER TABLE public.profile_identity
    ADD CONSTRAINT fk_profile_identity_diaspora_hub
    FOREIGN KEY (diaspora_hub_id) REFERENCES public.cities(id) ON DELETE SET NULL;

-- =============================================================================
-- 7. FIX 00019/00020: REPLACE MUTABLE BALANCE INCREMENT WITH COMPUTED BALANCE
-- =============================================================================

-- Replace update_ledger_account_balance with computed SUM approach
CREATE OR REPLACE FUNCTION public.update_ledger_account_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.ledger_accounts
    SET balance = (
        SELECT COALESCE(SUM(amount), 0)
        FROM public.ledger_entries
        WHERE account_id = NEW.account_id
    )
    WHERE id = NEW.account_id;
    RETURN NEW;
END;
$$;

-- Replace auto_create_creator_pending_ledger with SECURITY DEFINER + search_path
CREATE OR REPLACE FUNCTION public.auto_create_creator_pending_ledger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.ledger_accounts (owner_id, account_type, currency)
    VALUES (NEW.profile_id, 'creator_pending', 'USD');
    RETURN NEW;
END;
$$;

-- =============================================================================
-- 8. FIX 00011: enforce_ledger_sum_zero — add SECURITY DEFINER + SET search_path
-- =============================================================================

CREATE OR REPLACE FUNCTION public.enforce_ledger_sum_zero()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- =============================================================================
-- 9. FIX 00003: post_media SELECT policy — respect post visibility
-- =============================================================================

DROP POLICY IF EXISTS "Read post media with post visibility" ON public.post_media;

CREATE POLICY "Read post media with post visibility" ON public.post_media
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.posts p
            WHERE p.id = post_id
            AND (
                p.visibility = 'public'
                OR p.author_id = auth.uid()
                OR (p.visibility = 'followers' AND EXISTS (
                    SELECT 1 FROM public.follows f WHERE f.follower_id = auth.uid() AND f.following_id = p.author_id
                ))
            )
        )
    );

-- =============================================================================
-- 10. FIX 00017: Geographic data minimization — allow NULL origin_region_id/city_id
-- =============================================================================

DROP POLICY IF EXISTS "Geographic data minimization" ON public.profile_identity;

CREATE POLICY "Geographic data minimization" ON public.profile_identity
    FOR SELECT
    USING (
        auth.uid() = profile_id
        OR visibility = 'public'
    );

-- =============================================================================
-- 11. FIX 00017: Owner update identity — simplify WITH CHECK
-- =============================================================================

DROP POLICY IF EXISTS "Owner update own identity" ON public.profile_identity;

CREATE POLICY "Owner update own identity" ON public.profile_identity
    FOR ALL
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);