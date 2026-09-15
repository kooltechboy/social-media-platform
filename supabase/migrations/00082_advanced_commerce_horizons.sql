-- =============================================================================
-- Migration 00082: TUKUBI Advanced Commerce Horizons (Phases 13–16)
-- Description:
--   1. Adds public.livestream_products for Live Shopping product pinning & flash drops
--   2. Adds public.marketplace_shipments for Caribbean carrier tracking & webhook ingestion
--   3. Adds cross-border customs & diaspora duty prepayment (DDP) columns to orders
--   4. Adds parent_order_id to orders for multi-vendor split-checkout hierarchies
--   5. Enforces strict Row Level Security (RLS) with cached (SELECT auth.uid()) optimization
--   6. Adds partial & covering B-tree indexes for fast querying
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. LIVE SHOPPING STREAM INTEGRATION (livestream_products)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.livestream_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    livestream_id UUID REFERENCES public.livestreams(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    is_pinned BOOLEAN DEFAULT false NOT NULL,
    pinned_at TIMESTAMPTZ,
    flash_discount_bps INTEGER DEFAULT 0 NOT NULL CHECK (flash_discount_bps >= 0 AND flash_discount_bps <= 9000),
    display_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT uq_livestream_product UNIQUE (livestream_id, product_id)
);

-- Covering indexes
CREATE INDEX IF NOT EXISTS idx_livestream_products_stream_order 
    ON public.livestream_products(livestream_id, display_order ASC);

CREATE INDEX IF NOT EXISTS idx_livestream_products_product 
    ON public.livestream_products(product_id);

-- Enforce at most one pinned product per stream at any given time
CREATE UNIQUE INDEX IF NOT EXISTS idx_livestream_pinned_product 
    ON public.livestream_products(livestream_id) 
    WHERE is_pinned = true;

-- Enable RLS
ALTER TABLE public.livestream_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "livestream_products_read_policy" ON public.livestream_products
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.livestreams s
            WHERE s.id = livestream_products.livestream_id
        )
    );

CREATE POLICY "livestream_products_host_insert" ON public.livestream_products
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.livestreams s
            WHERE s.id = livestream_products.livestream_id
              AND s.creator_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "livestream_products_host_update" ON public.livestream_products
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.livestreams s
            WHERE s.id = livestream_products.livestream_id
              AND s.creator_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.livestreams s
            WHERE s.id = livestream_products.livestream_id
              AND s.creator_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "livestream_products_host_delete" ON public.livestream_products
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.livestreams s
            WHERE s.id = livestream_products.livestream_id
              AND s.creator_id = (SELECT auth.uid())
        )
    );

