-- Migration 00013: Self-Serve Advertising Platform
-- Description: advertisers, campaigns, ad sets, ads, impressions and click events (privacy-aware targeting only)

CREATE TABLE public.advertisers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    billing_country_iso VARCHAR(3) REFERENCES public.countries(iso_code),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TYPE public.campaign_objective AS ENUM ('awareness', 'traffic', 'engagement', 'conversions');

CREATE TABLE public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_id UUID REFERENCES public.advertisers(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    objective public.campaign_objective NOT NULL,
    status VARCHAR(12) CHECK (status IN ('draft', 'active', 'paused', 'completed', 'rejected')) DEFAULT 'draft' NOT NULL,
    budget_total_minor INTEGER CHECK (budget_total_minor > 0) NOT NULL,
    budget_daily_minor INTEGER CHECK (budget_daily_minor > 0),
    currency VARCHAR(3) NOT NULL,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.ad_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    country_iso VARCHAR(3) REFERENCES public.countries(iso_code),
    interest_keys TEXT[] DEFAULT '{}',
    placement VARCHAR(20) CHECK (placement IN ('feed', 'explore', 'search', 'reels', 'events')) NOT NULL,
    bid_cpm_minor INTEGER CHECK (bid_cpm_minor > 0),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_set_id UUID REFERENCES public.ad_sets(id) ON DELETE CASCADE NOT NULL,
    headline TEXT NOT NULL,
    body TEXT,
    media_path TEXT,
    destination_url TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.ad_impressions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE NOT NULL,
    viewer_id UUID,
    placement VARCHAR(20),
    cost_minor INTEGER NOT NULL,
    served_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.ad_clicks (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    impression_id BIGINT REFERENCES public.ad_impressions(id) ON DELETE CASCADE NOT NULL,
    clicked_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexing
CREATE INDEX idx_advertisers_profile ON public.advertisers(profile_id);
CREATE INDEX idx_campaigns_advertiser ON public.campaigns(advertiser_id, status);
CREATE INDEX idx_ad_sets_campaign ON public.ad_sets(campaign_id);
CREATE INDEX idx_ads_ad_set ON public.ads(ad_set_id, is_approved);
CREATE INDEX idx_ad_impressions_ad_time ON public.ad_impressions(ad_id, served_at DESC);
CREATE INDEX idx_ad_clicks_impression ON public.ad_clicks(impression_id);

-- Row Level Security
ALTER TABLE public.advertisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read advertisers" ON public.advertisers
    FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Profile creates advertiser" ON public.advertisers
    FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Advertiser reads campaigns" ON public.campaigns
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.advertisers a WHERE a.id = advertiser_id AND a.profile_id = auth.uid()
    ));
CREATE POLICY "Advertiser creates campaigns" ON public.campaigns
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM public.advertisers a WHERE a.id = advertiser_id AND a.profile_id = auth.uid()
    ));
CREATE POLICY "Advertiser updates campaigns" ON public.campaigns
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM public.advertisers a WHERE a.id = advertiser_id AND a.profile_id = auth.uid()
    ));

CREATE POLICY "Campaign owners read ad sets" ON public.ad_sets
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.campaigns c
        JOIN public.advertisers a ON a.id = c.advertiser_id
        WHERE c.id = campaign_id AND a.profile_id = auth.uid()
    ));
CREATE POLICY "Campaign owners create ad sets" ON public.ad_sets
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM public.campaigns c
        JOIN public.advertisers a ON a.id = c.advertiser_id
        WHERE c.id = campaign_id AND a.profile_id = auth.uid()
    ));

-- Ads themselves are readable by everyone when approved (delivery); edits restricted to owners
CREATE POLICY "Public read approved ads" ON public.ads
    FOR SELECT USING (is_approved OR EXISTS (
        SELECT 1 FROM public.ad_sets s
        JOIN public.campaigns c ON c.id = s.campaign_id
        JOIN public.advertisers a ON a.id = c.advertiser_id
        WHERE s.id = ad_set_id AND a.profile_id = auth.uid()
    ));
CREATE POLICY "Campaign owners create ads" ON public.ads
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM public.ad_sets s
        JOIN public.campaigns c ON c.id = s.campaign_id
        JOIN public.advertisers a ON a.id = c.advertiser_id
        WHERE s.id = ad_set_id AND a.profile_id = auth.uid()
    ));

CREATE POLICY "Viewers insert own impressions" ON public.ad_impressions
    FOR INSERT WITH CHECK (viewer_id = auth.uid() OR viewer_id IS NULL);
CREATE POLICY "Viewers insert own clicks" ON public.ad_clicks
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM public.ad_impressions i WHERE i.id = impression_id AND i.viewer_id = auth.uid()
    ));
