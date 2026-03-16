# IRO – Database Only Setup on VPS

Use this when you want to create the IRO project and database **now**, and deploy backend/frontend **later** after sprints are done.

---

## 1. SSH into your VPS

```bash
ssh root@187.77.187.213
```

---

## 2. Create IRO project directory

```bash
mkdir -p /root/iro
cd /root/iro
```

---

## 3. Copy files to VPS

From your **local machine** (in a new terminal, from the IRO project folder):

```bash
scp docker-compose.db-only.yml .env.db-only.example root@187.77.187.213:/root/iro/
```

---

## 4. Create `.env` on VPS

On the VPS:

```bash
cd /root/iro
cp .env.db-only.example .env
nano .env
```

Set a strong password:

```
IRO_DB_USER=postgres
IRO_DB_PASSWORD=YourSecurePassword123!
IRO_DB_NAME=iro
```

Save and exit (Ctrl+X, Y, Enter).

---

## 5. Start the database

```bash
docker compose -f docker-compose.db-only.yml up -d
```

---

## 6. Verify it’s running

```bash
docker ps
```

You should see `iro-postgres` running.

Test the database:

```bash
docker exec -it iro-postgres psql -U postgres -d iro -c "\dt"
```

(Empty tables is fine – migrations will run when you deploy the backend later.)

---

## 7. When you’re ready for backend + frontend

1. Copy the full IRO project to `/root/iro/` (backend, frontend, full `docker-compose.yml`).
2. Run migrations:  
   `docker compose exec backend npx prisma migrate deploy`
3. Start everything:  
   `docker compose up -d`

---

## Summary

| Step | Command |
|------|---------|
| Create dir | `mkdir -p /root/iro && cd /root/iro` |
| Copy files | `scp docker-compose.db-only.yml .env.db-only.example root@187.77.187.213:/root/iro/` |
| Create .env | `cp .env.db-only.example .env` then edit |
| Start DB | `docker compose -f docker-compose.db-only.yml up -d` |
| Check | `docker ps` |
