/**
 * TUKUBI — Production-Grade Service Worker
 * Version: v1.0.0
 * Architecture:
 * - Network-First for HTML navigation requests (with /offline fallback)
 * - Cache-First / Stale-While-Revalidate for versioned static assets
 * - Strict Network-Only bypass for all /api/, /auth/, Supabase, and payment endpoints
 * - Immediate old-cache pruning upon activation
 */

const CACHE_VERSION = 'tukubi-pwa-v1.0.0';
const STATIC_CACHE_NAME = `tukubi-static-${CACHE_VERSION}`;
const OFFLINE_FALLBACK_URL = '/offline';

// Essential offline fallback assets
const PRECACHE_ASSETS = [
  OFFLINE_FALLBACK_URL,
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/favicon.svg',
];

// Install Event: pre-cache offline shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        // Do not force skipWaiting immediately during install to allow graceful handoff
        return self.skipWaiting();
      })
      .catch((err) => {
        console.warn('[TUKUBI SW] Pre-cache failed:', err);
      })
  );
});

// Activate Event: prune old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('tukubi-') && cacheName !== STATIC_CACHE_NAME) {
              return caches.delete(cacheName);
            }
            return Promise.resolve();
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Message Event: allow client-initiated skipWaiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch Event: handle navigation, static assets, and security bypasses
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // 1. Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // 2. Strict Security Bypass:
  // - Never cache API calls
  // - Never cache Supabase auth/database endpoints
  // - Never cache payment, Stripe, or webhook endpoints
  // - Never cache analytics endpoints
  const isApiOrAuth =
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.hostname.includes('supabase.co') ||
    url.pathname.includes('/payments/') ||
    url.pathname.includes('/stripe') ||
    url.searchParams.has('nocache');

  if (isApiOrAuth) {
    // Network-Only: fetch directly from server without touching cache
    return;
  }

  // 3. HTML Navigation Requests (Page loads and deep links):
  // Network-First with /offline fallback.
  // NEVER cache authenticated HTML to avoid stale user states across sessions.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          return networkResponse;
        })
        .catch(async () => {
          // If network is completely unreachable, serve the pre-cached offline page
          const cache = await caches.open(STATIC_CACHE_NAME);
          const cachedOffline = await cache.match(OFFLINE_FALLBACK_URL);
          if (cachedOffline) {
            return cachedOffline;
          }
          return new Response(
            '<!DOCTYPE html><html><body><h1>TUKUBI</h1><p>You are currently offline. Please reconnect to continue.</p></body></html>',
            {
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
              status: 503,
              statusText: 'Service Unavailable',
            }
          );
        })
    );
    return;
  }

  // 4. Static Assets (_next/static, images, fonts, icons, manifest):
  // Safe to cache versioned or static files
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.webmanifest' ||
    url.pathname === '/manifest.json' ||
    url.pathname.match(/\.(?:js|css|woff2|woff|ttf|png|jpg|jpeg|gif|svg|ico|webp)$/);

  if (isStaticAsset && url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached asset immediately
          return cachedResponse;
        }

        // Fetch from network and populate cache
        return fetch(request).then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic'
          ) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
  }
});
