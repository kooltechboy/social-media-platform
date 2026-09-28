-- =============================================================================
-- Migration 00102: Social Commerce, Product Tagging, Escrow & Atomic Checkout
--
-- Standards: NASA-grade SQL, Fortune-100 Database Security & Ledger Integrity
-- Objectives:
-- 1. Extend posts and videos tables with tagged_product_ids and GIN indexes
-- 2. Extend product_tags to support video tagging with partial index
-- 3. Extend orders table with seller_id, escrow status constraint, escrow timestamp & indexes
-- 4. Extend order_items table with variant_id foreign key and index
-- 5. Extend storefront_configs table with return/shipping policies, currency, support_email, social_links
-- 6. Implement atomic RPC function public.place_order_with_escrow with row-level stock locks,
--    idempotency protection, and strict caller authorization
-- 7. Enforce RLS and explicit grants for authenticated users
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Posts Table: Product Tagging Extension & GIN Index
-- -----------------------------------------------------------------------------
ALTER TABLE public.posts
    ADD COLUMN IF NOT EXISTS tagged_product_ids UUID[] DEFAULT '{}'::uuid[] NOT NULL;

COMMENT ON COLUMN public.posts.tagged_product_ids IS 'Array of product UUIDs tagged in the social post.';

CREATE INDEX IF NOT EXISTS idx_posts_tagged_products
    ON public.posts USING gin (tagged_product_ids);

-- -----------------------------------------------------------------------------
-- 2. Videos Table: Product Tagging Extension & GIN Index
-- -----------------------------------------------------------------------------
ALTER TABLE public.videos
    ADD COLUMN IF NOT EXISTS tagged_product_ids UUID[] DEFAULT '{}'::uuid[] NOT NULL;

COMMENT ON COLUMN public.videos.tagged_product_ids IS 'Array of product UUIDs tagged in video reels or long-form videos.';

CREATE INDEX IF NOT EXISTS idx_videos_tagged_products
    ON public.videos USING gin (tagged_product_ids);

-- -----------------------------------------------------------------------------
-- 3. Product Tags Table: Video Tagging Support & Partial Index
-- -----------------------------------------------------------------------------
ALTER TABLE public.product_tags
    ALTER COLUMN post_id DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE;

COMMENT ON COLUMN public.product_tags.video_id IS 'Foreign key to videos table when product is tagged inside a video.';

CREATE INDEX IF NOT EXISTS idx_product_tags_video
    ON public.product_tags(video_id)
    WHERE video_id IS NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'product_tags_target_check'
    ) THEN
        ALTER TABLE public.product_tags
            ADD CONSTRAINT product_tags_target_check
            CHECK (post_id IS NOT NULL OR video_id IS NOT NULL);
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 4. Orders Table: Seller Assignment, Escrow Tracking & Indexes
-- -----------------------------------------------------------------------------
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS escrow_status VARCHAR(24) DEFAULT 'held' NOT NULL,
    ADD COLUMN IF NOT EXISTS escrow_released_at TIMESTAMPTZ;

