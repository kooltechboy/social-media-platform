-- =============================================================================
-- Migration 00081: TUKUBI Enterprise Marketplace Transformation
-- Description:
--   1. Adds marketplace_categories table with hierarchical Caribbean taxonomy & cultural tags
--   2. Expands public.products with condition, location, shipping/pickup flags, tags, status, views, saves
--   3. Adds marketplace_product_media for multi-image ordering & product videos
--   4. Adds marketplace_offers for negotiations, counteroffers, and expiration
--   5. Adds marketplace_wishlists & marketplace_saved_searches
--   6. Adds marketplace_disputes & marketplace_dispute_messages for Buyer Protection & Resolution Center
--   7. Adds marketplace_affiliate_links for Creator Commerce & trackable commissions
--   8. Adds marketplace_reports for trust & safety / moderation
--   9. Adds Row Level Security (RLS) policies with cached (SELECT auth.uid()) optimization
--  10. Adds covering foreign key indexes and helper functions
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. MARKETPLACE CATEGORIES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.marketplace_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(120) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    icon VARCHAR(60),
    parent_id UUID REFERENCES public.marketplace_categories(id) ON DELETE CASCADE,
    cultural_tags TEXT[] DEFAULT '{}'::text[] NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    display_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_marketplace_categories_parent ON public.marketplace_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_categories_slug ON public.marketplace_categories(slug);
CREATE INDEX IF NOT EXISTS idx_marketplace_categories_active_order ON public.marketplace_categories(is_active, display_order);

-- Seed Canonical Caribbean Categories
INSERT INTO public.marketplace_categories (slug, title, description, icon, cultural_tags, display_order)
VALUES
    ('food-spices', 'Caribbean Food & Spices', 'Blue Mountain coffee, scotch bonnet sauces, jerk seasoning, cacao, and culinary heritage.', 'Utensils', ARRAY['coffee', 'spices', 'culinary', 'rum', 'cacao'], 1),
    ('carnival-mas', 'Carnival & Mas', 'Festival costumes, carnival wire bras, headpieces, mas accessories, and Caribbean pride.', 'Sparkles', ARRAY['carnival', 'mas', 'costume', 'festival', 'soca'], 2),
    ('art-decor', 'Art & Island Living', 'Fine island paintings, handcrafted wooden carvings, pottery, prints, and Caribbean home decor.', 'Palette', ARRAY['art', 'paintings', 'carvings', 'decor', 'craft'], 3),
    ('fashion-apparel', 'Fashion & Island Wear', 'Caribbean designer apparel, resort wear, crochet, handmade sandals, and island streetwear.', 'Shirt', ARRAY['fashion', 'clothing', 'apparel', 'textiles', 'handmade'], 4),
    ('beauty-wellness', 'Beauty & Natural Wellness', 'Jamaican black castor oil, coconut balms, herbal sea moss, and Caribbean botanical care.', 'Heart', ARRAY['wellness', 'herbal', 'castor-oil', 'sea-moss', 'skincare'], 5),
    ('digital-sounds', 'Digital Audio & Creator Goods', 'Reggae stems, soca beat packs, sample libraries, creator presets, ebooks, and digital art.', 'Headphones', ARRAY['digital', 'audio', 'samples', 'music', 'beats'], 6),
    ('services-bookings', 'Services & Consultations', 'Caribbean photography, event production, creative consulting, wellness sessions, and bookings.', 'Briefcase', ARRAY['services', 'photography', 'booking', 'consulting'], 7),
    ('electronics-tech', 'Electronics & Mobile', 'Smartphones, laptops, accessories, audio gear, and tested refurbished tech.', 'Smartphone', ARRAY['tech', 'phones', 'electronics', 'laptops'], 8),
    ('vehicles-transport', 'Vehicles & Transport', 'Cars, island commercial trucks, motorcycles, boats, and marine accessories.', 'Car', ARRAY['vehicles', 'cars', 'marine', 'boats', 'bikes'], 9),
    ('real-estate-rentals', 'Real Estate & Rentals', 'Island residential rentals, vacation properties, commercial spaces, and Caribbean land.', 'Home', ARRAY['real-estate', 'rentals', 'land', 'properties'], 10)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- 2. EXPAND PUBLIC.PRODUCTS SCHEMA
