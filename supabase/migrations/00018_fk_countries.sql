-- Migration 00018: Foreign Key Constraints for Geographic References
-- Description: Ensures all country/region/city references in profile_identity table have valid foreign key entries

ALTER TABLE public.profile_identity
    DROP CONSTRAINT IF EXISTS fk_profile_identity_origin_region,
    ADD CONSTRAINT fk_profile_identity_origin_region
    FOREIGN KEY (origin_region_id) REFERENCES public.regions(id) ON DELETE SET NULL;

ALTER TABLE public.profile_identity
    DROP CONSTRAINT IF EXISTS fk_profile_identity_origin_city,
    ADD CONSTRAINT fk_profile_identity_origin_city
    FOREIGN KEY (origin_city_id) REFERENCES public.cities(id) ON DELETE SET NULL;

ALTER TABLE public.profile_identity
    DROP CONSTRAINT IF EXISTS fk_profile_identity_current_city,
    ADD CONSTRAINT fk_profile_identity_current_city
    FOREIGN KEY (current_city_id) REFERENCES public.cities(id) ON DELETE SET NULL;

ALTER TABLE public.profile_identity
    DROP CONSTRAINT IF EXISTS fk_profile_identity_diaspora_hub,
    ADD CONSTRAINT fk_profile_identity_diaspora_hub
    FOREIGN KEY (diaspora_hub_id) REFERENCES public.cities(id) ON DELETE SET NULL;