COMMENT ON COLUMN public.orders.seller_id IS 'Direct reference to seller profile fulfilling the order.';
COMMENT ON COLUMN public.orders.escrow_status IS 'State of funds held in escrow: held, releasing, released, refunded, or disputed.';
COMMENT ON COLUMN public.orders.escrow_released_at IS 'Timestamp when escrow funds were disbursed to seller wallet.';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'orders_escrow_status_check'
    ) THEN
        ALTER TABLE public.orders
            ADD CONSTRAINT orders_escrow_status_check
            CHECK (escrow_status IN ('held', 'releasing', 'released', 'refunded', 'disputed'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_escrow_status
    ON public.orders(escrow_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_seller_id
    ON public.orders(seller_id)
    WHERE seller_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 5. Order Items Table: Variant Support & Index
-- -----------------------------------------------------------------------------
ALTER TABLE public.order_items
    ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.order_items.variant_id IS 'Specific product variant purchased (color, size, etc.).';

CREATE INDEX IF NOT EXISTS idx_order_items_variant
    ON public.order_items(variant_id)
    WHERE variant_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 6. Storefront Configs Table: Return/Shipping Policies & Metadata
-- -----------------------------------------------------------------------------
ALTER TABLE public.storefront_configs
    ADD COLUMN IF NOT EXISTS return_policy TEXT,
    ADD COLUMN IF NOT EXISTS shipping_policy TEXT,
    ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    ADD COLUMN IF NOT EXISTS support_email TEXT,
    ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb NOT NULL;

COMMENT ON COLUMN public.storefront_configs.return_policy IS 'Storefront refund and return conditions.';
COMMENT ON COLUMN public.storefront_configs.shipping_policy IS 'Delivery expectations, timelines, and regional coverage.';
COMMENT ON COLUMN public.storefront_configs.currency IS 'Storefront operational display currency.';
COMMENT ON COLUMN public.storefront_configs.support_email IS 'Customer support contact email for buyer inquiries.';
COMMENT ON COLUMN public.storefront_configs.social_links IS 'Social profile links associated with this storefront.';

-- -----------------------------------------------------------------------------
-- 7. Atomic RPC Function: public.place_order_with_escrow
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.place_order_with_escrow(
    p_buyer_id UUID,
    p_seller_id UUID,
    p_items JSONB,
    p_subtotal_minor INTEGER,
    p_platform_fee_minor INTEGER,
    p_total_minor INTEGER,
    p_currency VARCHAR(3) DEFAULT 'USD',
    p_idempotency_key VARCHAR(128) DEFAULT NULL,
    p_shipping_address JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_existing_order_id UUID;
    v_existing_escrow_status VARCHAR(24);
    v_order_id UUID;
    v_item JSONB;
    v_product_id UUID;
    v_variant_id UUID;
    v_qty INTEGER;
    v_unit_price INTEGER;
    v_line_total INTEGER;
    v_product RECORD;
    v_variant RECORD;
BEGIN
    -- 1. Authorization check: caller must match buyer_id
    IF auth.uid() IS NULL OR NOT (auth.uid() = p_buyer_id) THEN
        RAISE EXCEPTION 'Unauthorized: Caller (auth.uid() = %) does not match buyer_id (%)', auth.uid(), p_buyer_id;
    END IF;

    -- 2. Idempotency safeguard: if key already exists, return previous order details
    IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
        SELECT id, escrow_status
        INTO v_existing_order_id, v_existing_escrow_status
        FROM public.orders
        WHERE idempotency_key = p_idempotency_key;

        IF FOUND THEN
            RETURN jsonb_build_object(
                'success', true,
                'order_id', v_existing_order_id,
                'escrow_status', v_existing_escrow_status,
                'idempotent_replay', true
            );
        END IF;
    ELSE
        p_idempotency_key := 'ord_' || gen_random_uuid()::TEXT;
    END IF;

    -- 3. Validate line items presence
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Order must contain at least one line item.';
    END IF;

    -- 4. Pass 1: Validate stock, existence, active status with FOR UPDATE locks
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_variant_id := NULLIF(v_item->>'variant_id', '')::UUID;
        v_qty := COALESCE((v_item->>'quantity')::INTEGER, 1);

        IF v_qty <= 0 THEN
            RAISE EXCEPTION 'Quantity for product % must be greater than zero.', v_product_id;
        END IF;

        -- Lock and verify product record
        SELECT id, is_active, inventory_count, seller_id
        INTO v_product
        FROM public.products
        WHERE id = v_product_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product % not found.', v_product_id;
        END IF;

        IF NOT v_product.is_active THEN
            RAISE EXCEPTION 'Product % is not active.', v_product_id;
        END IF;

        IF v_product.inventory_count IS NOT NULL AND v_product.inventory_count < v_qty THEN
            RAISE EXCEPTION 'Insufficient stock for product % (available: %, requested: %).',
                v_product_id, v_product.inventory_count, v_qty;
        END IF;

        -- Fallback seller_id assignment if omitted
        IF p_seller_id IS NULL THEN
            p_seller_id := v_product.seller_id;
        END IF;

        -- Decrement product stock if tracked
        IF v_product.inventory_count IS NOT NULL THEN
            UPDATE public.products
            SET inventory_count = inventory_count - v_qty
            WHERE id = v_product_id;
        END IF;

        -- Lock and verify variant if specified
        IF v_variant_id IS NOT NULL THEN
            SELECT id, is_active, inventory_count
            INTO v_variant
            FROM public.product_variants
            WHERE id = v_variant_id AND product_id = v_product_id
            FOR UPDATE;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Variant % for product % not found.', v_variant_id, v_product_id;
            END IF;

            IF NOT v_variant.is_active THEN
                RAISE EXCEPTION 'Variant % is not active.', v_variant_id;
            END IF;

            IF v_variant.inventory_count IS NOT NULL AND v_variant.inventory_count < v_qty THEN
                RAISE EXCEPTION 'Insufficient stock for variant % (available: %, requested: %).',
                    v_variant_id, v_variant.inventory_count, v_qty;
            END IF;

            -- Decrement variant stock if tracked
            IF v_variant.inventory_count IS NOT NULL THEN
                UPDATE public.product_variants
                SET inventory_count = inventory_count - v_qty
                WHERE id = v_variant_id;
            END IF;
        END IF;
    END LOOP;

    -- 5. Insert order record with held escrow status
    INSERT INTO public.orders (
        buyer_id,
        seller_id,
        status,
        escrow_status,
        subtotal_minor,
        platform_fee_minor,
        total_minor,
        currency,
        idempotency_key,
        shipping_address,
        created_at
    ) VALUES (
        p_buyer_id,
        p_seller_id,
        'paid'::public.order_status,
        'held',
        p_subtotal_minor,
        p_platform_fee_minor,
        p_total_minor,
        p_currency,
        p_idempotency_key,
        p_shipping_address,
        now()
    ) RETURNING id INTO v_order_id;

    -- 6. Insert order items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_variant_id := NULLIF(v_item->>'variant_id', '')::UUID;
        v_qty := COALESCE((v_item->>'quantity')::INTEGER, 1);
        v_unit_price := (v_item->>'unit_price_minor')::INTEGER;
        v_line_total := COALESCE((v_item->>'line_total_minor')::INTEGER, v_unit_price * v_qty);

        INSERT INTO public.order_items (
            order_id,
            product_id,
            variant_id,
            quantity,
            unit_price_minor,
            line_total_minor
        ) VALUES (
            v_order_id,
            v_product_id,
            v_variant_id,
            v_qty,
            v_unit_price,
            v_line_total
        );
    END LOOP;

    -- 7. Return atomic success response
    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'escrow_status', 'held'
    );
END;
$$;

-- Explicit privilege grants on RPC function
REVOKE ALL ON FUNCTION public.place_order_with_escrow(UUID, UUID, JSONB, INTEGER, INTEGER, INTEGER, VARCHAR, VARCHAR, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order_with_escrow(UUID, UUID, JSONB, INTEGER, INTEGER, INTEGER, VARCHAR, VARCHAR, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.place_order_with_escrow(UUID, UUID, JSONB, INTEGER, INTEGER, INTEGER, VARCHAR, VARCHAR, JSONB) TO service_role;

-- -----------------------------------------------------------------------------
-- 8. Row Level Security & Policies Enforcement
-- -----------------------------------------------------------------------------
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storefront_configs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.posts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.videos FORCE ROW LEVEL SECURITY;
ALTER TABLE public.product_tags FORCE ROW LEVEL SECURITY;
ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;
ALTER TABLE public.order_items FORCE ROW LEVEL SECURITY;
ALTER TABLE public.storefront_configs FORCE ROW LEVEL SECURITY;

-- Allow sellers to read orders assigned to their seller_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'Seller reads assigned orders'
    ) THEN
        CREATE POLICY "Seller reads assigned orders"
            ON public.orders FOR SELECT
            USING (auth.uid() = seller_id);
    END IF;
END $$;

-- Allow post authors and video creators to manage product tags on their content
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'product_tags' AND policyname = 'Content creators manage product tags'
    ) THEN
        CREATE POLICY "Content creators manage product tags"
            ON public.product_tags FOR ALL
            USING (
                (post_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.posts WHERE id = product_tags.post_id AND author_id = auth.uid()))
                OR
                (video_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.videos WHERE id = product_tags.video_id AND creator_id = auth.uid()))
            )
            WITH CHECK (
                (post_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.posts WHERE id = product_tags.post_id AND author_id = auth.uid()))
                OR
                (video_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.videos WHERE id = product_tags.video_id AND creator_id = auth.uid()))
            );
    END IF;
END $$;
