# IRO – Create GitHub Repo & Push Code

Step-by-step guide to create a new repo and push IRO from your local machine.

---

## Step 1: Create the repo on GitHub

1. Go to **https://github.com/new**
2. Fill in:
   - **Repository name:** `iro` (or `IRO`, `iro-platform`, etc.)
   - **Description:** `IRO - Indian Reformer Organisation | Civic + Political Digital Infrastructure Platform` (optional)
   - **Visibility:** Private or Public (your choice)
   - **Do NOT** check "Add a README file" – your project already has files
3. Click **Create repository**

---

## Step 2: Initialize Git locally (if not already done)

Open **PowerShell** in your IRO folder:

```powershell
cd c:\Users\bibha\OneDrive\Desktop\IRO
```

Check if Git is initialized:

```powershell
git status
```

- If you see "fatal: not a git repository" → run Step 2a  
- If you see a list of files → skip to Step 3

### Step 2a: Initialize Git

```powershell
git init
git add .
git status
```

Make sure `.env` and `node_modules` are **not** listed (they should be in `.gitignore`).

---

## Step 3: First commit

```powershell
git add .
git commit -m "Initial commit: IRO platform"
```

---

## Step 4: Add GitHub as remote

Replace `pankajrentfoxxy` with your GitHub username if different:

```powershell
git remote add origin https://github.com/pankajrentfoxxy/iro.git
```

---

## Step 5: Push to GitHub

```powershell
git branch -M main
git push -u origin main
```

You may be asked to sign in to GitHub (browser or token).

---

## Step 6: Verify

1. Open **https://github.com/pankajrentfoxxy/iro**
2. Confirm your files are there (backend, frontend, docker-compose, etc.)
3. Confirm `.env` is **not** there (it must stay local)

---

## Future pushes (after making changes)

```powershell
cd c:\Users\bibha\OneDrive\Desktop\IRO
git add .
git commit -m "Describe your changes"
git push origin main
```

---

## Quick reference

| Step | Command |
|------|---------|
| Create repo | Go to github.com/new, name it `iro` |
| Init (if needed) | `git init` |
| First commit | `git add .` then `git commit -m "Initial commit"` |
| Add remote | `git remote add origin https://github.com/pankajrentfoxxy/iro.git` |
| Push | `git push -u origin main` |
