-- =============================================================================
-- Migration 00070: Messaging P0 Rebuild & Realtime Notifications
-- =============================================================================
-- Sections:
--   1. Realtime Publication expansion (conversation_members, conversations, notifications)
--   2. Authoritative get_or_create_direct_conversation with block checks, caller auth guard & profile validation
--   3. Automated message notification trigger (fn_notify_message_recipients)
--   4. mark_conversation_read with automated notification read-state reconciliation
-- =============================================================================

BEGIN;

-- =============================================================================
-- Section 1: Realtime Publication Expansion
-- =============================================================================

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_members;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- Section 2: Authoritative get_or_create_direct_conversation
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
  is_blocked   BOOLEAN;
BEGIN
  -- 1. Caller authentication guard
  IF current_uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  -- 2. Self-message guard
  IF current_uid = target_user_id THEN
    RAISE EXCEPTION 'cannot_message_self';
  END IF;

  -- 3. Target profile existence validation
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'target_user_not_found';
  END IF;

  -- 4. Bidirectional block check
  SELECT EXISTS (
    SELECT 1 FROM public.blocks
    WHERE (blocker_id = current_uid AND blocked_id = target_user_id)
       OR (blocker_id = target_user_id AND blocked_id = current_uid)
  ) INTO is_blocked;

  IF is_blocked THEN
    RAISE EXCEPTION 'user_blocked';
  END IF;

  -- 5. Deterministic canonical pair key (ordered by UUID string representation)
  IF current_uid < target_user_id THEN
    pair_key := current_uid::text || ':' || target_user_id::text;
  ELSE
    pair_key := target_user_id::text || ':' || current_uid::text;
  END IF;

  -- 6. Locate existing conversation
  SELECT id INTO conv_id
  FROM public.conversations
  WHERE canonical_pair = pair_key;

  IF conv_id IS NOT NULL THEN
    -- Bidirectional reactivation: reactivate members if left
    UPDATE public.conversation_members
    SET left_at = NULL,
        status  = 'active'
    WHERE conversation_id = conv_id
      AND profile_id IN (current_uid, target_user_id)
      AND (left_at IS NOT NULL OR status <> 'active');

    RETURN conv_id;
  END IF;

  -- 7. Create new conversation atomically
  BEGIN
    INSERT INTO public.conversations (kind, canonical_pair, created_by, last_sequence_number)
    VALUES ('direct', pair_key, current_uid, 0)
    RETURNING id INTO conv_id;

    INSERT INTO public.conversation_members (conversation_id, profile_id, role, status)
    VALUES
      (conv_id, current_uid,    'member', 'active'),
      (conv_id, target_user_id, 'member', 'active')
    ON CONFLICT (conversation_id, profile_id)
    DO UPDATE SET left_at = NULL, status = 'active';

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
      AND (left_at IS NOT NULL OR status <> 'active');
  END;

  RETURN conv_id;
END;
$$;

-- Privilege hardening — strip execute from anonymous callers
REVOKE ALL ON FUNCTION public.get_or_create_direct_conversation(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_or_create_direct_conversation(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_direct_conversation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_direct_conversation(UUID) TO service_role;

-- =============================================================================
-- Section 3: Automated Message Notification Trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_notify_message_recipients()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
  preview_text TEXT;
BEGIN
  -- Skip notifications for soft-deleted or non-content messages
  IF NEW.deleted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  preview_text := SUBSTRING(COALESCE(NEW.body, 'New message') FROM 1 FOR 80);

  -- Notify all other active conversation participants
  FOR rec IN
    SELECT profile_id
    FROM public.conversation_members
    WHERE conversation_id = NEW.conversation_id
      AND profile_id <> NEW.sender_id
      AND left_at IS NULL
      AND status = 'active'
  LOOP
    INSERT INTO public.notifications (
      recipient_id,
      kind,
      actor_id,
      entity_type,
      entity_id,
      payload,
      created_at
    ) VALUES (
      rec.profile_id,
      'message',
      NEW.sender_id,
      'conversation',
      NEW.conversation_id,
      jsonb_build_object(
        'conversation_id', NEW.conversation_id,
        'message_id', NEW.id,
        'preview', preview_text
      ),
      now()
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_messages_notify_recipients ON public.messages;
CREATE TRIGGER trg_messages_notify_recipients
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_notify_message_recipients();

-- =============================================================================
-- Section 4: mark_conversation_read with Notification Reconciliation
-- =============================================================================

CREATE OR REPLACE FUNCTION public.mark_conversation_read(conv_id UUID, up_to_sequence BIGINT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_uid UUID;
    target_seq BIGINT;
    latest_msg_id UUID;
BEGIN
    current_uid := (SELECT auth.uid());
    IF current_uid IS NULL THEN
        RETURN;
    END IF;

    IF up_to_sequence IS NULL THEN
        SELECT last_sequence_number, last_message_id INTO target_seq, latest_msg_id
        FROM public.conversations
        WHERE id = conv_id;
    ELSE
        target_seq := up_to_sequence;
    END IF;

    -- Advance conversation member sequence
    UPDATE public.conversation_members
    SET 
        last_read_sequence = GREATEST(COALESCE(last_read_sequence, 0), COALESCE(target_seq, 0)),
        last_read_message_id = COALESCE(latest_msg_id, last_read_message_id),
        last_read_at = now()
    WHERE conversation_id = conv_id AND profile_id = current_uid;

    -- Reconcile pending notifications for this conversation
    UPDATE public.notifications
    SET read_at = now()
    WHERE recipient_id = current_uid
      AND entity_type = 'conversation'
      AND entity_id = conv_id
      AND read_at IS NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_conversation_read(UUID, BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_conversation_read(UUID, BIGINT) FROM anon;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read(UUID, BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read(UUID, BIGINT) TO service_role;

COMMIT;
