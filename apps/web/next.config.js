const { withSentryConfig } = require('@sentry/nextjs');

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
  // Images: self + Supabase Storage + Unsplash + Mux + Cloudflare + Cloudinary + YouTube/Vimeo/Spotify/SoundCloud/TikTok/OpenGraph thumbnails + Google favicons + data URIs
  "img-src 'self' data: blob: https: https://*.supabase.co https://*.supabase.in https://images.unsplash.com https://*.unsplash.com https://image.mux.com https://imagedelivery.net https://res.cloudinary.com https://i.ytimg.com https://img.youtube.com https://i.vimeocdn.com https://i.scdn.co https://*.spotifycdn.com https://*.sndcdn.com https://*.tiktokcdn.com https://*.tiktokcdn-us.com https://*.dmcdn.net https://cdn.loom.com https://*.mzstatic.com https://www.google.com https://www.paypalobjects.com https://www.gstatic.com",
  // Fonts: self + Google Fonts
  "font-src 'self' https://fonts.gstatic.com",
  // API/WebSocket connections: Supabase, Stripe, PayPal, self, Sentry, Mux, Cloudflare
  "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://api.stripe.com https://www.paypal.com https://api.paypal.com https://openrouter.ai https://api.openrouter.ai https://*.sentry.io https://stream.mux.com https://videodelivery.net",
  // Frames: Stripe hosted payment UI, PayPal Smart Buttons, and whitelisted RichMediaPlayer embed origins
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://www.paypal.com https://www.sandbox.paypal.com https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.dailymotion.com https://player.twitch.tv https://clips.twitch.tv https://www.loom.com https://open.spotify.com https://w.soundcloud.com https://embed.podcasts.apple.com https://embed.music.apple.com https://www.tiktok.com",
  // Media: self + Supabase Storage + Mux + Cloudflare Stream for audio/video
  "media-src 'self' blob: https://*.supabase.co https://*.supabase.in https://stream.mux.com https://videodelivery.net",
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
  transpilePackages: ["@caribbean/ui", "@caribbean/design-system", "@caribbean/payments", "@caribbean/ai", "@caribbean/media"],
  reactStrictMode: true,
  eslint: {
    // Avoid blocking build on client-side lint warnings in third-party & edge components
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        dns: false,
        net: false,
        tls: false,
        fs: false,
      };
    }
    return config;
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@caribbean/ui', '@caribbean/design-system'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [320, 420, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
      },
      {
        protocol: 'https',
        hostname: 'image.mux.com',
      },
      {
        protocol: 'https',
        hostname: 'videodelivery.net',
      },
      {
        protocol: 'https',
        hostname: 'imagedelivery.net',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/((?!embed/).*)',
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
            value: 'camera=(self), microphone=(self), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: TUKUBI_CSP,
          },
        ],
      },
      {
        source: '/embed/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value: `${TUKUBI_CSP}; frame-ancestors *`,
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

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
  hideSourceMaps: true,
  disableLogger: true,
});
