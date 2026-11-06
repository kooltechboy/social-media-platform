# TUKUBI FEED 2.0 — PERFORMANCE REPORT & CORE WEB VITALS
**Project:** TUKUBI — The Caribbean Connected  
**Baseline Date:** November 2026  
**Standard:** p75 Core Web Vitals Targets  

---

## 1. Core Web Vitals Targets & Budgets

| Metric | Target Threshold | Baseline Synthetic | Optimization Strategy |
|---|---|---|---|
| **LCP (Largest Contentful Paint)** | ≤ 2.5s | ~2.8s - 3.2s on mobile | Priority load above-the-fold post image/avatar with Next.js image optimization (`priority` flag on Post #1); eliminate render-blocking script overhead. |
| **INP (Interaction to Next Paint)** | ≤ 200ms | ~140ms - 220ms | Optimistic UI updates for likes, reactions, saves, and tab switches; debounce non-critical telemetry; avoid React 19 layout thrashing. |
| **CLS (Cumulative Layout Shift)** | ≤ 0.1 | ~0.08 - 0.14 | Enforce explicit aspect ratio containers (`aspect-[16/9]`, `aspect-[4/5]`, `aspect-square`) on all media containers and image placeholders. |
| **Initial Feed Payload** | ≤ 120 KB gzip | ~145 KB gzip | Strip unneeded raw join columns from initial SSR feed query; paginate at 30 items. |
| **Time to First Usable Post** | ≤ 1.2s | ~1.6s | Server component direct streaming with `Suspense` and pre-cached ranking signals. |

---

## 2. Rendering & DOM Efficiency

1. **Tab Caching:** Snapshot visited tab states (`tabCache`) in memory to ensure 0ms latency and 0 DOM re-mount flicker when toggling between `For You`, `Following`, `Caribbean`, and `Communities`.
2. **Virtualization Assessment:** At 30 posts per page, native DOM rendering with CSS `content-visibility: auto` on inactive post cards preserves scroll restoration and variable-height embeds better than complex virtual list libraries while maintaining 60fps scrolling.
3. **Media Autoplay Coordinator:** Viewport intersection observers ensure only 1 active video plays simultaneously, freeing GPU memory and saving mobile cellular bandwidth.
