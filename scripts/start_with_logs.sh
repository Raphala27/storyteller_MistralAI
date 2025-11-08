#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the script's directory and navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Create logs directory
mkdir -p logs

echo -e "${GREEN}🚀 Starting AI Story Generator with logging...${NC}\n"

# Check if .env exists
if [ ! -f backend/.env ]; then
    echo -e "${YELLOW}⚠️  Warning: backend/.env file not found!${NC}"
    echo "Creating .env file from .env.example..."
    cp backend/.env.example backend/.env
    echo -e "${YELLOW}Please edit backend/.env and add your MISTRAL_API_KEY${NC}\n"
fi

# Start backend with logs
echo -e "${GREEN}Starting Backend Server...${NC}"
cd backend
source venv/bin/activate 2>/dev/null || python -m venv venv && source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1
uvicorn main:app --reload --host 0.0.0.0 --port 8000 > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend with logs
echo -e "${GREEN}Starting Frontend Server...${NC}"
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo -e "\n${GREEN}✨ Both servers are starting with logs!${NC}"
echo -e "${BLUE}Backend:${NC} http://localhost:8000 (PID: $BACKEND_PID)"
echo -e "${BLUE}Frontend:${NC} http://localhost:5173 (PID: $FRONTEND_PID)"
echo ""
echo -e "${YELLOW}📋 View logs in real-time:${NC}"
echo -e "  ${GREEN}Backend:${NC}  tail -f logs/backend.log"
echo -e "  ${BLUE}Frontend:${NC} tail -f logs/frontend.log"
echo ""
echo -e "${YELLOW}Or open the log files directly:${NC}"
echo -e "  code logs/backend.log"
echo -e "  code logs/frontend.log"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}\n"

# Trap Ctrl+C to stop both servers
trap "echo -e '\n${YELLOW}Stopping servers...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo -e '${GREEN}✋ Servers stopped${NC}'; exit" INT

# Wait for both processes
wait
