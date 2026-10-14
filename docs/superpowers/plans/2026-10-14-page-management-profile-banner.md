# TUKUBI Page Management, Profile Editing & Banner Customization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a complete, production-grade Page Management system for TUKUBI — allowing page owners and administrators to edit page information, upload/preview/replace/remove page avatars and cover banners reliably across mobile and desktop, backed by Supabase Storage RLS policies, PostgreSQL triggers, and full feed/rail integration.

**Architecture:**
- **Database & Storage Layer (PostgreSQL & Supabase):** Versioned migration `00112_page_management_storage_and_profile_customization.sql` creating the `page-media` storage bucket, storage RLS policies granting upload/update/delete rights to authorized page managers (`public.can_manage_page`), safe folder path validator `can_manage_page_path`, column synchronization trigger (`avatar_url` <-> `logo_url`, `cover_image_url` <-> `cover_url`) on `public.businesses`, and verified RLS enforcement.
- **Backend & Data Access (Next.js Server Actions):** Implement `uploadPageImageAction`, `removePageImageAction`, and enhance `updatePageDetailsAction`, `fetchPageDetailsAction`, `fetchMyPagesAction` in `apps/web/src/lib/pages/actions.ts` with strict role verification, file type/size validation, unique cache-busting timestamped storage paths, and comprehensive cache invalidation (`revalidatePath`).
- **Frontend Management & Customization UI:** Transform `apps/web/src/app/pages/[slug]/manage/page-management-client.tsx` into an interactive, Caribbean Futurism design-system management dashboard with live image drag-and-drop file uploaders, immediate client-side previews, replace/remove buttons, crop/aspect ratio framing, field validation, unsaved changes dirty tracking, discard/cancel controls, and accessible status notifications.
- **Public & Home Integration:** Add prominent "Manage Page" and banner/avatar edit triggers to `apps/web/src/app/pages/[slug]/page.tsx`, ensure all page cards in directory (`/pages`), rails (`PagesRail`), and post attribution (`feed-post.tsx`) accurately display updated avatars and banners without browser cache lag, and preserve page-publishing identity.

**Tech Stack:** Next.js 15 (App Router, Server Actions, React 19 hooks `useTransition`), Tailwind CSS v4, Lucide React, Supabase Storage & PostgreSQL RLS, Vitest.

---

## Global Constraints
- Adhere to TUKUBI Engineering Governance (`AGENTS.md`) and Design System (`@caribbean/design-system`, Caribbean Futurism).
- Direct DDL executions outside versioned SQL migrations in `supabase/migrations/` are forbidden. All schema/storage policy changes must be in `00112_page_management_storage_and_profile_customization.sql`.
- Storage uploads must be authenticated and restricted by page manager authorization (`can_manage_page`). Never disable RLS or open public write access.
- TypeScript typecheck must pass with zero errors. All tests must pass with evidence.

---

### Task 1: Versioned Supabase SQL Migration (Storage & Database Sync)

**Files:**
- Create: `supabase/migrations/00112_page_management_storage_and_profile_customization.sql`
- Test: `tests/unit/page-storage-rls.test.ts`

**Interfaces:**
- Produces:
  - `storage.buckets` record `page-media` (10MB limit, public read, jpeg/png/webp/gif).
  - Function `public.can_manage_page_path(p_folder TEXT, p_user_id UUID) RETURNS BOOLEAN`.
  - Function `public.sync_business_image_columns() RETURNS TRIGGER` ensuring `avatar_url` <-> `logo_url` and `cover_image_url` <-> `cover_url` parity.
  - Storage RLS policies for `page-media` bucket (SELECT for all, INSERT/UPDATE/DELETE for `can_manage_page`).
  - Storage RLS policies on `avatars` bucket permitting page managers for `pages/{page_id}/*` paths.

