-- Migration 00084: PayPal Billing Plans & Tier Alignment
-- Adds paypal_plan_id to monetization_tier_configs and creator_subscription_plans,
-- and updates canonical platform tiers with their live PayPal Plan IDs.

ALTER TABLE public.monetization_tier_configs
    ADD COLUMN IF NOT EXISTS paypal_plan_id TEXT;

ALTER TABLE public.creator_subscription_plans
    ADD COLUMN IF NOT EXISTS paypal_plan_id TEXT;

-- Seed live PayPal Plan IDs into monetization_tier_configs
UPDATE public.monetization_tier_configs
SET paypal_plan_id = 'P-24422210GR093024NNKUOD7I'
WHERE id = 'user_premium';

UPDATE public.monetization_tier_configs
SET paypal_plan_id = 'P-5V708726CT8509016NKUOD7Q'
WHERE id = 'creator_plus';

UPDATE public.monetization_tier_configs
SET paypal_plan_id = 'P-66G91342833329842NKUOD7Q'
WHERE id = 'creator_pro';

UPDATE public.monetization_tier_configs
SET paypal_plan_id = 'P-8HW87778RJ695940XNKUOD7Y'
WHERE id = 'seller_pro';

UPDATE public.monetization_tier_configs
SET paypal_plan_id = 'P-21X48782YF5114038NKUOD7Y'
WHERE id = 'business_plus';
