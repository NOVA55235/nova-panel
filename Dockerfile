################################################################
# Nova Panel — Multi-stage Docker build
# @Lord_nova98 | https://github.com/NOVA55235
################################################################

# ── Stage 1: install workspace dependencies ──────────────────
FROM node:20-alpine AS deps
WORKDIR /app

RUN npm install -g pnpm@9

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY lib/db/package.json               lib/db/
COPY lib/api-spec/package.json         lib/api-spec/
COPY lib/api-zod/package.json          lib/api-zod/
COPY lib/api-client-react/package.json lib/api-client-react/
COPY artifacts/api-server/package.json artifacts/api-server/
COPY artifacts/panel/package.json      artifacts/panel/
COPY scripts/package.json              scripts/

RUN pnpm install --frozen-lockfile --ignore-scripts

# ── Stage 2: build shared libs ────────────────────────────────
FROM deps AS lib-builder
WORKDIR /app

COPY tsconfig.base.json tsconfig.json ./
COPY lib/ lib/

RUN pnpm --filter @workspace/db run build 2>/dev/null || true
RUN pnpm --filter @workspace/api-zod run build 2>/dev/null || true

# ── Stage 3: build the React frontend ────────────────────────
FROM lib-builder AS panel-builder
WORKDIR /app

COPY artifacts/panel/ artifacts/panel/
RUN pnpm --filter @workspace/panel run build

# ── Stage 4: build the Express API ───────────────────────────
FROM lib-builder AS api-builder
WORKDIR /app

COPY artifacts/api-server/ artifacts/api-server/
RUN pnpm --filter @workspace/api-server run build

# ── Stage 5: final production image ──────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Install pg (needed by seed script) and pnpm
RUN npm install -g pnpm@9 && npm install pg

# Copy API build + seed script
COPY --from=api-builder /app/artifacts/api-server/dist ./dist
COPY scripts/seed.mjs ./seed.mjs

# Copy node_modules from the full dep stage (includes @workspace/db deps)
COPY --from=deps /app/node_modules ./node_modules

# Copy built React app → served as static files by Express
COPY --from=panel-builder /app/artifacts/panel/dist ./public

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
