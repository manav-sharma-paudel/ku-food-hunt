# syntax=docker/dockerfile:1
#
# KU Food Hunt API — Express 5 + Prisma 6 on Node 22.
#
# Build context is the REPO ROOT, not apps/api: the API depends on the
# `@ku-food-hunt/shared` workspace package, and pnpm needs the workspace
# manifest + lockfile to resolve `workspace:*`.
#
#   docker build -f apps/api/Dockerfile -t kfh-api .
#
# tsup bundles @ku-food-hunt/shared into dist/index.js (`noExternal` in
# tsup.config.ts), so the runtime never loads packages/shared — but every other
# dependency stays external and must be present in node_modules at runtime.

ARG NODE_VERSION=22

# ───────────────────────────────────────────────────────────── base
# Debian slim rather than Alpine: Prisma's query engine wants glibc + OpenSSL 3,
# and this avoids the musl engine-target dance entirely.
FROM node:${NODE_VERSION}-bookworm-slim AS base

# openssl is a hard requirement for the Prisma query engine; ca-certificates is
# needed for the outbound HTTPS calls to Turnstile and Resend.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Pin pnpm to the version in the root package.json `packageManager` field.
ARG PNPM_VERSION=11.13.0
RUN npm install -g pnpm@${PNPM_VERSION}

WORKDIR /app


# ───────────────────────────────────────────────────────────── builder
# Full toolchain: installs every dependency (dev included), generates the Prisma
# client, and bundles the API. Also published as a target in its own right —
# docker-compose uses it for the one-shot `migrate` service, because it is the
# only stage that carries the Prisma CLI.
FROM base AS builder

# Manifests first so `pnpm install` is cached until a dependency actually changes.
# Every workspace manifest has to be present even though only the API is built
# here — --frozen-lockfile validates the lockfile against the whole workspace and
# fails if one is missing.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json     apps/api/
COPY apps/web/package.json     apps/web/
COPY packages/shared/package.json packages/shared/

# `<pkg>...` means "this package and its dependencies", which keeps the web app's
# tree (maplibre-gl, react, vite) out of the API image entirely — 367 packages
# instead of the full workspace.
RUN pnpm install --frozen-lockfile --filter @ku-food-hunt/api...

# Now the source. Everything the API build touches: its own tree plus the shared
# package and the base tsconfig it extends.
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api

# Generate the Prisma client into node_modules, then bundle src/index.ts → dist/.
RUN pnpm --filter @ku-food-hunt/api exec prisma generate
RUN pnpm --filter @ku-food-hunt/api build


# ───────────────────────────────────────────────────────────── runner
FROM base AS runner

ENV NODE_ENV=production \
    PORT=4000

# The whole built tree is carried over rather than a pruned subset. pnpm's
# node_modules is a web of symlinks into node_modules/.pnpm, and the generated
# Prisma client lives inside it — copying selected directories reliably breaks
# one or the other. The cost is that build-time tools ride along in the image;
# see the note in README "Docker" if that ever needs trimming.
COPY --from=builder --chown=node:node /app /app

# UPLOADS_ROOT is `path.resolve(process.cwd(), 'uploads')` (lib/uploads.ts), so
# the working directory decides where photos land. Keep it at the API package
# root and mount a volume on ./uploads — without one, every uploaded photo is
# lost when the container is replaced.
WORKDIR /app/apps/api
RUN mkdir -p uploads/reviews uploads/restaurants && chown -R node:node uploads
VOLUME ["/app/apps/api/uploads"]

USER node

EXPOSE 4000

# Uses the app's own liveness endpoint; Node 22 has global fetch, so this needs
# no curl in the image.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# index.ts installs its own SIGINT/SIGTERM handlers for graceful shutdown, so
# node can run as PID 1 — but run the container with `init: true` (compose) or
# `--init` so orphaned children are still reaped.
CMD ["node", "dist/index.js"]
