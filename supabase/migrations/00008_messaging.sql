-- Migration 00008: Messaging — Conversations, Messages & Receipts
-- Description: 1:1 and group conversations, member-scoped access, attachments, read receipts

CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kind VARCHAR(10) CHECK (kind IN ('direct', 'group')) NOT NULL,
    title TEXT,
    community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.conversation_members (
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role VARCHAR(12) CHECK (role IN ('member', 'admin')) DEFAULT 'member' NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    muted_until TIMESTAMPTZ,
    left_at TIMESTAMPTZ,
    PRIMARY KEY (conversation_id, profile_id)
);

CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    body TEXT,
    message_kind VARCHAR(12) CHECK (message_kind IN ('text', 'voice', 'media', 'system')) DEFAULT 'text' NOT NULL,
    reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    edited_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
    storage_path TEXT NOT NULL,
    attachment_kind VARCHAR(12) CHECK (attachment_kind IN ('image', 'video', 'audio', 'file')) NOT NULL,
    file_size_bytes BIGINT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.message_receipts (
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    PRIMARY KEY (message_id, profile_id)
);

-- Indexing
CREATE INDEX idx_conversation_members_profile ON public.conversation_members(profile_id) WHERE left_at IS NULL;
CREATE INDEX idx_conversations_last_message ON public.conversations(last_message_at DESC);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at DESC);
CREATE INDEX idx_message_attachments_message ON public.message_attachments(message_id);
CREATE INDEX idx_message_receipts_message ON public.message_receipts(message_id);

-- Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read conversations" ON public.conversations
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.conversation_members m
        WHERE m.conversation_id = id AND m.profile_id = auth.uid() AND m.left_at IS NULL
    ));

CREATE POLICY "Members read membership" ON public.conversation_members
    FOR SELECT USING (profile_id = auth.uid() OR conversation_id IN (
        SELECT conversation_id FROM public.conversation_members me
        WHERE me.profile_id = auth.uid() AND me.left_at IS NULL
    ));
CREATE POLICY "Self insert membership" ON public.conversation_members
    FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Members read messages" ON public.messages
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.conversation_members m
        WHERE m.conversation_id = conversation_id AND m.profile_id = auth.uid() AND m.left_at IS NULL
    ));
CREATE POLICY "Members send messages" ON public.messages
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM public.conversation_members m
        WHERE m.conversation_id = conversation_id AND m.profile_id = auth.uid() AND m.left_at IS NULL
    ));
CREATE POLICY "Sender edits messages" ON public.messages
    FOR UPDATE USING (sender_id = auth.uid());

CREATE POLICY "Members read attachments" ON public.message_attachments
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.messages msg
        JOIN public.conversation_members m ON m.conversation_id = msg.conversation_id
        WHERE msg.id = message_id AND m.profile_id = auth.uid() AND m.left_at IS NULL
    ));
CREATE POLICY "Members create attachments" ON public.message_attachments
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM public.messages msg
        WHERE msg.id = message_id AND msg.sender_id = auth.uid()
    ));

CREATE POLICY "Member reads receipts" ON public.message_receipts
    FOR SELECT USING (profile_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.messages msg
        JOIN public.conversation_members m ON m.conversation_id = msg.conversation_id
        WHERE msg.id = message_id AND m.profile_id = auth.uid() AND m.left_at IS NULL
    ));
CREATE POLICY "Member updates own receipts" ON public.message_receipts
    FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "Member inserts own receipts" ON public.message_receipts
    FOR INSERT WITH CHECK (profile_id = auth.uid());
