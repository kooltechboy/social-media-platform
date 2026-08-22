# ADR-013 — Trust & Safety Platform with Human-in-the-Loop

**Status:** Accepted
**Context:** Diaspora communities attract spam, scams, harassment, impersonation, and coordinated manipulation. AI-only moderation is unsafe and legally risky.
**Decision:** Pipeline of detectors (spam, bots, toxicity, fraud, URL safety, image/video safety, copyright signals) feeding a risk engine with three outcomes: ALLOW / REVIEW / RESTRICT. Auto-action only for high-confidence defined categories (e.g., CSAM, confirmed malware); everything else requires human moderation. All actions immutable + audited; appeals reviewed by a different moderator.
**Consequences:** Moderation console (`apps/moderation`) is a Phase 2 dependency, not an afterthought. AI improves triage speed; humans remain accountable. See `TRUST-SAFETY.md`.
