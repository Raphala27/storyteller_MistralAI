# 🗄️ PostgreSQL Database Implementation

## Overview

The AI Story Generator has been upgraded from **file-based storage** to **PostgreSQL database** for improved scalability, reliability, and multi-user support.

## ✨ What's New

### Features
- ✅ **PostgreSQL Database** - Production-grade relational database
- ✅ **Async Operations** - Non-blocking database queries with SQLAlchemy 2.0
- ✅ **JSONB Storage** - Flexible segment storage with query capabilities
- ✅ **Connection Pooling** - Optimized for concurrent users
- ✅ **Transaction Safety** - ACID compliance for data integrity
- ✅ **Multi-User Ready** - User ID column prepared for authentication
- ✅ **Auto-Migrations** - Tables created automatically on startup
- ✅ **Render.com Ready** - Native PostgreSQL integration

### Architecture Changes

**Before:**
```
FastAPI → storage.py → saved_stories/*.json
```

**After:**
```
FastAPI → database.py → PostgreSQL
         ↓
    models.py (ORM)
         ↓
    storage_postgres.py
```

## 🚀 Quick Start

### Local Development (5 minutes)

```bash
# 1. Navigate to backend
cd backend

# 2. Run setup script (installs deps, creates DB, tests connection)
bash setup_postgres.sh

# 3. Start server
uvicorn main:app --reload
```

**Output:**
```
🚀 Starting up...
✅ Database initialized
✅ Database tables created successfully
```

### Production Deployment (Render.com)

See [POSTGRES_QUICKSTART.md](POSTGRES_QUICKSTART.md) for step-by-step Render deployment.

## 📁 New Files

| File | Purpose |
|------|---------|
| `backend/database.py` | Database config, session management |
| `backend/models.py` | SQLAlchemy ORM Story model |
| `backend/storage_postgres.py` | PostgreSQL storage implementation |
| `backend/setup_postgres.sh` | Automated setup script |
| `POSTGRESQL_MIGRATION.md` | Complete migration documentation |
| `POSTGRES_QUICKSTART.md` | Quick setup guide |
| `POSTGRES_IMPLEMENTATION_SUMMARY.md` | Technical summary |

## 🗄️ Database Schema

### Table: `stories`

```sql
CREATE TABLE stories (
    story_id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    genre VARCHAR(200) NOT NULL,
    characters TEXT,
    opening_line TEXT,
    segments JSONB NOT NULL DEFAULT '[]',
    is_complete BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    user_id VARCHAR(100)  -- For future multi-user support
);
```

**Indexes:**
- Primary key on `story_id`
- Index on `user_id` (for future filtering)

## 🔧 Configuration

### Environment Variables

**`.env` (Local):**
```properties
MISTRAL_API_KEY=your_mistral_api_key
DATABASE_URL=postgresql+asyncpg://localhost/storyteller_db
```

**Render Environment Variables:**
```properties
MISTRAL_API_KEY=your_mistral_api_key
DATABASE_URL=postgres://user:pass@host/db  # Auto-provided by Render
```

The app automatically converts Render's `postgres://` to `postgresql+asyncpg://`.

## 📊 API Endpoints (Unchanged)

All endpoints work the same, but now use PostgreSQL:

- `GET /` - Health check
- `GET /suggestions` - AI-generated suggestions
- `GET /stories` - List all stories
- `GET /stories/{id}` - Get story details
- `POST /start-story` - Create new story
- `POST /continue-story` - Add story segment
- `POST /end-story` - Complete story
- `DELETE /stories/{id}` - Delete story

## 🧪 Testing

### Test Database Connection
```bash
psql storyteller_db -c "SELECT COUNT(*) FROM stories;"
```

### Test API
```bash
# Start a story
curl -X POST http://localhost:8000/start-story \
  -H "Content-Type: application/json" \
  -d '{"genre":"Space Opera"}' | jq

# List stories
curl http://localhost:8000/stories | jq

# Verify in database
psql storyteller_db -c "SELECT story_id, title, genre FROM stories LIMIT 5;"
```

## 🔄 Migration from File Storage

### Option 1: Fresh Start (Recommended)
Just deploy with PostgreSQL. Old file-based stories are preserved but not migrated.

### Option 2: Migrate Existing Stories

