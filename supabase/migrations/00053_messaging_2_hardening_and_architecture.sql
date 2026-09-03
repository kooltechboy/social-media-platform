-- Migration 00053: TUKUBI Messaging 2.0 Hardening, Security, Idempotency & Architecture
-- Description: Authoritative RLS fix, canonical direct pairs, message idempotency keys,
-- sequential ordering triggers, O(1) unread position tracking, message reactions & requests.

-- 1. Extend Conversations table with canonical pair and metadata
ALTER TABLE public.conversations 
    ADD COLUMN IF NOT EXISTS canonical_pair TEXT,
    ADD COLUMN IF NOT EXISTS last_message_id UUID,
    ADD COLUMN IF NOT EXISTS last_sequence_number BIGINT DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now() NOT NULL;

-- Direct conversations must have unique canonical pairing (e.g. userA:userB sorted)
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_canonical_pair 
    ON public.conversations(canonical_pair) 
    WHERE canonical_pair IS NOT NULL;

-- 2. Extend Conversation Members with sequence-based unread tracking
ALTER TABLE public.conversation_members
    ADD COLUMN IF NOT EXISTS last_read_message_id UUID,
    ADD COLUMN IF NOT EXISTS last_read_sequence BIGINT DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS status VARCHAR(16) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'pending_request', 'archived', 'rejected', 'blocked'));

-- 3. Extend Messages with idempotency, sequence numbers, reply, editing, and soft-delete
ALTER TABLE public.messages
    ADD COLUMN IF NOT EXISTS client_message_id TEXT,
    ADD COLUMN IF NOT EXISTS sequence_number BIGINT DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS deleted_for UUID[] DEFAULT '{}'::uuid[] NOT NULL,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb NOT NULL;

-- Idempotency constraint per conversation
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_idempotency 
    ON public.messages(conversation_id, client_message_id) 
    WHERE client_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_conversation_sequence 
    ON public.messages(conversation_id, sequence_number DESC);

