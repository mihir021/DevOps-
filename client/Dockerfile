# ---- Stage 1: build the static React app ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Note: client/.env is intentionally NOT excluded from this build context
# (see .dockerignore). Vite bakes VITE_-prefixed variables directly into the
# built JS bundle at build time, and the browser can already read them once
# shipped - so unlike server/.env (real secrets: DB password, JWT secret),
# there's nothing sensitive here to protect. Never put real secrets in a
# VITE_ variable for this exact reason.
#
# Note: VITE_API_URL is NOT needed here — the frontend uses a relative "/api"
# path, and Nginx reverse-proxies it to the server container internally.
# This means this image works with any server IP/domain without rebuilding.

COPY . .
RUN npm run build

# ---- Stage 2: serve the built files with Nginx ----
# The final image doesn't need Node.js at all - just a lightweight static
# file server. This is why we don't run `vite preview` in production.
FROM nginx:alpine AS runner
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Alpine's busybox includes `wget` by default, so we don't need to install
# curl just for this check. We use 127.0.0.1 instead of localhost because
# `listen 80;` only binds IPv4, and `localhost` inside the container can
# resolve to the IPv6 loopback (::1) first, causing a false failure.
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --spider -q http://127.0.0.1:80/ || exit 1