Create `migrate_stories.py`:
```python
import asyncio
import json
from pathlib import Path
from database import AsyncSessionLocal, init_db
from storage_postgres import postgres_storage

async def migrate():
    await init_db()
    
    stories_dir = Path("saved_stories")
    if not stories_dir.exists():
        print("No stories to migrate")
        return
    
    async with AsyncSessionLocal() as db:
        for file_path in stories_dir.glob("*.json"):
            with open(file_path) as f:
                story_data = json.load(f)
            
            story_id = story_data.get('id')
            print(f"Migrating {story_id}...")
            
            await postgres_storage.save_story(db, story_id, story_data)
        
        print("✅ Migration complete")

if __name__ == "__main__":
    asyncio.run(migrate())
```

Run:
```bash
cd backend
python migrate_stories.py
```

## 🐛 Troubleshooting

### "Import sqlalchemy could not be resolved"
```bash
pip install -r requirements.txt
```

### "Connection refused"
```bash
# Start PostgreSQL
brew services start postgresql@14  # macOS
sudo systemctl start postgresql    # Linux
```

### "Database does not exist"
```bash
psql postgres -c "CREATE DATABASE storyteller_db;"
```

### "Table 'stories' does not exist"
Just run the app - tables are created automatically:
```bash
uvicorn main:app --reload
```

### Render deployment fails
1. Check logs in Render Dashboard
2. Verify `DATABASE_URL` environment variable is set
3. Ensure database and web service are in the same region

## 📈 Performance Benefits

| Metric | File Storage | PostgreSQL |
|--------|-------------|-----------|
| Concurrent writes | ❌ File locks | ✅ Row-level locking |
| Query speed | O(n) | O(log n) with indexes |
| Scalability | Single server | Horizontal scaling |
| Transactions | ❌ No | ✅ ACID compliant |
| Backup | Manual copy | pg_dump/restore |

## 🔮 Future Enhancements

### 1. User Authentication
```python
# Add JWT authentication
# Filter stories by user_id
stories = await postgres_storage.list_stories(db, user_id=current_user.id)
```

### 2. Full-Text Search
```sql
-- Add text search index
CREATE INDEX stories_fts ON stories 
USING gin(to_tsvector('english', title || ' ' || genre));
```

### 3. Analytics Dashboard
```python
# Query story statistics
stats = await db.execute("""
    SELECT 
        COUNT(*) as total_stories,
        COUNT(*) FILTER (WHERE is_complete) as completed,
        AVG(jsonb_array_length(segments)) as avg_segments
    FROM stories
""")
```

### 4. Story Sharing
```python
# Add public/private flag
is_public = Column(Boolean, default=False)
share_token = Column(String(32), unique=True)
```

## 📚 Documentation

- **[POSTGRES_QUICKSTART.md](POSTGRES_QUICKSTART.md)** - 5-minute setup guide
- **[POSTGRESQL_MIGRATION.md](POSTGRESQL_MIGRATION.md)** - Complete documentation
- **[POSTGRES_IMPLEMENTATION_SUMMARY.md](POSTGRES_IMPLEMENTATION_SUMMARY.md)** - Technical details

## 🔒 Security Notes

- ✅ API keys stored in environment variables
- ✅ Database credentials never committed to git
- ✅ SQL injection protected by SQLAlchemy ORM
- ✅ Connection pooling limits concurrent connections
- ⚠️ User authentication not yet implemented (single-user mode)

## 🎯 Benefits

1. **Scalability** - Handle thousands of concurrent users
2. **Reliability** - ACID transactions, automatic backups
3. **Performance** - Indexed queries, connection pooling
4. **Developer Experience** - Type-safe ORM, async/await
5. **Production Ready** - Battle-tested PostgreSQL
6. **Future Proof** - Ready for multi-user, analytics, and more

## 🔄 Rollback

If you need to revert to file storage:
```bash
git checkout HEAD~1 -- backend/storage.py backend/main.py
git commit -m "Rollback to file storage"
git push
```

## 📞 Support Resources

- [PostgreSQL Official Docs](https://www.postgresql.org/docs/)
- [SQLAlchemy Docs](https://docs.sqlalchemy.org/)
- [FastAPI + Databases](https://fastapi.tiangolo.com/tutorial/sql-databases/)
- [Render PostgreSQL Guide](https://render.com/docs/databases)

---

## 🎉 Ready to Deploy!

Your AI Story Generator now uses PostgreSQL for robust, scalable storage.

**Next Steps:**
1. ✅ Test locally with `bash setup_postgres.sh`
2. ✅ Deploy to Render (see POSTGRES_QUICKSTART.md)
3. ✅ Monitor performance in production
4. 🔮 Consider adding user authentication

---

**Built with ❤️ using FastAPI, PostgreSQL, and SQLAlchemy**
