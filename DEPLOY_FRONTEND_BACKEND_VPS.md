# Deploy IRO Frontend + Backend on VPS

Step-by-step guide to deploy **only** the main IRO application on a VPS:

- **Frontend** → `frontend/` (Next.js, port **3000**)
- **Backend** → `backend/` (Express API, port **4000**)

This does **not** deploy `admin-web`, `iro-admin-service`, or `server/`.

PostgreSQL and Redis are still required for the backend (registration, OTP, queues). They run via the same `docker-compose.yml` on the VPS.

---

## Architecture on VPS

```
User → Nginx (443) → frontend:3000
                  → /api/* → backend:4000 → PostgreSQL + Redis
```

| Container      | Role             | Port |
|----------------|------------------|------|
| `iro-postgres` | PostgreSQL DB    | 5432 |
| `iro-redis`    | Redis            | 6379 |
| `iro-backend`  | Express API      | 4000 |
| `iro-web`      | Next.js frontend | 3000 |

---

## Step 1 — VPS Prerequisites

On your VPS (Ubuntu/Debian):

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose plugin
apt install -y docker-compose-plugin

# Verify
docker --version
docker compose version
```

Open firewall ports (if using UFW):

```bash
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

Ports **3000** and **4000** can stay internal; Nginx exposes **80/443** only.

---

## Step 2 — Copy Project to VPS

### Option A — Git (recommended)

```bash
ssh root@YOUR_VPS_IP

mkdir -p /root/iro
cd /root/iro

git clone https://github.com/YOUR_ORG/iro.git .
# Or pull latest if repo already exists:
# git pull origin main
```

### Option B — SCP from your PC

From the project root on your machine:

```powershell
scp -r backend frontend docker-compose.yml .env.vps.example package.json package-lock.json root@YOUR_VPS_IP:/root/iro/
```

Minimum required files:

- `backend/`
- `frontend/`
- `docker-compose.yml`
- `.env.vps.example`

---

## Step 3 — Create Environment File

On the VPS:

```bash
cd /root/iro
cp .env.vps.example .env
nano .env
```

Set these values:

```env
# Database
IRO_DB_USER=postgres
IRO_DB_PASSWORD=YourStrongPassword123!
IRO_DB_NAME=iro

# Auth (minimum 32 characters each)
IRO_JWT_SECRET=your-super-secret-jwt-key-min-32-chars
IRO_ENCRYPTION_KEY=your-encryption-key-minimum-32-characters-long

# Your live site URL (no trailing slash)
IRO_CORS_ORIGIN=https://iroorg.tech

# Optional: first admin phone (10 digits)
INIT_ADMIN_PHONE=9876543210

# Set 0 in production when SMS is configured
ALLOW_DEV_OTP=0
```

**If the DB password has special characters** (`@`, `#`, `!`), add a URL-encoded `DATABASE_URL` in `.env`:

```env
DATABASE_URL=postgresql://postgres:Your%40Encoded%23Password@postgres:5432/iro?schema=public
```

| Special char | URL-encoded |
|--------------|-------------|
| `@`          | `%40`       |
| `#`          | `%23`       |
| `!`          | `%21`       |

---

## Step 4 — Build and Start Services

From `/root/iro`:

```bash
docker compose up -d --build
```

Migrations run automatically when the backend starts (`backend/entrypoint.sh` → `prisma migrate deploy`).

---

## Step 5 — Verify Deployment

```bash
# Check containers
docker ps

# Backend health
curl http://127.0.0.1:4000/health

# Frontend
curl -I http://127.0.0.1:3000

# View logs if needed
docker compose logs -f backend
docker compose logs -f web
```

Test registration API:

```bash
curl -X POST http://127.0.0.1:4000/api/public/registrations \
  -H "Content-Type: application/json" \
  -d '{"mobile":"9876543210","fullName":"Test User"}'
```

Expected success response:

```json
{
  "success": true,
  "memberId": "IRO-2026-XXXXXX",
  "fullName": "Test User"
}
```

---

## Step 6 — Point Domain to VPS

At your domain registrar (e.g. `iroorg.tech`):

| Type | Name | Value       |
|------|------|-------------|
| A    | @    | YOUR_VPS_IP |
| A    | www  | YOUR_VPS_IP |

Wait 5–15 minutes for DNS propagation.

---

## Step 7 — Nginx Reverse Proxy + SSL

