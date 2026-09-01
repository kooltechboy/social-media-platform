-- Migration 00047: Fix Jamaica Default Country & Identity Integrity
-- Description: Removes unconsented 'JAM' fallback assignments from profile_identity
--   for users who did not explicitly configure Jamaican roots or residency, ensuring
--   that Caribbean country/island is not assumed or assigned by default.

DO $$
BEGIN
  -- Clear origin_country_iso = 'JAM' only where the user has no corresponding
  -- explicit country or island recorded on their profile, indicating it was
  -- written by the legacy signup fallback rather than user selection.
  UPDATE public.profile_identity pi
  SET origin_country_iso = NULL,
      updated_at = NOW()
  FROM public.profiles p
  WHERE pi.profile_id = p.id
    AND pi.origin_country_iso = 'JAM'
    AND (p.country IS NULL OR LOWER(p.country) != 'jamaica')
    AND (p.island IS NULL OR LOWER(p.island) != 'jamaica');

END $$;
