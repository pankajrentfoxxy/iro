# IRO – VPS Deployment Guide

## What You Need

1. **VPS** with Docker and Docker Compose
2. **Ports**: 3000 (web), 4000 (API). Adjust if needed.
3. **Env file** with secrets (see below)

---

## Option A: Dedicated IRO Stack (Recommended)

IRO runs with its **own PostgreSQL** container. No conflict with your existing project.

### 1. Create `.env` in project root

```bash
cp .env.vps.example .env
# Edit .env with your values
```

Required variables:
```
IRO_DB_PASSWORD=your_secure_password
IRO_JWT_SECRET=your-super-secret-jwt-key-min-32-chars
IRO_ENCRYPTION_KEY=your-encryption-key-minimum-32-characters-long
IRO_CORS_ORIGIN=https://your-iro-domain.com
```

### 2. Deploy

```bash
docker compose up -d
```

### 3. Access

- **Web**: http://your-vps-ip:3000
- **API**: http://your-vps-ip:4000

Migrations run automatically when the backend starts.

---

## Option B: Shared PostgreSQL (Same VPS)

Use your **existing PostgreSQL** (e.g. rentfoxxy-erp-postgres) and add an `iro` database.

### 1. Create `iro` database in existing Postgres

```bash
# Connect to your existing postgres container
docker exec -it rentfoxxy-erp-postgres psql -U postgres -c "CREATE DATABASE iro;"
```

### 2. Update IRO docker-compose

Create `docker-compose.override.yml` or edit `docker-compose.yml`:

```yaml
# Remove the postgres service, update backend to use external postgres
services:
  backend:
    environment:
      DATABASE_URL: postgresql://postgres:${EXISTING_DB_PASSWORD}@rentfoxxy-erp-postgres:5432/iro?schema=public
    depends_on:
      - postgres  # Remove this
    # Add to same network as your existing project
    networks:
      - default
      - laptop-erp_default  # Your existing network

networks:
  laptop-erp_default:
    external: true
```

Or use a **standalone compose** that only runs backend + web and connects to your postgres:

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://postgres:PASSWORD@rentfoxxy-erp-postgres:5432/iro?schema=public
    networks:
      - iro_default
      - laptop-erp_default

  web:
    build: ./frontend
    depends_on: [backend]
    ports: ["3000:3000"]
    networks: [iro_default]

networks:
  iro_default:
    driver: bridge
  laptop-erp_default:
    external: true
```

### 3. Run migrations manually (first time)

```bash
docker compose run --rm backend npx prisma migrate deploy
```

---

## Port Conflicts

If 3000 or 4000 are in use, change in `docker-compose.yml`:

```yaml
web:
  ports:
    - "3001:3000"   # Use 3001 instead of 3000

backend:
  ports:
    - "4001:4000"   # Use 4001 instead of 4000
```

Update `IRO_CORS_ORIGIN` if the frontend port changes.

---

## Nginx Reverse Proxy (Optional)

For HTTPS and a domain like `iro.yourdomain.com`:

```nginx
server {
    listen 80;
    server_name iro.yourdomain.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    location /api {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Useful Commands

| Task | Command |
|------|---------|
| Start | `docker compose up -d` |
| Stop | `docker compose down` |
| Logs | `docker compose logs -f` |
| Rebuild | `docker compose up -d --build` |
| DB seed | `docker compose exec backend npx prisma db seed` |
