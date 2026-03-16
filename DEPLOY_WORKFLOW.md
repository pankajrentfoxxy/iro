# IRO – Git-Based Deployment (No More SCP)

Deploy by pushing to Git and pulling on the VPS. No need to copy files manually.

---

## One-Time Setup

### 1. Create a GitHub repo (if you don't have one)

```bash
# On your local machine
cd c:\Users\bibha\OneDrive\Desktop\IRO
git init
git add .
git commit -m "Initial IRO deployment"
```

Create a new repo on GitHub (e.g. `your-username/iro`), then:

```bash
git remote add origin https://github.com/your-username/iro.git
git branch -M main
git push -u origin main
```

### 2. Set up the VPS with Git (one time)

**Option A: If you already have code on VPS (from scp)**

```bash
ssh root@187.77.187.213
cd /root/iro

# Initialize git and add remote (keep existing .env!)
git init
git remote add origin https://github.com/your-username/iro.git
git fetch origin
git checkout -b main origin/main
# Or: git pull origin main --allow-unrelated-histories
```

**Option B: Fresh clone**

```bash
ssh root@187.77.187.213
cd /root
rm -rf iro  # Only if you want a clean start (backup .env first!)
git clone https://github.com/your-username/iro.git iro
cd iro
cp .env.vps.example .env
nano .env   # Fill in your secrets
```

### 3. Save your .env on VPS

Your `.env` is **not** in Git (for security). After clone/pull, make sure it exists:

```bash
# If .env is missing after pull:
cp .env.vps.example .env
nano .env   # Paste your secrets
```

---

## Every Deployment (After Code Changes)

### On your local machine

```bash
cd c:\Users\bibha\OneDrive\Desktop\IRO
git add .
git commit -m "Your change description"
git push origin main
```

### On the VPS

```bash
ssh root@187.77.187.213
cd /root/iro
git pull origin main
docker compose up -d --build
```

That's it. No `scp` needed.

---

## Optional: Deploy Script on VPS

Create a script so you only run one command:

```bash
ssh root@187.77.187.213
nano /root/iro/deploy.sh
```

Paste:

```bash
#!/bin/bash
set -e
cd /root/iro
git pull origin main
docker compose up -d --build
echo "Deploy done. Check: docker compose ps"
```

Save, then:

```bash
chmod +x /root/iro/deploy.sh
```

**Deploy in one command:**

```bash
ssh root@187.77.187.213 "/root/iro/deploy.sh"
```

---

## Summary

| Step | Local | VPS |
|------|-------|-----|
| One-time | Push to GitHub | Clone repo, create .env |
| Every deploy | `git push` | `git pull && docker compose up -d --build` |