-- =============================================================================

ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.marketplace_categories(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS condition VARCHAR(32) DEFAULT 'new' NOT NULL,
    ADD COLUMN IF NOT EXISTS brand TEXT,
    ADD COLUMN IF NOT EXISTS model TEXT,
    ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}'::jsonb NOT NULL,
    ADD COLUMN IF NOT EXISTS pickup_available BOOLEAN DEFAULT true NOT NULL,
    ADD COLUMN IF NOT EXISTS shipping_available BOOLEAN DEFAULT false NOT NULL,
    ADD COLUMN IF NOT EXISTS delivery_available BOOLEAN DEFAULT false NOT NULL,
    ADD COLUMN IF NOT EXISTS shipping_cost_minor INTEGER DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS location_city TEXT,
    ADD COLUMN IF NOT EXISTS location_country_iso VARCHAR(3) REFERENCES public.countries(iso_code),
    ADD COLUMN IF NOT EXISTS latitude NUMERIC(9, 6),
    ADD COLUMN IF NOT EXISTS longitude NUMERIC(9, 6),
    ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::text[] NOT NULL,
    ADD COLUMN IF NOT EXISTS status VARCHAR(24) DEFAULT 'active' NOT NULL,
    ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS saves_count INTEGER DEFAULT 0 NOT NULL;

-- Ensure condition constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'products_condition_check'
    ) THEN
        ALTER TABLE public.products ADD CONSTRAINT products_condition_check
            CHECK (condition IN ('new', 'used_like_new', 'used_good', 'used_fair', 'refurbished', 'handmade', 'custom'));
    END IF;
END $$;

