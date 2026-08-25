/**
 * Caribbean Territory & Diaspora Constants — Single Source of Truth
 *
 * ANTILIA platform — Caribbean Futurism design system
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
  // ── Caribbean-Coast Nations (culturally integrated) ──
  { iso: 'PAN', name: 'Panama',                       flag: '🇵🇦', lang: 'es',  sovereign: true },
  { iso: 'COL', name: 'Colombia (Caribbean)',         flag: '🇨🇴', lang: 'es',  sovereign: true },
];

export const SOVEREIGN_CARIBBEAN = CARIBBEAN_TERRITORIES.filter(t => t.sovereign);

export const CARIBBEAN_TERRITORIES_BY_ISO: Record<string, CaribbeanTerritory> =
  Object.fromEntries(CARIBBEAN_TERRITORIES.map(t => [t.iso, t]));
