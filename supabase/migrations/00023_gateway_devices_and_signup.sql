-- Migration 00022: Tukubi Gateway Security Devices & Auth Extensions
-- Description: Adds user_devices table for user device tracking and active session management
-- Row-level security strictly enforced per AGENTS.md Rule 2

CREATE TABLE IF NOT EXISTS public.user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name VARCHAR(150),
  browser VARCHAR(100),
  os VARCHAR(100),
  ip_hash VARCHAR(128),
  approx_location VARCHAR(150),
  is_trusted BOOLEAN DEFAULT true NOT NULL,
  last_active_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for lookup by user
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON public.user_devices(user_id);

-- Enable RLS
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

-- Owner can read their own devices
CREATE POLICY "Owner read own devices"
  ON public.user_devices
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Owner can insert device record
CREATE POLICY "Owner insert own devices"
  ON public.user_devices
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Owner can update own devices
CREATE POLICY "Owner update own devices"
  ON public.user_devices
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Owner can delete device (revoke session)
CREATE POLICY "Owner delete own devices"
  ON public.user_devices
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
