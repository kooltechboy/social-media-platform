-- Migration 00054: TUKUBI Connect Hardening, Foreign-Key Indexing, RLS Optimization & Conversational Commerce
-- Description: Indexes unindexed foreign keys across messaging and live_messages tables,
-- optimizes RLS subqueries with (select auth.uid()) caching, tightens SECURITY DEFINER
-- authorization function access, expands message_kind for conversational commerce,
-- and adds conversation categories and contextual JSON metadata.

-- =============================================================================
-- 1. EXTEND CONVERSATIONS & MESSAGES SCHEMA FOR COMMERCE & CONTEXT
-- =============================================================================

ALTER TABLE public.conversations
    ADD COLUMN IF NOT EXISTS category VARCHAR(24) DEFAULT 'personal' NOT NULL,
    ADD COLUMN IF NOT EXISTS context_data JSONB DEFAULT '{}'::jsonb NOT NULL,
    ADD COLUMN IF NOT EXISTS is_pinned_by UUID[] DEFAULT '{}'::uuid[] NOT NULL;

-- Remove old message_kind constraint and apply expanded rich message kinds
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_message_kind_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_message_kind_check
    CHECK (message_kind IN (
        'text', 'voice', 'media', 'product', 'order', 'event', 
        'livestream', 'store', 'community', 'profile', 'system', 'ai_response'
    ));

-- =============================================================================
-- 2. COVERING FOREIGN KEY INDEXES (Resolving Supabase Database Advisor Warnings)
-- =============================================================================

-- Conversations
CREATE INDEX IF NOT EXISTS idx_conversations_community_id 
    ON public.conversations(community_id) 
    WHERE community_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_created_by 
    ON public.conversations(created_by) 
    WHERE created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_last_message_id 
    ON public.conversations(last_message_id) 
    WHERE last_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_category 
    ON public.conversations(category);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id 
    ON public.messages(reply_to_id) 
    WHERE reply_to_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_sender_id 
    ON public.messages(sender_id) 
    WHERE sender_id IS NOT NULL;

-- Message Attachments
CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id 
    ON public.message_attachments(message_id);

-- Message Receipts
CREATE INDEX IF NOT EXISTS idx_message_receipts_profile_id 
    ON public.message_receipts(profile_id);

CREATE INDEX IF NOT EXISTS idx_message_receipts_message_id 
    ON public.message_receipts(message_id);

-- Message Reactions
CREATE INDEX IF NOT EXISTS idx_message_reactions_profile_id 
    ON public.message_reactions(profile_id);

-- Message Requests
CREATE INDEX IF NOT EXISTS idx_message_requests_conversation_id 
    ON public.message_requests(conversation_id);

CREATE INDEX IF NOT EXISTS idx_message_requests_sender_id 
    ON public.message_requests(sender_id);

-- Live Messages
CREATE INDEX IF NOT EXISTS idx_live_messages_livestream_id 
    ON public.live_messages(livestream_id);

CREATE INDEX IF NOT EXISTS idx_live_messages_sender_id 
    ON public.live_messages(sender_id) 
    WHERE sender_id IS NOT NULL;

-- =============================================================================
-- 3. RLS PERFORMANCE OPTIMIZATION ((SELECT auth.uid()) CACHING)
-- =============================================================================

-- Drop policies to rebuild with optimized init-plans
DROP POLICY IF EXISTS "authenticated_members_read_conversations" ON public.conversations;
DROP POLICY IF EXISTS "authenticated_users_create_conversations" ON public.conversations;
DROP POLICY IF EXISTS "authenticated_admins_update_conversations" ON public.conversations;

CREATE POLICY "authenticated_members_read_conversations" ON public.conversations
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.conversation_members cm
        WHERE cm.conversation_id = public.conversations.id 
          AND cm.profile_id = (SELECT auth.uid()) 
          AND cm.left_at IS NULL
    ));

CREATE POLICY "authenticated_users_create_conversations" ON public.conversations
    FOR INSERT TO authenticated
    WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY "authenticated_admins_update_conversations" ON public.conversations
    FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.conversation_members cm
        WHERE cm.conversation_id = public.conversations.id 
          AND cm.profile_id = (SELECT auth.uid()) 
          AND (cm.role = 'admin' OR public.conversations.kind = 'direct')
          AND cm.left_at IS NULL
    ));

-- Conversation Members
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

-- Messages
DROP POLICY IF EXISTS "authenticated_members_read_messages" ON public.messages;
DROP POLICY IF EXISTS "authenticated_members_insert_messages" ON public.messages;
DROP POLICY IF EXISTS "authenticated_senders_update_messages" ON public.messages;
DROP POLICY IF EXISTS "authenticated_senders_delete_messages" ON public.messages;

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