-- Ensure status constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'products_status_check'
    ) THEN
        ALTER TABLE public.products ADD CONSTRAINT products_status_check
            CHECK (status IN ('draft', 'active', 'pending_review', 'sold', 'archived', 'rejected'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_seller_status ON public.products(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_products_country_status ON public.products(location_country_iso, status);
CREATE INDEX IF NOT EXISTS idx_products_price_status ON public.products(price_minor, status);
CREATE INDEX IF NOT EXISTS idx_products_created_status ON public.products(created_at DESC, status);

-- =============================================================================
-- 3. PRODUCT MEDIA GALLERY (Images, Videos, Display Order)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.marketplace_product_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    media_url TEXT NOT NULL,
    media_type VARCHAR(16) DEFAULT 'image' NOT NULL CHECK (media_type IN ('image', 'video')),
    thumbnail_url TEXT,
    display_order INTEGER DEFAULT 0 NOT NULL,
    alt_text TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_product_media_product_order ON public.marketplace_product_media(product_id, display_order ASC);

-- =============================================================================
-- 4. OFFERS & NEGOTIATION WORKFLOW
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.marketplace_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    offered_price_minor INTEGER CHECK (offered_price_minor > 0) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0) NOT NULL,
    status VARCHAR(24) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'countered', 'accepted', 'rejected', 'cancelled', 'expired')),
    counter_price_minor INTEGER CHECK (counter_price_minor IS NULL OR counter_price_minor > 0),
    message TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_marketplace_offers_product ON public.marketplace_offers(product_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_offers_buyer ON public.marketplace_offers(buyer_id, status);
CREATE INDEX IF NOT EXISTS idx_marketplace_offers_seller ON public.marketplace_offers(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_marketplace_offers_expires ON public.marketplace_offers(expires_at) WHERE status = 'pending';

-- =============================================================================
-- 5. WISHLISTS & SAVED SEARCHES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.marketplace_wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    collection_name VARCHAR(64) DEFAULT 'Default' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_marketplace_wishlists_user ON public.marketplace_wishlists(user_id);

CREATE TABLE IF NOT EXISTS public.marketplace_saved_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    query_text TEXT NOT NULL,
    filters JSONB DEFAULT '{}'::jsonb NOT NULL,
    notify_new_matches BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_marketplace_saved_searches_user ON public.marketplace_saved_searches(user_id);

-- =============================================================================
-- 6. BUYER PROTECTION & RESOLUTION CENTER (Disputes & Resolution)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.marketplace_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    reason VARCHAR(40) NOT NULL CHECK (reason IN ('not_received', 'materially_different', 'damaged', 'counterfeit', 'fraud')),
    status VARCHAR(24) DEFAULT 'open' NOT NULL CHECK (status IN ('open', 'seller_responded', 'under_review', 'resolved_refund', 'resolved_seller', 'closed')),
    disputed_amount_minor INTEGER CHECK (disputed_amount_minor > 0) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    buyer_notes TEXT NOT NULL,
    seller_notes TEXT,
    resolution_summary TEXT,
    evidence_urls TEXT[] DEFAULT '{}'::text[] NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_marketplace_disputes_order ON public.marketplace_disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_disputes_buyer ON public.marketplace_disputes(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_disputes_seller ON public.marketplace_disputes(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_disputes_status ON public.marketplace_disputes(status);

CREATE TABLE IF NOT EXISTS public.marketplace_dispute_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id UUID REFERENCES public.marketplace_disputes(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    attachments TEXT[] DEFAULT '{}'::text[] NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dispute_messages_dispute ON public.marketplace_dispute_messages(dispute_id, created_at ASC);

-- =============================================================================
-- 7. CREATOR COMMERCE & AFFILIATE ATTRIBUTION
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.marketplace_affiliate_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    referral_code VARCHAR(40) UNIQUE NOT NULL,
    commission_bps INTEGER DEFAULT 500 CHECK (commission_bps >= 0 AND commission_bps <= 5000) NOT NULL,
    clicks_count INTEGER DEFAULT 0 NOT NULL,
    sales_count INTEGER DEFAULT 0 NOT NULL,
    total_revenue_minor INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_affiliate_links_code ON public.marketplace_affiliate_links(referral_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_creator ON public.marketplace_affiliate_links(creator_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_product ON public.marketplace_affiliate_links(product_id);

-- =============================================================================
-- 8. TRUST & SAFETY / MARKETPLACE REPORTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.marketplace_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    seller_id UUID REFERENCES public.profiles(id),
    reason VARCHAR(40) NOT NULL,
    description TEXT,
    status VARCHAR(24) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'investigating', 'actioned', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_marketplace_reports_product ON public.marketplace_reports(product_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_reports_status ON public.marketplace_reports(status);

-- =============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE public.marketplace_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_product_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_dispute_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_reports ENABLE ROW LEVEL SECURITY;

-- Categories: Public read
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'marketplace_categories' AND policyname = 'Public read active categories') THEN
        CREATE POLICY "Public read active categories" ON public.marketplace_categories
            FOR SELECT USING (is_active = true);
    END IF;
END $$;

-- Product Media: Public read, Seller manage
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'marketplace_product_media' AND policyname = 'Public read product media') THEN
        CREATE POLICY "Public read product media" ON public.marketplace_product_media
            FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'marketplace_product_media' AND policyname = 'Sellers manage own product media') THEN
        CREATE POLICY "Sellers manage own product media" ON public.marketplace_product_media
            FOR ALL USING (EXISTS (
                SELECT 1 FROM public.products p WHERE p.id = product_id AND p.seller_id = (SELECT auth.uid())
            ))
            WITH CHECK (EXISTS (
                SELECT 1 FROM public.products p WHERE p.id = product_id AND p.seller_id = (SELECT auth.uid())
            ));
    END IF;
END $$;

-- Offers: Buyer & Seller only
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'marketplace_offers' AND policyname = 'Participants read offers') THEN
        CREATE POLICY "Participants read offers" ON public.marketplace_offers
            FOR SELECT USING (
                buyer_id = (SELECT auth.uid()) OR seller_id = (SELECT auth.uid())
            );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'marketplace_offers' AND policyname = 'Buyer can create offer') THEN
        CREATE POLICY "Buyer can create offer" ON public.marketplace_offers
            FOR INSERT WITH CHECK (
                buyer_id = (SELECT auth.uid()) AND buyer_id <> seller_id
            );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'marketplace_offers' AND policyname = 'Participants update offers') THEN
        CREATE POLICY "Participants update offers" ON public.marketplace_offers
            FOR UPDATE USING (
                buyer_id = (SELECT auth.uid()) OR seller_id = (SELECT auth.uid())
            );
    END IF;
END $$;

-- Wishlists: Owner only
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'marketplace_wishlists' AND policyname = 'Owner manage wishlist') THEN
        CREATE POLICY "Owner manage wishlist" ON public.marketplace_wishlists
            FOR ALL USING (user_id = (SELECT auth.uid()))
            WITH CHECK (user_id = (SELECT auth.uid()));
    END IF;
END $$;

-- Saved Searches: Owner only
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'marketplace_saved_searches' AND policyname = 'Owner manage saved searches') THEN
        CREATE POLICY "Owner manage saved searches" ON public.marketplace_saved_searches
            FOR ALL USING (user_id = (SELECT auth.uid()))
            WITH CHECK (user_id = (SELECT auth.uid()));
    END IF;
END $$;

-- Disputes: Buyer, Seller, or Admin
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'marketplace_disputes' AND policyname = 'Participants read disputes') THEN
        CREATE POLICY "Participants read disputes" ON public.marketplace_disputes
            FOR SELECT USING (
                buyer_id = (SELECT auth.uid()) OR seller_id = (SELECT auth.uid())
            );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'marketplace_disputes' AND policyname = 'Buyer creates dispute') THEN
        CREATE POLICY "Buyer creates dispute" ON public.marketplace_disputes
            FOR INSERT WITH CHECK (
                buyer_id = (SELECT auth.uid())
            );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'marketplace_disputes' AND policyname = 'Participants update dispute notes') THEN
        CREATE POLICY "Participants update dispute notes" ON public.marketplace_disputes
            FOR UPDATE USING (
                buyer_id = (SELECT auth.uid()) OR seller_id = (SELECT auth.uid())
            );
    END IF;
