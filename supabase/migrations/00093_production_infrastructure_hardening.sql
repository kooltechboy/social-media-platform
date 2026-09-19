-- =============================================================================
-- Migration 00093: Production Infrastructure Hardening & Security Remediation
-- =============================================================================
-- Description:
--   Comprehensive production hardening addressing verified advisor findings:
--   1. Drop 7 duplicate indexes on events, message_attachments, message_receipts,
--      message_requests, post_reactions, posts, videos (+ redundant profiles index).
--   2. Enforce immutable/strict search_path = public on official_account_id,
--      sync_feature_flag_status, and sync_sound_usage_count.
--   3. Relocate pg_trgm extension from public to extensions schema.
--   4. Revoke direct EXECUTE on 27 trigger & internal automation functions from PUBLIC,
--      anon, and authenticated (triggers fire automatically on table mutations).
--   5. Revoke EXECUTE from anon on all remaining 26 SECURITY DEFINER RPCs.
--   6. Contain administrative/DDL RPCs (create_monthly_partition, ingest_carrier_tracking_event,
--      log_admin_action, allocate_founder_number, award_badge, revoke_badge,
--      bootstrap_official_tukubi_account, seed_default_community_roles) strictly to service_role.
--   7. Grant EXECUTE to authenticated role only on user-facing feature RPCs.
--   8. Enforce explicit Row Level Security (RLS) policies and containment on 28
--      tables and partitions (reconciliation_reports, analytics_events_*,
--      chat_messages_p0..p7, feed_activity_timeline_*).
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. DROP DUPLICATE & REDUNDANT INDEXES
-- =============================================================================

-- Events: starts_at duplicate (keep idx_events_starts_at_upcoming)
DROP INDEX IF EXISTS public.idx_events_starts;

-- Message Attachments: message_id duplicate (keep idx_message_attachments_message_id)
DROP INDEX IF EXISTS public.idx_message_attachments_message;

-- Message Receipts: message_id duplicate (keep idx_message_receipts_message_id)
DROP INDEX IF EXISTS public.idx_message_receipts_message;

-- Message Requests: conversation_id duplicate (keep idx_message_requests_conversation_id)
DROP INDEX IF EXISTS public.idx_message_requests_conversation;

-- Post Reactions: duplicate of primary key post_reactions_pkey (keep post_reactions_pkey)
DROP INDEX IF EXISTS public.idx_post_reactions_unique_user;

-- Posts: country_id + created_at duplicate (keep idx_posts_country_created_at)
DROP INDEX IF EXISTS public.idx_posts_country_created;

-- Videos: video_kind + created_at duplicate (keep idx_videos_kind_created)
DROP INDEX IF EXISTS public.idx_videos_kind;

-- Profiles: redundant index on origin_country_id (keep idx_profiles_origin_country_id)
DROP INDEX IF EXISTS public.idx_profiles_origin_country;


-- =============================================================================
-- 2. HARDEN FUNCTION SEARCH_PATH
-- =============================================================================

CREATE OR REPLACE FUNCTION public.official_account_id()
RETURNS uuid
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $function$
    SELECT 'a0000000-0000-4000-8000-000000000001'::uuid;
$function$;

CREATE OR REPLACE FUNCTION public.sync_feature_flag_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    IF NEW.enabled IS DISTINCT FROM OLD.enabled THEN
        NEW.is_enabled := NEW.enabled;
    ELSIF NEW.is_enabled IS DISTINCT FROM OLD.is_enabled THEN
        NEW.enabled := NEW.is_enabled;
    END IF;
    NEW.updated_at := now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_sound_usage_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.sounds
        SET usage_count = usage_count + 1
        WHERE id = NEW.sound_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.sounds
        SET usage_count = GREATEST(0, usage_count - 1)
        WHERE id = OLD.sound_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$function$;


-- =============================================================================
-- 3. RELOCATE EXTENSIONS FROM PUBLIC SCHEMA
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_extension e
        JOIN pg_namespace n ON n.oid = e.extnamespace
        WHERE e.extname = 'pg_trgm' AND n.nspname = 'public'
    ) THEN
        ALTER EXTENSION pg_trgm SET SCHEMA extensions;
    END IF;
