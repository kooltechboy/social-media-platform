-- Extend campaigns table with new objective types if not already present
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS objective_v2 TEXT CHECK (objective_v2 IN (
  'awareness', 'reach', 'traffic', 'engagement', 'video_views', 'leads', 
  'messages', 'marketplace_sales', 'creator_promotion', 'app_installs'
));

-- Ad placements config
ALTER TABLE ad_sets ADD COLUMN IF NOT EXISTS placements JSONB DEFAULT '[]'::jsonb;
-- Example placement: ['feed', 'reels', 'stories', 'explore', 'marketplace', 'communities']

-- Creative type
ALTER TABLE ads ADD COLUMN IF NOT EXISTS creative_type TEXT CHECK (creative_type IN (
  'single_image', 'video', 'reel', 'story', 'carousel', 'collection', 'product', 'creator_partnership'
));

-- AI brief for AI-generated ad creation
ALTER TABLE ads ADD COLUMN IF NOT EXISTS ai_brief TEXT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS ai_generated_headline TEXT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS ai_generated_copy TEXT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS ai_generated_cta TEXT;

-- Ad reporting events table
CREATE TABLE IF NOT EXISTS ad_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'click', 'conversion', 'video_view', 'video_complete')),
  viewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_ad_events_ad_id ON ad_events(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_events_occurred_at ON ad_events(occurred_at);

-- RLS on ad_events
ALTER TABLE ad_events ENABLE ROW LEVEL SECURITY;

-- Only the ad owner (via campaigns join) can read events
CREATE POLICY "ad_owners_read_events" ON ad_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ads a
      JOIN ad_sets ads2 ON ads2.id = a.ad_set_id
      JOIN campaigns c ON c.id = ads2.campaign_id
      WHERE a.id = ad_events.ad_id
        AND c.advertiser_id = auth.uid()
    )
  );
