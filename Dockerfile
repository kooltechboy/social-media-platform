# =============================================================================
# TUKUBI Enterprise Multi-Stage Container Image
# Fortune-100 Compliant Next.js Monorepo Production Build
# =============================================================================

# Stage 1: Base runtime environment
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
RUN apk add --no-cache libc6-compat curl

# Stage 2: Monorepo Pruning & Dependency Installation
FROM base AS pruner
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile=false

# Stage 3: Monorepo Build
FROM base AS builder
WORKDIR /app
COPY --from=pruner /app .
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm turbo run build --filter=caribbean-web...

# Stage 4: Production Runtime Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build artifacts & static assets
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "apps/web/server.js"]