END $$;

-- Dispute Messages: Participants only
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'marketplace_dispute_messages' AND policyname = 'Participants read dispute messages') THEN
        CREATE POLICY "Participants read dispute messages" ON public.marketplace_dispute_messages
            FOR SELECT USING (EXISTS (
                SELECT 1 FROM public.marketplace_disputes d
                WHERE d.id = dispute_id AND (d.buyer_id = (SELECT auth.uid()) OR d.seller_id = (SELECT auth.uid()))
            ));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'marketplace_dispute_messages' AND policyname = 'Participants send dispute messages') THEN
        CREATE POLICY "Participants send dispute messages" ON public.marketplace_dispute_messages
            FOR INSERT WITH CHECK (
                sender_id = (SELECT auth.uid()) AND EXISTS (
                    SELECT 1 FROM public.marketplace_disputes d
                    WHERE d.id = dispute_id AND (d.buyer_id = (SELECT auth.uid()) OR d.seller_id = (SELECT auth.uid()))
                )
            );
    END IF;
END $$;

-- Affiliate Links: Public read, Creator manage
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'marketplace_affiliate_links' AND policyname = 'Public read affiliate links') THEN
        CREATE POLICY "Public read affiliate links" ON public.marketplace_affiliate_links
            FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'marketplace_affiliate_links' AND policyname = 'Creator manage own affiliate links') THEN
        CREATE POLICY "Creator manage own affiliate links" ON public.marketplace_affiliate_links
            FOR ALL USING (creator_id = (SELECT auth.uid()))
            WITH CHECK (creator_id = (SELECT auth.uid()));
    END IF;
END $$;

-- Reports: Authenticated create, Admins read
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'marketplace_reports' AND policyname = 'Users submit reports') THEN
        CREATE POLICY "Users submit reports" ON public.marketplace_reports
            FOR INSERT WITH CHECK (reporter_id = (SELECT auth.uid()));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'marketplace_reports' AND policyname = 'Reporter view own reports') THEN
        CREATE POLICY "Reporter view own reports" ON public.marketplace_reports
            FOR SELECT USING (reporter_id = (SELECT auth.uid()));
    END IF;
END $$;

-- =============================================================================
-- 10. HELPER FUNCTIONS & ATOMIC PROCEDURES
-- =============================================================================

-- Safely increment product views without exposing mutable column increments to client
CREATE OR REPLACE FUNCTION public.increment_product_views(p_product_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.products
    SET views_count = views_count + 1
    WHERE id = p_product_id;
END;
$$;

-- Atomic offer creation with validation
CREATE OR REPLACE FUNCTION public.submit_marketplace_offer(
    p_product_id            UUID,
    p_offered_price_minor   INTEGER,
    p_quantity              INTEGER DEFAULT 1,
    p_message               TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_buyer_id UUID := auth.uid();
    v_seller_id UUID;
    v_currency VARCHAR(3);
    v_product_active BOOLEAN;
    v_product_status VARCHAR(24);
    v_offer_id UUID;
    v_expires_at TIMESTAMPTZ := now() + INTERVAL '48 hours';
BEGIN
    IF v_buyer_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to make an offer.';
    END IF;

    IF p_offered_price_minor <= 0 THEN
        RAISE EXCEPTION 'Offered price must be greater than zero.';
    END IF;

    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'Quantity must be at least 1.';
    END IF;

    SELECT seller_id, currency, is_active, status
    INTO v_seller_id, v_currency, v_product_active, v_product_status
    FROM public.products
    WHERE id = p_product_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product not found.';
    END IF;

    IF v_seller_id = v_buyer_id THEN
        RAISE EXCEPTION 'Sellers cannot make offers on their own products.';
    END IF;

    IF NOT v_product_active OR v_product_status <> 'active' THEN
        RAISE EXCEPTION 'Product is not currently active for offers.';
    END IF;

    INSERT INTO public.marketplace_offers (
        product_id, buyer_id, seller_id, offered_price_minor, currency, quantity, status, message, expires_at
    )
    VALUES (
        p_product_id, v_buyer_id, v_seller_id, p_offered_price_minor, v_currency, p_quantity, 'pending', p_message, v_expires_at
    )
    RETURNING id INTO v_offer_id;

    RETURN jsonb_build_object(
        'offer_id', v_offer_id,
        'status', 'pending',
        'expires_at', v_expires_at
    );
END;
$$;

COMMIT;