Install Nginx and Certbot:

```bash
apt install -y nginx certbot python3-certbot-nginx
```

Create config:

```bash
nano /etc/nginx/sites-available/iroorg.tech
```

Paste:

```nginx
server {
    listen 80;
    server_name iroorg.tech www.iroorg.tech;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:

```bash
ln -sf /etc/nginx/sites-available/iroorg.tech /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

Get SSL certificate:

```bash
certbot --nginx -d iroorg.tech -d www.iroorg.tech
```

---

## Step 8 — Final Production Checks

1. Open `https://iroorg.tech` — homepage loads
2. Open `https://iroorg.tech/register` — registration form works
3. Open `https://iroorg.tech/join-the-movement` — QR landing page works
4. Open `https://iroorg.tech/iro-admin` — admin panel loads
5. Confirm `.env` has `IRO_CORS_ORIGIN=https://iroorg.tech`

---

## If You Already Deployed DB Only

If you ran `docker-compose.db-only.yml` earlier (see `VPS_IRO_DATABASE_ONLY.md`):

```bash
cd /root/iro

# Stop db-only stack (keeps data volume)
docker compose -f docker-compose.db-only.yml down

# Deploy full frontend + backend stack
docker compose up -d --build
```

Existing PostgreSQL data in the `iro_postgres_data` volume is preserved.

---

## Port Conflicts

If **3000** or **4000** are already used on the VPS, edit `docker-compose.yml`:

```yaml
backend:
  ports:
    - "4001:4000"

web:
  ports:
    - "3001:3000"
```

Update Nginx to proxy to `3001` and `4001` instead.

---

## Useful Commands After Deploy

| Task | Command |
|------|---------|
| Start | `docker compose up -d` |
| Rebuild after code change | `docker compose up -d --build` |
| View logs | `docker compose logs -f` |
| Stop | `docker compose down` |
| Run migrations manually | `docker compose exec backend npx prisma migrate deploy` |
| Seed data (optional) | `docker compose exec backend npx prisma db seed` |
| Open DB shell | `docker exec -it iro-postgres psql -U postgres -d iro` |
| List registrations | `docker exec -it iro-postgres psql -U postgres -d iro -c 'SELECT * FROM "Registration";'` |

---

## Project File Reference

| Path | Purpose |
|------|---------|
| `frontend/Dockerfile` | Builds Next.js standalone app |
| `backend/Dockerfile` | Builds Express API + Prisma |
| `backend/entrypoint.sh` | Runs DB migrations, then starts API |
| `docker-compose.yml` | Orchestrates postgres, redis, backend, web |
| `frontend/next.config.js` | Proxies `/api/*` → backend |
| `backend/src/routes/public.ts` | Registration API (`POST /api/public/registrations`) |
| `.env.vps.example` | Template for VPS environment variables |

---

## How API Routing Works

1. Browser calls `https://iroorg.tech/api/public/registrations`
2. Nginx forwards `/api` → backend on port **4000**
3. Backend validates input, saves to PostgreSQL `Registration` table, returns member ID

For local dev, Next.js rewrites `/api/*` to `http://127.0.0.1:4000` (see `frontend/next.config.js`).

In Docker, the frontend container rewrites to `http://iro-backend:4000`.

---

## Quick Deploy Checklist

```
[ ] VPS has Docker + Docker Compose
[ ] Project copied to /root/iro
[ ] .env created from .env.vps.example
[ ] docker compose up -d --build
[ ] curl http://127.0.0.1:4000/health → ok
[ ] Domain A record → VPS IP
[ ] Nginx + SSL configured
[ ] https://yourdomain.com/register works
```

---

## Related Docs

- `VPS_DEPLOYMENT.md` — Full VPS deployment options
- `VPS_IRO_DATABASE_ONLY.md` — Deploy PostgreSQL first, apps later
- `DEPLOY_IROORG_TECH.md` — Domain-specific guide for iroorg.tech
- `DATABASE_SETUP.md` — Local PostgreSQL setup

---

## Future Migration to iro.in

When moving to **iro.in**:

1. DNS: point `iro.in` and `www.iro.in` to your VPS IP
2. Nginx: add or replace server block for `iro.in`
3. `.env`: set `IRO_CORS_ORIGIN=https://iro.in`
4. Rebuild: `docker compose up -d --build`
5. Optional: redirect `iroorg.tech` → `iro.in`
