-- ============================================================================
-- Migration: 00113_dual_host_collaborative_livestreams.sql
-- Description: Dual-Host & Co-Host Collaborative Live Broadcasting
-- Adds co_host_id and co_host_status to livestreams with RLS policies
-- ============================================================================

ALTER TABLE public.livestreams
  ADD COLUMN IF NOT EXISTS co_host_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS co_host_status VARCHAR(16) CHECK (co_host_status IN ('none', 'invited', 'active', 'declined')) DEFAULT 'none' NOT NULL;

-- Index for fast lookup of co-hosted streams by profile
CREATE INDEX IF NOT EXISTS idx_livestreams_co_host_id ON public.livestreams(co_host_id) WHERE co_host_id IS NOT NULL;

-- Allow active co-hosts to view and participate in livestream management (e.g. status, chat moderation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'livestreams' AND policyname = 'livestreams_co_host_access'
  ) THEN
    CREATE POLICY livestreams_co_host_access ON public.livestreams
      FOR ALL
      TO authenticated
      USING (
        auth.uid() = creator_id OR
        (auth.uid() = co_host_id AND co_host_status IN ('invited', 'active'))
      )
      WITH CHECK (
        auth.uid() = creator_id OR
        (auth.uid() = co_host_id AND co_host_status = 'active')
      );
  END IF;
END $$;
