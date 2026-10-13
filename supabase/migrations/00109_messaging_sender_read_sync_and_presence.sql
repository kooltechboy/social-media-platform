-- =============================================================================
-- Migration 00109: Messaging Sender Read Sync, Presence & Friendship Alignment
-- Program: TUKUBI-RTP-001
-- Description:
--   1. Fixes sender unread count defect by atomically synchronizing the sender's
--      last_read_sequence in conversation_members inside fn_sync_message_sequence_and_conversation()
--   2. Hardens mark_conversation_read() with explicit search_path and sequence verification
--   3. Adds get_user_messaging_friends(viewer_id UUID) to securely retrieve accepted,
--      unblocked friends and their profile data for the Messaging Hub
-- Rollback Strategy:
--   Revert fn_sync_message_sequence_and_conversation and mark_conversation_read
--   to their definitions in 00071; drop function get_user_messaging_friends.
-- =============================================================================

BEGIN;

-- 1. Atomic message sequence and sender read cursor synchronization
CREATE OR REPLACE FUNCTION public.fn_sync_message_sequence_and_conversation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    next_seq BIGINT;
BEGIN
    IF NEW.id IS NULL THEN
        NEW.id := gen_random_uuid();
    END IF;

    -- Row-lock parent conversation to serialize sequence increments
    SELECT COALESCE(last_sequence_number, 0) + 1 INTO next_seq
    FROM public.conversations
    WHERE id = NEW.conversation_id
    FOR UPDATE;

    NEW.sequence_number := COALESCE(next_seq, 1);

    -- Update parent conversation metadata atomically
    UPDATE public.conversations
    SET 
        last_message_at = COALESCE(NEW.created_at, now()),
        last_message_id = NEW.id,
        last_sequence_number = NEW.sequence_number,
        updated_at = now()
    WHERE id = NEW.conversation_id;

    -- Automatically advance sender's read cursor to this sequence number
    -- This guarantees the sender's own sent message is NEVER counted as unread for the sender
    IF NEW.sender_id IS NOT NULL THEN
        UPDATE public.conversation_members
        SET 
            last_read_sequence = GREATEST(COALESCE(last_read_sequence, 0), NEW.sequence_number),
            last_read_message_id = NEW.id,
            last_read_at = COALESCE(NEW.created_at, now())
        WHERE conversation_id = NEW.conversation_id
          AND profile_id = NEW.sender_id;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_messages_before_insert_seq ON public.messages;
CREATE TRIGGER trg_messages_before_insert_seq
    BEFORE INSERT ON public.messages
    FOR EACH ROW
    WHEN (NEW.sequence_number IS NULL OR NEW.sequence_number = 0)
    EXECUTE FUNCTION public.fn_sync_message_sequence_and_conversation();

-- 2. Hardened mark_conversation_read with search_path and sequence verification
CREATE OR REPLACE FUNCTION public.mark_conversation_read(conv_id UUID, up_to_sequence BIGINT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    current_uid   UUID := (SELECT auth.uid());
    target_seq    BIGINT;
    latest_msg_id UUID;
BEGIN
    IF current_uid IS NULL THEN
        RETURN;
    END IF;

    IF up_to_sequence IS NULL THEN
        SELECT last_sequence_number, last_message_id INTO target_seq, latest_msg_id
        FROM public.conversations
        WHERE id = conv_id;
    ELSE
        target_seq := up_to_sequence;
        SELECT id INTO latest_msg_id
        FROM public.messages
        WHERE conversation_id = conv_id AND sequence_number = target_seq;
    END IF;

    -- Advance member read cursor
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

-- 3. Canonical get_user_messaging_friends helper function
CREATE OR REPLACE FUNCTION public.get_user_messaging_friends(viewer_id UUID DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    display_name TEXT,
    username TEXT,
    avatar_url TEXT,
    is_verified BOOLEAN,
    bio TEXT,
    friend_since TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    target_uid UUID := COALESCE(viewer_id, (SELECT auth.uid()));
BEGIN
    IF target_uid IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    WITH friend_edges AS (
        SELECT 
            CASE WHEN f.requester_id = target_uid THEN f.addressee_id ELSE f.requester_id END AS friend_id,
            f.updated_at AS friend_since
        FROM public.friendships f
        WHERE (f.requester_id = target_uid OR f.addressee_id = target_uid)
          AND f.status = 'accepted'
    )
    SELECT 
        p.id,
        p.display_name,
        p.username,
        p.avatar_url,
        COALESCE(p.is_verified, false) AS is_verified,
        p.bio,
        fe.friend_since
    FROM friend_edges fe
    JOIN public.profiles p ON p.id = fe.friend_id
    WHERE NOT EXISTS (
        SELECT 1 FROM public.blocks b
        WHERE (b.blocker_id = target_uid AND b.blocked_id = p.id)
           OR (b.blocker_id = p.id AND b.blocked_id = target_uid)
    )
    ORDER BY fe.friend_since DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_messaging_friends(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_user_messaging_friends(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_user_messaging_friends(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_messaging_friends(UUID) TO service_role;

COMMIT;
