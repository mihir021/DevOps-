# ---- Stage 1: install production dependencies ----
# A separate stage just for `npm ci` means Docker can cache this layer and
# skip re-installing packages whenever only our source code changes.
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- Stage 2: final runtime image ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy only what's needed to run: production node_modules + source code.
# devDependencies (jest, nodemon, supertest, mongodb-memory-server, ...)
# never make it into this image.
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

# Run as the non-root "node" user built into the official image, instead
# of root - a basic container security practice.
USER node

EXPOSE 5000

# Lets Docker (and docker-compose's `depends_on: condition: service_healthy`)
# know whether this container is actually serving requests, not just
# running. We use `node -e` instead of curl/wget since the slim Alpine
# image doesn't have either installed by default.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', res => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "src/index.js"]
