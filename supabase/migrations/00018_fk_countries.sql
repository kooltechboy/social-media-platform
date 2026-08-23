-- Migration 00018: Foreign Key Constraints for Country References
-- Description: Ensures all country/region/city references in profiles table have valid entries
-- in the geographic reference data model to prevent invalid data insertion.

-- =============================================================================
-- ADD FOREIGN KEY CONSTRAINTS FOR PROFILE GEOGRAPHIC REFERENCES
-- =============================================================================
-- Ensure origin_country_id, current_country_id reference valid countries
ALTER TABLE public.profiles
ADD CONSTRAINT fk_profiles_origin_country
FOREIGN KEY (origin_country_id) REFERENCES public.countries(id) ON DELETE CASCADE;

ALTER TABLE public.profiles
ADD CONSTRAINT fk_profiles_current_country
FOREIGN KEY (current_country_id) REFERENCES public.countries(id) ON DELETE CASCADE;

-- Ensure region and city references are valid
ALTER TABLE public.profiles
ADD CONSTRAINT fk_profiles_origin_region
FOREIGN KEY (origin_region_id) REFERENCES public.regions(id) ON DELETE SET NULL;

ALTER TABLE public.profiles
ADD CONSTRAINT fk_profiles_origin_city
FOREIGN KEY (origin_city_id) REFERENCES public.cities(id) ON DELETE SET NULL;

ALTER TABLE public.profiles
ADD CONSTRAINT fk_profiles_current_city
FOREIGN KEY (current_city_id) REFERENCES public.cities(id) ON DELETE SET NULL;

ALTER TABLE public.profiles
ADD CONSTRAINT fk_profiles_diaspora_hub
FOREIGN KEY (diaspora_hub_id) REFERENCES public.cities(id) ON DELETE SET NULL;

-- =============================================================================
-- RLS Policy to Block Invalid Geographic References
-- =============================================================================
-- Prevent users from setting invalid country/region/city IDs that don't exist in reference tables
CREATE POLICY "Block invalid country references" ON public.profiles
FOR UPDATE
WITH CHECK (\n    origin_country_id IS NULL OR EXISTS (SELECT 1 FROM public.countries WHERE id = origin_country_id),\n    current_country_id IS NULL OR EXISTS (SELECT 1 FROM public.countries WHERE id = current_country_id),\n    origin_region_id IS NULL OR EXISTS (SELECT 1 FROM public.regions WHERE id = origin_region_id),\n    origin_city_id IS NULL OR EXISTS (SELECT 1 FROM public.cities WHERE id = origin_city_id),\n    current_city_id IS NULL OR EXISTS (SELECT 1 FROM public.cities WHERE id = current_city_id),\n    diaspora_hub_id IS NULL OR EXISTS (SELECT 1 FROM public.cities WHERE id = diaspora_hub_id)\n);

-- =============================================================================
-- Rollback Plan
-- =============================================================================
-- To reverse this migration:
--
--   ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS fk_profiles_origin_country;
--   ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS fk_profiles_current_country;
--   ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS fk_profiles_origin_region;
--   ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS fk_profiles_origin_city;
--   ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS fk_profiles_current_city;
--   ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS fk_profiles_diaspora_hub;