# Add iroorg.tech to VPS (Without Affecting crm.rentfoxxy.com)

Your VPS hosts both crm.rentfoxxy.com and IRO. We'll add iroorg.tech to serve IRO only. crm.rentfoxxy.com stays unchanged.

---

## Step 1: Find Where the Reverse Proxy Lives

SSH into your VPS:

```bash
ssh root@187.77.187.213
```

Check what handles ports 80 and 443:

```bash
ss -tlnp | grep -E ':80|:443'
```

You'll likely see **laptop-erp-web** (Docker) – that container serves crm.rentfoxxy.com.

---

## Step 2: Find the laptop-erp Project and Nginx Config

```bash
# Find laptop-erp project folder
find /root -name "docker-compose*" -type f 2>/dev/null | head -20

# Or check common locations
ls -la /root/laptop-erp 2>/dev/null || ls -la /root/ 2>/dev/null
```

Look for nginx config files (e.g. `nginx.conf`, `nginx.deploy.conf`, `*.conf`).

---

## Step 3A: If Using Nginx Proxy Manager (Hostinger Docker Catalog)

If you have **Nginx Proxy Manager** in Docker Manager:

1. Open **Docker Manager** → your VPS
2. Open the **Nginx Proxy Manager** admin panel (link next to the container)
3. Click **Add Proxy Host**
4. **Domain:** `iroorg.tech` (and add `www.iroorg.tech` in Advanced)
5. **Forward Hostname/IP:** `127.0.0.1` or `host.docker.internal`
6. **Forward Port:** `3000`
7. **SSL** tab → Enable SSL, request Let's Encrypt
8. For `/api` → Add **Custom Location**: path `/api`, forward to `127.0.0.1:4000`

crm.rentfoxxy.com stays as its own Proxy Host.

---

## Step 3B: If nginx is in laptop-erp-web (Docker Container)

### 2A.1 Inspect the container

```bash
docker ps | grep -E "laptop|nginx|80|443"
```

### 2A.2 Locate nginx config

```bash
# Replace CONTAINER_NAME with the actual container name (e.g. laptop-erp-web)
docker exec CONTAINER_NAME ls /etc/nginx/
docker exec CONTAINER_NAME cat /etc/nginx/nginx.conf
```

### 2A.3 Add iroorg.tech config

You need to add a new server block. Options:

**Option 1 – Mount a config file**

1. Create on the host:

```bash
mkdir -p /root/nginx-sites
nano /root/nginx-sites/iroorg.tech.conf
```

Paste:

```nginx
server {
    listen 80;
    server_name iroorg.tech www.iroorg.tech;
    
    location / {
        proxy_pass http://host.docker.internal:3000;
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
        proxy_pass http://host.docker.internal:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

2. Update the laptop-erp docker-compose to mount this file and include it in nginx. (Exact steps depend on your compose setup.)

**Option 2 – Use Hostinger’s domain/reverse proxy**

If your VPS is managed by Hostinger, use their panel:

1. Add domain **iroorg.tech**
2. Set reverse proxy to `http://127.0.0.1:3000` (and `/api` to `http://127.0.0.1:4000`)
3. Enable SSL for iroorg.tech

---

## Step 2B: If nginx is on the Host (System)

### 2B.1 Create site config

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

### 2B.2 Enable and test

```bash
ln -sf /etc/nginx/sites-available/iroorg.tech /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 2B.3 Add SSL

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d iroorg.tech -d www.iroorg.tech
```

---

## Step 3: Hostinger Panel (If Available)

If your VPS is on Hostinger and you have a control panel:

1. Log in to the Hostinger account where the VPS and iroorg.tech are.
2. Open **Domains** or **Websites**.
3. Add **iroorg.tech** as a domain.
4. Configure **Reverse Proxy** or **Proxy**:
   - Domain: iroorg.tech
   - Target: `http://127.0.0.1:3000`
   - Path `/api`: `http://127.0.0.1:4000`
5. Enable **SSL** for iroorg.tech.

---

## Step 4: Verify

1. Visit **https://iroorg.tech** – should show IRO.
2. Visit **https://crm.rentfoxxy.com** – should still show rentfoxxy.

---

## Summary

| Domain            | Points to              | Port  |
|-------------------|------------------------|-------|
| crm.rentfoxxy.com | rentfoxxy (unchanged)  | 80/443|
| iroorg.tech       | IRO web + API          | 3000, 4000 |

Both domains use the same ports 80/443. Nginx chooses the backend by `server_name` (domain), so they stay separate.
