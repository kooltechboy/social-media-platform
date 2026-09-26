/**
 * TUKUBI Universal Content & Media Architecture
 * URL Detection & Normalization Engine
 */

import { UrlDetectionResult } from './types';

// RFC 3986 compliant URL regex with boundary protection
const URL_REGEX = /(?:https?:\/\/|www\.)[^\s<>"'{}|\\^`\[\]]+/gi;

const TRACKING_QUERY_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'fbclid',
  'gclid',
  'dclid',
  'msclkid',
  'mc_eid',
  'igshid',
  'si', // Spotify / YouTube share ID
  'feature', // YouTube tracking
  'ref',
  'ref_src',
  'ref_url',
  'source',
  'trk',
  '_hsenc',
  '_hsmi',
]);

/**
 * Detects all valid URLs in free-form text input.
 */
export function detectUrls(text: string): UrlDetectionResult {
  if (!text || typeof text !== 'string') {
    return { urls: [], normalizedUrls: [], hasUrls: false };
  }

  const matches = text.match(URL_REGEX);
  if (!matches) {
    return { urls: [], normalizedUrls: [], hasUrls: false };
  }

  const cleanUrls: string[] = [];
  const normalizedUrls: string[] = [];
  const seen = new Set<string>();

  for (let match of matches) {
    // Strip trailing punctuation commonly appended in natural writing (period, comma, exclamation, closing paren)
    match = match.replace(/[.,!?;:)]+$/, '');

    // Prepend https:// if starts with www.
    let fullUrl = match;
    if (fullUrl.toLowerCase().startsWith('www.')) {
      fullUrl = `https://${fullUrl}`;
    }

    try {
      const parsed = new URL(fullUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        continue;
      }

      const normalized = normalizeUrl(fullUrl);
      if (!seen.has(normalized)) {
        seen.add(normalized);
        cleanUrls.push(fullUrl);
        normalizedUrls.push(normalized);
      }
    } catch {
      // Invalid URL syntax
    }
  }

  return {
    urls: cleanUrls,
    primaryUrl: cleanUrls[0],
    normalizedUrls,
    hasUrls: cleanUrls.length > 0,
  };
}

/**
 * Normalizes URLs for canonical identity, tracking parameter elimination, and deduplication.
 */
export function normalizeUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';

  let trimmed = rawUrl.trim();
  if (trimmed.toLowerCase().startsWith('www.')) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const url = new URL(trimmed);

    // 1. Lowercase hostname and remove default ports
    url.hostname = url.hostname.toLowerCase();
    if (
      (url.protocol === 'http:' && url.port === '80') ||
      (url.protocol === 'https:' && url.port === '443')
    ) {
      url.port = '';
    }

    // 2. Canonicalize mobile hostnames
    if (url.hostname === 'm.youtube.com') {
      url.hostname = 'www.youtube.com';
    } else if (url.hostname === 'mobile.twitter.com' || url.hostname === 'twitter.com') {
      url.hostname = 'x.com';
    } else if (url.hostname === 'm.facebook.com' || url.hostname === 'mobile.facebook.com') {
      url.hostname = 'www.facebook.com';
    }

    // 3. Remove tracking query parameters while preserving functional parameters
    const paramsToKeep: Array<[string, string]> = [];
    url.searchParams.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (!TRACKING_QUERY_PARAMS.has(lowerKey)) {
        paramsToKeep.push([key, value]);
      }
    });

    // Reconstruct search parameters sorted for consistent hashing
    paramsToKeep.sort(([a], [b]) => a.localeCompare(b));
    url.search = '';
    for (const [k, v] of paramsToKeep) {
      url.searchParams.append(k, v);
    }

    // 4. Remove fragment/hash unless explicitly needed (e.g. for media timestamps)
    if (!url.hash.includes('t=')) {
      url.hash = '';
    }

    // 5. Trim trailing slash from pathname if path is not just root
    if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
      url.pathname = url.pathname.slice(0, -1);
    }

    return url.toString();
  } catch {
    return rawUrl;
  }
}

/**
 * Computes a fast, collision-resistant SHA-256 hash representation of the normalized URL.
 * Works seamlessly in both Node.js server environments and modern browser WebCrypto.
 */
export async function hashUrlAsync(normalizedUrl: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(normalizedUrl);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Synchronous Node fallback if available
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodeCrypto = require('crypto');
    return nodeCrypto.createHash('sha256').update(normalizedUrl).digest('hex');
  } catch {
    // Ultra-simple deterministic hash fallback if subtle crypto not available
    let hash = 0;
    for (let i = 0; i < normalizedUrl.length; i++) {
      const char = normalizedUrl.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `hash_${Math.abs(hash).toString(16)}`;
  }
}

/**
 * Synchronous URL hash for server operations.
 */
export function hashUrlSync(normalizedUrl: string): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodeCrypto = require('crypto');
    return nodeCrypto.createHash('sha256').update(normalizedUrl).digest('hex');
  } catch {
    let hash = 0;
    for (let i = 0; i < normalizedUrl.length; i++) {
      const char = normalizedUrl.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `hash_${Math.abs(hash).toString(16)}`;
  }
}

/**
 * Extracts a clean, user-friendly domain name from any URL.
 */
export function extractDomain(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return rawUrl;
  }
}

/**
 * Formats duration in seconds to "m:ss" or "h:mm:ss".
 */
export function formatDurationSeconds(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return '';
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}
