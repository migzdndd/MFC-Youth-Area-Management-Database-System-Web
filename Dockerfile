# Multi-stage production container image for MFC Youth Area Management System
FROM node:24-alpine AS base

WORKDIR /app

# Copy root and backend dependency manifests
COPY package.json ./
COPY Backend/package.json ./Backend/

# Install production dependencies
RUN cd Backend && npm install --omit=dev

# Copy full application codebase
COPY . .

# Expose HTTP port
EXPOSE 3000

# Set environment defaults
ENV PORT=3000
ENV NODE_ENV=production

# Health check endpoint verification
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "import('http').then(h => h.get('http://localhost:3000/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1)))"

# Launch standalone server
CMD ["node", "server.js"]
