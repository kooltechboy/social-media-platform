# 09_SECURITY.md — AppSec, OWASP Review, & Cryptography

## 1. Cryptographic Signature Verification
- `StripeAdapter.verifyWebhookSignature`: Uses `node:crypto` `timingSafeEqual` over HMAC-SHA256 to prevent timing attacks.
- Webhook payloads verify timestamp tolerance within 300 seconds to protect against replay attacks.

## 2. Secrets & Token Isolation
- Zero raw secrets or service role keys hardcoded in client source trees.
- Production environment variables managed strictly via Vercel secrets and Supabase Vault.
