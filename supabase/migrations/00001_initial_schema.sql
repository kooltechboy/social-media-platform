-- Migration 00001: Comprehensive Geographic Reference Data Model for CARIBBEAN ONE
-- Description: Creates sovereign states, CARICOM members, territories/dependencies, currencies, locales, flag emojis

CREATE TYPE public.country_type AS ENUM (
    'sovereign_state',
    'caricom_member',
    'territory',
    'dependency',
    'associated_state'
);

CREATE TABLE public.countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    iso_code VARCHAR(3) UNIQUE NOT NULL,
    iso2_code VARCHAR(2) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    official_name VARCHAR(150),
    classification public.country_type NOT NULL,
    primary_currency VARCHAR(3) NOT NULL,
    default_locale VARCHAR(10) NOT NULL,
    calling_code VARCHAR(10) NOT NULL,
    flag_emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to countries reference data"
ON public.countries FOR SELECT
USING (true);

-- Seed Core Geographic Reference Data
INSERT INTO public.countries (iso_code, iso2_code, name, official_name, classification, primary_currency, default_locale, calling_code, flag_emoji) VALUES
('JAM', 'JM', 'Jamaica', 'Jamaica', 'sovereign_state', 'JMD', 'en-JM', '+1-876', '🇯🇲'),
('DOM', 'DO', 'Dominican Republic', 'República Dominicana', 'sovereign_state', 'DOP', 'es-DO', '+1-809', '🇩🇴'),
('TTO', 'TT', 'Trinidad & Tobago', 'Republic of Trinidad and Tobago', 'sovereign_state', 'TTD', 'en-TT', '+1-868', '🇹🇹'),
('HTI', 'HT', 'Haiti', 'République d''Haïti', 'sovereign_state', 'HTG', 'ht-HT', '+509', '🇭🇹'),
('BHS', 'BS', 'Bahamas', 'Commonwealth of The Bahamas', 'sovereign_state', 'BSD', 'en-BS', '+1-242', '🇧🇸'),
('BRB', 'BB', 'Barbados', 'Barbados', 'sovereign_state', 'BBD', 'en-BB', '+1-246', '🇧🇧'),
('CUB', 'CU', 'Cuba', 'República de Cuba', 'sovereign_state', 'CUP', 'es-CU', '+53', '🇨🇺'),
('ATG', 'AG', 'Antigua & Barbuda', 'Antigua and Barbuda', 'sovereign_state', 'XCD', 'en-AG', '+1-268', '🇦🇬'),
('DMA', 'DM', 'Dominica', 'Commonwealth of Dominica', 'sovereign_state', 'XCD', 'en-DM', '+1-767', '🇩🇲'),
('GRD', 'GD', 'Grenada', 'Grenada', 'sovereign_state', 'XCD', 'en-GD', '+1-473', '🇬🇩'),
('KNA', 'KN', 'Saint Kitts & Nevis', 'Federation of Saint Christopher and Nevis', 'sovereign_state', 'XCD', 'en-KN', '+1-869', '🇰🇳'),
('LCA', 'LC', 'Saint Lucia', 'Saint Lucia', 'sovereign_state', 'XCD', 'en-LC', '+1-758', '🇱🇨'),
('VCT', 'VC', 'Saint Vincent & Grenadines', 'Saint Vincent and the Grenadines', 'sovereign_state', 'XCD', 'en-VC', '+1-784', '🇻🇨'),
('BLZ', 'BZ', 'Belize', 'Belize', 'caricom_member', 'BZD', 'en-BZ', '+501', '🇧🇿'),
('GUY', 'GY', 'Guyana', 'Co-operative Republic of Guyana', 'caricom_member', 'GYD', 'en-GY', '+592', '🇬🇾'),
('SUR', 'SR', 'Suriname', 'Republiek Suriname', 'caricom_member', 'SRD', 'nl-SR', '+597', '🇸🇷'),
('PRI', 'PR', 'Puerto Rico', 'Commonwealth of Puerto Rico', 'territory', 'USD', 'es-PR', '+1-787', '🇵🇷'),
('CYM', 'KY', 'Cayman Islands', 'Cayman Islands', 'territory', 'KYD', 'en-KY', '+1-345', '🇰🇾'),
('CUR', 'CW', 'Curaçao', 'Land Curaçao', 'territory', 'ANG', 'pap-CW', '+599', '🇨🇼'),
('ABW', 'AW', 'Aruba', 'Aruba', 'territory', 'AWG', 'pap-AW', '+297', '🇦🇼'),
('SXM', 'SX', 'Sint Maarten', 'Sint Maarten', 'territory', 'ANG', 'en-SX', '+1-721', '🇸🇽'),
('VGB', 'VG', 'British Virgin Islands', 'Virgin Islands', 'territory', 'USD', 'en-VG', '+1-284', '🇻🇬'),
('VIR', 'VI', 'U.S. Virgin Islands', 'Virgin Islands of the United States', 'territory', 'USD', 'en-VI', '+1-340', '🇻🇮'),
('TCA', 'TC', 'Turks & Caicos Islands', 'Turks and Caicos Islands', 'territory', 'USD', 'en-TC', '+1-649', '🇹🇨'),
('BMU', 'BM', 'Bermuda', 'Bermuda', 'territory', 'BMD', 'en-BM', '+1-441', '🇧🇲'),
('AIA', 'AI', 'Anguilla', 'Anguilla', 'territory', 'XCD', 'en-AI', '+1-264', '🇦🇮'),
('MTSR', 'MS', 'Montserrat', 'Montserrat', 'territory', 'XCD', 'en-MS', '+1-664', '🇲🇸'),
('GLP', 'GP', 'Guadeloupe', 'Guadeloupe', 'territory', 'EUR', 'fr-GP', '+590', '🇬🇵'),
('MTQ', 'MQ', 'Martinique', 'Martinique', 'territory', 'EUR', 'fr-MQ', '+596', '🇲🇶');
