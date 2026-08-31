/** @type {import('next').NextConfig} */

// CSP: tightly scoped to TUKUBI's actual third-party dependencies.
// Adjust 'connect-src' if additional API endpoints are added in future.
const TUKUBI_CSP = [
  // Default: only allow same-origin
  "default-src 'self'",
  // Scripts: self + inline required by Next.js hydration + Stripe + PayPal SDK
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.paypal.com https://www.paypalobjects.com https://accounts.google.com",
  // Styles: self + inline (Tailwind injects inline styles)
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Images: self + Supabase Storage + data URIs + common CDNs
  "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://www.paypalobjects.com https://www.gstatic.com",
  // Fonts: self + Google Fonts
  "font-src 'self' https://fonts.gstatic.com",
  // API/WebSocket connections: Supabase, Stripe, PayPal, self
  "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://api.stripe.com https://www.paypal.com https://api.paypal.com https://openrouter.ai https://api.openrouter.ai",
  // Frames: Stripe hosted payment UI, PayPal Smart Buttons
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://www.paypal.com https://www.sandbox.paypal.com",
  // Media: self + Supabase Storage for audio/video
  "media-src 'self' blob: https://*.supabase.co https://*.supabase.in",
  // Workers: service worker from same origin
  "worker-src 'self' blob:",
  // Object: none
  "object-src 'none'",
  // Base URI: prevent base tag injection
  "base-uri 'self'",
  // Form actions: self only
  "form-action 'self'",
  // Upgrade insecure requests in production
  "upgrade-insecure-requests",
].join('; ');

const nextConfig = {
  transpilePackages: ["@caribbean/ui", "@caribbean/design-system", "@caribbean/payments", "@caribbean/ai"],
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: TUKUBI_CSP,
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/manifest.webmanifest',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

