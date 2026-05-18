# IRO – Indian Republic Org

**Civic + Political Digital Infrastructure Platform v3.0**

Production-ready, modular, scalable political-civic tech stack.

## Stack

- **Frontend:** Next.js 14, Tailwind CSS, TypeScript, Framer Motion
- **Backend:** Node.js, Express, PostgreSQL, Prisma
- **Queue:** Redis, BullMQ
- **Auth:** JWT + OTP
- **Security:** AES-256 encrypted phones, RBAC, audit logs

## Microservices (`server` · `iro-admin-service` · `admin-web`)

Folder layout: **[`MICROSERVICES.md`](./MICROSERVICES.md)**.

### Run APIs + admin UI on the host (Docker = DB + Redis only)

From **`iro/`**, with **`server/.env`** pointing at Compose Postgres/Redis (`localhost:5433`, `localhost:6380` — see **`server/README.md`**):

1. **Stop any running Compose stack** (including API containers):

   ```bash
   npm run docker:down
   ```

2. **Start Postgres + Redis**, apply **Prisma migrations** via the migrate container, then start all Node services:

   ```bash
   npm run docker:infra
   npm run docker:migrate
   npm run dev:services
   ```

`npm run docker:migrate` runs `docker compose run --rm prisma-migrate` from **`server/`**, which executes **`npx prisma migrate deploy`** against the Compose database. Success ends with Prisma’s migration summary and exit code **0**.

### Full stack in Docker instead

From **`server/`**: `npm run docker:up` (starts **`api`** and **`admin-api`** via Compose profile **`apps`**). See **`server/README.md`**.

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment

```bash
cp .env.example .env
# Edit .env with your DATABASE_URL, REDIS_URL, JWT_SECRET, ENCRYPTION_KEY
```

### 3. Database

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 4. Run

**Terminal 1 – Backend**
```bash
npm run dev:backend
```

**Terminal 2 – Frontend**
```bash
npm run dev:frontend
```

**Terminal 3 – SMS Queue Worker (optional)**
```bash
npm run worker
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

## Project Structure

```
IRO/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma    # Full DB schema
│   │   └── seed.ts
│   ├── src/
│   │   ├── lib/             # crypto, jwt, otp, prisma, redis, queue
│   │   ├── middleware/      # auth, jurisdiction, audit
│   │   ├── routes/          # auth, webhooks, users, campaigns, analytics, etc.
│   │   ├── workers/         # sms-queue-worker
│   │   └── index.ts
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── admin/           # Admin panel (at /admin URL)
│   │   ├── login/          # Phone + OTP login
│   │   ├── signup/         # New user registration
│   │   └── page.tsx        # Landing
│   ├── components/         # IndiaMap, etc.
│   └── lib/                # API client
└── package.json
```

## Core Modules

| Module | Status |
|--------|--------|
| Missed call webhook capture | ✅ |
| WhatsApp onboarding flow | 🔲 (structure ready) |
| AI call fallback 24h | 🔲 (structure ready) |
| Referral engine | ✅ |
| Hierarchical admin (National→State→District→Tehsil) | ✅ |
| Public geo heatmap dashboard | ✅ |
| Bulk SMS campaign + queue worker | ✅ |
| Ideology scoring | ✅ |
| Donation (Razorpay-ready) | 🔲 Removed for now |
| Push notification structure | ✅ |
| Audit logs & consent tracking | ✅ |

## API Endpoints

### Public
- `GET /api/public/stats` – Public dashboard stats

### Auth
- `POST /api/auth/otp/request` – Request OTP
- `POST /api/auth/otp/verify` – Verify OTP & login
- `POST /api/auth/register` – Register with referral
- `GET /api/auth/me` – Current user (auth required)

### Webhooks
- `POST /api/webhooks/missed-call` – MyOperator missed call capture

### Admin (JWT required)
- `GET /api/users` – List members (jurisdiction-filtered)
- `GET /api/users/stats` – Member stats by state/district
- `POST /api/campaigns` – Create campaign
- `GET /api/campaigns` – List campaigns
- `GET /api/analytics/scores` – Analytics scores
- `GET /api/analytics/influencers` – Top influencers
- `GET /api/referral/leaderboard` – Referral leaderboard

## Design System

- **Primary:** Deep Navy `#0F172A`
- **Accent:** Saffron `#EA580C`
- **Neutral:** Slate `#F1F5F9`
- **Success:** Emerald `#16A34A`
- **Warning:** Amber `#F59E0B`

## Security

- AES-256 encrypted phone numbers
- JWT with role-based access
- Jurisdiction-based data isolation for admins
- Webhook signature verification
- Rate limiting
- Audit logs for admin actions

## License

Proprietary – Indian Republic Org
