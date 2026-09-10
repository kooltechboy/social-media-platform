-- Migration 00064: Content Repurpose Cache
-- Description: adds repurpose_result JSONB to podcast_episodes

ALTER TABLE public.podcast_episodes
  ADD COLUMN IF NOT EXISTS repurpose_result JSONB,
  ADD COLUMN IF NOT EXISTS repurposed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_podcast_episodes_repurposed 
  ON public.podcast_episodes(repurposed_at) WHERE repurposed_at IS NOT NULL;
