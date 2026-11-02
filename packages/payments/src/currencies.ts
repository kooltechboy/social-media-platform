// packages/payments/src/currencies.ts — TUKUBI Caribbean Regional & Diaspora Currency Registry

export type CaribbeanCurrencyCode =
  | 'USD' // US Dollar & British/US Virgin Islands, Caribbean Netherlands, Puerto Rico
  | 'JMD' // Jamaican Dollar
  | 'TTD' // Trinidad & Tobago Dollar
  | 'XCD' // East Caribbean Dollar (OECS: Antigua, Dominica, Grenada, St Kitts, St Lucia, St Vincent)
  | 'BBD' // Barbadian Dollar
  | 'BSD' // Bahamian Dollar
  | 'GYD' // Guyanese Dollar
  | 'SRD' // Surinamese Dollar
  | 'HTG' // Haitian Gourde
  | 'DOP' // Dominican Peso
  | 'ANG' // Netherlands Antillean Guilder (Curaçao, Sint Maarten)
  | 'AWG' // Aruban Florin
  | 'KYD' // Cayman Islands Dollar
  | 'BZD' // Belize Dollar
  | 'EUR' // Euro (Martinique, Guadeloupe, St Martin, St Barthélemy, French Guiana)
  | 'GBP' // British Pound (UK Diaspora)
  | 'CAD'; // Canadian Dollar (Canada Diaspora)

export interface CaribbeanCurrencyMeta {
  code: CaribbeanCurrencyCode;
  symbol: string;
  name: string;
  minorExponent: number;
  territories: string[];
}

export const CARIBBEAN_CURRENCIES: Record<CaribbeanCurrencyCode, CaribbeanCurrencyMeta> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    minorExponent: 2,
    territories: ['US', 'VI', 'VG', 'TC', 'BQ', 'PR'],
  },
  JMD: {
    code: 'JMD',
    symbol: 'J$',
    name: 'Jamaican Dollar',
    minorExponent: 2,
    territories: ['JM'],
  },
  TTD: {
    code: 'TTD',
    symbol: 'TT$',
    name: 'Trinidad and Tobago Dollar',
    minorExponent: 2,
    territories: ['TT'],
  },
  XCD: {
    code: 'XCD',
    symbol: 'EC$',
    name: 'East Caribbean Dollar',
    minorExponent: 2,
    territories: ['AG', 'DM', 'GD', 'KN', 'LC', 'VC', 'AI', 'MS'],
  },
  BBD: {
    code: 'BBD',
    symbol: 'Bds$',
    name: 'Barbadian Dollar',
    minorExponent: 2,
    territories: ['BB'],
  },
  BSD: {
    code: 'BSD',
    symbol: 'B$',
    name: 'Bahamian Dollar',
    minorExponent: 2,
    territories: ['BS'],
  },
  GYD: {
    code: 'GYD',
    symbol: 'G$',
    name: 'Guyanese Dollar',
    minorExponent: 2,
    territories: ['GY'],
  },
  SRD: {
    code: 'SRD',
    symbol: 'Sr$',
    name: 'Surinamese Dollar',
    minorExponent: 2,
    territories: ['SR'],
  },
  HTG: {
    code: 'HTG',
    symbol: 'G',
    name: 'Haitian Gourde',
    minorExponent: 2,
    territories: ['HT'],
  },
  DOP: {
    code: 'DOP',
    symbol: 'RD$',
    name: 'Dominican Peso',
    minorExponent: 2,
    territories: ['DO'],
  },
  ANG: {
    code: 'ANG',
    symbol: 'NAƒ',
    name: 'Netherlands Antillean Guilder',
    minorExponent: 2,
    territories: ['CW', 'SX'],
  },
  AWG: {
    code: 'AWG',
    symbol: 'Afl.',
    name: 'Aruban Florin',
    minorExponent: 2,
    territories: ['AW'],
  },
  KYD: {
    code: 'KYD',
    symbol: 'CI$',
    name: 'Cayman Islands Dollar',
    minorExponent: 2,
    territories: ['KY'],
  },
  BZD: {
    code: 'BZD',
    symbol: 'BZ$',
    name: 'Belize Dollar',
    minorExponent: 2,
    territories: ['BZ'],
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    minorExponent: 2,
    territories: ['MQ', 'GP', 'GF', 'BL', 'MF'],
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    minorExponent: 2,
    territories: ['GB'],
  },
  CAD: {
    code: 'CAD',
    symbol: 'CA$',
    name: 'Canadian Dollar',
    minorExponent: 2,
    territories: ['CA'],
  },
};

/**
 * Validates whether a currency code is a registered Caribbean or Diaspora currency.
 */
export function isCaribbeanCurrency(code: string): code is CaribbeanCurrencyCode {
  return typeof code === 'string' && code.toUpperCase() in CARIBBEAN_CURRENCIES;
}

/**
 * Authentically formats an integer minor unit amount with regional currency symbols.
 */
export function formatCaribbeanMoney(
  amountMinor: number,
  currencyCode: string,
  locale = 'en-US'
): string {
  if (!Number.isSafeInteger(amountMinor)) {
    throw new Error('Money amount must be an integer in minor units');
  }

  const upperCode = currencyCode.toUpperCase();
  const meta = isCaribbeanCurrency(upperCode) ? CARIBBEAN_CURRENCIES[upperCode] : null;
  const exponent = meta?.minorExponent ?? 2;
  const decimal = amountMinor / Math.pow(10, exponent);

  if (meta && meta.symbol) {
    const formattedNum = decimal.toFixed(exponent);
    // Authentic display with regional symbol prefix
    return `${meta.symbol}${formattedNum}`;
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: upperCode,
  }).format(decimal);
}
