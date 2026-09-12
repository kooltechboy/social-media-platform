-- =============================================================================
-- Migration 00071: Messaging 2.0 Reconciliation, RLS Repair & Permission Enforcement
-- =============================================================================
-- Description:
--   1. Schema Reconciliation (canonical_pair, sequence numbers, status, reactions, requests)
--   2. Data Backfill (canonical pairs for existing direct conversations, sequence numbers)
--   3. Non-Recursive Security Definer Membership Helper (is_conversation_member)
--   4. Hardened, Non-Recursive RLS Policies on conversations, conversation_members, messages, receipts
--   5. Authoritative get_or_create_direct_conversation RPC with messaging_permission & block enforcement
--   6. Authoritative mark_conversation_read RPC with notification reconciliation
--   7. Monotonic message sequencing trigger (fn_sync_message_sequence_and_conversation)
--   8. Automated message notification trigger (fn_notify_message_recipients)
--   9. Realtime Publication expansion (conversations, conversation_members, messages, notifications)
--  10. Tracked in supabase_migrations.schema_migrations
-- =============================================================================

BEGIN;

-- =============================================================================
-- Section 1: Schema Reconciliation (Idempotent ALTERs & Indexes)
-- =============================================================================

-- 1.1 Conversations
ALTER TABLE public.conversations 
    ADD COLUMN IF NOT EXISTS canonical_pair TEXT,
    ADD COLUMN IF NOT EXISTS category VARCHAR(20) DEFAULT 'personal' NOT NULL,
    ADD COLUMN IF NOT EXISTS last_message_id UUID,
    ADD COLUMN IF NOT EXISTS last_sequence_number BIGINT DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now() NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_canonical_pair 
    ON public.conversations(canonical_pair) 
    WHERE canonical_pair IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_created_by
    ON public.conversations(created_by);

CREATE INDEX IF NOT EXISTS idx_conversations_last_message_id
    ON public.conversations(last_message_id);

-- 1.2 Conversation Members
ALTER TABLE public.conversation_members
    ADD COLUMN IF NOT EXISTS last_read_message_id UUID,
    ADD COLUMN IF NOT EXISTS last_read_sequence BIGINT DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS status VARCHAR(16) DEFAULT 'active' NOT NULL;

