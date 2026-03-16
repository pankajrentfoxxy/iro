# PostgreSQL Database Setup for IRO

## Local Development (localhost)

### 1. Install PostgreSQL

PostgreSQL must be installed and running. If `psql` is not found, add PostgreSQL's `bin` folder to your PATH (e.g. `C:\Program Files\PostgreSQL\16\bin`).

**Windows:**
- Download from https://www.postgresql.org/download/windows/
- Or: `choco install postgresql`
- During install, set a password for the `postgres` user (default is often `postgres`)

**macOS:**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Linux (Ubuntu):**
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create the Database

```bash
# From project root
psql -U postgres -f database/create_local_db.sql
```

Or manually:
```bash
psql -U postgres
```
```sql
CREATE DATABASE iro;
\q
```

### 3. Configure .env

The `backend/.env` is pre-configured for localhost:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/iro?schema=public"
```

**If your PostgreSQL password is different**, edit `backend/.env` and replace `postgres` (the second one) with your password:
```
postgresql://postgres:YOUR_PASSWORD@localhost:5432/iro?schema=public
```

### 4. Run Migrations

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
```

Or from root:
```bash
npm run db:generate --workspace=backend
npm run db:migrate --workspace=backend
```

### 5. Seed (optional)

```bash
npm run db:seed --workspace=backend
```

### 6. Verify

```bash
npm run dev
```

Backend should start at http://localhost:4000

---

## Future: Migrate to VPS or Cloud DB

When moving to a VPS, Supabase, AWS RDS, or any hosted PostgreSQL:

1. **Create the database** on your new host
2. **Update `backend/.env`**:
   ```
   DATABASE_URL="postgresql://USER:PASSWORD@YOUR_HOST:5432/iro?schema=public"
   ```
   For cloud DBs (e.g. Supabase), add `&sslmode=require` if needed:
   ```
   DATABASE_URL="postgresql://USER:PASSWORD@host:5432/db?schema=public&sslmode=require"
   ```
3. **Run migrations** on the new DB:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```
4. **Optional:** Export/import data from local to production using `pg_dump` / `pg_restore`

---

## Quick Reference

| Task | Command |
|------|---------|
| Generate Prisma client | `npx prisma generate` |
| Run migrations | `npx prisma migrate deploy` |
| Create migration | `npx prisma migrate dev --name add_xxx` |
| Open DB GUI | `npx prisma studio` |
| Reset DB (dev) | `npx prisma migrate reset` |
