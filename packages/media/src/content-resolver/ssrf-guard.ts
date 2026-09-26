/**
 * TUKUBI Universal Content & Media Architecture
 * Defense-in-Depth SSRF & Safe HTTP Fetch Engine
 */

export interface SafeFetchOptions {
  timeoutMs?: number;
  maxRedirects?: number;
  maxSizeBytes?: number;
  allowPrivateIps?: boolean;
  userAgent?: string;
  headers?: Record<string, string>;
}

export interface SafeFetchResult {
  ok: boolean;
  status: number;
  statusText: string;
  url: string;
  headers: Headers;
  text: () => Promise<string>;
  json: <T = unknown>() => Promise<T>;
  blob: () => Promise<Blob>;
}

export class SsrfSecurityError extends Error {
  constructor(message: string, public readonly code: string = 'SSRF_BLOCKED') {
    super(message);
    this.name = 'SsrfSecurityError';
  }
}

const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_MAX_REDIRECTS = 3;
const DEFAULT_MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const TUKUBI_USER_AGENT =
  'TukubiBot/1.0 (+https://tukubi.com/bot; Caribbean Content & Media Resolver)';

/**
 * Checks if an IPv4 address falls within private, link-local, loopback, or reserved ranges.
 */
export function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return false;
  }

  const [a, b] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;

  // 10.0.0.0/8 (Private RFC 1918)
  if (a === 10) return true;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;

  // 100.64.0.0/10 (Carrier-grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true;

  // 169.254.0.0/16 (Link-Local & Cloud Metadata e.g. 169.254.169.254)
  if (a === 169 && b === 254) return true;

  // 172.16.0.0/12 (Private RFC 1918)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.168.0.0/16 (Private RFC 1918)
  if (a === 192 && b === 168) return true;

  // 192.0.0.0/24 & 192.0.2.0/24 (TEST-NET-1 & IETF assignments)
  if (a === 192 && b === 0) return true;

  // 198.18.0.0/15 (Benchmarking)
  if (a === 198 && (b === 18 || b === 19)) return true;

  // 198.51.100.0/24 (TEST-NET-2)
  if (a === 198 && b === 51) return true;

  // 203.0.113.0/24 (TEST-NET-3)
  if (a === 203 && b === 0) return true;

  // 224.0.0.0/4 (Multicast)
  if (a >= 224 && a <= 239) return true;

  // 240.0.0.0/4 (Reserved / Future Use) & 255.255.255.255
  if (a >= 240) return true;

  return false;
}

/**
 * Checks if an IPv6 address falls within loopback, unspecified, unique local, or link-local ranges.
 */
export function isPrivateIpv6(ip: string): boolean {
  const clean = ip.toLowerCase().trim();

  // Loopback & Unspecified
  if (clean === '::1' || clean === '::' || clean === '0:0:0:0:0:0:0:1' || clean === '0:0:0:0:0:0:0:0') {
    return true;
  }

  // IPv4-mapped IPv6 (::ffff:127.0.0.1)
  if (clean.startsWith('::ffff:') || clean.startsWith('0:0:0:0:0:ffff:')) {
    const ipv4Part = clean.split(':').pop();
    if (ipv4Part && ipv4Part.includes('.')) {
      return isPrivateIpv4(ipv4Part);
    }
  }

  // Unique local (fc00::/7) -> fc.. or fd..
  if (clean.startsWith('fc') || clean.startsWith('fd')) {
    return true;
  }

  // Link-local (fe80::/10)
  if (clean.startsWith('fe8') || clean.startsWith('fe9') || clean.startsWith('fea') || clean.startsWith('feb')) {
    return true;
  }

  return false;
}

/**
 * Verifies that a target URL is safe from SSRF before any network connection is attempted.
 */
