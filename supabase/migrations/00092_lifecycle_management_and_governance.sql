-- =============================================================================
-- Migration 00092: Entity Lifecycle Management, Archival & Governance Security
-- =============================================================================
-- Description:
--   Establishes complete CREATE -> USE -> MANAGE -> EDIT -> PAUSE/ARCHIVE -> DELETE
--   lifecycles for Pages (businesses), Communities, Events, and Marketplace Listings.
--   Enforces strict owner-only RLS policies for update, archive, and deletion.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Businesses / Pages Lifecycle Extensions
-- -----------------------------------------------------------------------------

ALTER TABLE public.businesses
    ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false NOT NULL,
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
    ADD COLUMN IF NOT EXISTS contact_email TEXT;

CREATE INDEX IF NOT EXISTS idx_businesses_active
    ON public.businesses(is_archived)
    WHERE is_archived = false;

-- Add explicit DELETE policy for business owners
DROP POLICY IF EXISTS "Owner deletes business" ON public.businesses;
CREATE POLICY "Owner deletes business"
    ON public.businesses
    FOR DELETE
    TO authenticated
    USING (auth.uid() = owner_id);

GRANT DELETE ON public.businesses TO authenticated;

-- -----------------------------------------------------------------------------
-- 2. Communities Lifecycle Extensions
-- -----------------------------------------------------------------------------

ALTER TABLE public.communities
    ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false NOT NULL,
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS rules TEXT;

CREATE INDEX IF NOT EXISTS idx_communities_active
    ON public.communities(is_archived)
    WHERE is_archived = false;

-- Allow Creator or Community Admin/Moderator to update community settings
DROP POLICY IF EXISTS "Creator or admin updates community" ON public.communities;
CREATE POLICY "Creator or admin updates community"
    ON public.communities
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = created_by
        OR EXISTS (
            SELECT 1 FROM public.community_members cm
            JOIN public.community_roles cr ON cr.id = cm.role_id
            WHERE cm.community_id = communities.id
              AND cm.profile_id = auth.uid()
              AND cm.membership_status = 'active'
              AND (cr.name IN ('admin', 'moderator') OR cr.can_moderate = true)
        )
    )
    WITH CHECK (
        auth.uid() = created_by
        OR EXISTS (
            SELECT 1 FROM public.community_members cm
            JOIN public.community_roles cr ON cr.id = cm.role_id
            WHERE cm.community_id = communities.id
              AND cm.profile_id = auth.uid()
              AND cm.membership_status = 'active'
              AND (cr.name IN ('admin', 'moderator') OR cr.can_moderate = true)
        )
    );

-- Allow Creator to delete community
DROP POLICY IF EXISTS "Creator deletes community" ON public.communities;
CREATE POLICY "Creator deletes community"
    ON public.communities
    FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);

GRANT UPDATE, DELETE ON public.communities TO authenticated;

-- -----------------------------------------------------------------------------
-- 3. Events Lifecycle Extensions
-- -----------------------------------------------------------------------------

ALTER TABLE public.events
    ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT false NOT NULL,
    ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_events_host_starts
    ON public.events(host_id, starts_at);

-- Allow Host to delete events
DROP POLICY IF EXISTS "Hosts delete events" ON public.events;
CREATE POLICY "Hosts delete events"
    ON public.events
    FOR DELETE
    TO authenticated
    USING (auth.uid() = host_id);

GRANT DELETE ON public.events TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. Marketplace Products Lifecycle Extensions
-- -----------------------------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'products' 
          AND column_name = 'status'
    ) THEN
        ALTER TABLE public.products
            ADD COLUMN status VARCHAR(15) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'sold', 'archived')) NOT NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_seller_status
    ON public.products(seller_id, status);

-- Allow Seller to delete products
DROP POLICY IF EXISTS "Seller deletes products" ON public.products;
CREATE POLICY "Seller deletes products"
    ON public.products
    FOR DELETE
    TO authenticated
    USING (auth.uid() = seller_id);

GRANT DELETE ON public.products TO authenticated;

COMMIT;
