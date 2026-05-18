# IRO Server

Backend package for the **Indian Reformers Org (IRO)** platform: **main mobile/public API** (this folder), shared **Prisma** schema, **PostgreSQL**, **Redis**. **Admin web** (`admin-web`, Next.js) lives at **`../admin-web`** — see **`../MICROSERVICES.md`** for the layout.

The **admin API** lives next to this repo: **`../iro-admin-service`** (sibling under the `iro/` monorepo root), not inside `server/`.

## Monorepo layout (`iro/`)

```
iro/
├── server/                 # This package — main API, prisma/, docker-compose.yml
├── iro-admin-service/      # Admin API (Express)
├── admin-web/              # Admin UI (Next.js)
└── ...
```

## Ports (quick reference)

| Service | Port (host) | Notes |
|--------|-------------|--------|
| Main API | **4000** | `/api/...`, health: `/api/health` |
| Admin API | **4010** | `/api/admin/auth/...`, `/api/admin/users`, … health: **`/health`** (root) |
| Admin web (dev) | **3001** | Next.js (`npm run dev:admin-web` from **`iro/`**, or `npm run admin:web` here) |
| Postgres (Compose) | **5433** → 5432 | User `iro`, DB `iro_app` |
| Redis (Compose) | **6380** → 6379 | |

## Prerequisites

- **Node.js 22** and npm  
- **Docker Desktop** (or Docker Engine + Compose v2) for the recommended stack  
- **Git**

---

## Local development

### 1. Environment files

**Main API (`server/.env`)** — copy from `server/.env.example`:

- `DATABASE_URL`, `REDIS_URL`, `JWT_*`, `AES_256_KEY_BASE64`, …

**Admin API** — recommended pattern:

1. Keep shared DB/Redis/AES in **`server/.env`**.
2. Add **either** in `server/.env` **or** in **`../iro-admin-service/.env`**:
   - `ADMIN_JWT_ACCESS_SECRET` (32+ characters)
   - `ADMIN_JWT_REFRESH_SECRET` (32+ characters)

The admin service loads **`../server/.env` first**, then **`../iro-admin-service/.env`** (overrides). So you can run the admin API with only `server/.env` if it already contains the `ADMIN_JWT_*` variables.

See **`../iro-admin-service/.env.example`** for optional overrides.

### 2. Install & Prisma (run from **`server/`**)

```bash
cd server
cp .env.example .env
# Edit .env — add ADMIN_JWT_* here OR add them later under ../iro-admin-service/.env

npm install
npx prisma generate
```

The Prisma schema generates **two** clients:

- Main API: `server/node_modules/@prisma/client`
- Admin API: `../iro-admin-service/node_modules/.prisma/client`

Always run **`npx prisma generate` from `server/`** after schema changes.

```bash
cd ../iro-admin-service && npm install && cd ../server
cd ../admin-web && npm install && cd ../server
```

### 3. Docker Compose

**Run commands from `server/`** (where `docker-compose.yml` lives).

**Postgres + Redis only** (for **`npm run dev:services`** from **`iro/`** — APIs run on the host):

```bash
cd server
npm run docker:infra      # postgres + redis (no api/admin-api containers)
npm run docker:migrate    # prisma migrate deploy inside Docker (uses Compose Postgres)
```

**Full stack in Docker** (main API + admin API containers as well):

```bash
npm run docker:migrate    # optional first; api/admin-api also run migrate on startup
npm run docker:up         # same as: docker compose --profile apps up --build -d
```

- Main API: `http://localhost:4000/api/health`  
- Admin API: `http://localhost:4010/health`  

The **`admin-api`** image builds with **`context: ..`** (the **`iro/`** folder) so the Dockerfile can access **`server/prisma`** and **`iro-admin-service`**.

**Compose profiles:** **`api`** and **`admin-api`** are behind profile **`apps`**. Plain `docker compose up -d` (without the profile) starts only **postgres** and **redis**.

For **host-run** APIs against Compose DB/Redis, use in `server/.env`:

`DATABASE_URL=postgresql://iro:iro@localhost:5433/iro_app?schema=public`  
`REDIS_URL=redis://localhost:6380`

Logs (when **`apps`** profile is running):

```bash
npm run docker:logs          # main api
npm run docker:logs:admin    # admin api
```

Stop everything:

```bash
npm run docker:down
```

### 4. Admin web (Next.js)

From **`iro/`** root:

```bash
cd admin-web
npm run dev
```

Or from **`server/`**: `npm run admin:web`

Open **http://localhost:3001**. Default API base: **`http://localhost:4010/api/admin`** (`NEXT_PUBLIC_ADMIN_API_URL`). Production: `https://your-admin-api.example.com/api/admin`.

### 5. Run APIs on the host (without Docker for Node)

From **`server/`** with Postgres/Redis already running:

```bash
npm run dev                 # main API
npm run admin:api           # admin API (uses npm --prefix ../iro-admin-service)
```

Admin API needs valid env (see §1).

### 6. Database migrations

```bash
cd server
npm run db:migrate          # dev
npm run docker:migrate      # prisma migrate deploy via Compose
```

---

## Production

- Build **main API**: `docker build -t iro-api -f Dockerfile .` from **`server/`**.  
- Build **admin API**: from **`iro/`** (monorepo root):  
  `docker build -f iro-admin-service/Dockerfile -t iro-admin-api .`  
  Or: `docker compose -f server/docker-compose.yml build admin-api`

HTTP CORS on **main** and **admin** APIs reflects any browser `Origin` (supports credentials). **`CORS_ORIGIN`** in env is kept for compatibility but does not restrict admin HTTP traffic anymore.

**Admin web build** (from **`iro/`** root):

```bash
cd admin-web
export NEXT_PUBLIC_ADMIN_API_URL=https://your-admin-api.example.com/api/admin
npm ci && npm run build && npm run start
```

---

## Troubleshooting

- **Admin API exits immediately (“Invalid environment”)** — Ensure `DATABASE_URL`, `REDIS_URL`, `AES_256_KEY_BASE64`, and both `ADMIN_JWT_*` are set via `server/.env` and/or `../iro-admin-service/.env`.  
- **Admin API Docker build fails “COPY server/prisma”** — Build must use **`iro/`** as context (`docker-compose.yml` already sets `context: ..` for `admin-api`).  
- **`Prisma Client` out of date** — From **`server/`**: `npx prisma generate`.  
- **Admin console login** — Seed creates **`admin@rentfoxxy.com`** / **`admin@123`** (L1). From **`server/`**: `npm run db:seed` (needs **`AES_256_KEY_BASE64`** in `.env`). Sign-in accepts **phone or email**. Replace this password in production.  
- **Duplicate `server/admin-web` after moving admin UI** — Stop Next.js / close editors locking `node_modules`, then delete **`server/admin-web`**. Canonical app root is **`iro/admin-web`**.

---

## Layout inside `server/`

```
server/
├── prisma/
├── src/                    # Main API
├── docker-compose.yml      # admin-api build context `..` → monorepo `iro/`
├── Dockerfile
└── .env.example
```