export async function assertSafeUrl(
  targetUrl: string | URL,
  allowPrivateIps = false
): Promise<URL> {
  const url = typeof targetUrl === 'string' ? new URL(targetUrl) : targetUrl;

  // 1. Protocol allowlist (strictly http & https)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new SsrfSecurityError(`Disallowed protocol: ${url.protocol}`, 'INVALID_PROTOCOL');
  }

  // 2. Reject credentials embedded in URL
  if (url.username || url.password) {
    throw new SsrfSecurityError('Embedded credentials in URLs are forbidden', 'CREDENTIALS_FORBIDDEN');
  }

  const hostname = url.hostname.toLowerCase();

  // If testing harness permits private IPs, bypass checks
  if (allowPrivateIps) {
    return url;
  }

  // 3. Known dangerous/internal hostnames
  const forbiddenHostnames = [
    'localhost',
    'localhost.localdomain',
    'metadata.google.internal',
    '169.254.169.254',
    'instance-data',
    'router.local',
    'broadcasthost',
  ];

  if (forbiddenHostnames.includes(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    throw new SsrfSecurityError(`Blocked internal destination: ${hostname}`, 'INTERNAL_HOST');
  }

  // 4. IP literal checks
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    if (isPrivateIpv4(hostname)) {
      throw new SsrfSecurityError(`Blocked private IPv4 literal: ${hostname}`, 'PRIVATE_IP');
    }
  }

  if (hostname.includes(':') || hostname.startsWith('[') || hostname.endsWith(']')) {
    const rawIp = hostname.replace(/[\[\]]/g, '');
    if (isPrivateIpv6(rawIp)) {
      throw new SsrfSecurityError(`Blocked private IPv6 literal: ${hostname}`, 'PRIVATE_IP');
    }
  }

  // 5. DNS Pre-Resolution Check in Node.js runtime to prevent DNS Rebinding
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const dns = require('dns').promises;
      const lookup = await dns.lookup(hostname, { all: true });

      for (const entry of lookup) {
        if (entry.family === 4 && isPrivateIpv4(entry.address)) {
          throw new SsrfSecurityError(
            `DNS resolved ${hostname} to private IPv4 address ${entry.address}`,
            'DNS_REBINDING_BLOCKED'
          );
        }
        if (entry.family === 6 && isPrivateIpv6(entry.address)) {
          throw new SsrfSecurityError(
            `DNS resolved ${hostname} to private IPv6 address ${entry.address}`,
            'DNS_REBINDING_BLOCKED'
          );
        }
      }
    } catch (err) {
      if (err instanceof SsrfSecurityError) {
        throw err;
      }
      // If DNS lookup itself fails (e.g. ENOTFOUND), that's fine; let the fetch fail naturally
    }
  }

  return url;
}

/**
 * Hardened HTTP client that enforces SSRF checks, redirect containment, timeouts, and payload size bounds.
 */
export async function safeFetch(
  targetUrl: string,
  options: SafeFetchOptions = {}
): Promise<SafeFetchResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const maxSizeBytes = options.maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES;
  const allowPrivateIps = options.allowPrivateIps ?? false;

  let currentUrl = targetUrl;
  let redirectsCount = 0;

  while (redirectsCount <= maxRedirects) {
    const validatedUrl = await assertSafeUrl(currentUrl, allowPrivateIps);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(validatedUrl.toString(), {
        method: 'GET',
        headers: {
          'User-Agent': options.userAgent || TUKUBI_USER_AGENT,
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,image/*;q=0.8,*/*;q=0.5',
          'Accept-Language': 'en-US,en;q=0.9,es;q=0.8,fr;q=0.7',
          ...options.headers,
        },
        redirect: 'manual', // Enforce manual redirect handling to validate each hop
        signal: controller.signal,
      });

      // Handle Redirects (301, 302, 303, 307, 308)
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location) {
          throw new SsrfSecurityError('Redirect received without Location header', 'MALFORMED_REDIRECT');
        }

        redirectsCount++;
        if (redirectsCount > maxRedirects) {
          throw new SsrfSecurityError(`Maximum redirect limit (${maxRedirects}) exceeded`, 'TOO_MANY_REDIRECTS');
        }

        // Resolve relative redirect against current URL
        currentUrl = new URL(location, validatedUrl).toString();
        continue;
      }

      // Check Content-Length if present
      const contentLengthHeader = response.headers.get('content-length');
      if (contentLengthHeader) {
        const length = parseInt(contentLengthHeader, 10);
        if (!isNaN(length) && length > maxSizeBytes) {
          throw new SsrfSecurityError(
            `Response payload size ${length} bytes exceeds maximum allowed limit ${maxSizeBytes} bytes`,
            'PAYLOAD_TOO_LARGE'
          );
        }
      }

      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        url: validatedUrl.toString(),
        headers: response.headers,
        text: async () => {
          // Read with size cap
          const reader = response.body?.getReader();
          if (!reader) {
            const txt = await response.text();
            if (txt.length > maxSizeBytes) {
              throw new SsrfSecurityError('Text payload exceeds maximum allowed size', 'PAYLOAD_TOO_LARGE');
            }
            return txt;
          }

          const chunks: Uint8Array[] = [];
          let totalBytes = 0;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              totalBytes += value.length;
              if (totalBytes > maxSizeBytes) {
                controller.abort();
                throw new SsrfSecurityError('Stream exceeded maximum allowed byte size', 'PAYLOAD_TOO_LARGE');
              }
              chunks.push(value);
            }
          }

          const combined = new Uint8Array(totalBytes);
          let offset = 0;
          for (const c of chunks) {
            combined.set(c, offset);
            offset += c.length;
          }
          return new TextDecoder('utf-8').decode(combined);
        },
        json: async <T = unknown>() => {
          const txt = await response.text();
          if (txt.length > maxSizeBytes) {
            throw new SsrfSecurityError('JSON payload exceeds maximum allowed size', 'PAYLOAD_TOO_LARGE');
          }
          return JSON.parse(txt) as T;
        },
        blob: async () => {
          return response.blob();
        },
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new SsrfSecurityError('Redirect evaluation failed', 'REDIRECT_ERROR');
}
