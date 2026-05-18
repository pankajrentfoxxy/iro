# Build from monorepo root `iro/` (parent of `server/` + `iro-admin-service/`):
#   docker compose -f server/docker-compose.yml build admin-api
# Or manually:
#   cd iro && docker build -f iro-admin-service/Dockerfile .
FROM node:22-alpine AS build
RUN apk add --no-cache openssl
WORKDIR /build
COPY server/prisma ./prisma/
COPY iro-admin-service/package.json iro-admin-service/package-lock.json* ./iro-admin-service/
WORKDIR /build/iro-admin-service
RUN npm ci 2>/dev/null || npm install
WORKDIR /build
RUN ./iro-admin-service/node_modules/.bin/prisma generate --schema prisma/schema.prisma
WORKDIR /build/iro-admin-service
COPY iro-admin-service/tsconfig.json ./
COPY iro-admin-service/src ./src/
RUN npm run build

FROM node:22-alpine
RUN apk add --no-cache openssl
WORKDIR /app/iro-admin-service
ENV NODE_ENV=production
COPY server/prisma /app/prisma/
COPY iro-admin-service/package.json iro-admin-service/package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev
RUN npm install prisma@5.22.0 --no-save
COPY --from=build /build/iro-admin-service/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /build/iro-admin-service/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /build/iro-admin-service/dist ./dist
EXPOSE 4010
CMD ["sh", "-c", "npx prisma migrate deploy --schema ../prisma/schema.prisma && node dist/server.js"]
