-- =============================================================================
-- Migration 00112: Page Management, Storage & Profile Customization
-- =============================================================================
-- Description:
--   1. Ensures column compatibility on public.businesses for image attributes:
--      avatar_url, logo_url, cover_image_url, cover_url.
--   2. Installs bidirectional column synchronization trigger on public.businesses
--      so all views (avatar_url/logo_url, cover_image_url/cover_url) remain perfectly consistent.
--   3. Hardens public.can_manage_page to guarantee page owners are authorized even
--      if page_roles mapping is pending.
--   4. Adds public.can_manage_page_path safe function for storage folder name evaluation.
--   5. Provisions public storage bucket 'page-media' (10MB limit) for high-resolution
--      page banners and profile avatars.
--   6. Enforces robust Storage RLS policies for page-media and avatars buckets so only
--      authorized page owners/admins can upload, replace, or delete page assets.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Businesses Table Image Column Compatibility
-- -----------------------------------------------------------------------------

ALTER TABLE public.businesses
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS logo_url TEXT,
    ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
    ADD COLUMN IF NOT EXISTS cover_url TEXT,
    ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Initial backfill between columns
UPDATE public.businesses
SET logo_url = avatar_url
WHERE logo_url IS NULL AND avatar_url IS NOT NULL;

UPDATE public.businesses
SET avatar_url = logo_url
WHERE avatar_url IS NULL AND logo_url IS NOT NULL;

UPDATE public.businesses
SET cover_url = cover_image_url
WHERE cover_url IS NULL AND cover_image_url IS NOT NULL;

UPDATE public.businesses
SET cover_image_url = cover_url
WHERE cover_image_url IS NULL AND cover_url IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 2. Bidirectional Image Column Synchronization Trigger
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sync_business_image_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Synchronize avatar_url and logo_url
    IF NEW.avatar_url IS NOT NULL AND (NEW.logo_url IS NULL OR NEW.logo_url <> NEW.avatar_url) THEN
        NEW.logo_url := NEW.avatar_url;
    ELSIF NEW.logo_url IS NOT NULL AND (NEW.avatar_url IS NULL OR NEW.avatar_url <> NEW.logo_url) THEN
        NEW.avatar_url := NEW.logo_url;
    ELSIF NEW.avatar_url IS NULL AND NEW.logo_url IS NOT NULL THEN
        NEW.avatar_url := NEW.logo_url;
    ELSIF NEW.logo_url IS NULL AND NEW.avatar_url IS NOT NULL THEN
        NEW.logo_url := NEW.avatar_url;
    END IF;

    -- Synchronize cover_image_url and cover_url
    IF NEW.cover_image_url IS NOT NULL AND (NEW.cover_url IS NULL OR NEW.cover_url <> NEW.cover_image_url) THEN
        NEW.cover_url := NEW.cover_image_url;
    ELSIF NEW.cover_url IS NOT NULL AND (NEW.cover_image_url IS NULL OR NEW.cover_image_url <> NEW.cover_url) THEN
        NEW.cover_image_url := NEW.cover_url;
    ELSIF NEW.cover_image_url IS NULL AND NEW.cover_url IS NOT NULL THEN
        NEW.cover_image_url := NEW.cover_url;
    ELSIF NEW.cover_url IS NULL AND NEW.cover_image_url IS NOT NULL THEN
        NEW.cover_url := NEW.cover_image_url;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_business_image_columns ON public.businesses;
CREATE TRIGGER trg_sync_business_image_columns
    BEFORE INSERT OR UPDATE ON public.businesses
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_business_image_columns();

-- -----------------------------------------------------------------------------
-- 3. Hardened Page Management Helper Functions
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.can_manage_page(
    p_page_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT (
        p_user_id IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM public.page_roles
                WHERE page_id = p_page_id
                  AND user_id = p_user_id
                  AND role IN ('owner', 'admin')
            )
            OR EXISTS (
                SELECT 1 FROM public.businesses
                WHERE id = p_page_id
                  AND owner_id = p_user_id
            )
        )
    );
$$;

GRANT EXECUTE ON FUNCTION public.can_manage_page(UUID, UUID) TO anon, authenticated, service_role;

-- Safe folder path evaluator to prevent cast exceptions on arbitrary storage paths
CREATE OR REPLACE FUNCTION public.can_manage_page_path(
    p_folder TEXT,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_page_id UUID;
BEGIN
    IF p_folder IS NULL OR p_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    BEGIN
        v_page_id := p_folder::uuid;
    EXCEPTION WHEN OTHERS THEN
        RETURN FALSE;
    END;

    RETURN public.can_manage_page(v_page_id, p_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.can_manage_page_path(TEXT, UUID) TO anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 4. Supabase Storage Provisioning: 'page-media' Bucket
-- -----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'page-media',
    'page-media',
    true,
    10485760, -- 10MB limit for banners and avatars
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- -----------------------------------------------------------------------------
-- 5. Storage RLS Policies: 'page-media' Bucket
-- -----------------------------------------------------------------------------

-- Public read access: anyone can view page banners and avatars
DROP POLICY IF EXISTS "page_media_select_policy" ON storage.objects;
CREATE POLICY "page_media_select_policy"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'page-media');

-- Authenticated upload: caller must be authorized manager of the target page
DROP POLICY IF EXISTS "page_media_insert_policy" ON storage.objects;
CREATE POLICY "page_media_insert_policy"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'page-media'
        AND (
            public.can_manage_page_path((storage.foldername(name))[1], auth.uid())
            OR (storage.foldername(name))[1] = auth.uid()::text
        )
    );

-- Authenticated update: caller must be authorized manager of the target page
DROP POLICY IF EXISTS "page_media_update_policy" ON storage.objects;
CREATE POLICY "page_media_update_policy"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'page-media'
        AND (
            public.can_manage_page_path((storage.foldername(name))[1], auth.uid())
            OR (storage.foldername(name))[1] = auth.uid()::text
        )
    );

-- Authenticated delete: caller must be authorized manager of the target page
DROP POLICY IF EXISTS "page_media_delete_policy" ON storage.objects;
CREATE POLICY "page_media_delete_policy"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'page-media'
        AND (
            public.can_manage_page_path((storage.foldername(name))[1], auth.uid())
            OR (storage.foldername(name))[1] = auth.uid()::text
        )
    );

-- -----------------------------------------------------------------------------
-- 6. Storage RLS Extension for 'avatars' Bucket (Pages support)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "avatars_page_managers_insert_policy" ON storage.objects;
CREATE POLICY "avatars_page_managers_insert_policy"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'avatars'
        AND public.can_manage_page_path((storage.foldername(name))[1], auth.uid())
    );

DROP POLICY IF EXISTS "avatars_page_managers_update_policy" ON storage.objects;
CREATE POLICY "avatars_page_managers_update_policy"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'avatars'
        AND public.can_manage_page_path((storage.foldername(name))[1], auth.uid())
    );

DROP POLICY IF EXISTS "avatars_page_managers_delete_policy" ON storage.objects;
CREATE POLICY "avatars_page_managers_delete_policy"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'avatars'
        AND public.can_manage_page_path((storage.foldername(name))[1], auth.uid())
    );

COMMIT;
