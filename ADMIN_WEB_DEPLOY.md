# Admin web — Docker (`admin-web`)

Work from monorepo root **`iro/`**. Set **`NEXT_PUBLIC_ADMIN_API_URL`** to the URL the **browser** uses for the admin API, including **`/api/admin`**, no trailing slash. It is applied at **image build** time (change URL → rebuild).

---

### Step 1 — Build image (production tag)

```bash
cd iro

docker build \
  -t YOUR_REGISTRY/iro-admin-web:latest \
  --build-arg NEXT_PUBLIC_ADMIN_API_URL=https://your-admin-api.example.com/api/admin \
  -f admin-web/Dockerfile \
  admin-web
```

---

### Step 2 — Push image (optional)

```bash
docker push YOUR_REGISTRY/iro-admin-web:latest
```

---

### Step 3 — Run container

```bash
docker run --rm -p 3001:3001 \
  -e PORT=3001 \
  YOUR_REGISTRY/iro-admin-web:latest
```

App: **http://localhost:3001** (default **`PORT=3001`**).

---

### Step 4 — Local image + run (admin API on host `:4010`)

```bash
cd iro

docker build \
  -t iro-admin-web:local \
  --build-arg NEXT_PUBLIC_ADMIN_API_URL=http://localhost:4010/api/admin \
  -f admin-web/Dockerfile \
  admin-web

docker run --rm -p 3001:3001 iro-admin-web:local
```

---

### Step 5 — Docker Compose (`ui` profile)

From **`iro/server/`**:

```bash
docker compose --profile apps --profile ui up --build -d admin-web admin-api
```

Stop **`admin-web`** (profile **`ui`**):

```bash
docker compose --profile ui down
```


docker build -t nursidansari/iro-admin-web:latest --build-arg NEXT_PUBLIC_ADMIN_API_URL=https://iro-api-latest.onrender.com/api/admin -f admin-web/Dockerfile admin-web

docker push nursidansari/iro-admin-web:latest