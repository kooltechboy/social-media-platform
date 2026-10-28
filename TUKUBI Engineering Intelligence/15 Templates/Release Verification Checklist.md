---
title: "Release Verification Checklist — {{Release Version}}"
type: release-checklist
status: pending
owner: Release Manager
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags:
  - tukubi
  - release
---

# Release Verification Checklist: {{Release Version}}

## 1. Automated Quality Gates
- [ ] `pnpm check:prohibited` passes with zero violations
- [ ] `pnpm typecheck` passes across all 31 workspace packages
- [ ] `pnpm lint` passes with zero errors and zero warnings
- [ ] `pnpm test:unit` passes 100% of unit and security suites
- [ ] Codebase graph refreshed (`node scripts/code-intelligence/generate-codebase-graph.js`)

## 2. Database & Financial Safety
- [ ] All schema changes reside in versioned `supabase/migrations/` files
- [ ] Every new table has `ENABLE ROW LEVEL SECURITY` and explicit policies
- [ ] All monetary operations produce balanced double-entry `ledger_entries`

## 3. Rollback Strategy
- **Code Rollback:** `git revert <commit>`
- **Database Rollback:** Documented compensating SQL statements
