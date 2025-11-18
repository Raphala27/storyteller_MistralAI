# PostgreSQL Setup - Quick Start

## 🚀 Local Development (5 minutes)

### 1. Install PostgreSQL
```bash
# macOS
brew install postgresql@14
brew services start postgresql@14

# Linux (Debian/Ubuntu)
sudo apt-get install postgresql
sudo systemctl start postgresql

# Windows (PowerShell)
# Option A: Install with Chocolatey (run as Administrator)
choco install postgresql -y

# Option B: Install with winget (Windows 10/11)
winget install --id PostgreSQL.PostgreSQL -e

# Option C: Use the official installer
# Download & run: https://www.postgresql.org/download/windows/

# Start the service (service name may vary; use Services UI if unsure)
Start-Service postgresql-x64-14  # or use the actual service name shown in Services

# Verify
psql --version
```
```

### 2. Create Database
```bash
psql postgres -c "CREATE DATABASE storyteller_db;"
```

### 3. Update Environment
```bash
cd backend
echo "DATABASE_URL=postgresql+asyncpg://localhost/storyteller_db" >> .env
```

### 4. Install Dependencies & Run
```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

✅ **Done!** Tables auto-create on startup.

---

## 🌐 Render.com Deployment (3 minutes)

### 1. Create PostgreSQL Database
- Dashboard → New + → PostgreSQL
- Name: `storyteller-db`
- Click "Create Database"
- Copy "Internal Database URL"

### 2. Add to Backend Service
- Your Web Service → Environment
- Add Variable:
  - Key: `DATABASE_URL`
  - Value: (paste URL)

### 3. Deploy
```bash
git add .
git commit -m "Add PostgreSQL support"
git push
```

✅ **Done!** Render auto-deploys with database.

---

## 🧪 Test It

```bash
# Create story
curl -X POST http://localhost:8000/start-story \
  -H "Content-Type: application/json" \
  -d '{"genre":"Space Opera"}' | jq

# List stories
curl http://localhost:8000/stories | jq
```

---

## 🆘 Quick Fixes

**Can't connect?**
```bash
# Check PostgreSQL is running
brew services list  # macOS
sudo systemctl status postgresql  # Linux
```

**Tables not created?**
```bash
# Check app logs for "Database initialized"
uvicorn main:app --reload
```

**Render 500 error?**
- Check logs in Render Dashboard
- Verify DATABASE_URL is set

---

See [POSTGRESQL_MIGRATION.md](POSTGRESQL_MIGRATION.md) for full documentation.
