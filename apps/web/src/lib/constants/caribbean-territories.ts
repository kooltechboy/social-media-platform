/**
 * Caribbean Territory & Diaspora Constants — Single Source of Truth
 *
 * TUKUBI platform — Caribbean Futurism design system
 * All Caribbean sovereign states, territories, and dependencies.
 *
 * Privacy note (AGENTS.md Rule 8): Caribbean identity is optional
 * and private by default. These constants are display data only.
 * They must never be used to infer or expose identity without user consent.
 */

export interface CaribbeanTerritory {
  /** ISO 3166-1 alpha-3 code (or closest standard code for territories) */
  iso: string;
  /** Display name */
  name: string;
  /** Flag emoji */
  flag: string;
  /** Primary language code */
  lang: 'en' | 'es' | 'fr' | 'ht' | 'nl' | 'pap';
  /** true = sovereign state, false = territory/dependency */
  sovereign: boolean;
}

// ─── Sovereign States ────────────────────────────────────────────────────────

export const CARIBBEAN_TERRITORIES: CaribbeanTerritory[] = [
  // ── Sovereign States ──
  { iso: 'ATG', name: 'Antigua & Barbuda',           flag: '🇦🇬', lang: 'en', sovereign: true },
  { iso: 'BHS', name: 'Bahamas',                      flag: '🇧🇸', lang: 'en', sovereign: true },
  { iso: 'BRB', name: 'Barbados',                     flag: '🇧🇧', lang: 'en', sovereign: true },
  { iso: 'BLZ', name: 'Belize',                       flag: '🇧🇿', lang: 'en', sovereign: true },
  { iso: 'CUB', name: 'Cuba',                         flag: '🇨🇺', lang: 'es', sovereign: true },
  { iso: 'DMA', name: 'Dominica',                     flag: '🇩🇲', lang: 'en', sovereign: true },
  { iso: 'DOM', name: 'Dominican Republic',           flag: '🇩🇴', lang: 'es', sovereign: true },
  { iso: 'GRD', name: 'Grenada',                      flag: '🇬🇩', lang: 'en', sovereign: true },
  { iso: 'GUY', name: 'Guyana',                       flag: '🇬🇾', lang: 'en', sovereign: true },
  { iso: 'HTI', name: 'Haiti',                        flag: '🇭🇹', lang: 'ht', sovereign: true },
  { iso: 'JAM', name: 'Jamaica',                      flag: '🇯🇲', lang: 'en', sovereign: true },
  { iso: 'KNA', name: 'Saint Kitts & Nevis',          flag: '🇰🇳', lang: 'en', sovereign: true },
  { iso: 'LCA', name: 'Saint Lucia',                  flag: '🇱🇨', lang: 'en', sovereign: true },
  { iso: 'VCT', name: 'St. Vincent & Grenadines',     flag: '🇻🇨', lang: 'en', sovereign: true },
  { iso: 'SUR', name: 'Suriname',                     flag: '🇸🇷', lang: 'nl', sovereign: true },
  { iso: 'TTO', name: 'Trinidad & Tobago',            flag: '🇹🇹', lang: 'en', sovereign: true },
  // ── Territories & Dependencies ──
  { iso: 'AIA', name: 'Anguilla',                     flag: '🇦🇮', lang: 'en',  sovereign: false },
  { iso: 'ABW', name: 'Aruba',                        flag: '🇦🇼', lang: 'pap', sovereign: false },
  { iso: 'BES', name: 'Bonaire',                      flag: '🇧🇶', lang: 'pap', sovereign: false },
  { iso: 'VGB', name: 'British Virgin Islands',       flag: '🇻🇬', lang: 'en',  sovereign: false },
  { iso: 'CYM', name: 'Cayman Islands',               flag: '🇰🇾', lang: 'en',  sovereign: false },
  { iso: 'CUW', name: 'Curaçao',                      flag: '🇨🇼', lang: 'pap', sovereign: false },
  { iso: 'GUF', name: 'French Guiana',                flag: '🇬🇫', lang: 'fr',  sovereign: false },
  { iso: 'GLP', name: 'Guadeloupe',                   flag: '🇬🇵', lang: 'fr',  sovereign: false },
  { iso: 'MTQ', name: 'Martinique',                   flag: '🇲🇶', lang: 'fr',  sovereign: false },
  { iso: 'MSR', name: 'Montserrat',                   flag: '🇲🇸', lang: 'en',  sovereign: false },
  { iso: 'PRI', name: 'Puerto Rico',                  flag: '🇵🇷', lang: 'es',  sovereign: false },
  { iso: 'SXM', name: 'Sint Maarten',                 flag: '🇸🇽', lang: 'nl',  sovereign: false },
  { iso: 'TCA', name: 'Turks & Caicos',               flag: '🇹🇨', lang: 'en',  sovereign: false },
  { iso: 'VIR', name: 'US Virgin Islands',            flag: '🇻🇮', lang: 'en',  sovereign: false },
  { iso: 'SAB', name: 'Saba',                         flag: '🇸🇧', lang: 'nl',  sovereign: false },
  { iso: 'EUX', name: 'Sint Eustatius',               flag: '🇧🇶', lang: 'nl',  sovereign: false },
  { iso: 'BLM', name: 'Saint Barthélemy',             flag: '🇧🇱', lang: 'fr',  sovereign: false },
  { iso: 'MAF', name: 'Saint Martin (French)',        flag: '🇲🇫', lang: 'fr',  sovereign: false },
  // ── Caribbean-Coast Nations (culturally integrated) ──
  { iso: 'PAN', name: 'Panama',                       flag: '🇵🇦', lang: 'es',  sovereign: true },
  { iso: 'COL', name: 'Colombia (Caribbean)',         flag: '🇨🇴', lang: 'es',  sovereign: true },
  { iso: 'VEN', name: 'Venezuela (Caribbean)',        flag: '🇻🇪', lang: 'es',  sovereign: true },
];

