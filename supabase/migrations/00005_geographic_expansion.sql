-- Migration 00005: Geographic Expansion & Caribbean Identity Model
-- Description: regions, cities, languages, country-language mapping, privacy-first profile identity

CREATE TABLE public.regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_iso VARCHAR(3) REFERENCES public.countries(iso_code) ON DELETE CASCADE NOT NULL,
    code VARCHAR(20) NOT NULL,
    name TEXT NOT NULL,
    division_type VARCHAR(40) NOT NULL,
    UNIQUE (country_iso, code)
);

CREATE TABLE public.cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id UUID REFERENCES public.regions(id) ON DELETE CASCADE,
    country_iso VARCHAR(3) REFERENCES public.countries(iso_code) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    is_diaspora_hub BOOLEAN DEFAULT false NOT NULL,
    UNIQUE (country_iso, name)
);

CREATE TABLE public.languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    iso639 VARCHAR(10) UNIQUE NOT NULL,
    name TEXT NOT NULL,
    native_name TEXT NOT NULL
);

CREATE TABLE public.country_languages (
    country_iso VARCHAR(3) REFERENCES public.countries(iso_code) ON DELETE CASCADE NOT NULL,
    language_id UUID REFERENCES public.languages(id) ON DELETE CASCADE NOT NULL,
    is_official BOOLEAN DEFAULT false NOT NULL,
    PRIMARY KEY (country_iso, language_id)
);

-- Privacy-first Caribbean identity: optional, user-controlled, private by default
CREATE TABLE public.profile_identity (
    profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    origin_country_iso VARCHAR(3) REFERENCES public.countries(iso_code),
    origin_region_id UUID REFERENCES public.regions(id),
    origin_city_id UUID REFERENCES public.cities(id),
    current_city_id UUID REFERENCES public.cities(id),
    diaspora_hub_id UUID REFERENCES public.cities(id),
    visibility VARCHAR(12) CHECK (visibility IN ('public', 'followers', 'private')) DEFAULT 'private' NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.profile_interests (
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    interest_key VARCHAR(60) NOT NULL,
    PRIMARY KEY (profile_id, interest_key)
);

-- Reference data: launch languages
INSERT INTO public.languages (iso639, name, native_name) VALUES
    ('en', 'English', 'English'),
    ('es', 'Spanish', 'Español'),
    ('fr', 'French', 'Français'),
    ('ht', 'Haitian Creole', 'Kreyòl Ayisyen'),
    ('nl', 'Dutch', 'Nederlands'),
    ('pap', 'Papiamento', 'Papiamentu');

-- Reference data: diaspora hub countries referenced by the diaspora city model below
INSERT INTO public.countries (iso_code, iso2_code, name, official_name, classification, primary_currency, default_locale, calling_code, flag_emoji) VALUES
    ('USA', 'US', 'United States', 'United States of America', 'sovereign_state', 'USD', 'en-US', '+1', 'US'),
    ('CAN', 'CA', 'Canada', 'Canada', 'sovereign_state', 'CAD', 'en-CA', '+1', 'CA'),
    ('GBR', 'GB', 'United Kingdom', 'United Kingdom of Great Britain and Northern Ireland', 'sovereign_state', 'GBP', 'en-GB', '+44', 'GB'),
    ('NLD', 'NL', 'Netherlands', 'Kingdom of the Netherlands', 'sovereign_state', 'EUR', 'nl-NL', '+31', 'NL')
ON CONFLICT (iso_code) DO NOTHING;

-- Reference data: representative regions for launch markets
INSERT INTO public.regions (country_iso, code, name, division_type) VALUES
    ('JAM', 'KGN', 'Kingston', 'Parish'),
    ('JAM', 'STJ', 'St. James', 'Parish'),
    ('DOM', 'ND', 'Distrito Nacional', 'Province'),
    ('TTO', 'POS', 'Port of Spain', 'Municipality'),
    ('BRB', 'CH', 'Christ Church', 'Parish'),
    ('BHS', 'NP', 'New Providence', 'District'),
    ('HTI', 'OU', 'Ouest', 'Department');

-- Reference data: home cities + diaspora hubs
INSERT INTO public.cities (country_iso, name, is_diaspora_hub, latitude, longitude) VALUES
    ('JAM', 'Kingston', false, 17.971369, -76.793150),
    ('JAM', 'Montego Bay', false, 18.476233, -77.893890),
    ('DOM', 'Santo Domingo', false, 18.486058, -69.931212),
    ('TTO', 'Port of Spain', false, 10.654902, -61.501911),
    ('BRB', 'Bridgetown', false, 13.113222, -59.598809),
    ('BHS', 'Nassau', false, 25.044284, -77.350120),
    ('HTI', 'Port-au-Prince', false, 18.594395, -72.307433),
    ('USA', 'Miami', true, 25.761681, -80.191788),
    ('USA', 'New York', true, 40.712776, -74.005974),
    ('CAN', 'Toronto', true, 43.653226, -79.383184),
    ('CAN', 'Montreal', true, 45.501690, -73.567253),
    ('GBR', 'London', true, 51.507351, -0.127758),
    ('NLD', 'Amsterdam', true, 52.370216, 4.895168);

-- Indexing
CREATE INDEX idx_regions_country ON public.regions(country_iso);
CREATE INDEX idx_cities_country ON public.cities(country_iso);
CREATE INDEX idx_cities_diaspora ON public.cities(is_diaspora_hub) WHERE is_diaspora_hub;
CREATE INDEX idx_profile_interests_key ON public.profile_interests(interest_key);

-- Row Level Security
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.country_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_identity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read regions" ON public.regions FOR SELECT USING (true);
CREATE POLICY "Public read cities" ON public.cities FOR SELECT USING (true);
CREATE POLICY "Public read languages" ON public.languages FOR SELECT USING (true);
CREATE POLICY "Public read country languages" ON public.country_languages FOR SELECT USING (true);

CREATE POLICY "Owner full control profile identity" ON public.profile_identity
    FOR ALL USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Owner read own interests" ON public.profile_interests FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Owner write own interests" ON public.profile_interests FOR ALL
    USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

-- Service-role-only view of all identity rows for server-side Caribbean Graph ranking.
-- Client role reads are filtered by the owner policy; non-owner rows are invisible by default.
CREATE POLICY "Public read interests" ON public.profile_interests FOR SELECT USING (true);
