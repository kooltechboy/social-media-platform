# 08_API.md — Next.js Route Handlers & Server Actions

## 1. REST & AI Endpoints
- `/api/v1/health`: System heartbeat and dependency health checks.
- `/api/v1/ai`: Ask Caribbean AI query planning with regional dialect translation.
- `/api/v1/podcasts/[id]/rss`: Standards-compliant iTunes Podcast RSS 2.0 XML feed generator.
- `/api/flags`: Admin feature flag query and toggle endpoint.
- `/api/moderation/action`: Trust & Safety decisioning endpoint.

## 2. Server Actions
- Type-safe mutations located in `src/lib/*/actions.ts` utilizing `revalidatePath` and authenticated Supabase server clients.
