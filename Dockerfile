# ==========================================
# Stage 1: Dependency resolution
# ==========================================
FROM node:24-alpine AS deps
WORKDIR /app

# Copy root lockfile and workspace package manifests
COPY package.json package-lock.json ./
COPY Backend/package.json ./Backend/

# Install only production dependencies deterministically
RUN npm ci --omit=dev

# ==========================================
# Stage 2: Hardened Runtime
# ==========================================
FROM node:24-alpine AS runner
WORKDIR /app

# Install tini for init signal handling and zombie reaping
RUN apk add --no-cache tini

ENV NODE_ENV=production
ENV PORT=3000

# Copy production node_modules from deps stage
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --from=deps --chown=node:node /app/Backend/node_modules ./Backend/node_modules

# Copy application source code with unprivileged user ownership
COPY --chown=node:node package.json server.js ./
COPY --chown=node:node Backend/ ./Backend/
COPY --chown=node:node Frontend/ ./Frontend/

# Run as non-root user
USER node

EXPOSE 3000

# Health check without heavy process spawning overhead
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Use tini to handle SIGTERM/SIGINT signals gracefully
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]