CREATE POLICY "authenticated_senders_update_messages" ON public.messages
    FOR UPDATE TO authenticated
    USING (
        sender_id = (SELECT auth.uid())
        OR EXISTS (
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

-- Message Attachments
DROP POLICY IF EXISTS "authenticated_members_read_attachments" ON public.message_attachments;
DROP POLICY IF EXISTS "authenticated_senders_create_attachments" ON public.message_attachments;

CREATE POLICY "authenticated_members_read_attachments" ON public.message_attachments
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.messages msg
        JOIN public.conversation_members cm ON cm.conversation_id = msg.conversation_id
        WHERE msg.id = public.message_attachments.message_id 
          AND cm.profile_id = (SELECT auth.uid()) 
          AND cm.left_at IS NULL
    ));

CREATE POLICY "authenticated_senders_create_attachments" ON public.message_attachments
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.messages msg
        WHERE msg.id = public.message_attachments.message_id 
          AND msg.sender_id = (SELECT auth.uid())
    ));

-- Message Receipts
DROP POLICY IF EXISTS "authenticated_members_read_receipts" ON public.message_receipts;
DROP POLICY IF EXISTS "authenticated_users_manage_own_receipts" ON public.message_receipts;

CREATE POLICY "authenticated_members_read_receipts" ON public.message_receipts
    FOR SELECT TO authenticated
    USING (
        profile_id = (SELECT auth.uid()) 
        OR EXISTS (
            SELECT 1 FROM public.messages msg
            JOIN public.conversation_members cm ON cm.conversation_id = msg.conversation_id
            WHERE msg.id = public.message_receipts.message_id 
              AND cm.profile_id = (SELECT auth.uid()) 
              AND cm.left_at IS NULL
        )
    );

CREATE POLICY "authenticated_users_manage_own_receipts" ON public.message_receipts
    FOR ALL TO authenticated
    USING (profile_id = (SELECT auth.uid()))
    WITH CHECK (profile_id = (SELECT auth.uid()));

-- Message Reactions
DROP POLICY IF EXISTS "authenticated_members_read_reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "authenticated_members_insert_reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "authenticated_users_delete_own_reactions" ON public.message_reactions;

CREATE POLICY "authenticated_members_read_reactions" ON public.message_reactions
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.messages msg
        JOIN public.conversation_members cm ON cm.conversation_id = msg.conversation_id
        WHERE msg.id = public.message_reactions.message_id 
          AND cm.profile_id = (SELECT auth.uid()) 
          AND cm.left_at IS NULL
    ));

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

-- Message Requests
DROP POLICY IF EXISTS "authenticated_users_read_message_requests" ON public.message_requests;
DROP POLICY IF EXISTS "authenticated_users_create_message_requests" ON public.message_requests;
DROP POLICY IF EXISTS "authenticated_receivers_update_message_requests" ON public.message_requests;

CREATE POLICY "authenticated_users_read_message_requests" ON public.message_requests
    FOR SELECT TO authenticated
    USING (sender_id = (SELECT auth.uid()) OR receiver_id = (SELECT auth.uid()));

CREATE POLICY "authenticated_users_create_message_requests" ON public.message_requests
    FOR INSERT TO authenticated
    WITH CHECK (sender_id = (SELECT auth.uid()));

CREATE POLICY "authenticated_receivers_update_message_requests" ON public.message_requests
    FOR UPDATE TO authenticated
    USING (receiver_id = (SELECT auth.uid()) OR sender_id = (SELECT auth.uid()));

-- =============================================================================
-- 4. SECURITY DEFINER AUTHORIZATION FUNCTION HARDENING
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin' AND pronamespace = 'public'::regnamespace) THEN
        REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
        GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
        ALTER FUNCTION public.is_admin() SET search_path = public;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_super_admin' AND pronamespace = 'public'::regnamespace) THEN
        REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC, anon;
        GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, service_role;
        ALTER FUNCTION public.is_super_admin() SET search_path = public;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_moderator' AND pronamespace = 'public'::regnamespace) THEN
        REVOKE EXECUTE ON FUNCTION public.is_moderator() FROM PUBLIC, anon;
        GRANT EXECUTE ON FUNCTION public.is_moderator() TO authenticated, service_role;
        ALTER FUNCTION public.is_moderator() SET search_path = public;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_permission' AND pronamespace = 'public'::regnamespace) THEN
        REVOKE EXECUTE ON FUNCTION public.has_permission(VARCHAR) FROM PUBLIC, anon;
        GRANT EXECUTE ON FUNCTION public.has_permission(VARCHAR) TO authenticated, service_role;
        ALTER FUNCTION public.has_permission(VARCHAR) SET search_path = public;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_role' AND pronamespace = 'public'::regnamespace) THEN
        REVOKE EXECUTE ON FUNCTION public.has_role(VARCHAR) FROM PUBLIC, anon;
        GRANT EXECUTE ON FUNCTION public.has_role(VARCHAR) TO authenticated, service_role;
        ALTER FUNCTION public.has_role(VARCHAR) SET search_path = public;
    END IF;
END $$;
