# IRO Database Setup

## Option 1: Prisma (recommended)

If you have the database `iro` created and `.env` with `DATABASE_URL`:

```bash
cd c:\Users\bibha\OneDrive\Desktop\IRO
npm run db:generate
npm run db:migrate
```

This creates all tables automatically.

---

## Option 2: Manual SQL (pgAdmin / DBeaver)

---

## Run in 2 steps (if 02_create_schema.sql fails)

If you get "AdminActionLog does not exist", run these **one at a time**:

1. **02a_tables_only.sql** – Run this first. Execute the whole script.
2. **02b_indexes_and_fks.sql** – Run this second. Execute the whole script.

This helps identify which step fails. If 02a fails, the error will show the real problem.

---

## Option A: pgAdmin 4

### Step 1: Create the database
1. Connect to your PostgreSQL server (localhost)
2. Right-click **Databases** → **Create** → **Database**
3. Name: `iro`
4. Click **Save**

**Or** run `01_create_database.sql`:
- Right-click **postgres** database → **Query Tool**
- Open `01_create_database.sql` and execute (F5)

### Step 2: Create tables
1. Connect to the **iro** database (double-click it)
2. Right-click **iro** → **Query Tool**
3. **If re-running after errors:** Execute `00_reset_schema.sql` first
4. Open `02_create_schema.sql`
5. Execute the entire script (F5 or Execute button)

---

## Option B: DBeaver

### Step 1: Create the database
1. Right-click your PostgreSQL connection → **SQL Editor** → **New SQL Script**
2. Paste contents of `01_create_database.sql`
3. Execute (Ctrl+Enter)

### Step 2: Create tables
1. Expand **Databases** → double-click **iro** to connect
2. Right-click **iro** → **SQL Editor** → **New SQL Script**
3. Open or paste `02_create_schema.sql`
4. Execute (Ctrl+Enter)

---

## After setup

1. Add to your `.env` file:
   ```
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/iro?schema=public"
   ```

2. Run Prisma generate (to sync client):
   ```bash
   npm run db:generate
   ```

3. Mark migrations as applied (since we created schema manually):
   ```bash
   npx prisma migrate resolve --applied 20240302000000_init
   npx prisma migrate resolve --applied 20250302000000_add_user_location
   ```

4. Start the backend:
   ```bash
   npm run dev:backend
   ```
