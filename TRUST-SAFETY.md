# Trust & Safety Architecture — TUKUBI

## 1. Philosophy

A platform serving diaspora communities will attract spam, scams, fraud, harassment, impersonation, and coordinated manipulation. We build a **Trust & Safety platform**, not a report button. AI assists humans; AI is never the sole judge of high-risk decisions.

## 2. Content Pipeline

```
USER CONTENT
     │
     ▼
CONTENT PIPELINE (async, event-driven)
     ├── Spam detection
     ├── Bot detection
     ├── Toxicity / hate speech
     ├── Fraud & scam signals
     ├── Malware/phishing URL checks
     ├── Image safety (CSAM/NCII hashing + classifier)
     ├── Video safety (sampled frames)
     ├── Copyright signals (audio fingerprinting — Phase 5+)
     └── Account risk scoring
             │
             ▼
        RISK ENGINE
             │
       ┌─────┼─────┐
       ▼     ▼     ▼
     ALLOW  REVIEW  RESTRICT
```

- **ALLOW:** published immediately; signals retained for model feedback.
- **REVIEW:** queued to moderation console with AI recommendation; human decision.
- **RESTRICT/REMOVE:** auto-action only for high-confidence, well-defined categories (CSAM, confirmed malware); everything else requires human confirmation; all auto-actions auditable and appealable.

## 3. Data Model (migration `00005+`)

```
reports              — user reports (target, reason, reporter, status)
moderation_cases     — queue items, priority (critical/high/medium/low), signals JSONB
moderation_actions   — immutable action log (actor, action, rationale, timestamp)
moderator_assignments
appeals              — user appeals with independent reviewer
risk_scores          — per-account/per-content rolling scores
audit_logs           — append-only
security_events
```

Every moderator action is logged and attributable. Appeals route to a different moderator than the original decision.

## 4. Moderation Console (`apps/moderation`, Phase 2 MVP)

Queue by priority; case view with content, actor history, signals (spam %, harassment %, scam %), AI recommendation, and actions: REMOVE / RESTRICT / ALLOW / ESCALATE. SLA targets: critical < 15 min, high < 4 h.

## 5. Account Integrity

- Progressive friction: rate limits → action blocks → verification challenges → suspension.
- Bot detection: device fingerprint, behavioral signals, graph anomaly detection.
- Fake-account/impersonation: verification workflow for creators/businesses; name-similarity flags.

## 6. CaribAI Assistance

Classification, prioritization, duplicate report collapsing, semantic search over abusive patterns, multilingual moderation (en/es/fr/ht/nl/pap). Human-in-the-loop mandatory for all account-level penalties above 24 h.

## 7. Escalation & Transparency

- Transparency reports (published periodically).
- User-facing policy pages (per `docs/operations/compliance-notes.md` when drafted).
- Retention: moderation data retained per legal requirements; user data deletion propagates to moderation cases with legal-hold exceptions.
