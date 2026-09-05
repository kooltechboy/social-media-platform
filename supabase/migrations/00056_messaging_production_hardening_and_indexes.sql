-- =============================================================================
-- Migration 00056: Messaging Production Hardening & Indexes
-- =============================================================================
-- Sections:
--   1. Missing FK Indexes (all 7)
--   2. RLS Policy Hardening — drop old policies, recreate with (SELECT auth.uid())
--   3. get_or_create_direct_conversation — bidirectional reactivation + privilege hardening
-- =============================================================================

BEGIN;

-- =============================================================================
-- Section 1: Missing Foreign Key Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_conversations_created_by
  ON public.conversations(created_by);

CREATE INDEX IF NOT EXISTS idx_conversations_last_message_id
  ON public.conversations(last_message_id);

CREATE INDEX IF NOT EXISTS idx_conversation_members_last_read_msg
  ON public.conversation_members(last_read_message_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id
  ON public.messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id
  ON public.messages(reply_to_id);

CREATE INDEX IF NOT EXISTS idx_message_reactions_profile_id
  ON public.message_reactions(profile_id);

CREATE INDEX IF NOT EXISTS idx_message_requests_conversation
  ON public.message_requests(conversation_id);

-- =============================================================================
-- Section 2: RLS Policy Hardening — (SELECT auth.uid()) subquery caching
-- Drops all messaging RLS policies (from 00053 and 00055) and recreates them
-- using the cached-subquery form: (SELECT auth.uid()) instead of bare auth.uid().
-- This eliminates per-row auth.uid() calls, achieving 5-10x speedup on large tables.
-- =============================================================================

-- ── conversations ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "authenticated_members_read_conversations" ON public.conversations;
DROP POLICY IF EXISTS "authenticated_users_create_conversations" ON public.conversations;
DROP POLICY IF EXISTS "authenticated_admins_update_conversations" ON public.conversations;

CREATE POLICY "authenticated_members_read_conversations" ON public.conversations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = public.conversations.id
        AND cm.profile_id = (SELECT auth.uid())
        AND cm.left_at IS NULL
    )
  );

CREATE POLICY "authenticated_users_create_conversations" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY "authenticated_admins_update_conversations" ON public.conversations
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = public.conversations.id
        AND cm.profile_id = (SELECT auth.uid())
        AND (cm.role = 'admin' OR public.conversations.kind = 'direct')
        AND cm.left_at IS NULL
    )
  );

-- ── conversation_members ────────────────────────────────────────────────────

DROP POLICY IF EXISTS "authenticated_members_read_memberships" ON public.conversation_members;
DROP POLICY IF EXISTS "authenticated_users_manage_own_membership" ON public.conversation_members;
DROP POLICY IF EXISTS "authenticated_members_update_own_membership" ON public.conversation_members;

CREATE POLICY "authenticated_members_read_memberships" ON public.conversation_members
  FOR SELECT TO authenticated
  USING (
    profile_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.conversation_members me
      WHERE me.conversation_id = public.conversation_members.conversation_id
        AND me.profile_id = (SELECT auth.uid())
        AND me.left_at IS NULL
    )
  );

CREATE POLICY "authenticated_users_manage_own_membership" ON public.conversation_members
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = (SELECT auth.uid()));

CREATE POLICY "authenticated_members_update_own_membership" ON public.conversation_members
  FOR UPDATE TO authenticated
  USING (profile_id = (SELECT auth.uid()));

-- ── messages ────────────────────────────────────────────────────────────────
-- Drop both 00053 original policies and 00055 split policies

DROP POLICY IF EXISTS "authenticated_members_read_messages" ON public.messages;
DROP POLICY IF EXISTS "authenticated_members_insert_messages" ON public.messages;
DROP POLICY IF EXISTS "authenticated_senders_update_messages" ON public.messages;
DROP POLICY IF EXISTS "authenticated_senders_delete_messages" ON public.messages;
-- 00055 split policies
DROP POLICY IF EXISTS "authenticated_senders_update_own_messages" ON public.messages;
DROP POLICY IF EXISTS "authenticated_members_soft_delete_messages" ON public.messages;

CREATE POLICY "authenticated_members_read_messages" ON public.messages
  FOR SELECT TO authenticated
  USING (
    (NOT ((SELECT auth.uid()) = ANY(public.messages.deleted_for)))
    AND EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = public.messages.conversation_id
        AND cm.profile_id = (SELECT auth.uid())
        AND cm.left_at IS NULL
    )
  );

CREATE POLICY "authenticated_members_insert_messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = public.messages.conversation_id
        AND cm.profile_id = (SELECT auth.uid())
        AND cm.left_at IS NULL
    )
  );

-- Split UPDATE policies — sender edits + member soft-delete
CREATE POLICY "authenticated_senders_update_own_messages" ON public.messages
  FOR UPDATE TO authenticated
  USING (sender_id = (SELECT auth.uid()))
  WITH CHECK (sender_id = (SELECT auth.uid()));

