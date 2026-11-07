-- =============================================================================
-- Rollback Script for Migration 00117
-- =============================================================================

-- 1. Revert public.podcast_analytics policy
DROP POLICY IF EXISTS "podcast_analytics_insert_all" ON public.podcast_analytics;
CREATE POLICY "podcast_analytics_insert_all" ON public.podcast_analytics
    FOR INSERT WITH CHECK (auth.uid() = listener_id OR listener_id IS NULL);

-- 2. Revert public.sounds policies
DROP POLICY IF EXISTS "sounds_creator_delete" ON public.sounds;
DROP POLICY IF EXISTS "sounds_creator_update" ON public.sounds;
DROP POLICY IF EXISTS "sounds_creator_insert" ON public.sounds;
CREATE POLICY "sounds_creator_insert" ON public.sounds
    FOR INSERT WITH CHECK (auth.uid() = creator_id OR creator_id IS NULL);

-- 3. Revert public.events policies
DROP POLICY IF EXISTS "Hosts update events" ON public.events;
CREATE POLICY "Hosts update events" ON public.events
    FOR UPDATE USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "Public read published events" ON public.events;
CREATE POLICY "Public read published events" ON public.events
    FOR SELECT USING (starts_at > now() OR auth.uid() = host_id);

-- 4. Drop events columns added in 00117
ALTER TABLE public.events
    DROP COLUMN IF EXISTS cultural_observance_id,
    DROP COLUMN IF EXISTS postponed_at,
    DROP COLUMN IF EXISTS ticket_availability,
    DROP COLUMN IF EXISTS ticket_source_url,
    DROP COLUMN IF EXISTS organizer_name,
    DROP COLUMN IF EXISTS timezone,
    DROP COLUMN IF EXISTS last_verified_at,
    DROP COLUMN IF EXISTS official_source_url,
    DROP COLUMN IF EXISTS verification_status,
    DROP COLUMN IF EXISTS source_type;

-- 5. Drop cultural_observances table
DROP TABLE IF EXISTS public.cultural_observances CASCADE;
