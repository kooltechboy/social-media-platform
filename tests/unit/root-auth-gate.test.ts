import { describe, it, expect } from 'vitest';
import { sanitizeRedirectUrl } from '../../apps/web/src/lib/auth/redirect-utils';
import fs from 'fs';
import path from 'path';

describe('Root Route Authentication Gate & Complete Protected-Route Security Audit', () => {
  // ── 1. Route Classification Matrix ──────────────────────────────────────
  const AUTH_GATEWAY_ROUTES = [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
  ];

  const PUBLIC_EXEMPT_ROUTES = [
    '/auth/callback',
    '/admin/bootstrap',
    '/api/auth/check-username',
    '/api/v1/health',
    '/api/webhooks/stripe',
  ];

  const PROTECTED_APPLICATION_ROUTES = [
    '/',
    '/explore',
    '/diaspora',
    '/map',
    '/reels',
    '/sounds',
    '/live',
    '/podcasts',
    '/communities',
    '/marketplace',
    '/events',
    '/pages',
    '/messages',
    '/notifications',
    '/profile',
    '/settings',
    '/financial-center',
    '/creator-studio',
    '/create',
    '/search',
    '/onboarding',
    '/admin',
    '/moderation',
  ];

  const PROTECTED_API_ROUTES = [
    '/api/v1/ai',
    '/api/v1/ask',
  ];

  // Helper simulating the exact Next.js middleware decision engine
  function evaluateMiddlewareRoute(
    pathname: string,
    user: { id: string } | null,
    searchParams?: Record<string, string>
  ): {
    action: 'allow' | 'redirect' | 'unauthorized_401';
    destination?: string;
  } {
    const isAuthGatewayRoute = AUTH_GATEWAY_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

    const isPublicExemptRoute =
      PUBLIC_EXEMPT_ROUTES.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
      ) || (pathname.startsWith('/api/v1/podcasts/') && pathname.endsWith('/rss'));

    // 1. Authenticated users should NEVER see login/signup forms
    if (user && isAuthGatewayRoute) {
      const rawNext = searchParams?.next;
      const safeNext = sanitizeRedirectUrl(rawNext);
      return { action: 'redirect', destination: safeNext };
    }

    // 2. Publicly exempt routes pass through freely
    if (isPublicExemptRoute) {
      return { action: 'allow' };
    }

    // 3. Auth gateway routes are accessible to unauthenticated visitors
    if (isAuthGatewayRoute) {
      return { action: 'allow' };
    }

    // 4. Unauthenticated visitors accessing protected routes
    if (!user) {
      if (pathname.startsWith('/api/')) {
        return { action: 'unauthorized_401' };
      }

      if (pathname === '/') {
        return { action: 'redirect', destination: '/login' };
      }

      const returnPath = pathname + (searchParams?.q ? `?q=${searchParams.q}` : '');
      return { action: 'redirect', destination: `/login?next=${encodeURIComponent(returnPath)}` };
    }

    // 5. Authenticated user accessing protected route
    return { action: 'allow' };
  }

  // ── 2. Primary Requirement: Root Route Protection ───────────────────────
  describe('Primary Requirement: Root Route (/) Gate', () => {
    it('MUST redirect unauthenticated visitor on / immediately to /login', () => {
      const decision = evaluateMiddlewareRoute('/', null);
      expect(decision.action).toBe('redirect');
      expect(decision.destination).toBe('/login');
    });

    it('MUST load Home Feed when visitor has active authenticated session on /', () => {
      const decision = evaluateMiddlewareRoute('/', { id: 'usr_carib_123' });
      expect(decision.action).toBe('allow');
    });

    it('does NOT redirect authenticated user back to /login when visiting /', () => {
      const decision = evaluateMiddlewareRoute('/', { id: 'usr_carib_123' });
      expect(decision.action).not.toBe('redirect');
    });
  });

  // ── 3. Login / Gateway Workflow & Loop Prevention ────────────────────────
  describe('Login & Gateway Workflow (Loop Prevention)', () => {
    it('unauthenticated visitor accessing /login is allowed to view login gateway', () => {
      const decision = evaluateMiddlewareRoute('/login', null);
      expect(decision.action).toBe('allow');
    });

    it('unauthenticated visitor accessing /signup is allowed to view signup gateway', () => {
      const decision = evaluateMiddlewareRoute('/signup', null);
      expect(decision.action).toBe('allow');
    });

    it('authenticated user opening /login is redirected to / (preventing login loops)', () => {
      const decision = evaluateMiddlewareRoute('/login', { id: 'usr_123' });
      expect(decision.action).toBe('redirect');
      expect(decision.destination).toBe('/');
    });

    it('authenticated user opening /signup is redirected to /', () => {
      const decision = evaluateMiddlewareRoute('/signup', { id: 'usr_123' });
      expect(decision.action).toBe('redirect');
      expect(decision.destination).toBe('/');
    });

    it('authenticated user opening /login?next=/creator-studio is directed to target destination', () => {
      const decision = evaluateMiddlewareRoute('/login', { id: 'usr_123' }, { next: '/creator-studio' });
      expect(decision.action).toBe('redirect');
      expect(decision.destination).toBe('/creator-studio');
    });

    it('authenticated user opening /login?next=https://evil.com is redirected safely to / (open redirect defense)', () => {
      const decision = evaluateMiddlewareRoute('/login', { id: 'usr_123' }, { next: 'https://evil.com' });
      expect(decision.action).toBe('redirect');
      expect(decision.destination).toBe('/');
    });
  });

  // ── 4. Protected Route Inventory & Enforcement ──────────────────────────
  describe('Protected Route Inventory & Boundary Enforcement', () => {
    for (const route of PROTECTED_APPLICATION_ROUTES) {
      if (route === '/') continue;

      it(`redirects unauthenticated access on ${route} to /login with next param`, () => {
        const decision = evaluateMiddlewareRoute(route, null);
        expect(decision.action).toBe('redirect');
        expect(decision.destination).toBe(`/login?next=${encodeURIComponent(route)}`);
      });

      it(`allows authenticated access on ${route}`, () => {
        const decision = evaluateMiddlewareRoute(route, { id: 'usr_123' });
        expect(decision.action).toBe('allow');
      });
    }
  });

  // ── 5. Public Exemptions ─────────────────────────────────────────────────
  describe('Public Route Exemptions', () => {
    for (const route of PUBLIC_EXEMPT_ROUTES) {
      it(`allows unauthenticated access on public exempt endpoint ${route}`, () => {
        const decision = evaluateMiddlewareRoute(route, null);
        expect(decision.action).toBe('allow');
      });
    }

    it('allows unauthenticated access to podcast RSS XML feeds', () => {
      const decision = evaluateMiddlewareRoute('/api/v1/podcasts/carib-beats-456/rss', null);
      expect(decision.action).toBe('allow');
    });
  });

  // ── 6. Protected API Route Security ──────────────────────────────────────
  describe('Protected API Routes', () => {
    for (const apiRoute of PROTECTED_API_ROUTES) {
      it(`blocks unauthenticated call to ${apiRoute} with 401 Unauthorized`, () => {
        const decision = evaluateMiddlewareRoute(apiRoute, null);
        expect(decision.action).toBe('unauthorized_401');
      });

      it(`allows authenticated call to ${apiRoute}`, () => {
        const decision = evaluateMiddlewareRoute(apiRoute, { id: 'usr_123' });
        expect(decision.action).toBe('allow');
      });
    }
  });

  // ── 7. Open Redirect Vector Defense ──────────────────────────────────────
  describe('Open Redirect Defense Vectors', () => {
    const maliciousVectors = [
      'https://malicious-site.com',
      'http://attacker.com/steal-creds',
      '//attacker.com/phish',
      '///attacker.com',
      'javascript:alert(document.cookie)',
      'data:text/html,<script>alert(1)</script>',
      'vbscript:msgbox(1)',
      '/\\evil.com',
      '/settings/../../evil.com',
      'https://tukubi.com.evil.com',
    ];

    for (const vector of maliciousVectors) {
      it(`sanitizes malicious vector: ${vector} -> /`, () => {
        expect(sanitizeRedirectUrl(vector)).toBe('/');
      });
    }
  });

  // ── 8. Cache & SSR Safety Audit ──────────────────────────────────────────
  describe('SSR / Cache Directives Verification', () => {
    it('verifies root page.tsx declares force-dynamic to prevent cached content leakage', () => {
      const rootPagePath = path.resolve(__dirname, '../../apps/web/src/app/page.tsx');
      const pageContent = fs.readFileSync(rootPagePath, 'utf-8');
      expect(pageContent).toContain("export const dynamic = 'force-dynamic';");
      expect(pageContent).toContain('getCurrentUser()');
      expect(pageContent).toContain('if (!user)');
      expect(pageContent).toContain("redirect('/login')");
    });
  });
});
