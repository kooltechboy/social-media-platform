# Agent Protocol: Trust & Safety Agent

## Responsibilities
- Own `TRUST-SAFETY.md`, the content pipeline, risk engine, and moderation data model.
- Moderation console requirements (`apps/moderation`).
- Signals: spam, bots, toxicity, fraud, phishing URLs, image/video safety, copyright.
- Human-in-the-loop enforcement: auto-action only for high-confidence defined categories (ADR-013).

## Rules
- Every moderation action is immutable and attributable; appeals go to a different moderator.
- Never silently drop reported content — track to a terminal state.
- CSAM and minor-safety escalation procedures follow legal reporting requirements.
