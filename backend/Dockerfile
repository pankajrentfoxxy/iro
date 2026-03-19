# IRO Backend - Production (Debian base for Prisma/OpenSSL compatibility)
FROM node:20-slim AS builder

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
FROM node:20-slim

WORKDIR /app

# OpenSSL required for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

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

# Run as root (Prisma needs write access for migrate deploy)
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 4000

CMD ["/entrypoint.sh"]
