# IRO microservices — repository layout

Sibling packages under the **`iro/`** monorepo root (shared Postgres + Redis via `server/docker-compose.yml`).

```
iro/
├── server/                    # Main public/mobile API (Express) · Prisma schema & migrations
│   ├── prisma/
│   ├── src/
│   ├── docker-compose.yml     # postgres, redis, api, admin-api, worker (optional)
│   ├── Dockerfile
│   └── package.json
├── iro-admin-service/         # Admin REST API (Express) · leadership console backend
│   ├── src/
│   └── package.json
├── admin-web/                 # Admin UI (Next.js) · Dockerfile · `:3001`
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── backend/                   # Legacy workspace package (npm workspaces)
├── frontend/                  # Legacy workspace package (npm workspaces)
├── package.json               # Root scripts: dev:services, dev:api, …
├── env.production             # Production env checklist (Render / Docker)
├── RENDER_DEPLOY.md           # Render Docker deploy (APIs)
├── ADMIN_WEB_DEPLOY.md        # Admin web Docker deploy
└── MICROSERVICES.md           # This file
```

Ports (local defaults):

| Package             | Dev command (from `iro/`) | Port |
|---------------------|---------------------------|------|
| `server`            | `npm run dev:api`         | 4000 |
| `iro-admin-service` | `npm run dev:admin-api`   | 4010 |
| `admin-web`         | `npm run dev:admin-web`   | 3001 |

Docker helpers (from **`iro/`**, Compose file in **`server/`**):

| Script | Purpose |
|--------|---------|
| `npm run docker:down` | Stop all Compose services |
| `npm run docker:infra` | Postgres + Redis only (for host `dev:services`) |
| `npm run docker:migrate` | `prisma migrate deploy` via Docker against Compose Postgres |
| `npm run docker:up:apps` | Full stack: APIs + DB + Redis in Docker |
| `npm run docker:build:admin-web` | Build admin-web Docker image locally (`NEXT_PUBLIC_ADMIN_API_URL` is bake-time; default targets local admin API) |
| `npm run docker:up:admin-web` | Compose profile **`ui`**: admin-web on `:3001` (run APIs separately or use **`docker:up:apps`**) |

## Production (Render)

Docker: **[RENDER_DEPLOY.md](./RENDER_DEPLOY.md)** (APIs) · **[ADMIN_WEB_DEPLOY.md](./ADMIN_WEB_DEPLOY.md)** (admin web). Env checklist: **`env.production`**.