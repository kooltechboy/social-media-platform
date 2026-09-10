-- Migration: 00065_live_cdn_integration.sql
-- Adds Cloudflare Stream CDN columns to the livestreams table for real live streaming ingest and playback.

ALTER TABLE public.livestreams
  ADD COLUMN IF NOT EXISTS cloudflare_uid TEXT,
  ADD COLUMN IF NOT EXISTS rtmps_url TEXT,
  ADD COLUMN IF NOT EXISTS rtmps_key TEXT,
  ADD COLUMN IF NOT EXISTS playback_hls_url TEXT,
  ADD COLUMN IF NOT EXISTS playback_dash_url TEXT,
  ADD COLUMN IF NOT EXISTS webrtc_url TEXT,
  ADD COLUMN IF NOT EXISTS viewer_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recording_uid TEXT;

-- Index for quick lookup by Cloudflare UID when status webhooks arrive
CREATE UNIQUE INDEX IF NOT EXISTS idx_livestreams_cloudflare_uid
  ON public.livestreams(cloudflare_uid)
  WHERE cloudflare_uid IS NOT NULL;

-- SECURITY NOTE: rtmps_key is the stream key used by OBS/mobile. Treat it as a secret.
-- Never log it, never include it in SELECT * queries surfaced to viewers.
-- Existing RLS on livestreams restricts creator_id ownership.