DO $$
BEGIN
    ALTER TABLE public.conversation_members 
        ADD CONSTRAINT chk_conversation_members_status 
        CHECK (status IN ('active', 'pending_request', 'archived', 'rejected', 'blocked'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_conversation_members_last_read_msg
    ON public.conversation_members(last_read_message_id);

-- 1.3 Messages
ALTER TABLE public.messages
    ADD COLUMN IF NOT EXISTS client_message_id TEXT,
    ADD COLUMN IF NOT EXISTS sequence_number BIGINT DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS deleted_for UUID[] DEFAULT '{}'::uuid[] NOT NULL,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_idempotency 
    ON public.messages(conversation_id, client_message_id) 
    WHERE client_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_conversation_sequence 
    ON public.messages(conversation_id, sequence_number DESC);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id
    ON public.messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id
    ON public.messages(reply_to_id);

-- 1.4 Message Reactions Table
CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT uq_message_reaction UNIQUE (message_id, profile_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_profile_id ON public.message_reactions(profile_id);

-- 1.5 Message Requests Table
CREATE TABLE IF NOT EXISTS public.message_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(16) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT uq_message_request_pair UNIQUE (sender_id, receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_message_requests_conversation ON public.message_requests(conversation_id);
CREATE INDEX IF NOT EXISTS idx_message_requests_receiver ON public.message_requests(receiver_id, status);

-- =============================================================================
-- Section 2: Data Backfill (Preserve All Existing Production History)
-- =============================================================================

-- Backfill canonical_pair for existing direct conversations
UPDATE public.conversations c
SET canonical_pair = (
    SELECT CASE WHEN cm1.profile_id < cm2.profile_id 
        THEN cm1.profile_id::text || ':' || cm2.profile_id::text
        ELSE cm2.profile_id::text || ':' || cm1.profile_id::text
    END
    FROM public.conversation_members cm1
    JOIN public.conversation_members cm2 
        ON cm1.conversation_id = cm2.conversation_id AND cm1.profile_id != cm2.profile_id
    WHERE cm1.conversation_id = c.id
    LIMIT 1
)
WHERE c.kind = 'direct' AND (c.canonical_pair IS NULL OR c.canonical_pair = '');

-- Backfill sequence_number on existing messages (monotonic per conversation)
WITH numbered_msgs AS (
    SELECT id, conversation_id,
           ROW_NUMBER() OVER (PARTITION BY conversation_id ORDER BY created_at ASC) as seq
    FROM public.messages
)
UPDATE public.messages m
SET sequence_number = nm.seq
FROM numbered_msgs nm
WHERE m.id = nm.id AND (m.sequence_number IS NULL OR m.sequence_number = 0);

-- Sync conversation last_sequence_number and last_message_id
UPDATE public.conversations c
SET 
    last_sequence_number = COALESCE((
        SELECT MAX(sequence_number) FROM public.messages WHERE conversation_id = c.id
    ), 0),
    last_message_id = (
        SELECT id FROM public.messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1
    )
WHERE c.last_sequence_number = 0 OR c.last_sequence_number IS NULL;

-- =============================================================================
-- Section 3: Non-Recursive Security Definer Membership Helper
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_conversation_member(
    conv_id UUID,
    user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.conversation_members cm
        WHERE cm.conversation_id = conv_id
          AND cm.profile_id = user_id
          AND cm.left_at IS NULL
          AND cm.status <> 'blocked'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_conversation_member(
    conv_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.is_conversation_member(conv_id, (SELECT auth.uid()));
$$;

REVOKE ALL ON FUNCTION public.is_conversation_member(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_conversation_member(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_conversation_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_conversation_member(UUID, UUID) TO service_role;

REVOKE ALL ON FUNCTION public.is_conversation_member(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_conversation_member(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_conversation_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_conversation_member(UUID) TO service_role;

-- =============================================================================
-- Section 4: Hardened Non-Recursive Row Level Security
-- =============================================================================

-- Enable RLS across all messaging tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_requests ENABLE ROW LEVEL SECURITY;

-- 4.1 Drop all legacy and defective policies
DROP POLICY IF EXISTS "Members read conversations" ON public.conversations;
DROP POLICY IF EXISTS "authenticated_members_read_conversations" ON public.conversations;
DROP POLICY IF EXISTS "authenticated_users_create_conversations" ON public.conversations;
DROP POLICY IF EXISTS "authenticated_admins_update_conversations" ON public.conversations;
DROP POLICY IF EXISTS "authenticated_members_update_conversations" ON public.conversations;

DROP POLICY IF EXISTS "Members read membership" ON public.conversation_members;
DROP POLICY IF EXISTS "Self insert membership" ON public.conversation_members;
DROP POLICY IF EXISTS "authenticated_members_read_memberships" ON public.conversation_members;
DROP POLICY IF EXISTS "authenticated_users_manage_own_membership" ON public.conversation_members;
DROP POLICY IF EXISTS "authenticated_members_update_own_membership" ON public.conversation_members;

DROP POLICY IF EXISTS "Members read messages" ON public.messages;
DROP POLICY IF EXISTS "Members send messages" ON public.messages;
DROP POLICY IF EXISTS "Sender edits messages" ON public.messages;
DROP POLICY IF EXISTS "authenticated_members_read_messages" ON public.messages;
DROP POLICY IF EXISTS "authenticated_members_insert_messages" ON public.messages;
DROP POLICY IF EXISTS "authenticated_senders_update_messages" ON public.messages;
DROP POLICY IF EXISTS "authenticated_senders_update_own_messages" ON public.messages;
DROP POLICY IF EXISTS "authenticated_members_soft_delete_messages" ON public.messages;
DROP POLICY IF EXISTS "authenticated_senders_delete_messages" ON public.messages;

DROP POLICY IF EXISTS "Member reads receipts" ON public.message_receipts;
DROP POLICY IF EXISTS "Member updates own receipts" ON public.message_receipts;
DROP POLICY IF EXISTS "Member inserts own receipts" ON public.message_receipts;
DROP POLICY IF EXISTS "authenticated_members_read_receipts" ON public.message_receipts;
DROP POLICY IF EXISTS "authenticated_users_manage_own_receipts" ON public.message_receipts;

DROP POLICY IF EXISTS "Members read attachments" ON public.message_attachments;
DROP POLICY IF EXISTS "Members create attachments" ON public.message_attachments;
DROP POLICY IF EXISTS "authenticated_members_read_attachments" ON public.message_attachments;
DROP POLICY IF EXISTS "authenticated_senders_create_attachments" ON public.message_attachments;

DROP POLICY IF EXISTS "Members read reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "Members react to messages" ON public.message_reactions;
DROP POLICY IF EXISTS "Users delete own reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "authenticated_members_read_reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "authenticated_members_insert_reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "authenticated_users_delete_own_reactions" ON public.message_reactions;

DROP POLICY IF EXISTS "authenticated_users_read_message_requests" ON public.message_requests;
DROP POLICY IF EXISTS "authenticated_users_create_message_requests" ON public.message_requests;
DROP POLICY IF EXISTS "authenticated_receivers_update_message_requests" ON public.message_requests;

-- 4.2 Conversations Policies
CREATE POLICY "authenticated_members_read_conversations" ON public.conversations
    FOR SELECT TO authenticated
    USING (public.is_conversation_member(id));

CREATE POLICY "authenticated_users_create_conversations" ON public.conversations
    FOR INSERT TO authenticated
    WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY "authenticated_members_update_conversations" ON public.conversations
    FOR UPDATE TO authenticated
    USING (public.is_conversation_member(id));

-- 4.3 Conversation Members Policies (Non-Recursive via helper)
CREATE POLICY "authenticated_members_read_memberships" ON public.conversation_members
    FOR SELECT TO authenticated
    USING (
        profile_id = (SELECT auth.uid())
        OR public.is_conversation_member(conversation_id)
    );

CREATE POLICY "authenticated_users_manage_own_membership" ON public.conversation_members
    FOR INSERT TO authenticated
    WITH CHECK (profile_id = (SELECT auth.uid()));

CREATE POLICY "authenticated_members_update_own_membership" ON public.conversation_members
    FOR UPDATE TO authenticated
    USING (profile_id = (SELECT auth.uid()));

-- 4.4 Messages Policies (Strict sender verification & disambiguated conversation membership)
CREATE POLICY "authenticated_members_read_messages" ON public.messages
    FOR SELECT TO authenticated
    USING (
        (NOT ((SELECT auth.uid()) = ANY(deleted_for)))
        AND public.is_conversation_member(conversation_id)
    );

CREATE POLICY "authenticated_members_insert_messages" ON public.messages
    FOR INSERT TO authenticated
    WITH CHECK (
        sender_id = (SELECT auth.uid())
        AND public.is_conversation_member(conversation_id)
    );

CREATE POLICY "authenticated_senders_update_own_messages" ON public.messages
    FOR UPDATE TO authenticated
    USING (sender_id = (SELECT auth.uid()))
    WITH CHECK (sender_id = (SELECT auth.uid()));

CREATE POLICY "authenticated_members_soft_delete_messages" ON public.messages
    FOR UPDATE TO authenticated
    USING (public.is_conversation_member(conversation_id));

CREATE POLICY "authenticated_senders_delete_messages" ON public.messages
    FOR DELETE TO authenticated
    USING (sender_id = (SELECT auth.uid()));

-- 4.5 Message Receipts Policies
CREATE POLICY "authenticated_members_read_receipts" ON public.message_receipts
    FOR SELECT TO authenticated
    USING (
        profile_id = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.messages m
            WHERE m.id = message_receipts.message_id
              AND public.is_conversation_member(m.conversation_id)
        )
    );

CREATE POLICY "authenticated_users_manage_own_receipts" ON public.message_receipts
    FOR ALL TO authenticated
    USING (profile_id = (SELECT auth.uid()))
    WITH CHECK (profile_id = (SELECT auth.uid()));

-- 4.6 Message Attachments Policies
CREATE POLICY "authenticated_members_read_attachments" ON public.message_attachments
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.messages m
            WHERE m.id = message_attachments.message_id
              AND public.is_conversation_member(m.conversation_id)
        )
    );

CREATE POLICY "authenticated_senders_create_attachments" ON public.message_attachments
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.messages m
            WHERE m.id = message_attachments.message_id
              AND m.sender_id = (SELECT auth.uid())
        )
    );

-- 4.7 Message Reactions Policies
CREATE POLICY "authenticated_members_read_reactions" ON public.message_reactions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.messages m
            WHERE m.id = message_reactions.message_id
              AND public.is_conversation_member(m.conversation_id)
        )
    );

CREATE POLICY "authenticated_members_insert_reactions" ON public.message_reactions
    FOR INSERT TO authenticated
    WITH CHECK (
        profile_id = (SELECT auth.uid())
        AND EXISTS (
            SELECT 1 FROM public.messages m
            WHERE m.id = message_reactions.message_id
              AND public.is_conversation_member(m.conversation_id)
        )
    );

CREATE POLICY "authenticated_users_delete_own_reactions" ON public.message_reactions
    FOR DELETE TO authenticated
    USING (profile_id = (SELECT auth.uid()));

-- 4.8 Message Requests Policies
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

-- 4.9 Role Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_attachments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_receipts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_reactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_requests TO authenticated;

-- =============================================================================
-- Section 5: Authoritative get_or_create_direct_conversation RPC
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
    current_uid   UUID := (SELECT auth.uid());
    target_perm   TEXT;
    is_blocked    BOOLEAN;
    is_friend     BOOLEAN;
    pair_key      TEXT;
    conv_id       UUID;
BEGIN
    -- 1. Caller authentication guard
    IF current_uid IS NULL THEN
        RAISE EXCEPTION 'authentication_required';
    END IF;

    -- 2. Self-message guard
    IF current_uid = target_user_id THEN
        RAISE EXCEPTION 'cannot_message_self';
    END IF;

    -- 3. Target profile existence & privacy/permission validation
    SELECT messaging_permission INTO target_perm
    FROM public.profiles
    WHERE id = target_user_id;

    IF target_perm IS NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id) THEN
            RAISE EXCEPTION 'target_user_not_found';
        END IF;
        target_perm := 'everyone';
    END IF;

    -- 4. Enforce recipient messaging permission
    IF target_perm = 'no_one' THEN
        RAISE EXCEPTION 'messaging_disabled';
    ELSIF target_perm = 'friends' THEN
        SELECT EXISTS (
            SELECT 1 FROM public.friendships
            WHERE status = 'accepted'
              AND (
                  (requester_id = current_uid AND addressee_id = target_user_id)
                  OR
                  (requester_id = target_user_id AND addressee_id = current_uid)
              )
        ) INTO is_friend;

        IF NOT is_friend THEN
            RAISE EXCEPTION 'friends_only';
        END IF;
    END IF;

    -- 5. Bidirectional block check
    SELECT EXISTS (
        SELECT 1 FROM public.blocks
        WHERE (blocker_id = current_uid AND blocked_id = target_user_id)
           OR (blocker_id = target_user_id AND blocked_id = current_uid)
    ) INTO is_blocked;

    IF is_blocked THEN
        RAISE EXCEPTION 'user_blocked';
    END IF;

    -- 6. Deterministic symmetric canonical pair key
    IF current_uid < target_user_id THEN
        pair_key := current_uid::text || ':' || target_user_id::text;
    ELSE
        pair_key := target_user_id::text || ':' || current_uid::text;
    END IF;

    -- 7. Search for existing direct conversation
    SELECT id INTO conv_id
    FROM public.conversations
    WHERE canonical_pair = pair_key;

    IF conv_id IS NOT NULL THEN
        -- Bidirectional reactivation: reactivate both members if left or archived
        UPDATE public.conversation_members
        SET left_at = NULL,
            status  = 'active'
        WHERE conversation_id = conv_id
          AND profile_id IN (current_uid, target_user_id)
          AND (left_at IS NOT NULL OR status <> 'active');

        RETURN conv_id;
    END IF;

    -- 8. Create new conversation atomically
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
        -- Concurrency race: fetched the conversation created in parallel
        SELECT id INTO conv_id
        FROM public.conversations
        WHERE canonical_pair = pair_key;

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

REVOKE ALL ON FUNCTION public.get_or_create_direct_conversation(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_or_create_direct_conversation(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_direct_conversation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_direct_conversation(UUID) TO service_role;

-- =============================================================================
-- Section 6: Authoritative mark_conversation_read RPC
-- =============================================================================

CREATE OR REPLACE FUNCTION public.mark_conversation_read(
    conv_id UUID,
    up_to_sequence BIGINT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- =============================================================================
-- Section 7: Monotonic Message Sequence & Sync Trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_sync_message_sequence_and_conversation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    next_seq BIGINT;
BEGIN
    -- Row-lock parent conversation to serialize sequence increments
    SELECT COALESCE(last_sequence_number, 0) + 1 INTO next_seq
    FROM public.conversations
    WHERE id = NEW.conversation_id
    FOR UPDATE;

    NEW.sequence_number := COALESCE(next_seq, 1);

    -- Update parent conversation metadata atomically
    UPDATE public.conversations
    SET 
        last_message_at = NEW.created_at,
        last_message_id = NEW.id,
        last_sequence_number = NEW.sequence_number,
        updated_at = now()
    WHERE id = NEW.conversation_id;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_messages_before_insert_seq ON public.messages;
CREATE TRIGGER trg_messages_before_insert_seq
    BEFORE INSERT ON public.messages
    FOR EACH ROW
    WHEN (NEW.sequence_number IS NULL OR NEW.sequence_number = 0)
    EXECUTE FUNCTION public.fn_sync_message_sequence_and_conversation();

-- =============================================================================
-- Section 8: Automated Message Notification Trigger
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
    IF NEW.deleted_at IS NOT NULL THEN
        RETURN NEW;
    END IF;

    preview_text := SUBSTRING(COALESCE(NEW.body, 'New message') FROM 1 FOR 80);

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
-- Section 9: Realtime Publication Expansion
-- =============================================================================

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_members;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- Section 10: Migration Version Registration
-- =============================================================================

INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('00071')
ON CONFLICT (version) DO NOTHING;

COMMIT;
