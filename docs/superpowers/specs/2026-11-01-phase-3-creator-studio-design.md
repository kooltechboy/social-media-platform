# TUKUBI Phase 3: Unified Creator Studio & Publishing Lifecycle Architecture Specification

**Document Version:** 1.0.0  
**Status:** Approved  
**Author:** Tukubi Engineering Pair  
**System:** TUKUBI — The Caribbean Connected  

---

## 1. Executive Summary & Problem Statement

Tukubi is a creator-first Caribbean platform empowering diaspora artists, musicians, filmmakers, and entrepreneurs. The publishing pipeline spans:
1. **Create Hub (`/create`) & Universal Composer:** Creation surface handling Posts, Caribbean Shorts, Reels, Live streams, Podcasts, Shoppable product tags, and Interactive Polls.
2. **Media Processing Engine (`packages/media`):** EXIF image optimization, poster frame generation, audio mixing, and multi-link resolution.
3. **Draft Lifecycle State Machine:** Deterministic persistence preventing lost work across mobile connection drops and accidental tab navigation.

### REA Audit Findings & Architectural Flaws
1. **Resilient Draft Restoration Banner:** While `draft-manager.ts` saves draft text, `UniversalComposer` lacked an immediate visual banner alerting the creator of an autosaved draft with 1-click "Restore Draft" or "Discard" actions.
2. **Media Upload Resilience & Progress Contracts:** Video and photo items need atomic status progression (`idle` -> `uploading` -> `processing` -> `ready` | `error`) with retry capability per file item.
3. **SSRF Guard Invariants:** Pasted external URLs must be strictly validated against RFC 1918 private subnets and cloud metadata IPs (`169.254.169.254`) before content-resolver fetch occurs.
4. **Composer Ergonomics & Accessibility (WCAG 2.2 AA):** Keyboard shortcuts (`Cmd+Enter` / `Ctrl+Enter` to submit), high-contrast character counters, and live ARIA progress feedback for screen readers during uploads.

---

## 2. Invariants & Security Boundaries

- **Zero Content Loss:** Any non-empty composer state must be autosaved to `localStorage` within 300ms of typing.
- **SSRF Immunity:** The server-side media resolver must reject private IP addresses, loopback hosts, link-local addresses, and AWS/GCP/Azure instance metadata endpoints.
- **Strict Authorization & Role Boundaries:** Only verified creators, page operators, and official accounts may publish as non-personal entities (`publishAsType`).
- **WCAG 2.2 AA Compliance:** Contrast ratio >= 4.5:1, explicit focus rings, keyboard trapping in composer modals.

---

## 3. Modular Architecture

### 3.1 Draft Restoration Notification (`DraftRestoreBanner`)
- Displayed when a meaningful unsaved draft exists in storage upon composer mount.
- Actions: "Restore Draft" (populates content, media summaries, tags) vs "Discard" (cleans storage).

### 3.2 Media Upload Pipeline Contracts
```typescript
export interface ManagedMediaItem {
  id: string;
  file?: File;
  previewUrl: string;
  type: 'image' | 'video';
  status: 'idle' | 'uploading' | 'ready' | 'error';
  progress: number;
  uploadedUrl?: string;
  errorMessage?: string;
}
```

### 3.3 SSRF Guard
- `isSafePublicUrl(url: string): boolean` rigorously verifies hostname against IPv4/IPv6 private ranges before making outbound HTTP requests.

---

## 4. Verification & Testing Strategy
- Unit tests for SSRF Guard and URL safety (`tests/media-ssrf-guard.test.ts`).
- Unit tests for Draft State Machine transitions (`tests/draft-manager.test.ts`).
- Full monorepo typecheck verification (`pnpm typecheck`).
