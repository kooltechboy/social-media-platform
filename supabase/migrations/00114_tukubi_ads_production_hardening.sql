-- Migration 00114: TUKUBI Ads Production Hardening, PayPal Billing Linkage & Moderation
-- Description: Hardens advertising RLS, introduces budget spend tracking, staff moderation controls, atomic ad serving spend deductions, and post-promotion foreign keys.

-- 1. Fix ad_events RLS policy: Join via advertisers.profile_id to auth.uid()
DROP POLICY IF EXISTS "ad_owners_read_events" ON public.ad_events;
CREATE POLICY "ad_owners_read_events" ON public.ad_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ads a
      JOIN public.ad_sets s ON s.id = a.ad_set_id
      JOIN public.campaigns c ON c.id = s.campaign_id
      JOIN public.advertisers adv ON adv.id = c.advertiser_id
      WHERE a.id = ad_events.ad_id
        AND adv.profile_id = auth.uid()
    )
  );

-- Viewers (authenticated and anon) can insert telemetry events for approved ads
DROP POLICY IF EXISTS "viewers_insert_ad_events" ON public.ad_events;
CREATE POLICY "viewers_insert_ad_events" ON public.ad_events
  FOR INSERT TO authenticated, anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ads a
      WHERE a.id = ad_events.ad_id AND a.is_approved = true
    )
  );

-- 2. Extend campaigns with budget tracking, moderation status, and source post linkage
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS funded_amount_minor INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS spent_amount_minor INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')) NOT NULL,
  ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS source_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS page_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL;

-- 3. Extend ads with moderation audit fields
ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES public.profiles(id);

-- 4. Helper function: Check if user is staff/moderator/admin
CREATE OR REPLACE FUNCTION public.is_staff_or_ad_moderator(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.accounts
    WHERE (profile_id = p_user_id OR id = p_user_id)
      AND status = 'active'
      AND role IN ('super_admin', 'superadmin', 'management', 'admin', 'moderator', 'content_manager')
  );
$$;

-- 5. Staff RLS policies for Campaign & Ad Moderation
DROP POLICY IF EXISTS "Staff read all campaigns" ON public.campaigns;
CREATE POLICY "Staff read all campaigns" ON public.campaigns
  FOR SELECT TO authenticated
  USING (public.is_staff_or_ad_moderator(auth.uid()));

DROP POLICY IF EXISTS "Staff update all campaigns" ON public.campaigns;
CREATE POLICY "Staff update all campaigns" ON public.campaigns
  FOR UPDATE TO authenticated
  USING (public.is_staff_or_ad_moderator(auth.uid()));

DROP POLICY IF EXISTS "Staff read all ads" ON public.ads;
CREATE POLICY "Staff read all ads" ON public.ads
  FOR SELECT TO authenticated
  USING (public.is_staff_or_ad_moderator(auth.uid()));

DROP POLICY IF EXISTS "Staff update all ads" ON public.ads;
CREATE POLICY "Staff update all ads" ON public.ads
  FOR UPDATE TO authenticated
  USING (public.is_staff_or_ad_moderator(auth.uid()));

DROP POLICY IF EXISTS "Staff read all ad sets" ON public.ad_sets;
CREATE POLICY "Staff read all ad sets" ON public.ad_sets
  FOR SELECT TO authenticated
  USING (public.is_staff_or_ad_moderator(auth.uid()));

DROP POLICY IF EXISTS "Staff read all advertisers" ON public.advertisers;
CREATE POLICY "Staff read all advertisers" ON public.advertisers
  FOR SELECT TO authenticated
  USING (public.is_staff_or_ad_moderator(auth.uid()));

-- 6. Atomic Ad Serving Spend & Impression Function
-- Prevents overspend beyond funded campaign budget and auto-completes exhausted campaigns
CREATE OR REPLACE FUNCTION public.record_ad_impression_and_spend(
  p_ad_id UUID,
  p_viewer_id UUID,
  p_placement TEXT,
  p_cost_minor INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_campaign_id UUID;
  v_budget_total INTEGER;
  v_funded INTEGER;
  v_spent INTEGER;
  v_is_approved BOOLEAN;
  v_status TEXT;
  v_new_spent INTEGER;
  v_impression_id BIGINT;
BEGIN
  -- Lock campaign row for atomic balance update
  SELECT 
    c.id, c.budget_total_minor, c.funded_amount_minor, c.spent_amount_minor, c.status, a.is_approved
  INTO 
    v_campaign_id, v_budget_total, v_funded, v_spent, v_status, v_is_approved
  FROM public.ads a
  JOIN public.ad_sets s ON s.id = a.ad_set_id
  JOIN public.campaigns c ON c.id = s.campaign_id
  WHERE a.id = p_ad_id
  FOR UPDATE OF c;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ad not found');
  END IF;

  IF NOT v_is_approved THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ad is not approved');
  END IF;

  IF v_status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Campaign is not active');
  END IF;

  -- Verify campaign is funded
  IF v_funded <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Campaign has zero funded budget');
  END IF;

  -- Prevent overspend beyond funded budget
  IF v_spent >= v_funded THEN
    UPDATE public.campaigns SET status = 'completed' WHERE id = v_campaign_id;
    RETURN jsonb_build_object('success', false, 'error', 'Campaign budget exhausted', 'completed', true);
  END IF;

  v_new_spent := LEAST(v_spent + COALESCE(p_cost_minor, 0), v_funded);

  -- Update campaign spend and status
  UPDATE public.campaigns
  SET 
    spent_amount_minor = v_new_spent,
    status = CASE WHEN v_new_spent >= v_funded THEN 'completed' ELSE 'active' END
  WHERE id = v_campaign_id;

  -- Insert impression record
  INSERT INTO public.ad_impressions (ad_id, viewer_id, placement, cost_minor)
  VALUES (p_ad_id, p_viewer_id, COALESCE(p_placement, 'feed'), COALESCE(p_cost_minor, 0))
  RETURNING id INTO v_impression_id;

  -- Insert event record
  INSERT INTO public.ad_events (ad_id, event_type, viewer_id, metadata)
  VALUES (
    p_ad_id, 
    'impression', 
    p_viewer_id, 
    jsonb_build_object('cost_minor', COALESCE(p_cost_minor, 0), 'placement', COALESCE(p_placement, 'feed'))
  );

  RETURN jsonb_build_object(
    'success', true, 
    'impression_id', v_impression_id, 
    'spent_amount_minor', v_new_spent,
    'is_exhausted', (v_new_spent >= v_funded)
  );
END;
$$;

-- Revoke dangerous direct execution on internal RPCs from public
REVOKE EXECUTE ON FUNCTION public.record_ad_impression_and_spend FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_ad_impression_and_spend TO authenticated, anon, service_role;

-- 7. Add index for fast retrieval of active, funded, approved ads
CREATE INDEX IF NOT EXISTS idx_campaigns_serving_active 
  ON public.campaigns(status, moderation_status, funded_amount_minor, spent_amount_minor)
  WHERE status = 'active' AND moderation_status = 'approved';

CREATE INDEX IF NOT EXISTS idx_ads_approved_ad_set 
  ON public.ads(ad_set_id) 
  WHERE is_approved = true;

CREATE INDEX IF NOT EXISTS idx_campaigns_source_post 
  ON public.campaigns(source_post_id) 
  WHERE source_post_id IS NOT NULL;