END $$;


-- =============================================================================
-- 4. REVOKE EXECUTE ON TRIGGER & INTERNAL AUTOMATION FUNCTIONS
-- =============================================================================

REVOKE ALL ON FUNCTION public.auto_create_creator_pending_ledger() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.calculate_profile_age_tier() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_reserved_username() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_expired_trending_signals() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_ledger_sum_zero() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_notify_message_recipients() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_sync_message_sequence_and_conversation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_creator_draft_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_follow_count_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_follow_notification() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_friendship_count_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_friendship_notification() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_like_received_count_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_notification_preferences() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_profile_counts() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_profile_welcome() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_podcast_follower_count_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_poll_vote_insert() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_post_count_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_profile_audit() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_profile_identity_audit() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_official_post_flags() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_sound_usage_count() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_feature_flag_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_help_article_updated_at() FROM PUBLIC, anon, authenticated;


-- =============================================================================
-- 5. HARDEN ADMINISTRATIVE & SERVICE RPC FUNCTIONS
-- =============================================================================

-- Restrict administrative DDL and ingestion functions to service_role only
REVOKE ALL ON FUNCTION public.create_monthly_partition(text, date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_monthly_partition(text, date) TO service_role;

REVOKE ALL ON FUNCTION public.ingest_carrier_tracking_event(character varying, text, character varying, text, text, timestamp with time zone) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ingest_carrier_tracking_event(character varying, text, character varying, text, text, timestamp with time zone) TO service_role;

REVOKE ALL ON FUNCTION public.log_admin_action(uuid, character varying, character varying, uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_admin_action(uuid, character varying, character varying, uuid, jsonb) TO service_role;

REVOKE ALL ON FUNCTION public.allocate_founder_number(uuid, character varying) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.allocate_founder_number(uuid, character varying) TO service_role;

REVOKE ALL ON FUNCTION public.award_badge(uuid, character varying, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_badge(uuid, character varying, text, uuid) TO service_role;

REVOKE ALL ON FUNCTION public.revoke_badge(uuid, character varying, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_badge(uuid, character varying, text, uuid) TO service_role;

REVOKE ALL ON FUNCTION public.bootstrap_official_tukubi_account(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_official_tukubi_account(uuid, uuid) TO service_role;

REVOKE ALL ON FUNCTION public.seed_default_community_roles() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.seed_default_community_roles() TO service_role;


-- =============================================================================
-- 6. HARDEN USER-FACING RPC FUNCTIONS (REVOKE ANON, GRANT AUTHENTICATED)
-- =============================================================================

REVOKE ALL ON FUNCTION public.create_secure_checkout(checkout_line_item[], character varying, character varying) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_secure_checkout(checkout_line_item[], character varying, character varying) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.submit_marketplace_offer(uuid, integer, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_marketplace_offer(uuid, integer, integer, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.pin_livestream_product(uuid, uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pin_livestream_product(uuid, uuid, integer) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.unpin_livestream_product(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.unpin_livestream_product(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.confirm_parental_consent(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_parental_consent(uuid, uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_active_community_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_community_member(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_official_account(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_official_account(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_official_account_operator(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_official_account_operator(uuid, uuid, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_order_participant(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_order_participant(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_staff() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.has_creator_team_role(uuid, uuid, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_creator_team_role(uuid, uuid, text[]) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.increment_podcast_followers(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_podcast_followers(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.decrement_podcast_followers(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decrement_podcast_followers(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.increment_product_views(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_product_views(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.ensure_ledger_account(uuid, ledger_account_type, character varying) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_ledger_account(uuid, ledger_account_type, character varying) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_creator_gift_earnings(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_creator_gift_earnings(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_mutual_connections_count(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_mutual_connections_count(uuid, uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_mutual_friends(uuid, uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_mutual_friends(uuid, uuid, integer) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_profile_recognition(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_profile_recognition(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.evaluate_user_reputation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.evaluate_user_reputation(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_available_identities(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_available_identities(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.switch_active_identity(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.switch_active_identity(uuid, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.toggle_favorite(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.toggle_favorite(uuid, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_profile_friends(uuid, uuid, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_profile_friends(uuid, uuid, integer, integer) TO authenticated, service_role;


-- =============================================================================
-- 7. EXPLICIT RLS POLICIES & CONTAINMENT FOR PARTITIONS & INTERNAL TABLES
-- =============================================================================

-- A. Reconciliation Reports (Internal accounting audit logs)
REVOKE ALL ON public.reconciliation_reports FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.reconciliation_reports TO service_role;

DROP POLICY IF EXISTS "Service role manages reconciliation reports" ON public.reconciliation_reports;
CREATE POLICY "Service role manages reconciliation reports"
    ON public.reconciliation_reports
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- B. Analytics Events Partitions
DO $$
DECLARE
    part TEXT;
    parts TEXT[] := ARRAY[
        'analytics_events_2026_01', 'analytics_events_2026_02', 'analytics_events_2026_03',
        'analytics_events_2026_04', 'analytics_events_2026_05', 'analytics_events_2026_06',
        'analytics_events_2026_07', 'analytics_events_2026_08', 'analytics_events_2026_09',
        'analytics_events_2026_10', 'analytics_events_2026_11', 'analytics_events_2026_12',
        'analytics_events_default'
    ];
BEGIN
    FOREACH part IN ARRAY parts LOOP
        IF EXISTS (SELECT 1 FROM pg_class WHERE relname = part) THEN
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', part || '_insert', part);
            EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated, anon WITH CHECK (true);', part || '_insert', part);

            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', part || '_select', part);
            EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());', part || '_select', part);
        END IF;
    END LOOP;
END $$;

-- C. Chat Messages Shard Partitions (p0 through p7)
DO $$
DECLARE
    i INT;
    part TEXT;
BEGIN
    FOR i IN 0..7 LOOP
        part := 'chat_messages_p' || i;
        IF EXISTS (SELECT 1 FROM pg_class WHERE relname = part) THEN
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', part || '_select', part);
            EXECUTE format($pol$
                CREATE POLICY %I ON public.%I
                FOR SELECT TO authenticated
                USING (
                    EXISTS (
                        SELECT 1 FROM public.conversation_members cm
                        WHERE cm.conversation_id = %I.conversation_id
                          AND cm.profile_id = auth.uid()
                          AND cm.left_at IS NULL
                    )
                );
            $pol$, part || '_select', part, part);

            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', part || '_insert', part);
            EXECUTE format($pol$
                CREATE POLICY %I ON public.%I
                FOR INSERT TO authenticated
                WITH CHECK (
                    auth.uid() = sender_id
                    AND EXISTS (
                        SELECT 1 FROM public.conversation_members cm
                        WHERE cm.conversation_id = %I.conversation_id
                          AND cm.profile_id = auth.uid()
                          AND cm.left_at IS NULL
                    )
                );
            $pol$, part || '_insert', part, part);
        END IF;
    END LOOP;
END $$;

-- D. Feed Activity Timeline Partitions
DO $$
DECLARE
    part TEXT;
    parts TEXT[] := ARRAY[
        'feed_activity_timeline_2026_08', 'feed_activity_timeline_2026_09',
        'feed_activity_timeline_2026_10', 'feed_activity_timeline_2026_11',
        'feed_activity_timeline_2026_12', 'feed_activity_timeline_default'
    ];
BEGIN
    FOREACH part IN ARRAY parts LOOP
        IF EXISTS (SELECT 1 FROM pg_class WHERE relname = part) THEN
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', part || '_select', part);
            EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (auth.uid() = user_id);', part || '_select', part);

            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', part || '_insert', part);
            EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated, service_role WITH CHECK (true);', part || '_insert', part);
        END IF;
    END LOOP;
END $$;

COMMIT;
