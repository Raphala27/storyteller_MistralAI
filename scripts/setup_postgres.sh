#!/bin/bash
# PostgreSQL Setup and Verification Script

set -e  # Exit on error

# Get the script's directory and navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"

echo "🚀 PostgreSQL Migration Setup Script"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Navigate to backend directory
cd "$BACKEND_DIR"

echo -e "${YELLOW}Step 1: Installing Python dependencies...${NC}"
if [ -d "venv" ]; then
    source venv/bin/activate
else
    python3 -m venv venv
    source venv/bin/activate
fi
pip install -r requirements.txt
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

echo -e "${YELLOW}Step 2: Checking PostgreSQL installation...${NC}"
if command -v psql &> /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL is installed${NC}"
    psql --version
else
    echo -e "${RED}❌ PostgreSQL not found${NC}"
    echo ""
    echo "Please install PostgreSQL:"
    echo "  macOS:   brew install postgresql@14 && brew services start postgresql@14"
    echo "  Ubuntu:  sudo apt-get install postgresql"
    echo "  Windows: Download from postgresql.org"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 3: Creating database (if not exists)...${NC}"
if psql postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'storyteller_db'" | grep -q 1; then
    echo -e "${GREEN}✅ Database 'storyteller_db' already exists${NC}"
else
    psql postgres -c "CREATE DATABASE storyteller_db;"
    echo -e "${GREEN}✅ Database 'storyteller_db' created${NC}"
fi
echo ""

echo -e "${YELLOW}Step 4: Checking .env configuration...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found, creating from example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env file${NC}"
    echo -e "${YELLOW}⚠️  Please update .env with your MISTRAL_API_KEY${NC}"
fi

if grep -q "DATABASE_URL" .env; then
    echo -e "${GREEN}✅ DATABASE_URL found in .env${NC}"
    # Update to use psycopg if it's using asyncpg
    if grep -q "postgresql+asyncpg://" .env; then
        echo -e "${YELLOW}⚠️  Updating DATABASE_URL to use psycopg (Python 3.13 compatible)...${NC}"
        sed -i.bak 's/postgresql+asyncpg:/postgresql+psycopg:/g' .env
        echo -e "${GREEN}✅ DATABASE_URL updated${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Adding DATABASE_URL to .env...${NC}"
    echo "" >> .env
    echo "# PostgreSQL Database (Python 3.13 compatible - using psycopg)" >> .env
    echo "DATABASE_URL=postgresql+psycopg://localhost/storyteller_db" >> .env
    echo -e "${GREEN}✅ DATABASE_URL added to .env${NC}"
fi
echo ""

echo -e "${YELLOW}Step 5: Testing database connection...${NC}"
python3 << 'PYEND'
import sys
from database import engine, init_db

def test_connection():
    try:
        init_db()
        print("✅ Database connection successful")
        print("✅ Tables created successfully")
        
        # Test query
        with engine.connect() as conn:
            result = conn.execute("SELECT COUNT(*) FROM stories")
            count = result.scalar()
            print(f"✅ Current story count: {count}")
        
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        engine.dispose()

if not test_connection():
    sys.exit(1)
PYEND

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database test passed${NC}"
else
    echo -e "${RED}❌ Database test failed${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 6: Verifying file structure...${NC}"
files=("main.py" "database.py" "models.py" "storage_postgres.py")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file missing${NC}"
        exit 1
    fi
done
echo ""

echo "=========================================="
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Update .env with your MISTRAL_API_KEY if not already set"
echo "2. Start the server with:"
echo "   bash $PROJECT_ROOT/scripts/start.sh"
echo ""
echo "3. Test the API:"
echo "   curl http://localhost:8000/"
echo "   curl http://localhost:8000/stories"
echo ""
echo "4. Check database:"
echo "   psql storyteller_db -c 'SELECT * FROM stories;'"
echo ""
echo "For more information, see:"
echo "  - $PROJECT_ROOT/docs/POSTGRES_QUICKSTART.md"
echo "  - $PROJECT_ROOT/docs/DATABASE_README.md"
echo ""


echo -e "${YELLOW}Step 1: Installing Python dependencies...${NC}"
pip install -r requirements.txt
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

echo -e "${YELLOW}Step 2: Checking PostgreSQL installation...${NC}"
if command -v psql &> /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL is installed${NC}"
    psql --version
else
    echo -e "${RED}❌ PostgreSQL not found${NC}"
    echo ""
    echo "Please install PostgreSQL:"
    echo "  macOS:   brew install postgresql@14 && brew services start postgresql@14"
    echo "  Ubuntu:  sudo apt-get install postgresql"
    echo "  Windows: Download from postgresql.org"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 3: Creating database (if not exists)...${NC}"
if psql postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'storyteller_db'" | grep -q 1; then
    echo -e "${GREEN}✅ Database 'storyteller_db' already exists${NC}"
else
    psql postgres -c "CREATE DATABASE storyteller_db;"
    echo -e "${GREEN}✅ Database 'storyteller_db' created${NC}"
fi
echo ""

echo -e "${YELLOW}Step 4: Checking .env configuration...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found, creating from example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env file${NC}"
    echo -e "${YELLOW}⚠️  Please update .env with your MISTRAL_API_KEY${NC}"
fi

if grep -q "DATABASE_URL" .env; then
    echo -e "${GREEN}✅ DATABASE_URL found in .env${NC}"
else
    echo -e "${YELLOW}⚠️  Adding DATABASE_URL to .env...${NC}"
    echo "" >> .env
    echo "# PostgreSQL Database" >> .env
    echo "DATABASE_URL=postgresql+asyncpg://localhost/storyteller_db" >> .env
    echo -e "${GREEN}✅ DATABASE_URL added to .env${NC}"
fi
echo ""

echo -e "${YELLOW}Step 5: Testing database connection...${NC}"
python3 << 'PYEND'
import asyncio
import sys
from database import engine, init_db

async def test_connection():
    try:
        await init_db()
        print("✅ Database connection successful")
        print("✅ Tables created successfully")
        
        # Test query
        async with engine.begin() as conn:
            result = await conn.execute("SELECT COUNT(*) FROM stories")
            count = result.scalar()
            print(f"✅ Current story count: {count}")
        
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    finally:
        await engine.dispose()

if not asyncio.run(test_connection()):
    sys.exit(1)
PYEND

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database test passed${NC}"
else
    echo -e "${RED}❌ Database test failed${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 6: Verifying file structure...${NC}"
files=("main.py" "database.py" "models.py" "storage_postgres.py")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file missing${NC}"
        exit 1
    fi
done
echo ""

echo "=========================================="
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Update .env with your MISTRAL_API_KEY if not already set"
echo "2. Start the server:"
echo "   uvicorn main:app --reload"
echo ""
echo "3. Test the API:"
echo "   curl http://localhost:8000/"
echo "   curl http://localhost:8000/stories"
echo ""
echo "4. Check database:"
echo "   psql storyteller_db -c 'SELECT * FROM stories;'"
echo ""
echo "For production deployment on Render, see:"
echo "  - POSTGRES_QUICKSTART.md"
echo "  - POSTGRESQL_MIGRATION.md"
echo ""
