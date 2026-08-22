# 26 — COMPREHENSIVE GAP ANALYSIS MATRIX

**Domain:** Cross-Domain Capability vs Target Production Readiness  
**Auditor:** Distinguished Systems Architect & Technical Program Manager  
**Status:** Actionable Baseline

---

## 1. Master Gap Analysis Matrix

| Domain | Current State | Target State | Gap Identified | Severity | Priority |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **Frontend Type Safety** | 7 actions/pages fail typecheck | 100% zero-error TypeScript build | Fix Next.js 15 cache imports & parameter signatures | P0 | Immediate |
| **SpotPay Checkout** | PSP Adapters throw stub errors | Live Stripe & PayPal processing | Wire live SDKs behind `PSPAdapter` interface | P1 | Phase 2 |
| **Mobile App Architecture** | Single-file prototype `App.tsx` | Modular Expo Router / Supabase App | Separate screens, hooks, navigation & live auth | P1 | Phase 2 |
| **Live Stream Transcoding** | Direct Supabase RT chat only | WebRTC/WHIP broadcast + HLS CDN | Connect Cloudflare Stream / AWS IVS endpoints | P2 | Phase 3 |
| **Design System Components** | Ad-hoc HTML in some web pages | Shared `@caribbean/ui` primitives | Refactor composer & buttons to shared library | P2 | Phase 3 |
| **API Rate Limiting** | Next.js API route handlers | Redis token-bucket rate limiter | Add Upstash Redis middleware to `/api/*` | P2 | Phase 3 |
| **Search Engine Sitemaps** | Static metadata in root layout | Dynamic XML sitemaps for public entities | Add dynamic `sitemap.ts` for creators/podcasts | P3 | Phase 4 |
