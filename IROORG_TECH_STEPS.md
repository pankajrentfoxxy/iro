# iroorg.tech Setup – Step by Step

**Goal:** Serve IRO at iroorg.tech without changing crm.rentfoxxy.com.

---

## Step 1: Check Your Setup on the VPS

SSH in and run:

```bash
ssh root@187.77.187.213
docker ps
```

Note which containers use ports 80 and 443 (e.g. laptop-erp-web, nginx-proxy-manager).

---

## Step 2A: If You Have Nginx Proxy Manager

1. Open **Hostinger** → **VPS** → **Docker Manager**
2. Find **Nginx Proxy Manager** and open its admin link
3. Log in (default: admin@example.com / changeme)
4. **Hosts** → **Proxy Hosts** → **Add Proxy Host**
5. Fill in:
   - **Domain Names:** `iroorg.tech`, `www.iroorg.tech`
   - **Forward Hostname/IP:** `172.17.0.1` (Docker host) or `host.docker.internal`
   - **Forward Port:** `3000`
   - **Cache Assets:** Off
   - **Block Common Exploits:** On
6. **SSL** tab:
   - **SSL Certificate:** Request a new Let's Encrypt certificate
   - **Force SSL:** On
7. **Custom Locations** (for API):
   - **Add** → **Define location:** `/api`
   - **Forward hostname:** `172.17.0.1` or `host.docker.internal`
   - **Forward port:** `4000`
8. **Save**

---

## Step 2B: If laptop-erp-web Handles 80/443 (No Nginx Proxy Manager)

You need to add iroorg.tech to the nginx that serves crm.rentfoxxy.com.

### 1. Find the laptop-erp project

```bash
ls /root/
# Look for: laptop-erp, laptop-refurb, or similar
```

### 2. Inspect nginx config

```bash
docker exec laptop-erp-web cat /etc/nginx/nginx.conf
# Or: docker exec laptop-erp-web ls /etc/nginx/conf.d/
```

### 3. Add iroorg.tech as a new server block

You’ll need to add a config file and mount it into the container, or edit the nginx config inside the container.

**Create config on host:**

```bash
mkdir -p /root/iro-nginx
nano /root/iro-nginx/iroorg.tech.conf
```

Paste:

```nginx
server {
    listen 80;
    server_name iroorg.tech www.iroorg.tech;
    
    location / {
        proxy_pass http://172.17.0.1:3000;
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
        proxy_pass http://172.17.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then update the laptop-erp docker-compose to mount `/root/iro-nginx` into the nginx container and include this file. (Exact steps depend on your compose setup.)

---

## Step 2C: Deploy Nginx Proxy Manager (If You Don’t Have It)

If laptop-erp-web is on 80/443 and you can’t easily add iroorg.tech to it:

1. **Hostinger** → **VPS** → **Docker Manager** → **Catalog**
2. Deploy **Nginx Proxy Manager**
3. Configure NPM to proxy crm.rentfoxxy.com to laptop-erp and iroorg.tech to IRO
4. Stop laptop-erp-web from binding 80/443 and let NPM handle them

This is more involved and may require downtime. Prefer Step 2A or 2B if possible.

---

## Step 3: Verify

- **https://iroorg.tech** → IRO site
- **https://crm.rentfoxxy.com** → rentfoxxy (unchanged)

---

## Need Help?

If the setup is unclear:

1. Run `docker ps` and share the output
2. Run `docker exec laptop-erp-web cat /etc/nginx/nginx.conf` (if that container exists) and share the output
3. Or contact Hostinger support and ask how to add a second domain (iroorg.tech) with reverse proxy to 127.0.0.1:3000 on your VPS
