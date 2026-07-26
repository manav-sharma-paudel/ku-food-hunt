# syntax=docker/dockerfile:1
#
# KU Food Hunt web — Vite SPA built to static files, served by nginx.
#
# Build context is the REPO ROOT (the app imports the @ku-food-hunt/shared
# workspace package):
#
#   docker build -f apps/web/Dockerfile -t kfh-web .
#
# NOTE ON ENV VARS: Vite inlines `import.meta.env.VITE_*` at BUILD time. They are
# build arguments, not runtime environment — setting them in docker-compose's
# `environment:` block does nothing. Changing one means rebuilding the image.

ARG NODE_VERSION=22
ARG NGINX_VERSION=1.27

# ───────────────────────────────────────────────────────────── builder
FROM node:${NODE_VERSION}-bookworm-slim AS builder

ARG PNPM_VERSION=11.13.0
RUN npm install -g pnpm@${PNPM_VERSION}

WORKDIR /app

# All workspace manifests are required: --frozen-lockfile validates the lockfile
# against the whole workspace and fails if one is missing.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json      apps/web/
COPY apps/api/package.json      apps/api/
COPY packages/shared/package.json packages/shared/

# `<pkg>...` = this package plus its dependencies, so the API's tree (Prisma,
# Express) never gets installed here.
RUN pnpm install --frozen-lockfile --filter @ku-food-hunt/web...

COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/web apps/web

# Public origin for canonical + Open Graph URLs (lib/site.ts). Leave unset and
# the app falls back to window.location.origin, which is fine locally but wrong
# for anything a crawler or a social card reads.
ARG VITE_SITE_URL
# Privacy-first analytics — unset means no script is ever loaded (lib/analytics.ts).
ARG VITE_ANALYTICS_DOMAIN
ARG VITE_ANALYTICS_SRC

ENV VITE_SITE_URL=${VITE_SITE_URL} \
    VITE_ANALYTICS_DOMAIN=${VITE_ANALYTICS_DOMAIN} \
    VITE_ANALYTICS_SRC=${VITE_ANALYTICS_SRC}

RUN pnpm --filter @ku-food-hunt/web build


# ───────────────────────────────────────────────────────────── runner
FROM nginx:${NGINX_VERSION}-alpine AS runner

# Drop the stock default site before adding ours.
RUN rm -f /etc/nginx/conf.d/default.conf

COPY apps/web/nginx-security-headers.conf /etc/nginx/security-headers.conf
COPY apps/web/nginx.conf                  /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist    /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