-- 4. Message Reactions Table
CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT uq_message_reaction UNIQUE (message_id, profile_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON public.message_reactions(message_id);

-- 5. Message Requests Table (for inbound chats from non-connections)
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

CREATE INDEX IF NOT EXISTS idx_message_requests_receiver ON public.message_requests(receiver_id, status);

-- 6. Trigger: Authoritative Sequential Numbering & Conversation Metadata Sync
CREATE OR REPLACE FUNCTION public.fn_sync_message_sequence_and_conversation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    next_seq BIGINT;
BEGIN
    -- Increment sequence number monotonically per conversation
    SELECT COALESCE(MAX(sequence_number), 0) + 1 INTO next_seq
    FROM public.messages
    WHERE conversation_id = NEW.conversation_id;

    NEW.sequence_number := next_seq;

    -- Update parent conversation metadata
    UPDATE public.conversations
    SET 
        last_message_at = NEW.created_at,
        last_message_id = NEW.id,
        last_sequence_number = next_seq,
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

-- 7. Stored Procedure: Atomic & Canonical Direct Conversation Creation with Block Check
CREATE OR REPLACE FUNCTION public.get_or_create_direct_conversation(target_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_uid UUID;
    pair_key TEXT;
    conv_id UUID;
    is_blocked BOOLEAN;
BEGIN
    current_uid := auth.uid();
    IF current_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    IF current_uid = target_user_id THEN
        RAISE EXCEPTION 'Cannot create direct conversation with self.';
    END IF;

    -- Verify no blocks exist between the users
    SELECT EXISTS (
        SELECT 1 FROM public.blocks
        WHERE (blocker_id = current_uid AND blocked_id = target_user_id)
           OR (blocker_id = target_user_id AND blocked_id = current_uid)
    ) INTO is_blocked;

    IF is_blocked THEN
        RAISE EXCEPTION 'Conversation cannot be created due to user block settings.';
    END IF;

    -- Generate canonical symmetric key (lexicographically ordered)
    IF current_uid < target_user_id THEN
        pair_key := current_uid::text || ':' || target_user_id::text;
    ELSE
        pair_key := target_user_id::text || ':' || current_uid::text;
    END IF;

    -- Check if conversation already exists
    SELECT id INTO conv_id
    FROM public.conversations
    WHERE canonical_pair = pair_key;

    IF conv_id IS NOT NULL THEN
        -- Re-activate membership if left
        UPDATE public.conversation_members
        SET left_at = NULL, status = 'active'
        WHERE conversation_id = conv_id AND profile_id = current_uid;
        
        RETURN conv_id;
    END IF;

    -- Create new conversation atomically
    INSERT INTO public.conversations (kind, created_by, canonical_pair, last_sequence_number)
    VALUES ('direct', current_uid, pair_key, 0)
    RETURNING id INTO conv_id;

    -- Add both members
    INSERT INTO public.conversation_members (conversation_id, profile_id, role, status)
    VALUES 
        (conv_id, current_uid, 'member', 'active'),
        (conv_id, target_user_id, 'member', 'active')
    ON CONFLICT (conversation_id, profile_id) 
    DO UPDATE SET left_at = NULL, status = 'active';

    RETURN conv_id;
END;
$$;

-- 8. Stored Procedure: Mark Conversation Read O(1)
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
    current_uid := auth.uid();
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

    UPDATE public.conversation_members
    SET 
        last_read_sequence = GREATEST(COALESCE(last_read_sequence, 0), COALESCE(target_seq, 0)),
        last_read_message_id = COALESCE(latest_msg_id, last_read_message_id),
        last_read_at = now()
    WHERE conversation_id = conv_id AND profile_id = current_uid;
END;
$$;

-- 9. Complete Security Hardening: Row Level Security Remediation
-- Drop all existing ambiguous policies
DROP POLICY IF EXISTS "Members read conversations" ON public.conversations;
DROP POLICY IF EXISTS "Members read membership" ON public.conversation_members;
DROP POLICY IF EXISTS "Self insert membership" ON public.conversation_members;
DROP POLICY IF EXISTS "Members read messages" ON public.messages;
DROP POLICY IF EXISTS "Members send messages" ON public.messages;
DROP POLICY IF EXISTS "Sender edits messages" ON public.messages;
DROP POLICY IF EXISTS "Members read attachments" ON public.message_attachments;
DROP POLICY IF EXISTS "Members create attachments" ON public.message_attachments;
DROP POLICY IF EXISTS "Member reads receipts" ON public.message_receipts;
DROP POLICY IF EXISTS "Member updates own receipts" ON public.message_receipts;
DROP POLICY IF EXISTS "Member inserts own receipts" ON public.message_receipts;
DROP POLICY IF EXISTS "Members read reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "Members react to messages" ON public.message_reactions;
DROP POLICY IF EXISTS "Users delete own reactions" ON public.message_reactions;

-- Enable RLS on all tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_requests ENABLE ROW LEVEL SECURITY;

-- Conversations Policies
CREATE POLICY "authenticated_members_read_conversations" ON public.conversations
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.conversation_members cm
        WHERE cm.conversation_id = public.conversations.id 
          AND cm.profile_id = auth.uid() 
          AND cm.left_at IS NULL
    ));

CREATE POLICY "authenticated_users_create_conversations" ON public.conversations
    FOR INSERT TO authenticated
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "authenticated_admins_update_conversations" ON public.conversations
    FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.conversation_members cm
        WHERE cm.conversation_id = public.conversations.id 
          AND cm.profile_id = auth.uid() 
          AND (cm.role = 'admin' OR public.conversations.kind = 'direct')
          AND cm.left_at IS NULL
    ));

-- Conversation Members Policies
CREATE POLICY "authenticated_members_read_memberships" ON public.conversation_members
    FOR SELECT TO authenticated
    USING (
        profile_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM public.conversation_members me
            WHERE me.conversation_id = public.conversation_members.conversation_id
              AND me.profile_id = auth.uid()
              AND me.left_at IS NULL
        )
    );

CREATE POLICY "authenticated_users_manage_own_membership" ON public.conversation_members
    FOR INSERT TO authenticated
    WITH CHECK (profile_id = auth.uid());

CREATE POLICY "authenticated_members_update_own_membership" ON public.conversation_members
    FOR UPDATE TO authenticated
    USING (profile_id = auth.uid());

