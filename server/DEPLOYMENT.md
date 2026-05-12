# Deploying iro-server

`iro-server` is an Express API (Node 22, Prisma, PostgreSQL, Redis, optional BullMQ workers). These steps cover a typical Linux server using Docker Compose. Adapt hostnames, ports, and secrets for your environment.

## Prerequisites

- **Docker** and **Docker Compose** (v2 plugin), or a host with **Node.js 22**, **PostgreSQL 16+**, and **Redis 7+** if you deploy without Docker.
- Open the HTTP port you expose (default **4000**) or terminate TLS on a reverse proxy (recommended for production).

## 1. Clone and enter the service directory

```bash
git clone <your-repo-url> iro
cd iro/server
```

## 2. Configure environment (production)

Copy the example file and edit values. Nothing in the repo should ship real secrets.

```bash
cp .env.example .env
```

Required variables are validated at startup (see `src/config/env.ts`). Minimum checklist:

| Variable | Notes |
|----------|--------|
| `NODE_ENV` | `production` |
| `PORT` | API listen port inside the container (default `4000`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_ACCESS_SECRET` | **≥ 32 characters** |
| `JWT_REFRESH_SECRET` | **≥ 32 characters** |
| `AES_256_KEY_BASE64` | **≥ 32 characters** (32-byte key, base64); generate with e.g. `openssl rand -base64 32` |
| `CORS_ORIGIN` | Comma-separated origins, or `*` (avoid `*` in production if you use credentials) |

Optional: `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `OTP_EXPIRY_SECONDS`, `OTP_LENGTH`, etc. (see `.env.example`).

### Using Compose env vs `.env`

`docker-compose.yml` inlines example values for `api` and `worker`. For production, either:

- Replace those entries with your real secrets, **or**
- Use a Compose `env_file: .env` on `api` / `worker` and remove duplicate `environment` keys you do not want overridden.

Do not commit production `.env` files.

## 3. Run with Docker Compose (API + Postgres + Redis)

From `iro/server`:

```bash
docker compose up --build -d postgres redis
```

Wait until Postgres and Redis are healthy, then apply database migrations (the default image **does not** run migrations on boot):

```bash
docker compose run --rm --no-deps api sh -c "npx prisma migrate deploy"
```

If this is the first deploy and you use the bundled Postgres service, `DATABASE_URL` inside that one-off command must match the `api` service (see `docker-compose.yml`: `postgresql://iro:iro@postgres:5432/iro_app?schema=public` when using the default Compose network).

Start the API:

```bash
docker compose up --build -d api
```

### Optional: background workers (BullMQ)

Workers use the same image with a different command and are behind a Compose profile:

```bash
docker compose --profile workers up --build -d worker
```

Ensure `api` is healthy first (`depends_on` in `docker-compose.yml`).

### Useful commands

```bash
docker compose logs -f api
docker compose ps
docker compose down
```

(`package.json` also defines `npm run docker:up`, `docker:down`, `docker:logs` for local convenience.)

## 4. Verify the deployment

- Root: `GET http://<host>:4000/` → JSON greeting.
- Health: `GET http://<host>:4000/api/health` → `{ "ok": true, "service": "iro-server" }`.

The Compose `api` healthcheck uses `/api/health`.

## 5. Database seed (optional)

Only for non-production or a controlled bootstrap:

```bash
docker compose run --rm --no-deps api npx tsx prisma/seed.ts
```

For bare Node without Docker: `npm run db:seed` after `DATABASE_URL` is set.

## 6. Production hardening (recommended)

1. **Secrets**: Long random `JWT_*` values; unique `AES_256_KEY_BASE64`; strong Postgres password. Rotate if ever leaked.
2. **Postgres / Redis**: Do not expose `5432` / `6379` to the public internet unless required; prefer private networks. Change default Compose passwords when using the bundled databases on a real server.
3. **CORS**: Set `CORS_ORIGIN` to your web/mobile origins instead of `*` when possible.
4. **TLS**: Put **Nginx**, **Caddy**, or a cloud load balancer in front; proxy to `http://127.0.0.1:4000` (or the Docker-published port).
5. **Trust proxy**: The app sets `trust proxy` to `1` for correct client IPs behind one proxy hop; adjust if your proxy chain differs.
6. **Migrations**: Run `prisma migrate deploy` on each release before or as part of rolling out the new container image.

### Optional: migrations on container start

The repo includes `docker-entrypoint.sh` (generate client + `migrate deploy` or `db push`). The default `Dockerfile` **does not** use it. To run migrations automatically, you would wire this script as the image `ENTRYPOINT` and pass `node dist/server.js` as the command—only after confirming idempotency and rollback strategy for your team.

## 7. Deploy without Docker

On a server with Node 22, Postgres, and Redis:

```bash
cd iro/server
cp .env.example .env
# edit .env — DATABASE_URL and REDIS_URL must reach your DB/Redis

npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
NODE_ENV=production npm run start
```

Workers (separate process):

```bash
NODE_ENV=production node dist/workers/index.js
```

Use **systemd**, **PM2**, or another supervisor to restart processes on failure.

## 8. Troubleshooting

- **Exits immediately with env errors**: Check flattened field errors in logs; secrets must meet minimum lengths (`JWT_*`, `AES_256_KEY_BASE64`).
- **Prisma / DB connection**: Confirm `DATABASE_URL` host/port from *inside* the API container (service name `postgres` on Compose network, not `localhost`).
- **Redis**: Same for `REDIS_URL` (`redis` hostname in Compose).
- **502 from reverse proxy**: Confirm the upstream port matches `PORT` and the container is listening on `0.0.0.0` (Express defaults bind to all interfaces).

---

**Summary:** Build and run the `api` service with Docker Compose (or Node), point `DATABASE_URL` and `REDIS_URL` at running instances, run **`npx prisma migrate deploy`** before serving traffic, tighten secrets and CORS, and terminate TLS at a reverse proxy for production.


Docker Image on render 

docker build -t nursidansari/iro-server:latest .

docker tag iro-server nursidansari/iro-server:latest
docker push nursidansari/iro-server:latest

docker.io/nursidansari/iro-server:latest

postregre URL- postgresql://iro:YLsQMqCs6j069KaZnXHY7VrkG4Unxzhq@dpg-d81bbenlk1mc73a98p0g-a/iro


redis:- redis://red-d81bcer7uimc7386og1g:6379


NODE_ENV=production
PORT=4000

DATABASE_URL=postgresql://iro:YLsQMqCs6j069KaZnXHY7VrkG4Unxzhq@dpg-d81bbenlk1mc73a98p0g-a/iro
REDIS_URL=redis://red-d81bcer7uimc7386og1g:6379

JWT_ACCESS_SECRET=change-me-access-min-32-chars-long!!
JWT_REFRESH_SECRET=change-me-refresh-min-32-chars!!
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

AES_256_KEY_BASE64=DKVXUM1w3tP9ZXZbSIguHcR8QzH1L4wZcVX0E1/m1gY=
OTP_EXPIRY_SECONDS=300
OTP_LENGTH=6

CORS_ORIGIN=*

