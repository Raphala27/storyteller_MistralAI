#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the script's directory and navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo -e "${GREEN}🚀 Starting AI Story Generator...${NC}\n"

# Check if .env exists
if [ ! -f backend/.env ]; then
    echo -e "${YELLOW}⚠️  Warning: backend/.env file not found!${NC}"
    echo "Creating .env file from .env.example..."
    cp backend/.env.example backend/.env
    echo -e "${YELLOW}Please edit backend/.env and add your MISTRAL_API_KEY${NC}\n"
fi

# Start backend
echo -e "${GREEN}Starting Backend Server...${NC}"
cd backend

# Check if venv exists, create if not
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python -m venv venv
fi

# Determine Python executable path (cross-platform)
if [ -f "venv/Scripts/python.exe" ]; then
    # Windows
    PYTHON_BIN="venv/Scripts/python.exe"
elif [ -f "venv/bin/python" ]; then
    # Unix-like
    PYTHON_BIN="venv/bin/python"
else
    echo "Error: Could not find Python in venv"
    exit 1
fi

# Install dependencies if needed
$PYTHON_BIN -m pip install -r requirements.txt > /dev/null 2>&1

# Start backend using venv Python directly
$PYTHON_BIN -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend
echo -e "${GREEN}Starting Frontend Server...${NC}"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo -e "\n${GREEN}✨ Both servers are starting!${NC}"
echo -e "Backend: http://localhost:8000"
echo -e "Frontend: http://localhost:5173"
echo -e "\nPress Ctrl+C to stop both servers\n"

# Wait for Ctrl+C
trap "echo -e '\n${YELLOW}Stopping servers...${NC}'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
