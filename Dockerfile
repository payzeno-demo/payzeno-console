# syntax=docker/dockerfile:1.7
#
# Two stages. The build stage needs the pnpm workspace root because @payzeno/contracts is a
# workspace:* dependency — building this repo in isolation will fail at install with
# ---------- build ----------
FROM deps AS build
WORKDIR /repo
COPY payzeno-contracts ./payzeno-contracts
COPY payzeno-console  ./payzeno-console

RUN pnpm --filter @payzeno/contracts build

# The seven VITE_* vars are BUILD-time. Baking them means one image per environment; that is
# ---------- runtime ----------
FROM nginx:1.25-alpine AS runtime
RUN apk add --no-cache curl

COPY payzeno-console/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/payzeno-console/dist /usr/share/nginx/html

