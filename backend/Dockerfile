# IRO Backend - Production
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install deps (including dev for build)
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy source
COPY src ./src
COPY tsconfig.json tsconfig.build.json ./

# Build (use build config to exclude seed)
RUN npx tsc -p tsconfig.build.json

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install prod deps + prisma for migrations
RUN npm install --omit=dev && npm install prisma --save-dev

# Generate Prisma client for runtime
RUN npx prisma generate

# Copy built output and migrations
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma/

# Non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 4000

# Run migrations then start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
