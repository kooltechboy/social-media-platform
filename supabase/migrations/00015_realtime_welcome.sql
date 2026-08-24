-- Migration 00015: Realtime publication for messages + welcome conversation trigger
-- Description: enables Supabase Realtime subscriptions on messages (RLS still enforced
-- per subscriber) and greets every new profile with a welcome DM from the official account.

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Official platform account id (seeded by supabase/seed/official_account.sql)
CREATE OR REPLACE FUNCTION public.official_account_id()
RETURNS uuid
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT 'a0000000-0000-4000-8000-000000000001'::uuid;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_profile_welcome()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    official_id uuid := public.official_account_id();
    conv_id uuid;
BEGIN
    IF NEW.id = official_id THEN
        RETURN NEW;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = official_id) THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.conversations (kind, created_by)
    VALUES ('direct', official_id)
    RETURNING id INTO conv_id;

    INSERT INTO public.conversation_members (conversation_id, profile_id)
    VALUES (conv_id, NEW.id), (conv_id, official_id);

    INSERT INTO public.messages (conversation_id, sender_id, body, message_kind)
    VALUES (
        conv_id,
        official_id,
        'Welcome to ANTILIA — the digital home of the Caribbean and its global diaspora. Explore communities, events and creators, and say hello in your local diaspora hub. 🌴',
        'text'
    );

    UPDATE public.conversations SET last_message_at = now() WHERE id = conv_id;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_welcome_new_profile
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_welcome();

-- Rollback plan:
--   DROP TRIGGER trg_welcome_new_profile ON public.profiles;
--   DROP FUNCTION public.handle_new_profile_welcome();
--   DROP FUNCTION public.official_account_id();
--   ALTER PUBLICATION supabase_realtime DROP TABLE public.messages;