CREATE POLICY "authenticated_members_soft_delete_messages" ON public.messages
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = public.messages.conversation_id
        AND cm.profile_id = (SELECT auth.uid())
        AND cm.left_at IS NULL
    )
  );

CREATE POLICY "authenticated_senders_delete_messages" ON public.messages
  FOR DELETE TO authenticated
  USING (
    sender_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = public.messages.conversation_id
        AND cm.profile_id = (SELECT auth.uid())
        AND cm.role = 'admin'
        AND cm.left_at IS NULL
    )
  );

-- ── message_reactions ────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "authenticated_members_read_reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "authenticated_members_insert_reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "authenticated_users_delete_own_reactions" ON public.message_reactions;

CREATE POLICY "authenticated_members_read_reactions" ON public.message_reactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.messages msg
      JOIN public.conversation_members cm ON cm.conversation_id = msg.conversation_id
      WHERE msg.id = public.message_reactions.message_id
        AND cm.profile_id = (SELECT auth.uid())
        AND cm.left_at IS NULL
    )
  );

CREATE POLICY "authenticated_members_insert_reactions" ON public.message_reactions
  FOR INSERT TO authenticated
  WITH CHECK (
    profile_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.messages msg
      JOIN public.conversation_members cm ON cm.conversation_id = msg.conversation_id
      WHERE msg.id = public.message_reactions.message_id
        AND cm.profile_id = (SELECT auth.uid())
        AND cm.left_at IS NULL
    )
  );

CREATE POLICY "authenticated_users_delete_own_reactions" ON public.message_reactions
  FOR DELETE TO authenticated
  USING (profile_id = (SELECT auth.uid()));

-- ── message_requests ─────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "authenticated_users_read_message_requests" ON public.message_requests;
DROP POLICY IF EXISTS "authenticated_users_create_message_requests" ON public.message_requests;
DROP POLICY IF EXISTS "authenticated_receivers_update_message_requests" ON public.message_requests;

CREATE POLICY "authenticated_users_read_message_requests" ON public.message_requests
  FOR SELECT TO authenticated
  USING (
    sender_id = (SELECT auth.uid())
    OR receiver_id = (SELECT auth.uid())
  );

CREATE POLICY "authenticated_users_create_message_requests" ON public.message_requests
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = (SELECT auth.uid()));

CREATE POLICY "authenticated_receivers_update_message_requests" ON public.message_requests
  FOR UPDATE TO authenticated
  USING (
    receiver_id = (SELECT auth.uid())
    OR sender_id = (SELECT auth.uid())
  );

-- =============================================================================
-- Section 3: get_or_create_direct_conversation
--   - Bidirectional reactivation (both current_uid AND target_user_id)
--   - Privilege hardening (strip PUBLIC/anon execute rights)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_or_create_direct_conversation(
  target_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_uid  UUID := (SELECT auth.uid());
  pair_key     TEXT;
  conv_id      UUID;
BEGIN
  -- Self-message guard
  IF current_uid = target_user_id THEN
    RAISE EXCEPTION 'cannot_message_self';
  END IF;

  -- Deterministic canonical pair key
  IF current_uid < target_user_id THEN
    pair_key := current_uid::text || ':' || target_user_id::text;
  ELSE
    pair_key := target_user_id::text || ':' || current_uid::text;
  END IF;

  -- Try to find existing conversation
  SELECT id INTO conv_id
  FROM public.conversations
  WHERE canonical_pair = pair_key;

  IF conv_id IS NOT NULL THEN
    -- Bidirectional reactivation: reactivate BOTH members if they left
    UPDATE public.conversation_members
    SET left_at = NULL,
        status  = 'active'
    WHERE conversation_id = conv_id
      AND profile_id IN (current_uid, target_user_id)
      AND left_at IS NOT NULL;

    RETURN conv_id;
  END IF;

  -- Create new conversation
  BEGIN
    INSERT INTO public.conversations (kind, canonical_pair, created_by)
    VALUES ('direct', pair_key, current_uid)
    RETURNING id INTO conv_id;

    INSERT INTO public.conversation_members (conversation_id, profile_id, status)
    VALUES
      (conv_id, current_uid,    'active'),
      (conv_id, target_user_id, 'active');

  EXCEPTION WHEN unique_violation THEN
    -- Race condition: another session created it simultaneously
    SELECT id INTO conv_id
    FROM public.conversations
    WHERE canonical_pair = pair_key;

    -- Bidirectional reactivation on the race-resolved conversation
    UPDATE public.conversation_members
    SET left_at = NULL,
        status  = 'active'
    WHERE conversation_id = conv_id
      AND profile_id IN (current_uid, target_user_id)
      AND left_at IS NOT NULL;
  END;

  RETURN conv_id;
END;
$$;

-- Privilege hardening — strip execute from anonymous callers
REVOKE ALL ON FUNCTION public.get_or_create_direct_conversation(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_or_create_direct_conversation(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_direct_conversation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_direct_conversation(UUID) TO service_role;

COMMIT;