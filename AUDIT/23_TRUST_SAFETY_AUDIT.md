# 23 — TRUST & SAFETY, RISK & MODERATION AUDIT

**Domain:** Content Moderation, Automated Risk Scoring, User Reporting & Sanctions  
**Auditor:** Principal Trust & Safety Architect  
**Status:** Good / Robust (Score: 86/100)

---

## 1. Moderation Pipeline & Case Triage (`@caribbean/trust-safety`)

- **Report Categories:** `spam`, `harassment`, `hate_speech`, `fraud_scam`, `impersonation`, `misinformation`, `child_safety`.
- **Automated Risk Scoring:** Integrates with `@caribbean/ai` risk classification to score incoming posts and flag high-risk content for review.
- **Sanction Actions:** `warn`, `hide_content`, `temp_mute`, `suspend_account`, `ban_account`.

---

## 2. Dedicated Moderation Portal (`apps/moderation`)

- Independent Next.js portal for human moderators.
- Features: Case queue filtering by severity/priority, evidence inspection, sanction application, and audit trail logging.
