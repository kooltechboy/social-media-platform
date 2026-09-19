# TUKUBI Deployment & CI/CD Pipeline Architecture

**Status:** Production Ready  
**Version:** September 2026 Master Baseline  

---

## 1. Monorepo CI/CD Pipeline Architecture

TUKUBI utilizes Turborepo with pnpm workspaces to orchestrate continuous integration, static analysis, type checking, security auditing, and deployments across 31 packages and apps.

```mermaid
graph TD
    GitPush[Developer Pushes to Main Branch] --> CI[GitHub Actions CI Runner]
    
    subgraph CI Quality Gates
        CI --> Gate1[1. Prohibited Reference Audit: pnpm check:prohibited]
        CI --> Gate2[2. TypeScript Strict Typecheck: pnpm typecheck (31/31 packages)]
        CI --> Gate3[3. Vitest Unit Test Suite: pnpm test:unit (1049 tests)]
        CI --> Gate4[4. Database Migration Verifier: scripts/apply-all-migrations.js]
    end
    
    Gate1 --> Pass{All Gates Pass?}
    Gate2 --> Pass
    Gate3 --> Pass
    Gate4 --> Pass
    
    Pass -- Yes --> DeployWeb[Deploy Web to Vercel Production]
    Pass -- Yes --> DeployAdmin[Deploy Admin/Moderation/Studios to Vercel]
    Pass -- Yes --> DeployMobile[Trigger EAS Mobile Build - Expo 52]
    Pass -- No --> Fail[Abort Deployment & Alert On-Call Engineer]
```

---

## 2. CI Quality Gates & Verification Commands

Every pull request and deployment must pass the following automated gates with zero warnings or exceptions:

1. **Zero Prohibited References Gate:**
   ```bash
   pnpm check:prohibited
   ```
   Scans the entire codebase for forbidden payment processors and unverified patterns. Zero violations permitted.

2. **TypeScript Compilation Gate:**
   ```bash
   pnpm typecheck
   ```
   Compiles all 31 monorepo packages and applications in parallel with `--noEmit`. Zero type errors permitted.

3. **Automated Unit & Invariant Test Gate:**
   ```bash
   pnpm test:unit
   ```
   Executes 107 Vitest test suites (1,049 tests) covering double-entry accounting, RLS helpers, cryptographic signing, aspect ratios, and Caribbean localization.

4. **Database Migration Pipeline:**
   ```bash
   node scripts/apply-all-migrations.js
   ```
   Extracts credentials via Windows Credential Manager / CI secrets and applies pending migrations sequentially against the target PostgreSQL 17 instance via the Supabase Management API.

---

## 3. Production Deployment Targets

- **Web Frontend (`apps/web`):** Vercel Edge Network with Next.js 15.5.23 App Router, utilizing React Server Components and Edge Middleware.
- **Operator Consoles (`apps/admin`, `apps/moderation`, `apps/creator-studio`, `apps/business-studio`):** Deployed as isolated subdomains with strict SSO and IP allowlisting.
- **Mobile Applications (`apps/mobile`):** Universal Expo 52 React Native compiled via Expo Application Services (EAS) for native iOS (TestFlight / App Store) and Android (Google Play Console).
