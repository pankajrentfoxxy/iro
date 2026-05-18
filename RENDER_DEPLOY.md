# Deploy IRO backend on Render (Docker)

Two **Web Services** (Docker): **main API** (`server`, port from `PORT`) and **admin API** (`iro-admin-service`). Use **Render PostgreSQL** (and **Redis**) or any external URLs — both services share the same **`DATABASE_URL`**, **`REDIS_URL`**, and **`AES_256_KEY_BASE64`** (must be identical on both).

---

## 1. Repo layout (must match Dockerfiles)

Build commands assume your **current directory is the monorepo root `iro/`** (the folder that contains `server/` and `iro-admin-service/`).

---

## 2. Build and push images (run locally or in CI)

Replace `YOUR_REGISTRY` with Docker Hub (`youruser/iro-api`), GHCR (`ghcr.io/your-org/iro-api`), ECR, etc.

### Main API (`server`)

```bash
cd iro

docker build -t nursidansari/iro-api:latest -f server/Dockerfile server

docker push nursidansari/iro-api:latest
```

### Admin API (`iro-admin-service`)

**Context must be `iro/`** (monorepo root), not `iro-admin-service/`, because the Dockerfile copies `server/prisma` and `iro-admin-service/*`.

```bash
cd iro

docker build -t YOUR_REGISTRY/iro-admin-api:latest -f iro-admin-service/Dockerfile .

docker push YOUR_REGISTRY/iro-admin-api:latest
```

---

## 3. Render — Main API Web Service

| Setting | Value |
|--------|--------|
| Environment | Docker |
| Image | `YOUR_REGISTRY/iro-api:latest` (or connect Git and use Dockerfile below) |
| Dockerfile path | `server/Dockerfile` |
| Docker build context | `server` (set **Root Directory** to `server` if the repo root is `iro`; if Render root is already `server`, context is `.`) |

**Health check path:** `/api/health`  
**Port:** Render sets `PORT`; your app already uses `env.PORT` (default `4000` locally).

Full production variable checklist (including optional JWT TTL / OTP fields): **`env.production`** at the monorepo root. Paste values into Render; keep real secrets out of git if you edit that file in-place.

### Environment variables (main API)

| Variable | Notes |
|----------|--------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Postgres connection string (SSL if Render Postgres: often `?sslmode=require`) |
| `REDIS_URL` | Redis URL (`rediss://` if TLS) |
| `JWT_ACCESS_SECRET` | Strong secret, ≥32 chars |
| `JWT_REFRESH_SECRET` | Strong secret, ≥32 chars, different from access |
| `AES_256_KEY_BASE64` | Same bytes as admin API (32-byte key, base64) |
| `CORS_ORIGIN` | Comma-separated origins for mobile/web clients |

Optional: `PORT` is usually injected by Render — leave default unless you override.

Startup runs **`prisma migrate deploy`** then the server.

---

## 4. Render — Admin API Web Service

| Setting | Value |
|--------|--------|
| Environment | Docker |
| Image | `YOUR_REGISTRY/iro-admin-api:latest` |
| If building from Git: **Root Directory** | `iro` (monorepo root) |
| Dockerfile path | `iro-admin-service/Dockerfile` |
| Docker build context | `.` (repository root = `iro`) |

**Health check path:** `/health`  
**Port:** `PORT` from Render (default image exposes `4010`; bind to `process.env.PORT`).

### Environment variables (admin API)

| Variable | Notes |
|----------|--------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Same DB as main API |
| `REDIS_URL` | Same Redis as main API |
| `ADMIN_JWT_ACCESS_SECRET` | ≥32 chars, **not** the mobile JWT secrets |
| `ADMIN_JWT_REFRESH_SECRET` | ≥32 chars |
| `AES_256_KEY_BASE64` | **Same value as main API** |
| `CORS_ORIGIN` | Must include your deployed **admin-web** origin(s), e.g. `https://admin.example.com` |

Startup runs **`prisma migrate deploy`** (same schema as main API; concurrent deploy is OK with Prisma locks).

---

## 5. Provision data stores on Render

1. Create **PostgreSQL** → copy **Internal Database URL** or **External URL** into **`DATABASE_URL`** on **both** services (add `?schema=public` if needed; use SSL params required by Render).
2. Create **Redis** (Render Redis or Redis Cloud) → set **`REDIS_URL`** on **both** services.

Run **`npm run db:seed`** (or a one-off Render **shell** / local against prod DB) once if you need seed roles/hierarchy/bootstrap admin — only after migrations.

---

## 6. Admin web (`admin-web`)

Docker image + Compose profile **`ui`**: **[ADMIN_WEB_DEPLOY.md](./ADMIN_WEB_DEPLOY.md)**.

Quick build from **`iro/`**:

```bash
docker build -t YOUR_REGISTRY/iro-admin-web:latest \
  --build-arg NEXT_PUBLIC_ADMIN_API_URL=https://your-admin-api.onrender.com/api/admin \
  -f admin-web/Dockerfile admin-web
```

---

## 7. Optional: tag by Git SHA

```bash
export TAG=$(git rev-parse --short HEAD)

docker build -t YOUR_REGISTRY/iro-api:${TAG} -f server/Dockerfile server
docker build -t YOUR_REGISTRY/iro-admin-api:${TAG} -f iro-admin-service/Dockerfile .
docker build -t YOUR_REGISTRY/iro-admin-web:${TAG} \
  --build-arg NEXT_PUBLIC_ADMIN_API_URL=https://your-admin-api.example.com/api/admin \
  -f admin-web/Dockerfile \
  admin-web

docker push YOUR_REGISTRY/iro-api:${TAG}
docker push YOUR_REGISTRY/iro-admin-api:${TAG}
docker push YOUR_REGISTRY/iro-admin-web:${TAG}
```

---

## 8. Checklist before go-live

- [ ] `DATABASE_URL` / `REDIS_URL` reachable from Render regions  
- [ ] **`AES_256_KEY_BASE64`** identical on main + admin API  
- [ ] Mobile JWT secrets ≠ admin JWT secrets  
- [ ] **`CORS_ORIGIN`** on admin API matches real admin UI origins  
- [ ] Health checks: main `/api/health`, admin `/health`  
- [ ] HTTPS URLs only in production CORS and `NEXT_PUBLIC_ADMIN_API_URL`  
- [ ] Admin web image rebuilt with correct **`NEXT_PUBLIC_ADMIN_API_URL`** (see **[ADMIN_WEB_DEPLOY.md](./ADMIN_WEB_DEPLOY.md)**)
