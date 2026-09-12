-- =============================================================================
-- Migration 00077: Caribbean Audio Spaces ("Tukubi Sound Lounge")
-- =============================================================================
-- Description:
--   Introduces low-latency audio spaces for cultural dialogue, music premieres,
--   and fete discussions with role-based stage governance and real-time state.
--   1. public.sound_lounges
--   2. public.sound_lounge_members
--   3. Realtime publication registration
--   4. Row Level Security (RLS) policies
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. Sound Lounges Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.sound_lounges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    cultural_genre VARCHAR(40) DEFAULT 'carnival' NOT NULL,
    state VARCHAR(12) CHECK (state IN ('scheduled', 'live', 'ended', 'cancelled')) DEFAULT 'scheduled' NOT NULL,
    scheduled_for TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    listener_count INTEGER DEFAULT 0 NOT NULL,
    peak_listeners INTEGER DEFAULT 0 NOT NULL,
    is_recorded BOOLEAN DEFAULT false NOT NULL,
    recording_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexing
CREATE INDEX IF NOT EXISTS idx_sound_lounges_host ON public.sound_lounges (host_id);
CREATE INDEX IF NOT EXISTS idx_sound_lounges_state ON public.sound_lounges (state);
CREATE INDEX IF NOT EXISTS idx_sound_lounges_created ON public.sound_lounges (created_at DESC);

-- =============================================================================
-- 2. Sound Lounge Members & Stage Roles
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.sound_lounge_members (
    lounge_id UUID REFERENCES public.sound_lounges(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role VARCHAR(12) CHECK (role IN ('host', 'co_host', 'speaker', 'listener')) DEFAULT 'listener' NOT NULL,
    is_muted BOOLEAN DEFAULT true NOT NULL,
    hand_raised BOOLEAN DEFAULT false NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    left_at TIMESTAMPTZ,
    PRIMARY KEY (lounge_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_sound_lounge_members_lounge ON public.sound_lounge_members (lounge_id) WHERE left_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sound_lounge_members_profile ON public.sound_lounge_members (profile_id) WHERE left_at IS NULL;

-- =============================================================================
-- 3. Realtime Publication Registration
-- =============================================================================

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sound_lounges;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sound_lounge_members;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- 4. Row Level Security (RLS)
-- =============================================================================

ALTER TABLE public.sound_lounges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sound_lounge_members ENABLE ROW LEVEL SECURITY;

-- Sound Lounges Policies
CREATE POLICY "sound_lounges_select_public" ON public.sound_lounges
    FOR SELECT USING (state IN ('live', 'scheduled', 'ended'));

CREATE POLICY "sound_lounges_insert_creator" ON public.sound_lounges
    FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "sound_lounges_update_host" ON public.sound_lounges
    FOR UPDATE USING (
        auth.uid() = host_id
        OR EXISTS (
            SELECT 1 FROM public.sound_lounge_members
            WHERE lounge_id = sound_lounges.id
              AND profile_id = auth.uid()
              AND role = 'co_host'
              AND left_at IS NULL
        )
    );

-- Sound Lounge Members Policies
CREATE POLICY "sound_lounge_members_select" ON public.sound_lounge_members
    FOR SELECT USING (true);

CREATE POLICY "sound_lounge_members_insert_self" ON public.sound_lounge_members
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "sound_lounge_members_update_self_or_host" ON public.sound_lounge_members
    FOR UPDATE USING (
        auth.uid() = profile_id
        OR EXISTS (
            SELECT 1 FROM public.sound_lounges
            WHERE id = sound_lounge_members.lounge_id
              AND host_id = auth.uid()
        )
    );

COMMIT;
