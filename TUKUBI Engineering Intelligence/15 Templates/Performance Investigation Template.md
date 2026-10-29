---
title: "PERF-{{ID}}: {{Performance Investigation Target}}"
type: performance-investigation
status: verified
owner: Performance & SRE Lead
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags:
  - tukubi
  - performance
  - lcp
  - optimization
---

# Performance Investigation: {{Performance Investigation Target}}

## 1. Scope & Measured Baseline
- **Surface / Route:**
- **Reported Issue:** (Slow LCP, high FID/INP, excessive bundle size, slow DB query)
- **Baseline Metrics:**
  - First Contentful Paint (FCP):
  - Largest Contentful Paint (LCP):
  - First Load JS Size:
  - API / Database Query Latency:

## 2. Profiling & Root Cause Analysis
- **Execution Path:**
- **Flamegraph / Network Waterfall Findings:**
- **Bottlenecks Identified:** (N+1 database queries, unoptimized images, missing keyset cursor pagination)

## 3. Optimization Strategy & Benchmark Target
- **Changes Implemented:**
- **Evidence-Based Comparison:**
  | Metric | Baseline | Post-Optimization | Delta |
  | :--- | :--- | :--- | :--- |
  | LCP | | | |
  | First Load JS | | | |
  | Query Duration | | | |

## 4. Verification & Regression Protection
- [ ] Automated regression benchmark added
- [ ] No visual or functional regressions detected
