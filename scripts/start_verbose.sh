#!/bin/bash

# Get the script's directory and navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Create logs directory
mkdir -p logs

echo "🚀 Starting AI Story Generator (Verbose Mode)..."

# Function to add timestamps and prefix to logs
log_with_prefix() {
    local prefix=$1
    local color=$2
    while IFS= read -r line; do
        echo -e "${color}[$(date '+%H:%M:%S')] [$prefix]${NC} $line"
    done
}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f backend/.env ]; then
    echo -e "${YELLOW}⚠️  Warning: backend/.env file not found!${NC}"
    echo "Creating .env file from .env.example..."
    cp backend/.env.example backend/.env
    echo -e "${YELLOW}Please edit backend/.env and add your MISTRAL_API_KEY${NC}\n"
fi

# Start backend
echo -e "${GREEN}Starting Backend...${NC}"
cd backend
source venv/bin/activate 2>/dev/null || python -m venv venv && source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1
uvicorn main:app --reload --host 0.0.0.0 --port 8000 2>&1 | log_with_prefix "BACKEND" "$GREEN" | tee ../logs/backend.log &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 2

# Start frontend
echo -e "${BLUE}Starting Frontend...${NC}"
cd frontend
npm run dev 2>&1 | log_with_prefix "FRONTEND" "$BLUE" | tee ../logs/frontend.log &
FRONTEND_PID=$!
cd ..

echo ""
echo -e "${YELLOW}✨ Both servers are running!${NC}"
echo -e "Backend:  http://localhost:8000"
echo -e "Frontend: http://localhost:5173"
echo ""
echo -e "${YELLOW}📋 Logs are displayed here AND saved to:${NC}"
echo -e "  - logs/backend.log"
echo -e "  - logs/frontend.log"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}\n"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo -e '\n${GREEN}✋ Servers stopped${NC}'; exit" INT
wait
