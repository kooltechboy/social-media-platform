-- Migration 00055: Messaging Concurrency Hardening, Canonical Pair Backfill & RLS Tightening
-- 
-- Fixes:
-- 1. Race condition in get_or_create_direct_conversation (unique_violation handler)
-- 2. Sequence number race in fn_sync_message_sequence_and_conversation (FOR UPDATE lock)
-- 3. Backfill canonical_pair on welcome conversations lacking the symmetric key
-- 4. Fix handle_new_profile_welcome() to set canonical_pair and prevent duplicates
-- 5. Tighten messages UPDATE RLS — split into sender-only + member soft-delete policies
-- 6. Add fn_guard_message_update trigger to prevent non-senders from editing message content

BEGIN;

-- Section 1: Fix `get_or_create_direct_conversation` race condition
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

    -- Verify target user exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id) THEN
        RAISE EXCEPTION 'Target user not found.';
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
        -- Re-activate membership if previously left
        UPDATE public.conversation_members
        SET left_at = NULL, status = 'active'
        WHERE conversation_id = conv_id AND profile_id = current_uid AND left_at IS NOT NULL;
        
        RETURN conv_id;
    END IF;

    -- Create new conversation atomically with race-condition safety
    BEGIN
        INSERT INTO public.conversations (kind, created_by, canonical_pair, last_sequence_number)
        VALUES ('direct', current_uid, pair_key, 0)
        RETURNING id INTO conv_id;
    EXCEPTION WHEN unique_violation THEN
        -- Concurrent insert won the race — fetch the winner's row
        SELECT id INTO conv_id
        FROM public.conversations
        WHERE canonical_pair = pair_key;
    END;

    -- Add both members (upsert in case of race)
    INSERT INTO public.conversation_members (conversation_id, profile_id, role, status)
    VALUES 
        (conv_id, current_uid, 'member', 'active'),
        (conv_id, target_user_id, 'member', 'active')
    ON CONFLICT (conversation_id, profile_id) 
    DO UPDATE SET left_at = NULL, status = 'active';

    RETURN conv_id;
END;
$$;

-- Section 2: Fix `fn_sync_message_sequence_and_conversation` sequence race
CREATE OR REPLACE FUNCTION public.fn_sync_message_sequence_and_conversation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    next_seq BIGINT;
BEGIN
    -- Lock the conversation row to serialize sequence assignment
    SELECT last_sequence_number + 1 INTO next_seq
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

-- Section 3: Backfill `canonical_pair` on welcome conversations
-- Backfill canonical_pair for existing direct conversations that lack one
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
WHERE c.kind = 'direct' AND c.canonical_pair IS NULL;

-- Section 4: Fix `handle_new_profile_welcome()` to set `canonical_pair`
CREATE OR REPLACE FUNCTION public.handle_new_profile_welcome()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    official_id uuid := public.official_account_id();
    conv_id uuid;
    pair_key text;
BEGIN
    -- Skip for the official account itself
    IF NEW.id = official_id THEN
        RETURN NEW;
    END IF;
    -- Skip if official account doesn't exist yet
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = official_id) THEN
        RETURN NEW;
    END IF;

    -- Compute canonical pair key for deduplication
    IF NEW.id < official_id THEN
        pair_key := NEW.id::text || ':' || official_id::text;
    ELSE
        pair_key := official_id::text || ':' || NEW.id::text;
    END IF;

    -- Create welcome conversation with canonical_pair (skip if already exists)
    BEGIN
        INSERT INTO public.conversations (kind, created_by, canonical_pair)
        VALUES ('direct', official_id, pair_key)
        RETURNING id INTO conv_id;
    EXCEPTION WHEN unique_violation THEN
        -- If conversation already existed, look it up
        SELECT id INTO conv_id FROM public.conversations WHERE canonical_pair = pair_key;
    END;

    IF conv_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Add both members
    INSERT INTO public.conversation_members (conversation_id, profile_id)
    VALUES (conv_id, NEW.id), (conv_id, official_id)
    ON CONFLICT (conversation_id, profile_id) DO NOTHING;

    -- Send welcome message
    INSERT INTO public.messages (conversation_id, sender_id, body, message_kind)
    VALUES (
        conv_id,
        official_id,
        'Welcome to TUKUBI — the digital home of the Caribbean and its global diaspora. Explore communities, events and creators, and say hello in your local diaspora hub. 🌴',
        'text'
    );

    UPDATE public.conversations SET last_message_at = now() WHERE id = conv_id;

    RETURN NEW;
END;
$$;

-- Section 5: Tighten messages UPDATE RLS
-- Drop the overly-permissive combined policy
DROP POLICY IF EXISTS "authenticated_senders_update_messages" ON public.messages;

-- Policy 1: Senders can update their own messages (edit body, soft-delete)
CREATE POLICY "authenticated_senders_update_own_messages" ON public.messages
    FOR UPDATE TO authenticated
    USING (sender_id = (SELECT auth.uid()))
    WITH CHECK (sender_id = (SELECT auth.uid()));

-- Policy 2: Members can update deleted_for on any message in their conversations
-- (guard trigger below restricts what non-senders can actually change)
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

-- Guard trigger: non-senders may only modify deleted_for
CREATE OR REPLACE FUNCTION public.fn_guard_message_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- If the updater is not the sender, only deleted_for may change
    IF OLD.sender_id IS DISTINCT FROM (SELECT auth.uid()) THEN
        IF NEW.body IS DISTINCT FROM OLD.body 
           OR NEW.edited_at IS DISTINCT FROM OLD.edited_at
           OR NEW.metadata IS DISTINCT FROM OLD.metadata
           OR NEW.message_kind IS DISTINCT FROM OLD.message_kind
           OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at THEN
            RAISE EXCEPTION 'Only the message sender may edit message content.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_message_update ON public.messages;
CREATE TRIGGER trg_guard_message_update
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_guard_message_update();

-- Section 6: Re-grant execute permissions
-- Ensure RPC functions remain callable by authenticated users
GRANT EXECUTE ON FUNCTION public.get_or_create_direct_conversation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read(UUID, BIGINT) TO authenticated;

-- Revoke public/anon from new guard function
REVOKE ALL ON FUNCTION public.fn_guard_message_update() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_guard_message_update() FROM anon;
GRANT EXECUTE ON FUNCTION public.fn_guard_message_update() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_guard_message_update() TO service_role;

COMMIT;
