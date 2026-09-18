-- Migration 00090: Storage Bucket RLS Hardening & Owner Path Enclosure
-- Description: Restricts uploads in caribbean-sounds and live-replays to user-scoped folder paths
--              (storage.foldername(name))[1] = auth.uid()::text and adds owner UPDATE/DELETE policies.

DO $$
BEGIN
    -- 1. Hardening caribbean-sounds
    DROP POLICY IF EXISTS "Authenticated creators upload sounds" ON storage.objects;
    DROP POLICY IF EXISTS "Users update own sounds" ON storage.objects;
    DROP POLICY IF EXISTS "Users delete own sounds" ON storage.objects;

    CREATE POLICY "Authenticated creators upload sounds"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'caribbean-sounds'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

    CREATE POLICY "Users update own sounds"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'caribbean-sounds'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

    CREATE POLICY "Users delete own sounds"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'caribbean-sounds'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

    -- 2. Hardening live-replays
    DROP POLICY IF EXISTS "Broadcasters upload replays" ON storage.objects;
    DROP POLICY IF EXISTS "Users update own replays" ON storage.objects;
    DROP POLICY IF EXISTS "Users delete own replays" ON storage.objects;

    CREATE POLICY "Broadcasters upload replays"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'live-replays'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

    CREATE POLICY "Users update own replays"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'live-replays'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

    CREATE POLICY "Users delete own replays"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'live-replays'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
END $$;
