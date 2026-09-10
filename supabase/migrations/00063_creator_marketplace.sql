CREATE TABLE IF NOT EXISTS creator_marketplace_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  categories TEXT[] DEFAULT '{}', -- ['music', 'food', 'fashion', 'sports', 'comedy', 'travel', 'business']
  min_collaboration_budget_cents INTEGER, -- minimum fee for paid collaborations
  typical_turnaround_days INTEGER DEFAULT 7,
  languages TEXT[] DEFAULT '{"en"}',
  collaboration_types TEXT[] DEFAULT '{}', -- ['sponsored_post', 'reel', 'story', 'live', 'podcast', 'event_appearance']
  media_kit_url TEXT,
  portfolio_urls TEXT[] DEFAULT '{}',
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_creator_marketplace_creator_id ON creator_marketplace_profiles(creator_id);

CREATE TABLE IF NOT EXISTS brand_campaign_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  budget_range_cents_min INTEGER,
  budget_range_cents_max INTEGER,
  content_types TEXT[] DEFAULT '{}',
  target_islands TEXT[] DEFAULT '{}', -- ISO codes
  target_diaspora_cities TEXT[] DEFAULT '{}',
  deadline DATE,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS creator_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID NOT NULL REFERENCES brand_campaign_briefs(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  proposal TEXT NOT NULL,
  rate_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(brief_id, creator_id)
);

-- RLS
ALTER TABLE creator_marketplace_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_campaign_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_applications ENABLE ROW LEVEL SECURITY;

-- Creator marketplace profiles: public read, own write
CREATE POLICY "public_read_creator_marketplace" ON creator_marketplace_profiles
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "creator_own_marketplace_profile" ON creator_marketplace_profiles
  FOR ALL TO authenticated
  USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());

-- Campaign briefs: public read (open briefs), business writes own
CREATE POLICY "public_read_open_briefs" ON brand_campaign_briefs
  FOR SELECT TO anon, authenticated USING (status = 'open');

CREATE POLICY "business_own_briefs" ON brand_campaign_briefs
  FOR ALL TO authenticated
  USING (business_id = auth.uid()) WITH CHECK (business_id = auth.uid());

-- Applications: creator reads own, brief owner reads all for their brief
CREATE POLICY "creator_own_applications" ON creator_applications
  FOR ALL TO authenticated
  USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());

CREATE POLICY "brief_owner_reads_applications" ON creator_applications
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM brand_campaign_briefs b
      WHERE b.id = creator_applications.brief_id
        AND b.business_id = auth.uid()
    )
  );
