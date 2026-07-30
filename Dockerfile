# syntax=docker/dockerfile:1.7
#
# Two stages. The build stage needs the pnpm workspace root because @payzeno/contracts is a
# workspace:* dependency — building this repo in isolation will fail at install with
# ERR_PNPM_WORKSPACE_PKG_NOT_FOUND. The compose service sets `context: ..` for that reason.
# Runtime is nginx serving static files; there is no node process in production.

# ---------- deps ----------
FROM node:20.11.1-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.1.1 --activate
WORKDIR /repo

COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY payzeno-contracts/package.json ./payzeno-contracts/
COPY payzeno-console/package.json  ./payzeno-console/

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter @payzeno/console...

# ---------- build ----------
FROM deps AS build
WORKDIR /repo
COPY payzeno-contracts ./payzeno-contracts
COPY payzeno-console  ./payzeno-console

RUN pnpm --filter @payzeno/contracts build

# The seven VITE_* vars are BUILD-time. Baking them means one image per environment; that is
# the tradeoff we took in ADR 0002 and it is why the deploy pipeline builds per env.
ARG VITE_PAYZENO_API_URL=http://localhost/v1
ARG VITE_WS_URL=ws://localhost/ws/notifications
ARG VITE_VAULT_PUBLIC_URL=http://localhost:8099/public
ARG VITE_SENTRY_DSN=
ARG VITE_ENVIRONMENT=local
ARG VITE_FEATURE_SETTLEMENT_EXPLORER=true
ARG VITE_FEATURE_DISPUTE_EVIDENCE_V2=false
ARG GIT_SHA=local
ENV VITE_PAYZENO_API_URL=$VITE_PAYZENO_API_URL \
    VITE_WS_URL=$VITE_WS_URL \
    VITE_VAULT_PUBLIC_URL=$VITE_VAULT_PUBLIC_URL \
    VITE_SENTRY_DSN=$VITE_SENTRY_DSN \
    VITE_ENVIRONMENT=$VITE_ENVIRONMENT \
    VITE_FEATURE_SETTLEMENT_EXPLORER=$VITE_FEATURE_SETTLEMENT_EXPLORER \
    VITE_FEATURE_DISPUTE_EVIDENCE_V2=$VITE_FEATURE_DISPUTE_EVIDENCE_V2 \
    GIT_SHA=$GIT_SHA

WORKDIR /repo/payzeno-console
RUN pnpm build

# ---------- runtime ----------
FROM nginx:1.25-alpine AS runtime
RUN apk add --no-cache curl

COPY payzeno-console/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/payzeno-console/dist /usr/share/nginx/html

# Sourcemaps are uploaded to Sentry by CI and must not be served to merchants.
RUN find /usr/share/nginx/html -name '*.map' -delete

EXPOSE 8082
HEALTHCHECK --interval=15s --timeout=3s --retries=5 \
  CMD curl -fsS http://localhost:8082/healthz || exit 1

LABEL org.opencontainers.image.title="payzeno-console" \
      org.opencontainers.image.vendor="Payzeno" \
      org.opencontainers.image.source="https://github.com/payzeno/payzeno-console"

CMD ["nginx", "-g", "daemon off;"]
