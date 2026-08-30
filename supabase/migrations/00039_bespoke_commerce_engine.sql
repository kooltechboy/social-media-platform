-- =============================================================================
-- Migration 00039: TUKUBI Bespoke Commerce & Marketplace Engine
--
-- Objective:
-- 1. Product Variants (SKU, pricing, options matrix, inventory counts)
-- 2. Storefront Configurations (Custom modular sections, branding, policies)
-- 3. Product Reviews (Verified customer purchases, moderation, ratings)
-- 4. Social Product Tagging (Connecting posts to marketplace goods)
-- 5. Row Level Security (RLS) enforcement on all commerce entities
-- =============================================================================

-- 1. Product Variants Table
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    sku VARCHAR(60) NOT NULL,
    title TEXT NOT NULL,
    options JSONB DEFAULT '{}'::jsonb NOT NULL,
    price_minor INTEGER CHECK (price_minor > 0) NOT NULL,
    compare_at_price_minor INTEGER CHECK (compare_at_price_minor IS NULL OR compare_at_price_minor > 0),
    inventory_count INTEGER DEFAULT 0 NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (product_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON public.product_variants(is_active);

-- 2. Storefront Configurations Table
CREATE TABLE IF NOT EXISTS public.storefront_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    seller_type VARCHAR(30) DEFAULT 'merchant' NOT NULL,
    headline TEXT,
    hero_image_url TEXT,
    sections JSONB DEFAULT '[]'::jsonb NOT NULL,
    brand_color VARCHAR(30) DEFAULT '#FF6B4A',
    policies JSONB DEFAULT '{}'::jsonb NOT NULL,
    is_published BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (seller_id)
);

CREATE INDEX IF NOT EXISTS idx_storefront_configs_business ON public.storefront_configs(business_id);
CREATE INDEX IF NOT EXISTS idx_storefront_configs_published ON public.storefront_configs(is_published);

-- 3. Product Reviews Table
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rating SMALLINT CHECK (rating BETWEEN 1 AND 5) NOT NULL,
    headline TEXT,
    body TEXT,
    verified_purchase BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (product_id, author_id)
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON public.product_reviews(rating);

-- 4. Social Product Tagging
CREATE TABLE IF NOT EXISTS public.product_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    x_pos NUMERIC(5, 2),
    y_pos NUMERIC(5, 2),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_product_tags_post ON public.product_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_product ON public.product_tags(product_id);

-- 5. Row Level Security Enforcement
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storefront_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;

-- Product Variants Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'product_variants' AND policyname = 'Public read active product variants'
    ) THEN
        CREATE POLICY "Public read active product variants"
            ON public.product_variants FOR SELECT
            USING (is_active = true OR auth.uid() IN (
                SELECT seller_id FROM public.products WHERE id = product_id
            ));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'product_variants' AND policyname = 'Sellers can manage product variants'
    ) THEN
        CREATE POLICY "Sellers can manage product variants"
            ON public.product_variants FOR ALL
            USING (auth.uid() IN (
                SELECT seller_id FROM public.products WHERE id = product_id
            ))
            WITH CHECK (auth.uid() IN (
                SELECT seller_id FROM public.products WHERE id = product_id
            ));
    END IF;
END $$;

-- Storefront Configs Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'storefront_configs' AND policyname = 'Public read published storefronts'
    ) THEN
        CREATE POLICY "Public read published storefronts"
            ON public.storefront_configs FOR SELECT
            USING (is_published = true OR auth.uid() = seller_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'storefront_configs' AND policyname = 'Sellers can manage own storefront'
    ) THEN
        CREATE POLICY "Sellers can manage own storefront"
            ON public.storefront_configs FOR ALL
            USING (auth.uid() = seller_id)
            WITH CHECK (auth.uid() = seller_id);
    END IF;
END $$;

-- Product Reviews Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'product_reviews' AND policyname = 'Public read product reviews'
    ) THEN
        CREATE POLICY "Public read product reviews"
            ON public.product_reviews FOR SELECT
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'product_reviews' AND policyname = 'Authenticated users can create product review'
    ) THEN
        CREATE POLICY "Authenticated users can create product review"
            ON public.product_reviews FOR INSERT
            WITH CHECK (auth.uid() = author_id);
    END IF;
END $$;

-- Product Tags Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'product_tags' AND policyname = 'Public read product tags'
    ) THEN
        CREATE POLICY "Public read product tags"
            ON public.product_tags FOR SELECT
            USING (true);
    END IF;
END $$;
