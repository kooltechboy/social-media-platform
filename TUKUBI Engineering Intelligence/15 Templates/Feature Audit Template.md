---
title: "{{Feature Name}} — Feature Audit"
type: feature-audit
status: draft
owner: Product & QA Engineering
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags:
  - tukubi
  - feature-audit
---

# Feature Audit: {{Feature Name}}

## 1. Implementation Mapping
- **Routes:** `/...`
- **Client Components:** `apps/web/src/components/...`
- **Server Actions / API Routes:** `apps/web/src/lib/...`
- **Database Tables & RLS Policies:** `public....`

## 2. End-to-End Verification Checklist
- [ ] Unauthenticated visitor behavior verified
- [ ] Authenticated user happy path verified
- [ ] Empty, loading, and error states verified
- [ ] RLS & authorization boundary verified
- [ ] WCAG 2.2 AA contrast and keyboard navigation verified
- [ ] Unit / E2E regression tests passing