- [ ] **Step 1: Write unit test verifying SQL migration syntax and functions**
- [ ] **Step 2: Run test to verify it fails before migration creation**
- [ ] **Step 3: Author `00112_page_management_storage_and_profile_customization.sql` with idempotent statements**
- [ ] **Step 4: Run test to verify it passes**

---

### Task 2: Backend Server Actions for Page Media & Information

**Files:**
- Modify: `apps/web/src/lib/pages/actions.ts`
- Test: `tests/unit/page-management-actions.test.ts`

**Interfaces:**
- Produces:
  - `uploadPageImageAction(pageId: string, formData: FormData, imageType: 'avatar' | 'banner'): Promise<ActionResponse<{ url: string }>>`
  - `removePageImageAction(pageId: string, imageType: 'avatar' | 'banner'): Promise<ActionResponse>`
  - Enhanced `updatePageDetailsAction(pageId: string, formData: FormData): Promise<PageActionResult>` with full field validation
  - Enhanced `fetchPageDetailsAction(slug: string)` with mapped image aliases
- Consumes: `createSupabaseServerClient`, `getCurrentUser`, `public.businesses`, `public.page_roles`

- [ ] **Step 1: Write unit tests covering upload validation, permission rejection for non-managers, and update validation**
- [ ] **Step 2: Run test to verify failure**
- [ ] **Step 3: Implement `uploadPageImageAction`, `removePageImageAction`, and enhance `updatePageDetailsAction`**
- [ ] **Step 4: Run test to verify all action test cases pass**

---

### Task 3: Interactive Page Media Customizer & Edit Form UI

**Files:**
- Create: `apps/web/src/components/pages/page-image-uploader.tsx`
- Modify: `apps/web/src/app/pages/[slug]/manage/page-management-client.tsx`
- Test: `tests/unit/page-image-uploader.test.ts`

**Interfaces:**
- Produces:
  - `PageImageUploader` component with live client-side image preview, drag-and-drop, aspect ratio framing (banner 16:6 / avatar 1:1), upload progress, replace, and remove actions.
  - Revamped `PageManagementClient` with tab navigation, unsaved changes detection, discard edits, field validation messages, and immediate visual feedback.

- [ ] **Step 1: Create `PageImageUploader` component with responsive mobile & desktop UI**
- [ ] **Step 2: Update `PageManagementClient` to embed `PageImageUploader` for Avatar and Banner with Cancel/Discard controls**
- [ ] **Step 3: Write and run unit tests for image validation and uploader logic**

---

### Task 4: Public Page & Navigation Integration

**Files:**
- Modify: `apps/web/src/app/pages/[slug]/page.tsx`
- Modify: `apps/web/src/components/rails/pages-rail.tsx`
- Test: `tests/unit/public-page-display.test.ts`

**Interfaces:**
- Produces:
  - Prominent "Manage Page" and banner/avatar hover edit overlay buttons for page owners/admins in `[slug]/page.tsx`.
  - Fix property fallback for `avatar_url` and `cover_image_url` alongside `logo_url` and `cover_url`.
  - Direct deep link to edit mode `/pages/${slug}/manage?tab=edit`.

- [ ] **Step 1: Write unit tests verifying image property resolution and edit permissions on public page**
- [ ] **Step 2: Update `[slug]/page.tsx` with prominent management actions and image resolution**
- [ ] **Step 3: Verify `PagesRail` and directory cards correctly link and display avatars/banners**
- [ ] **Step 4: Run tests to verify passing behavior**

---

### Task 5: End-to-End Verification & TypeScript Typecheck

**Files:**
- Test: All tests in `tests/unit/`
- Full test suite: `npx vitest run`

- [ ] **Step 1: Run comprehensive Vitest test suite covering all page management and publishing tests**
- [ ] **Step 2: Run project-wide TypeScript typecheck (`npx turbo run typecheck` or `npx tsc --noEmit`)**
- [ ] **Step 3: Verify responsive mobile & desktop UI layout and WCAG accessibility standards**
- [ ] **Step 4: Produce final engineering report and verification evidence**