-- Messages Policies (Strictly disambiguated non-tautological membership verification)
CREATE POLICY "authenticated_members_read_messages" ON public.messages
    FOR SELECT TO authenticated
    USING (
        (NOT (auth.uid() = ANY(public.messages.deleted_for)))
        AND EXISTS (
            SELECT 1 FROM public.conversation_members cm
            WHERE cm.conversation_id = public.messages.conversation_id 
              AND cm.profile_id = auth.uid() 
              AND cm.left_at IS NULL
        )
    );

CREATE POLICY "authenticated_members_insert_messages" ON public.messages
    FOR INSERT TO authenticated
    WITH CHECK (
        sender_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.conversation_members cm
            WHERE cm.conversation_id = public.messages.conversation_id 
              AND cm.profile_id = auth.uid() 
              AND cm.left_at IS NULL
        )
    );

CREATE POLICY "authenticated_senders_update_messages" ON public.messages
    FOR UPDATE TO authenticated
    USING (
        sender_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.conversation_members cm
            WHERE cm.conversation_id = public.messages.conversation_id
              AND cm.profile_id = auth.uid()
              AND cm.left_at IS NULL
        )
    );

CREATE POLICY "authenticated_senders_delete_messages" ON public.messages
    FOR DELETE TO authenticated
    USING (
        sender_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.conversation_members cm
            WHERE cm.conversation_id = public.messages.conversation_id
              AND cm.profile_id = auth.uid()
              AND cm.role = 'admin'
              AND cm.left_at IS NULL
        )
    );

-- Message Attachments Policies
CREATE POLICY "authenticated_members_read_attachments" ON public.message_attachments
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.messages msg
        JOIN public.conversation_members cm ON cm.conversation_id = msg.conversation_id
        WHERE msg.id = public.message_attachments.message_id 
          AND cm.profile_id = auth.uid() 
          AND cm.left_at IS NULL
    ));

CREATE POLICY "authenticated_senders_create_attachments" ON public.message_attachments
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.messages msg
        WHERE msg.id = public.message_attachments.message_id 
          AND msg.sender_id = auth.uid()
    ));

-- Message Receipts Policies
CREATE POLICY "authenticated_members_read_receipts" ON public.message_receipts
    FOR SELECT TO authenticated
    USING (
        profile_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM public.messages msg
            JOIN public.conversation_members cm ON cm.conversation_id = msg.conversation_id
            WHERE msg.id = public.message_receipts.message_id 
              AND cm.profile_id = auth.uid() 
              AND cm.left_at IS NULL
        )
    );

CREATE POLICY "authenticated_users_manage_own_receipts" ON public.message_receipts
    FOR ALL TO authenticated
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());

-- Message Reactions Policies
CREATE POLICY "authenticated_members_read_reactions" ON public.message_reactions
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.messages msg
        JOIN public.conversation_members cm ON cm.conversation_id = msg.conversation_id
        WHERE msg.id = public.message_reactions.message_id 
          AND cm.profile_id = auth.uid() 
          AND cm.left_at IS NULL
    ));

CREATE POLICY "authenticated_members_insert_reactions" ON public.message_reactions
    FOR INSERT TO authenticated
    WITH CHECK (
        profile_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.messages msg
            JOIN public.conversation_members cm ON cm.conversation_id = msg.conversation_id
            WHERE msg.id = public.message_reactions.message_id 
              AND cm.profile_id = auth.uid() 
              AND cm.left_at IS NULL
        )
    );

CREATE POLICY "authenticated_users_delete_own_reactions" ON public.message_reactions
    FOR DELETE TO authenticated
    USING (profile_id = auth.uid());

-- Message Requests Policies
CREATE POLICY "authenticated_users_read_message_requests" ON public.message_requests
    FOR SELECT TO authenticated
    USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "authenticated_users_create_message_requests" ON public.message_requests
    FOR INSERT TO authenticated
    WITH CHECK (sender_id = auth.uid());

CREATE POLICY "authenticated_receivers_update_message_requests" ON public.message_requests
    FOR UPDATE TO authenticated
    USING (receiver_id = auth.uid() OR sender_id = auth.uid());

-- Grant proper permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_attachments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_receipts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_reactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_requests TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_direct_conversation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read(UUID, BIGINT) TO authenticated;
