# Deploy IRO to iroorg.tech

Step-by-step guide to deploy the full IRO stack and serve it at **iroorg.tech**.  
Later you can switch to **iro.in** by updating DNS and nginx.

---

## Part 1: Deploy IRO Stack on VPS

### 1. SSH into VPS

```bash
ssh root@187.77.187.213
```

### 2. Stop db-only, create .env, start full stack

```bash
cd /root/iro

# Stop the db-only compose (keeps database volume)
docker compose -f docker-compose.db-only.yml down

# Create .env from example
cp .env.vps.example .env
nano .env
```

**Edit `.env` with these values** (use the same DB password you used before):

```
IRO_DB_USER=postgres
IRO_DB_PASSWORD=your_existing_db_password
IRO_DB_NAME=iro

IRO_JWT_SECRET=your-super-secret-jwt-key-min-32-chars
IRO_ENCRYPTION_KEY=your-encryption-key-minimum-32-characters-long

IRO_CORS_ORIGIN=https://iroorg.tech
```

Save (Ctrl+X, Y, Enter).

### 3. Build and start all services

```bash
docker compose up -d --build
```

### 4. Verify

```bash
docker ps
```

You should see: `iro-postgres`, `iro-backend`, `iro-web` all running.

- Web: http://YOUR_VPS_IP:3000  
- API: http://YOUR_VPS_IP:4000  

---

## Part 2: Point iroorg.tech to Your VPS

### 1. DNS (at your domain registrar)

Add an **A record**:

| Type | Name | Value        | TTL  |
|------|------|--------------|------|
| A    | @    | 187.77.187.213 | 3600 |

(If your VPS IP is different, use that instead.)

For `www.iroorg.tech`, add:

| Type | Name | Value        | TTL  |
|------|------|--------------|------|
| A    | www  | 187.77.187.213 | 3600 |

Wait 5–15 minutes for DNS to propagate.

---

## Part 3: Nginx + SSL for iroorg.tech

Your VPS likely has nginx (or a reverse proxy) for laptop-erp. Add a new server block for IRO.

### Option A: System nginx (Ubuntu/Debian)

```bash
# Install nginx and certbot if not already
apt update && apt install -y nginx certbot python3-certbot-nginx

# Create config for IRO
nano /etc/nginx/sites-available/iroorg.tech
```

Paste this (replace `187.77.187.213` if your IP is different):

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

Enable and test:

```bash
ln -sf /etc/nginx/sites-available/iroorg.tech /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

Get SSL certificate:

```bash
certbot --nginx -d iroorg.tech -d www.iroorg.tech
```

Follow the prompts. Certbot will update nginx for HTTPS.

### Option B: Hosting panel (e.g. hstgr.cloud)

If you use a hosting panel:

1. Add domain **iroorg.tech** in the panel.
2. Point it to the same server.
3. Add a reverse proxy (or similar) pointing to `http://127.0.0.1:3000` for the site and `http://127.0.0.1:4000` for `/api`.
4. Enable SSL (Let’s Encrypt) in the panel.

---

## Part 4: Update Frontend for Production

The frontend uses `NEXT_PUBLIC_API_URL` at build time. For same-domain setup, `/api` is fine.

**If you deploy with the default** (no `NEXT_PUBLIC_API_URL`), it uses `/api` and works when the site is behind nginx at iroorg.tech.

**If you need to override** (e.g. separate API domain), add to `docker-compose.yml` under `web` build args:

```yaml
args:
  NEXT_PUBLIC_API_URL: https://iroorg.tech/api
```

Then rebuild: `docker compose up -d --build`.

---

## Part 5: Future Migration to iro.in

When you move to **iro.in**:

1. DNS: point `iro.in` and `www.iro.in` to your VPS IP.
2. Nginx: add a new server block for `iro.in` (or replace `iroorg.tech`).
3. `.env`: set `IRO_CORS_ORIGIN=https://iro.in`.
4. Rebuild frontend: `docker compose up -d --build`.
5. Optional: add a redirect from `iroorg.tech` to `iro.in`.

---

## Quick Reference

| Task | Command |
|------|---------|
| Start | `docker compose up -d` |
| Rebuild | `docker compose up -d --build` |
| Logs | `docker compose logs -f` |
| Stop | `docker compose down` |
| DB migrations | `docker compose exec backend npx prisma migrate deploy` |