-- Helper RPC for host to atomically pin a product and unpin other products
CREATE OR REPLACE FUNCTION public.pin_livestream_product(
    p_livestream_id UUID,
    p_product_id UUID,
    p_flash_discount_bps INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_creator_id UUID;
    v_caller_id UUID;
    v_record_id UUID;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authentication required.');
    END IF;

    SELECT creator_id INTO v_creator_id
    FROM public.livestreams
    WHERE id = p_livestream_id;

    IF v_creator_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Livestream not found.');
    END IF;

    IF v_creator_id <> v_caller_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Only the broadcast host can pin products.');
    END IF;

    -- Unpin any currently pinned product for this stream
    UPDATE public.livestream_products
    SET is_pinned = false,
        pinned_at = NULL
    WHERE livestream_id = p_livestream_id AND is_pinned = true;

    -- Insert or update the target product as pinned
    INSERT INTO public.livestream_products (livestream_id, product_id, is_pinned, pinned_at, flash_discount_bps)
    VALUES (p_livestream_id, p_product_id, true, now(), p_flash_discount_bps)
    ON CONFLICT (livestream_id, product_id) DO UPDATE
    SET is_pinned = true,
        pinned_at = now(),
        flash_discount_bps = EXCLUDED.flash_discount_bps
    RETURNING id INTO v_record_id;

    RETURN jsonb_build_object('success', true, 'id', v_record_id);
END;
$$;

-- Helper RPC to unpin products for a stream
CREATE OR REPLACE FUNCTION public.unpin_livestream_product(
    p_livestream_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_creator_id UUID;
    v_caller_id UUID;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authentication required.');
    END IF;

    SELECT creator_id INTO v_creator_id
    FROM public.livestreams
    WHERE id = p_livestream_id;

    IF v_creator_id IS NULL OR v_creator_id <> v_caller_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Only the broadcast host can unpin products.');
    END IF;

    UPDATE public.livestream_products
    SET is_pinned = false,
        pinned_at = NULL
    WHERE livestream_id = p_livestream_id AND is_pinned = true;

    RETURN jsonb_build_object('success', true);
END;
$$;


-- =============================================================================
-- 2. CARIBBEAN CARRIER TRACKING & SHIPMENTS (marketplace_shipments)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.marketplace_shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    seller_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
    carrier_code VARCHAR(32) NOT NULL,
    carrier_name TEXT NOT NULL,
    tracking_number TEXT NOT NULL,
    origin_country_iso VARCHAR(3) REFERENCES public.countries(iso_code),
    destination_country_iso VARCHAR(3) REFERENCES public.countries(iso_code),
    status VARCHAR(32) DEFAULT 'label_created' NOT NULL,
    estimated_delivery_at TIMESTAMPTZ,
    events JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT shipment_status_check CHECK (
        status IN ('label_created', 'in_transit', 'customs_hold', 'out_for_delivery', 'delivered', 'exception')
    )
);

-- Covering indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_shipments_order 
    ON public.marketplace_shipments(order_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_shipments_tracking 
    ON public.marketplace_shipments(carrier_code, tracking_number);

CREATE INDEX IF NOT EXISTS idx_marketplace_shipments_seller_status 
    ON public.marketplace_shipments(seller_id, status);

-- Enable RLS
ALTER TABLE public.marketplace_shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketplace_shipments_parties_read" ON public.marketplace_shipments
    FOR SELECT
    TO authenticated
    USING (
        seller_id = (SELECT auth.uid()) OR
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = marketplace_shipments.order_id
              AND o.buyer_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "marketplace_shipments_seller_insert" ON public.marketplace_shipments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        seller_id = (SELECT auth.uid())
    );

CREATE POLICY "marketplace_shipments_seller_update" ON public.marketplace_shipments
    FOR UPDATE
    TO authenticated
    USING (
        seller_id = (SELECT auth.uid())
    )
    WITH CHECK (
        seller_id = (SELECT auth.uid())
    );


-- =============================================================================
-- 3. EXPAND PUBLIC.ORDERS (Customs, Duties, Multi-Vendor Sub-Orders)
-- =============================================================================

ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS parent_order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS duties_prepaid BOOLEAN DEFAULT false NOT NULL,
    ADD COLUMN IF NOT EXISTS customs_duty_minor INTEGER DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS import_vat_minor INTEGER DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS customs_admin_fee_minor INTEGER DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS hs_tariff_category VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_orders_parent_order_id 
    ON public.orders(parent_order_id) 
    WHERE parent_order_id IS NOT NULL;


-- =============================================================================
-- 4. ATOMIC SHIPMENT WEBHOOK INGESTION RPC
-- =============================================================================

CREATE OR REPLACE FUNCTION public.ingest_carrier_tracking_event(
    p_carrier_code VARCHAR,
    p_tracking_number TEXT,
    p_status VARCHAR,
    p_location TEXT,
    p_description TEXT,
    p_timestamp TIMESTAMPTZ DEFAULT now()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_shipment_id UUID;
    v_order_id UUID;
    v_new_event JSONB;
BEGIN
    -- Find active shipment by carrier code and tracking number
    SELECT id, order_id INTO v_shipment_id, v_order_id
    FROM public.marketplace_shipments
    WHERE carrier_code = p_carrier_code AND tracking_number = p_tracking_number
    LIMIT 1;

    IF v_shipment_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Shipment not found for tracking number.');
    END IF;

    v_new_event := jsonb_build_object(
        'timestamp', p_timestamp,
        'status', p_status,
        'location', p_location,
        'description', p_description
    );

    -- Append event to JSONB array and update status
    UPDATE public.marketplace_shipments
    SET status = p_status,
        events = events || v_new_event,
        updated_at = now()
    WHERE id = v_shipment_id;

    -- If carrier marked as delivered, transition order to fulfilled if currently paid
    IF p_status = 'delivered' THEN
        UPDATE public.orders
        SET status = 'fulfilled'
        WHERE id = v_order_id AND status = 'paid';
    END IF;

    RETURN jsonb_build_object('success', true, 'shipment_id', v_shipment_id, 'order_id', v_order_id, 'new_status', p_status);
END;
$$;

COMMIT;
