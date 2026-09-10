-- Trending signals store (replaces/augments real-time trending)
CREATE TABLE IF NOT EXISTS trending_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  territory_iso TEXT, -- NULL = platform-wide, 'JM' = Jamaica, etc.
  signal_type TEXT NOT NULL CHECK (signal_type IN ('hashtag', 'sound', 'creator', 'topic', 'keyword')),
  entity_id TEXT NOT NULL, -- hashtag text, sound id, profile id, etc.
  entity_label TEXT NOT NULL, -- display name
  entity_avatar_url TEXT,
  score NUMERIC NOT NULL DEFAULT 0,
  post_count_last_2h INTEGER DEFAULT 0,
  post_count_last_24h INTEGER DEFAULT 0,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '6 hours')
);

CREATE INDEX IF NOT EXISTS idx_trending_signals_territory ON trending_signals(territory_iso, signal_type, score DESC);
CREATE INDEX IF NOT EXISTS idx_trending_signals_expires ON trending_signals(expires_at);

-- RLS: trending signals are public read
ALTER TABLE trending_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_trending" ON trending_signals
  FOR SELECT TO anon, authenticated
  USING (expires_at > now());

-- Only service role can write trending signals
CREATE POLICY "service_write_trending" ON trending_signals
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Cleanup function for expired signals
CREATE OR REPLACE FUNCTION cleanup_expired_trending_signals()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM trending_signals WHERE expires_at < now();
END;
$$;