export const SOVEREIGN_CARIBBEAN = CARIBBEAN_TERRITORIES.filter(t => t.sovereign);

export const CARIBBEAN_TERRITORIES_BY_ISO: Record<string, CaribbeanTerritory> =
  Object.fromEntries(CARIBBEAN_TERRITORIES.map(t => [t.iso, t]));

/**
 * Maps ISO-2 or variant ISO-3 territory codes to database-compliant public.countries(iso_code)
 */
export const ISO2_TO_ISO3_MAP: Record<string, string> = {
  JM: 'JAM',
  DO: 'DOM',
  TT: 'TTO',
  HT: 'HTI',
  BS: 'BHS',
  BB: 'BRB',
  CU: 'CUB',
  AG: 'ATG',
  DM: 'DMA',
  GD: 'GRD',
  KN: 'KNA',
  LC: 'LCA',
  VC: 'VCT',
  BZ: 'BLZ',
  GY: 'GUY',
  SR: 'SUR',
  PR: 'PRI',
  KY: 'CYM',
  CW: 'CUR',
  CUW: 'CUR',
  AW: 'ABW',
  SX: 'SXM',
  VG: 'VGB',
  VI: 'VIR',
  TC: 'TCA',
  BM: 'BMU',
  AI: 'AIA',
  MS: 'MSR',
  US: 'USA',
  CA: 'CAN',
  GB: 'GBR',
  NL: 'NLD',
};

export const VALID_COUNTRY_ISO3 = new Set([
  'JAM', 'DOM', 'TTO', 'HTI', 'BHS', 'BRB', 'CUB', 'ATG', 'DMA', 'GRD',
  'KNA', 'LCA', 'VCT', 'BLZ', 'GUY', 'SUR', 'PRI', 'CYM', 'CUR', 'ABW',
  'SXM', 'VGB', 'VIR', 'TCA', 'BMU', 'AIA', 'MSR', 'USA', 'CAN', 'GBR', 'NLD'
]);

export function normalizeCaribbeanCountryIso(raw?: string | null): string {
  if (!raw) return 'JAM';
  const clean = raw.trim().toUpperCase();
  if (VALID_COUNTRY_ISO3.has(clean)) return clean;
  if (ISO2_TO_ISO3_MAP[clean]) return ISO2_TO_ISO3_MAP[clean];
  if (clean.length === 2 && ISO2_TO_ISO3_MAP[clean]) return ISO2_TO_ISO3_MAP[clean];
  return 'JAM';
}
